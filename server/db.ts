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
  cachedDown: false,
};

let dbDownUntil = 0;

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
  if (value) {
    dbDownUntil = 0;
    dbGuard.reason = undefined;
    dbGuard.code = undefined;
    dbGuard.cachedDown = false;
  } else {
    dbDownUntil = Date.now() + 10_000; // short negative cache
    dbGuard.reason = reason;
    dbGuard.code = code;
    dbGuard.cachedDown = true;
  }
}

export async function isDbAvailable(): Promise<boolean> {
  if (dbGuard.bypass) return true;

  const now = Date.now();
  if (now < dbDownUntil) {
    dbGuard.cachedDown = true;
    return false;
  }

  try {
    await Promise.race([
      pool.query('SELECT 1'),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 2000),
      ),
    ]);
    setDbEnabled(true);
    return true;
  } catch (err: any) {
    setDbEnabled(false, err?.message, err?.code);
    const logNow = Date.now();
    if (logNow - dbGuard.lastLog > 60_000) {
      const msg = dbGuard.bypass ? 'db guard bypass' : 'db guard block';
      console.warn(msg, { reason: dbGuard.reason, code: dbGuard.code });
      dbGuard.lastLog = logNow;
    }
    return false;
  }
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
const poolConfig: any = {};
if (process.env.DATABASE_URL) poolConfig.connectionString = process.env.DATABASE_URL;
if (process.env.PGHOST) poolConfig.host = process.env.PGHOST;
if (process.env.PGPORT) poolConfig.port = Number(process.env.PGPORT);
if (process.env.PGUSER) poolConfig.user = process.env.PGUSER;
if (process.env.PGPASSWORD) poolConfig.password = process.env.PGPASSWORD;
if (process.env.PGDATABASE) poolConfig.database = process.env.PGDATABASE;

export const pool = new Pool({
  ...poolConfig,
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
