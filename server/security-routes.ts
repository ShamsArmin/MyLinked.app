import { Router } from 'express';
import { isAuthenticated } from './auth';
import { securityMiddleware } from './security-middleware';
import { logSystemEvent } from './admin-routes';

export const securityRouter = Router();

// Admin-only middleware
function isAdmin(req: any, res: any, next: any) {
  const role = req.user?.role;
  if (role === 'admin' || role === 'super_admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
}

// Get security status
securityRouter.get('/status', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const status = securityMiddleware.getSecurityStatus();
    res.json(status);
  } catch (error) {
    console.error('Security status error:', error);
    res.status(500).json({ error: 'Failed to get security status' });
  }
});

// Unblock IP address
securityRouter.post('/unblock-ip', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { ip } = req.body;
    
    if (!ip) {
      return res.status(400).json({ error: 'IP address is required' });
    }

    const success = securityMiddleware.unblockIP(ip);
    
    if (success) {
      logSystemEvent('info', `IP ${ip} unblocked by admin`, 'security', req.user?.id);
      res.json({ success: true, message: `IP ${ip} has been unblocked` });
    } else {
      res.json({ success: false, message: `IP ${ip} was not in the blocked list` });
    }
  } catch (error) {
    console.error('Unblock IP error:', error);
    res.status(500).json({ error: 'Failed to unblock IP' });
  }
});

// Block IP address
securityRouter.post('/block-ip', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { ip } = req.body;
    
    if (!ip) {
      return res.status(400).json({ error: 'IP address is required' });
    }

    securityMiddleware.blockIP(ip);
    logSystemEvent('warning', `IP ${ip} blocked by admin`, 'security', req.user?.id);
    
    res.json({ success: true, message: `IP ${ip} has been blocked` });
  } catch (error) {
    console.error('Block IP error:', error);
    res.status(500).json({ error: 'Failed to block IP' });
  }
});

// Generate CSRF token
securityRouter.get('/csrf-token', isAuthenticated, async (req, res) => {
  try {
    const token = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    
    req.session.csrfToken = token;
    res.json({ token });
  } catch (error) {
    console.error('CSRF token error:', error);
    res.status(500).json({ error: 'Failed to generate CSRF token' });
  }
});

// Security audit endpoint
securityRouter.get('/audit', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const securityStatus = securityMiddleware.getSecurityStatus();
    
    const auditReport = {
      timestamp: new Date().toISOString(),
      securityStatus,
      recommendations: [],
      riskLevel: 'low'
    };

    // Analyze security status and provide recommendations
    if (securityStatus.blockedIPs.length > 10) {
      auditReport.recommendations.push('High number of blocked IPs detected. Consider reviewing security policies.');
      auditReport.riskLevel = 'medium';
    }

    if (securityStatus.suspiciousIPs.length > 20) {
      auditReport.recommendations.push('High number of suspicious IPs detected. Monitor for potential attacks.');
      auditReport.riskLevel = 'high';
    }

    // Check environment security
    const envSecurityChecks = {
      hasSessionSecret: !!process.env.SESSION_SECRET,
      hasDbUrl: !!process.env.DATABASE_URL,
      hasOpenAiKey: !!process.env.OPENAI_API_KEY,
      nodeEnv: process.env.NODE_ENV
    };

    if (!envSecurityChecks.hasSessionSecret) {
      auditReport.recommendations.push('SESSION_SECRET not configured. Sessions may be vulnerable.');
      auditReport.riskLevel = 'high';
    }

    if (envSecurityChecks.nodeEnv !== 'production') {
      auditReport.recommendations.push('Application not running in production mode.');
    }

    auditReport.recommendations.push('Regular security audits recommended.');

    res.json(auditReport);
  } catch (error) {
    console.error('Security audit error:', error);
    res.status(500).json({ error: 'Failed to generate security audit' });
  }
});