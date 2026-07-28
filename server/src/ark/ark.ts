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
   */
  load(accountId: AccountId): Promise<Ark>;
  save(ark: Ark): Promise<void>;
}

export const ARK_REPOSITORY = Symbol('ArkRepository');
