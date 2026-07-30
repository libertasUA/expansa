import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

import { MIGRATIONS_FOLDER, MIGRATIONS_SCHEMA } from './migrations-config';

/**
 * Applies pending migrations and exits.
 *
 * Deliberately a command rather than something the server runs at boot: two
 * instances starting together would race for the same migration, and the
 * resulting intermittent hang is a miserable thing to diagnose. It also means
 * migrations can be applied and inspected without restarting anything.
 */
async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString === undefined || connectionString === '') {
    throw new Error('DATABASE_URL is not set');
  }

  // One connection: this is a short-lived process doing one ordered thing, and a
  // pool would only add ways for it to interleave with itself.
  const pool = new Pool({ connectionString, max: 1 });

  try {
    await migrate(drizzle(pool), {
      migrationsFolder: MIGRATIONS_FOLDER,
      migrationsSchema: MIGRATIONS_SCHEMA,
    });
    process.stdout.write('migrations up to date\n');
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
