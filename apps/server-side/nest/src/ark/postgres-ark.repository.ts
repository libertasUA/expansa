import { randomUUID } from 'node:crypto';

import { and, asc, eq, isNull } from 'drizzle-orm';

import type { QuantityState } from '@expansa/engine-quantity';
import { type AccountId, type Clock, timestamp } from '@expansa/kernel';
import type { Database } from '@expansa/platform';

import { STARTING_STATE } from '../content/quantities';
import { holdings, players, synthesisOrders, worlds } from '../game/schema';
import type { Ark, ArkRepository, PendingSynthesis } from './ark';

/**
 * The transaction handle Drizzle hands to a callback, derived rather than named:
 * it is a deep generic type and writing it out by hand goes stale on every
 * upgrade.
 */
type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

/** Either a pooled connection or a transaction — the queries below read the same. */
type Conn = Database | Transaction;

const ARK = 'ark';

interface HoldingRow {
  readonly id: string;
  readonly checkpointAt: Date;
  readonly quantities: Record<string, QuantityState>;
}

/**
 * The ark in PostgreSQL, behind the port the in-memory version implemented.
 *
 * Two things it does that the Map could not: it survives a restart and a second
 * server process, and it refuses to lose a write when two orders arrive together.
 */
export class PostgresArkRepository implements ArkRepository {
  constructor(
    private readonly db: Database,
    private readonly clock: Clock,
  ) {}

  async load(accountId: AccountId): Promise<Ark> {
    return this.db.transaction(async (tx) => {
      const holding = await this.enter(tx, accountId, false);
      return this.read(tx, accountId, holding);
    });
  }

  async mutate(accountId: AccountId, change: (ark: Ark) => Ark): Promise<Ark> {
    return this.db.transaction(async (tx) => {
      const holding = await this.enter(tx, accountId, true);
      const before = await this.read(tx, accountId, holding);

      // Inside the transaction on purpose: a rejected order throws from here and
      // the row lock is released by the rollback, leaving nothing behind.
      const after = change(before);

      await tx
        .update(holdings)
        .set({
          checkpointAt: new Date(after.checkpoint.at),
          // Copied rather than passed through: the engine hands back a readonly
          // checkpoint, and the driver's insert type is mutable. The copy is the
          // boundary, not a workaround for the modifier.
          quantities: { ...after.checkpoint.states },
        })
        .where(eq(holdings.id, holding.id));

      await this.replaceOrders(tx, holding.id, after.pending);
      return after;
    });
  }

  /**
   * The player's ark in the live world, joining and founding it if this is the
   * first time the account has been seen there.
   *
   * Joining is lazy rather than part of registration, and that is the model
   * rather than a shortcut: an account is not automatically in every world —
   * ADR 0006 — so entering one is an act, and the first touch is when it happens.
   * When a second world opens, the same code puts the same account into it with
   * no migration and no join flow.
   *
   * It runs on the read path too, which does not contradict *reads write
   * nothing*: that rule forbids persisting a **projection**, because the next
   * write would compute it again. Founding an ark is not a projection — it is
   * what gives the projection an instant to start from.
   */
  private async enter(
    tx: Transaction,
    accountId: AccountId,
    lock: boolean,
  ): Promise<HoldingRow> {
    const worldId = await this.liveWorld(tx);

    const [player] = await tx
      .insert(players)
      .values({ id: randomUUID(), worldId, accountId })
      .onConflictDoNothing({ target: [players.worldId, players.accountId] })
      .returning({ id: players.id });

    const playerId = player?.id ?? (await this.findPlayer(tx, worldId, accountId));

    const existing = await this.findHolding(tx, playerId, lock);
    if (existing !== null) {
      return existing;
    }

    const [created] = await tx
      .insert(holdings)
      .values({
        id: randomUUID(),
        worldId,
        playerId,
        kind: ARK,
        checkpointAt: new Date(this.clock.now()),
        quantities: { ...STARTING_STATE },
      })
      .onConflictDoNothing({
        target: [holdings.worldId, holdings.playerId, holdings.kind],
      })
      .returning({
        id: holdings.id,
        checkpointAt: holdings.checkpointAt,
        quantities: holdings.quantities,
      });

    if (created !== undefined) {
      return created;
    }

    // Another connection founded it between the select and the insert. The
    // unique constraint turned that into no rows rather than a duplicate, so
    // read what it wrote — this time under the lock if one was asked for.
    const raced = await this.findHolding(tx, playerId, lock);
    if (raced === null) {
      throw new Error(`Ark for account ${accountId} vanished between insert and read`);
    }
    return raced;
  }

