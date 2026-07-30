import { primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { platform } from '../database/schema';

/**
 * A player. Carries no credentials of its own, because it will eventually be
 * reached through several — Apple, Google, Steam, a login — and must stay one
 * account across all of them.
 */
export const accounts = platform.table('accounts', {
  id: uuid('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * One way of proving you are an account.
 *
 * A login and password is `provider = 'password'`, with the login as
 * `external_id` and the hash as `secret`. Apple is `provider = 'apple'` with the
 * subject claim and no secret at all. Adding a provider is therefore an insert
 * rather than a migration, which is the reason this is a second table rather
 * than two more columns on the first.
 */
export const identities = platform.table(
  'identities',
  {
    provider: text('provider').notNull(),
    externalId: text('external_id').notNull(),
    secret: text('secret'),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // The natural key: one external identity belongs to exactly one account, and
    // the same person arriving twice through Apple must not create a second.
    primaryKey({ columns: [table.provider, table.externalId] }),
  ],
);
