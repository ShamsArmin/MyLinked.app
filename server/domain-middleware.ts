import { Request, Response, NextFunction } from 'express';

// Custom domain handling middleware
export function handleCustomDomain(req: Request, res: Response, next: NextFunction) {
  const host = req.get('host');

  // Log all incoming requests for debugging
  console.log(`Incoming request: ${req.method} ${req.url} from ${host}`);

  if (host === 'mylinked.app' || host === 'www.mylinked.app') {
    // Add security headers for custom domain
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Force HTTPS when behind proxies
    if (req.header('x-forwarded-proto') !== 'https' && req.header('x-forwarded-proto') !== undefined) {
      return res.redirect(308, `https://${host}${req.url}`);
    }

    console.log(`Custom domain request handled: ${host}${req.url}`);
  }

  next();
}

// Health check endpoint for domain verification
export function domainHealthCheck(req: Request, res: Response) {
  const host = req.get('host');

  res.json({
    status: 'healthy',
    host: host,
    domain: host === 'www.mylinked.app' || host === 'mylinked.app' ? 'custom' : 'default',
    timestamp: new Date().toISOString(),
    ssl: req.secure || req.header('x-forwarded-proto') === 'https'
  });
}
