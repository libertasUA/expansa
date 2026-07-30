// Contour 1, the platform-bound half: adapters over adopted technology, and the
// machinery those adapters share.
//
// No @nestjs dependency, by construction — anything here enters the framework as
// a value through `useFactory`, never as a class Nest instantiates. See ADR 0005.

export { MIGRATIONS_FOLDER, MIGRATIONS_SCHEMA } from './database/migrations-config';
export { createDatabase, type Database } from './database/connection';

// The table itself, not just its repository: a game table carries a foreign key
// to `platform.accounts`, and a foreign key cannot be declared against a name.
// Exporting it is narrower than it looks — the product may reference an account,
// which it already had to, and still cannot reach past this package for anything
// else.
export { accounts, identities } from './accounts/schema';

export {
  type AccountIdentity,
  type AccountRepository,
  DrizzleAccountRepository,
} from './accounts/account.repository';
