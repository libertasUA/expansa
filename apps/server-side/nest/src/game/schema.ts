import {
  index,
  integer,
  jsonb,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import type { QuantityState } from '@expansa/engine-quantity';
import { accounts } from '@expansa/platform';

/**
 * Everything the game owns. Declared here rather than in `platform` because the
 * product owns its own state — ADR 0007 — which is also what keeps game
 * vocabulary out of Contour 1.
 *
 * The directory is `game/` rather than beside the ark, because none of these
 * tables is the ark's: a world and a player outlive every holding on them. Where
 * this sits once there are more of them is #42.
 */
export const game = pgSchema('game');

/**
 * A round. Worlds end — a year or two — and the next one starts empty.
 *
 * `ends_at` is null while it is running rather than a far-future date, so that
 * "the world that is live" is a query about null and cannot be answered wrongly
 * by a clock skew.
 */
export const worlds = game.table('worlds', {
  id: uuid('id').primaryKey(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endsAt: timestamp('ends_at', { withTimezone: true }),
});

/**
 * A person **in one world**, which is what game tables reference — never the
 * account, which outlives the round. ADR 0006.
 *
 * Created on first touch rather than at registration. An account is not
 * automatically in every world, so entering one is an act — and when a second
 * world opens, the same path puts an existing account into it with no migration
 * and no join flow to build.
 */
export const players = game.table(
  'players',
  {
    id: uuid('id').primaryKey(),
    worldId: uuid('world_id')
      .notNull()
      .references(() => worlds.id, { onDelete: 'cascade' }),
    // No cascade from the account: deleting an account anonymises it and keeps
    // the tombstone, so that battle reports and clan logs still resolve — ADR 0006.
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.worldId, table.accountId)],
);

/**
 * Something a player owns in a world. The ark is `kind = 'ark'`; stations and
 * extraction complexes are the same table with a different kind, because the
 * differences between them are policy rather than structure.
 *
 * The checkpoint lives here as one JSONB column plus its instant, not as a row
 * per quantity. A checkpoint is read and written whole — ADR 0002 — so splitting
 * it would buy a join and cost the atomicity of a single row lock. It also keeps
 * adding a quantity a content change with no migration, which is the Contour 3
 * acceptance criterion.
 *
 * The column is typed with the **engine's** `QuantityState`, not a copy of it.
 * A copy drifted the first time it was written: `capacity` is `number | null`
 * there, where null means unbounded, and the duplicate said `number`. Anything
 * uncapped would have been stored and read back as a lie.
 *
 * They are JSON numbers, so floating point. That is not a compromise — the
 * engine projects in floating point on the server and in the client both, so
 * exact decimals here would claim a precision the arithmetic does not have, and
 * the two sides would then disagree about the same ark.
 */
export const holdings = game.table(
  'holdings',
  {
    id: uuid('id').primaryKey(),
    worldId: uuid('world_id')
      .notNull()
      .references(() => worlds.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    checkpointAt: timestamp('checkpoint_at', { withTimezone: true }).notNull(),
    quantities: jsonb('quantities').$type<Record<string, QuantityState>>().notNull(),
  },
  (table) => [
    // One ark per player per world. A player with two arks is not a state the
    // game has a rule for, so it is refused by the database rather than guarded
    // against in three places.
    unique().on(table.worldId, table.playerId, table.kind),
  ],
);

/**
 * Fuel ordered and not yet delivered. Its own table rather than an array on the
 * holding: orders have a lifecycle of their own, and #15 will want to find what
 * is due across every player rather than inside one row.
 *
 * `fuel` is an integer because an order is placed in whole units; the *stored*
 * quantity is not, because it accrues continuously.
 */
export const synthesisOrders = game.table(
  'synthesis_orders',
  {
    id: uuid('id').primaryKey(),
    holdingId: uuid('holding_id')
      .notNull()
      .references(() => holdings.id, { onDelete: 'cascade' }),
    fuel: integer('fuel').notNull(),
    orderedAt: timestamp('ordered_at', { withTimezone: true }).notNull(),
    completesAt: timestamp('completes_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    // The scheduler's query when #15 arrives: what is due, oldest first. Cheap to
    // add now and awkward to add to a large table later.
    index('synthesis_orders_completes_at_idx').on(table.completesAt),
    index('synthesis_orders_holding_idx').on(table.holdingId),
  ],
);
