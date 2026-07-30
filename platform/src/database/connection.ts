import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as accounts from '../accounts/schema';

const schema = { ...accounts };

export type Database = NodePgDatabase<typeof schema>;

/**
 * The connection, and nothing else.
 *
 * Transaction propagation through `AsyncLocalStorage`, deterministic lock
 * ordering and deadlock retry are #13 and are deliberately absent: nothing yet
 * writes more than one row at a time, and writing that layer before anything has
 * exercised it is the mistake ADR 0003 made with the repository layout.
 */
export function createDatabase(connectionString: string): {
  db: Database;
  close: () => Promise<void>;
} {
  const pool = new Pool({ connectionString });
  return { db: drizzle(pool, { schema }), close: () => pool.end() };
}
