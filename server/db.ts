import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '../shared/schema';

// Database guard state
export const dbGuard = {
  bypass: process.env.DB_GUARD_BYPASS === '1',
  reason: undefined as string | undefined,
  code: undefined as string | undefined,
  lastLog: 0,
};

let dbEnabled = true;

function isEndpointDisabledError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as any).message === 'string' &&
    (err as any).message.includes('endpoint has been disabled')
  );
}

export function setDbEnabled(value: boolean, reason?: string, code?: string) {
  dbEnabled = value;
  if (!value) {
    dbGuard.reason = reason;
    dbGuard.code = code;
  }
}

export function isDbAvailable(): boolean {
  const available = dbEnabled || dbGuard.bypass;
  if (!dbEnabled) {
    const now = Date.now();
    if (now - dbGuard.lastLog > 60_000) {
      const msg = dbGuard.bypass ? 'db guard bypass' : 'db guard block';
      console.warn(msg, {
        reason: dbGuard.reason,
        code: dbGuard.code,
      });
      dbGuard.lastLog = now;
    }
  }
  return available;
}

// Configure Neon Database to use WebSockets (needed for serverless environments)
neonConfig.webSocketConstructor = ws;

// Verify database URL is available
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL must be set. Did you forget to provision a database?',
  );
}

console.log('Connecting to database...');

// Create connection pool with more conservative settings for stability
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5, // Reduce max connections for stability
  idleTimeoutMillis: 60000, // Keep connections longer
  connectionTimeoutMillis: 10000, // Increase timeout
  maxUses: 7500, // Limit connection reuse
  allowExitOnIdle: true,
});

// Initialize Drizzle ORM with our schema
export const db = drizzle({ client: pool, schema });

// Add connection error handling
pool.on('error', (err: any) => {
  console.error('Database pool error:', err);
  if (isEndpointDisabledError(err)) {
    setDbEnabled(false, 'endpoint disabled', err.code);
  }
});

// Test database connection with retry logic
async function testConnection(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      console.log('Database connection successful');
      client.release();
      return true;
    } catch (err: any) {
      console.error(`Database connection attempt ${i + 1} failed:`, err);
      if (isEndpointDisabledError(err)) {
        setDbEnabled(false, 'endpoint disabled', err.code);
        return false;
      }
      if (i === retries - 1) {
        setDbEnabled(false, err.message, err.code);
        console.error('All database connection attempts failed');
        return false;
      }
      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

// Start initial connection test
void testConnection();
