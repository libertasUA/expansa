import type { QuantityId } from './types';

/**
 * Content and code disagree: something referred to a quantity the engine was not
 * built with. Always a configuration error, never a player action.
 */
export class UnknownQuantityError extends Error {
  constructor(readonly quantityId: QuantityId) {
    super(`Unknown quantity ${JSON.stringify(quantityId)}`);
    this.name = 'UnknownQuantityError';
  }
}

/**
 * A spend was applied that the holding could not cover.
 *
 * Thrown rather than clamped at zero. Clamping would turn a caller that forgot to
 * check `canAfford` into a silent economy leak — the player would receive the
 * thing and pay less than its price, and nothing would report it.
 */
export class InsufficientQuantityError extends Error {
  constructor(
    readonly quantityId: QuantityId,
    readonly available: number,
    readonly required: number,
  ) {
    super(`Insufficient ${quantityId}: have ${available}, need ${required}`);
    this.name = 'InsufficientQuantityError';
  }
}
