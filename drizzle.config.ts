import { defineConfig } from 'drizzle-kit';

/**
 * Generation only — applying migrations is `pnpm db:migrate`, which runs the
 * migrator in `platform` rather than the CLI, so that the same code path is used
 * in development and wherever this is eventually deployed.
 *
 * `schema` will list the definition files as they appear: `platform` declares
 * its own tables, the product declares the game's. One output folder regardless,
 * because there is one database and its history is ordered.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: ['./platform/src/database/schema.ts'],
  out: './migrations',
  migrations: { schema: 'drizzle' },
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
  strict: true,
  verbose: true,
});
