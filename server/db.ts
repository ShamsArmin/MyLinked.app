// server/db.ts
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';

// -------------------------
// Database guard state
// -------------------------
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

// -------------------------
// Connection setup
// -------------------------

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL must be set. Did you forget to provision a database or add the env var on Render?',
  );
}

console.log('Connecting to database...');

// If you use the External URL on Render it will include ?sslmode=require.
// Internal URL usually doesn't need SSL. We auto-detect.
const ssl =
  process.env.DATABASE_URL.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : undefined;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl,
  max: 5, // conservative for Render free tier
  idleTimeoutMillis: 60_000,
  connectionTimeoutMillis: 10_000,
  allowExitOnIdle: true,
});

// Drizzle ORM (node-postgres adapter)
export const db = drizzle(pool, { schema });

// -------------------------
// Error handling & warm-up
// -------------------------
pool.on('error', (err: any) => {
  console.error('Database pool error:', err);
  if (isEndpointDisabledError(err)) {
    setDbEnabled(false, 'endpoint disabled', err.code);
  }
});

async function testConnection(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('Database connection successful');
      return true;
    } catch (err: any) {
      console.error(`Database connection attempt ${i + 1} failed:`, err);
      if (isEndpointDisabledError(err)) {
        setDbEnabled(false, 'endpoint disabled', err?.code);
        return false;
      }
      if (i === retries - 1) {
        setDbEnabled(false, err?.message, err?.code);
        console.error('All database connection attempts failed');
        return false;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

void testConnection();