  private async read(tx: Conn, accountId: AccountId, holding: HoldingRow): Promise<Ark> {
    const orders = await tx
      .select({
        id: synthesisOrders.id,
        fuel: synthesisOrders.fuel,
        orderedAt: synthesisOrders.orderedAt,
        completesAt: synthesisOrders.completesAt,
      })
      .from(synthesisOrders)
      .where(eq(synthesisOrders.holdingId, holding.id))
      .orderBy(asc(synthesisOrders.completesAt));

    const pending: PendingSynthesis[] = orders.map((order) => ({
      id: order.id,
      fuel: order.fuel,
      orderedAt: timestamp(order.orderedAt.getTime()),
      completesAt: timestamp(order.completesAt.getTime()),
    }));

    return {
      accountId,
      checkpoint: {
        at: timestamp(holding.checkpointAt.getTime()),
        states: holding.quantities,
      },
      pending,
    };
  }

  /**
   * Deleted and reinserted rather than diffed.
   *
   * An order is immutable once placed, so the only changes are additions and
   * removals, and a settle removes every order that has completed. Computing the
   * difference would be more code to be wrong in, on a list that is never long —
   * the holding is already locked, so nothing else is reading it meanwhile.
   */
  private async replaceOrders(
    tx: Transaction,
    holdingId: string,
    pending: readonly PendingSynthesis[],
  ): Promise<void> {
    await tx.delete(synthesisOrders).where(eq(synthesisOrders.holdingId, holdingId));

    if (pending.length === 0) {
      return;
    }

    await tx.insert(synthesisOrders).values(
      pending.map((order) => ({
        id: order.id,
        holdingId,
        fuel: order.fuel,
        orderedAt: new Date(order.orderedAt),
        completesAt: new Date(order.completesAt),
      })),
    );
  }

  /**
   * The world that is running. `ends_at IS NULL` rather than a comparison against
   * now, so the answer cannot change because a clock drifted.
   */
  private async liveWorld(tx: Conn): Promise<string> {
    const [world] = await tx
      .select({ id: worlds.id })
      .from(worlds)
      .where(isNull(worlds.endsAt))
      .orderBy(asc(worlds.startedAt))
      .limit(1);

    if (world === undefined) {
      throw new Error('No live world. One is seeded by migration; check db:migrate ran.');
    }
    return world.id;
  }

  private async findPlayer(
    tx: Conn,
    worldId: string,
    accountId: AccountId,
  ): Promise<string> {
    const [row] = await tx
      .select({ id: players.id })
      .from(players)
      .where(and(eq(players.worldId, worldId), eq(players.accountId, accountId)))
      .limit(1);

    if (row === undefined) {
      throw new Error(`Player row for account ${accountId} missing after upsert`);
    }
    return row.id;
  }

  private async findHolding(
    tx: Transaction,
    playerId: string,
    lock: boolean,
  ): Promise<HoldingRow | null> {
    const query = tx
      .select({
        id: holdings.id,
        checkpointAt: holdings.checkpointAt,
        quantities: holdings.quantities,
      })
      .from(holdings)
      .where(and(eq(holdings.playerId, playerId), eq(holdings.kind, ARK)))
      .limit(1);

    // FOR UPDATE only on the write path. Taking it on every read would serialise
    // every player looking at their own ark behind anyone writing to it.
    const [row] = lock ? await query.for('update') : await query;
    return row ?? null;
  }
}
