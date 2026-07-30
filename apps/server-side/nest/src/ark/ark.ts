import type { Checkpoint } from '@expansa/engine-quantity';
import type { AccountId, Timestamp } from '@expansa/kernel';

/**
 * Fuel ordered from the synthesiser, not yet delivered.
 *
 * The energy was already spent when the order was placed, so a pending order is
 * a promise the world owes the player rather than a reservation.
 */
export interface PendingSynthesis {
  readonly id: string;
  readonly fuel: number;
  readonly orderedAt: Timestamp;
  readonly completesAt: Timestamp;
}

export interface Ark {
  readonly accountId: AccountId;
  readonly checkpoint: Checkpoint;
  readonly pending: readonly PendingSynthesis[];
}

export interface ArkRepository {
  /**
   * The ark belonging to an account, created on first sight.
   *
   * There is no `create`: every account has exactly one ark for the lifetime of a
   * world, so a separate creation step would only add a state where an account
   * exists and its ark does not.
   *
   * No lock. A read settles what is due to answer correctly and persists none of
   * it — ADR 0002 — so there is nothing for a concurrent write to lose.
   */
  load(accountId: AccountId): Promise<Ark>;

  /**
   * Reads the ark under a row lock, applies `change`, and stores the result — all
   * within one transaction.
   *
   * Not `load` then `save`. Between two calls nothing holds the row, so two
   * synthesis orders arriving together would each price against the same
   * checkpoint and the second write would erase the first. The loss is silent:
   * both requests return success and one order simply never happened.
   *
   * `change` runs inside the transaction, so throwing out of it rolls the whole
   * thing back — which is how a rejected order leaves no trace.
   *
   * This is deliberately narrower than transaction propagation. Nothing yet needs
   * a transaction to cross a service boundary; when something does, #13 adopts a
   * library for it rather than widening this.
   */
  mutate(accountId: AccountId, change: (ark: Ark) => Ark): Promise<Ark>;
}

export const ARK_REPOSITORY = Symbol('ArkRepository');
