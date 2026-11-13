import pg from 'pg';
import { env } from './env.js';
import { logger } from '../shared/logger.js';

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: env.DATABASE_POOL_MAX,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected PostgreSQL pool error');
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (duration > 500) {
    logger.warn({ text: text.slice(0, 80), duration, rows: result.rowCount }, 'Slow query');
  }
  return result;
}

export async function getClient(): Promise<pg.PoolClient> {
  return pool.connect();
}

export async function healthCheck(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

export { pool };
