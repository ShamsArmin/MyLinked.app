import { Request, Response, NextFunction } from 'express';
import { monitor } from './monitoring';
import { logSystemEvent } from './admin-routes';

// Rate limiting store
interface RateLimitStore {
  [key: string]: {
    requests: number;
    resetTime: number;
  };
}

// Security middleware class
class SecurityMiddleware {
  private static instance: SecurityMiddleware;
  private rateLimitStore: RateLimitStore = {};
  private suspiciousIPs: Set<string> = new Set();
  private blockedIPs: Set<string> = new Set();
  private maxRequestsPerMinute = 300; // More generous for development
  private maxRequestsPerHour = 5000; // More generous for development

  private constructor() {
    // Clean up rate limit store every 5 minutes
    setInterval(() => this.cleanupRateLimitStore(), 5 * 60 * 1000);
  }

  static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware();
    }
    return SecurityMiddleware.instance;
  }

  // Rate limiting middleware
  rateLimiter = (req: Request, res: Response, next: NextFunction) => {
    const ip = this.getClientIP(req);
    const now = Date.now();
    const minuteKey = `${ip}:${Math.floor(now / 60000)}`;
    const hourKey = `${ip}:hour:${Math.floor(now / 3600000)}`;

    // Skip rate limiting for development environment
    if (process.env.NODE_ENV === 'development') {
      return next();
    }

    // Check if IP is blocked
    if (this.blockedIPs.has(ip)) {
      this.logSecurityEvent('blocked_ip_access', ip, req);
      return res.status(429).json({ error: 'Access denied' });
    }

    // Initialize or update minute counter
    if (!this.rateLimitStore[minuteKey]) {
      this.rateLimitStore[minuteKey] = { requests: 0, resetTime: now + 60000 };
    }
    this.rateLimitStore[minuteKey].requests++;

    // Initialize or update hour counter
    if (!this.rateLimitStore[hourKey]) {
      this.rateLimitStore[hourKey] = { requests: 0, resetTime: now + 3600000 };
    }
    this.rateLimitStore[hourKey].requests++;

    // Check rate limits
    if (this.rateLimitStore[minuteKey].requests > this.maxRequestsPerMinute) {
      this.handleRateLimit(ip, 'minute', req);
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    if (this.rateLimitStore[hourKey].requests > this.maxRequestsPerHour) {
      this.handleRateLimit(ip, 'hour', req);
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    next();
  };

  // SQL injection protection
  sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
    const suspiciousPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(\b(OR|AND)\s+\w+\s*=\s*\w+)/gi,
      /(\b1\s*=\s*1\b|\b1\s*=\s*'1')/gi,
      /(\bUNION\s+SELECT\b)/gi,
      /(\b--\s*$)/gm,
      /(\b\/\*[\s\S]*?\*\/)/g
    ];

    const checkObject = (obj: any, path: string = '') => {
      if (typeof obj === 'string') {
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(obj)) {
            this.logSecurityEvent('sql_injection_attempt', this.getClientIP(req), req, {
              path,
              suspiciousValue: obj,
              pattern: pattern.toString()
            });
            return true;
          }
        }
      } else if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          if (checkObject(obj[key], `${path}.${key}`)) {
            return true;
          }
        }
      }
      return false;
    };

    if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    next();
  };

  // XSS protection
  xssProtection = (req: Request, res: Response, next: NextFunction) => {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=\s*['"][^'"]*['"]/gi,
      /<img[^>]+src\s*=\s*['"]javascript:[^'"]*['"]/gi,
      /<[^>]+style\s*=\s*['"][^'"]*expression\s*\([^'"]*['"]/gi
    ];

    const sanitizeObject = (obj: any, path: string = '') => {
      if (typeof obj === 'string') {
        for (const pattern of xssPatterns) {
          if (pattern.test(obj)) {
            this.logSecurityEvent('xss_attempt', this.getClientIP(req), req, {
              path,
              suspiciousValue: obj,
              pattern: pattern.toString()
            });
            return true;
          }
        }
      } else if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          if (sanitizeObject(obj[key], `${path}.${key}`)) {
            return true;
          }
        }
      }
      return false;
    };

    if (sanitizeObject(req.body) || sanitizeObject(req.query)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    next();
  };

  // CSRF protection
  csrfProtection = (req: Request, res: Response, next: NextFunction) => {
    // Skip CSRF for GET requests and API calls with proper authentication
    if (req.method === 'GET' || req.path.startsWith('/api/auth/')) {
      return next();
    }

    const token = req.headers['x-csrf-token'] || req.body._csrf;
    const sessionToken = (req.session as any)?.csrfToken;

    if (!token || !sessionToken || token !== sessionToken) {
      this.logSecurityEvent('csrf_token_mismatch', this.getClientIP(req), req);
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }

    next();
  };

  // Input validation and sanitization
  inputValidation = (req: Request, res: Response, next: NextFunction) => {
    const sanitizeString = (str: string): string => {
      return str
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
    };

    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return sanitizeString(obj);
      } else if (typeof obj === 'object' && obj !== null) {
        const sanitized: any = {};
        for (const key in obj) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
      }
      return obj;
    };

    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    next();
  };

  // Security headers
  securityHeaders = (req: Request, res: Response, next: NextFunction) => {
    // Content Security Policy - more permissive for React app
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://connect.facebook.net; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "img-src 'self' data: https: blob:; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "connect-src 'self' https: wss:; " +
      "frame-src 'self' https://accounts.google.com https://www.facebook.com; " +
      "frame-ancestors 'none';"
    );

    // Other security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // Allow framing for OAuth
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // HSTS for HTTPS - always set for Replit
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    next();
  };

  // Suspicious activity detection
  suspiciousActivityDetection = (req: Request, res: Response, next: NextFunction) => {
    const ip = this.getClientIP(req);
    const userAgent = req.get('User-Agent') || '';
    const path = req.path;

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /wp-admin|wp-login|wordpress/i,
      /phpmyadmin|admin|dashboard/i,
      /\.\./,
      /\.(php|asp|jsp|cgi)$/i,
      /\/(etc|usr|var|tmp|boot)/i
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(path));
    const isBot = /bot|crawler|spider|scraper/i.test(userAgent);
    const hasNoUserAgent = !userAgent;

    if (isSuspicious || (isBot && !path.startsWith('/api/')) || hasNoUserAgent) {
      this.suspiciousIPs.add(ip);
      this.logSecurityEvent('suspicious_activity', ip, req, {
        reason: isSuspicious ? 'suspicious_path' : isBot ? 'bot_activity' : 'no_user_agent',
        path,
        userAgent
      });

      // Block IP after multiple suspicious activities
      if (this.getSuspiciousActivityCount(ip) > 5) {
        this.blockedIPs.add(ip);
        this.logSecurityEvent('ip_blocked', ip, req);
      }
    }

    next();
  };

  // Private helper methods
  private getClientIP(req: Request): string {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
           'unknown';
  }

  private handleRateLimit(ip: string, type: 'minute' | 'hour', req: Request) {
    this.suspiciousIPs.add(ip);
    this.logSecurityEvent('rate_limit_exceeded', ip, req, { type });

    // Block IP after repeated rate limit violations
    if (this.getSuspiciousActivityCount(ip) > 10) {
      this.blockedIPs.add(ip);
      this.logSecurityEvent('ip_blocked', ip, req);
    }
  }

  private getSuspiciousActivityCount(ip: string): number {
    return Array.from(this.suspiciousIPs).filter(suspiciousIp => suspiciousIp === ip).length;
  }

  private logSecurityEvent(event: string, ip: string, req: Request, metadata?: any) {
    const securityEvent = {
      event,
      ip,
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      ...metadata
    };

    const logger = event === 'suspicious_activity' ? console.debug : console.warn;
    logger(`Security Event: ${event} from ${ip}`);
    
    // Log to monitoring system
    monitor.recordError({
      timestamp: new Date().toISOString(),
      level: 'warning',
      message: `Security Event: ${event}`,
      endpoint: req.path,
      userAgent: req.get('User-Agent'),
      ip
    });

    // Log to admin system
    logSystemEvent('warning', `Security Event: ${event} from ${ip}`, 'security', undefined, securityEvent);
  }

  private cleanupRateLimitStore() {
    const now = Date.now();
    for (const key in this.rateLimitStore) {
      if (this.rateLimitStore[key].resetTime < now) {
        delete this.rateLimitStore[key];
      }
    }
  }

  // Public methods for admin
  getSecurityStatus() {
    return {
      suspiciousIPs: Array.from(this.suspiciousIPs),
      blockedIPs: Array.from(this.blockedIPs),
      rateLimitEntries: Object.keys(this.rateLimitStore).length,
      timestamp: new Date().toISOString()
    };
  }

  unblockIP(ip: string): boolean {
    return this.blockedIPs.delete(ip);
  }

  blockIP(ip: string): void {
    this.blockedIPs.add(ip);
  }
}

export const securityMiddleware = SecurityMiddleware.getInstance();

export function requireAdmin(req: any, res: any, next: any) {
  const user = (req as any).user;
  const role = user?.role;
  if (!user || (!user.isAdmin && role !== "admin" && role !== "super_admin")) {
    return res.status(403).json({ message: "Administrator privileges required" });
  }
  next();
}

