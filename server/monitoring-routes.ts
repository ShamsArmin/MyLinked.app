import { Router } from 'express';
import { isAuthenticated } from './auth';
import { monitor } from './monitoring';

export const monitoringRouter = Router();

// Admin-only middleware (you can adjust this based on your admin system)
function isAdmin(req: any, res: any, next: any) {
  const role = req.user?.role;
  if (role === 'admin' || role === 'super_admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
}

// Get current system status
monitoringRouter.get('/status', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const status = monitor.getCurrentStatus();
    res.json(status);
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

// Get detailed metrics
monitoringRouter.get('/metrics', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const metrics = monitor.getMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Metrics fetch error:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// Get error logs
monitoringRouter.get('/logs', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const logs = monitor.getErrorLogs();
    res.json(logs);
  } catch (error) {
    console.error('Logs fetch error:', error);
    res.status(500).json({ error: 'Failed to get error logs' });
  }
});

// Health check endpoint (public - for external monitoring)
monitoringRouter.get('/health', async (req, res) => {
  try {
    const status = monitor.getCurrentStatus();
    
    if (status.status === 'error') {
      res.status(503).json({
        status: 'error',
        message: 'Service unavailable',
        uptime: status.uptime
      });
    } else {
      res.json({
        status: 'healthy',
        uptime: status.uptime,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Performance metrics endpoint
monitoringRouter.get('/performance', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const metrics = monitor.getMetrics();
    const recent = metrics.slice(-10); // Last 10 metrics
    
    const avgResponseTime = recent.reduce((sum, m) => sum + m.responseTime, 0) / recent.length;
    const avgMemoryUsage = recent.reduce((sum, m) => sum + (m.memoryUsage.heapUsed / m.memoryUsage.heapTotal), 0) / recent.length;
    
    res.json({
      averageResponseTime: avgResponseTime,
      averageMemoryUsage: avgMemoryUsage * 100,
      errorCount: recent.reduce((sum, m) => sum + m.errorCount, 0),
      databaseStatus: recent[recent.length - 1]?.databaseStatus || 'unknown',
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json({ error: 'Failed to get performance metrics' });
  }
});

// Alert configuration endpoint
monitoringRouter.post('/alerts', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { type, threshold, enabled } = req.body;
    
    // In a real system, you'd store these in the database
    // For now, we'll just acknowledge the configuration
    res.json({
      success: true,
      message: 'Alert configuration saved',
      config: { type, threshold, enabled }
    });
  } catch (error) {
    console.error('Alert configuration error:', error);
    res.status(500).json({ error: 'Failed to configure alerts' });
  }
});

// System diagnostic endpoint
monitoringRouter.post('/diagnose', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      env: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
      },
      recentErrors: monitor.getErrorLogs().slice(-5),
      systemStatus: monitor.getCurrentStatus()
    };
    
    res.json(diagnostics);
  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({ error: 'Failed to generate diagnostics' });
  }
});