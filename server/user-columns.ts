import { sql } from 'drizzle-orm';

let cache: { columns: Set<string>; expires: number } | null = null;

export async function getUserColumnSet(db: any): Promise<Set<string>> {
  const now = Date.now();
  if (cache && cache.expires > now) {
    return cache.columns;
  }

  const { rows } = await db.execute(
    sql`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='users'`
  );
  const columns = new Set((rows as Array<{ column_name: string }>).map(r => r.column_name));
  cache = { columns, expires: now + 60_000 };
  return columns;
}
