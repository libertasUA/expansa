import { join } from 'node:path';

/**
 * One ordered history for the whole database, at the repository root.
 *
 * Definitions are split by owner — `platform` declares its own tables, the
 * product declares the game's — but migrations are not, because ordering crosses
 * schemas: a foreign key from `game` to `platform` needs the second to exist
 * first. Two histories could not express that.
 */
export const MIGRATIONS_FOLDER = join(__dirname, '..', '..', '..', 'migrations');

/**
 * Drizzle's own bookkeeping table lives in its own schema, so that `public`
 * stays empty and nothing lands there by default.
 */
export const MIGRATIONS_SCHEMA = 'drizzle';
