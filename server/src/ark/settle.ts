import type { QuantityEngine } from '@expansa/engine-quantity';
import type { Timestamp } from '@expansa/kernel';

import type { Ark } from './ark';

/**
 * Applies every synthesis order that has finished by `at`.
 *
 * Pure, and separate from both use cases, because it is the same operation
 * whether it runs on a read or on a write.
 *
 * Each order is credited **at its own completion time**, not at `at`. Crediting
 * them all at the end would be wrong the moment a quantity has both a rate and a
 * ceiling: fuel delivered an hour ago should have been sitting in a store that
 * was filling, and clamping applies at the instant of delivery.
 *
 * This is where a job queue will take over once #15 is decided. Until then a
 * write settles what is due before doing anything else, which is safe only
 * because synthesis has no side effects — nothing is notified, nobody else's
 * state changes. An event that did have side effects could not be settled lazily
 * like this, because it would never fire for a player who stopped playing.
 */
export function settleSynthesis(
  ark: Ark,
  at: Timestamp,
  engine: QuantityEngine,
): Ark {
  const due = ark.pending
    .filter((order) => order.completesAt <= at)
    .sort((a, b) => a.completesAt - b.completesAt);

  if (due.length === 0) {
    return ark;
  }

  let checkpoint = ark.checkpoint;
  for (const order of due) {
    checkpoint = engine.credit(checkpoint, order.completesAt, { fuel: order.fuel });
  }

  return {
    ...ark,
    checkpoint: engine.project(checkpoint, at),
    pending: ark.pending.filter((order) => order.completesAt > at),
  };
}
