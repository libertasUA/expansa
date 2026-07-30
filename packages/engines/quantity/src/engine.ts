import { type Duration, type Timestamp, duration, elapsed } from '@expansa/kernel';

import { InsufficientQuantityError, UnknownQuantityError } from './errors';
import type {
  Checkpoint,
  QuantityDefinition,
  QuantityDelta,
  QuantityId,
  QuantityState,
} from './types';

const MS_PER_SECOND = 1_000;

export interface QuantityEngine {
  project(checkpoint: Checkpoint, at: Timestamp): Checkpoint;
  canAfford(checkpoint: Checkpoint, at: Timestamp, cost: QuantityDelta): boolean;
  spend(checkpoint: Checkpoint, at: Timestamp, cost: QuantityDelta): Checkpoint;
  credit(checkpoint: Checkpoint, at: Timestamp, amounts: QuantityDelta): Checkpoint;
  setRate(
    checkpoint: Checkpoint,
    at: Timestamp,
    quantityId: QuantityId,
    ratePerSecond: number,
  ): Checkpoint;
  timeUntilAffordable(checkpoint: Checkpoint, cost: QuantityDelta): Duration | null;
}

/**
 * Builds the engine from content.
 *
 * Definitions arrive as an argument and are never imported: adding a quantity is
 * a content change, and this file does not know that energy or fuel exist.
 */
export function createQuantityEngine(
  definitions: readonly QuantityDefinition[],
): QuantityEngine {
  const known = new Set(definitions.map((definition) => definition.id));

  function require(states: Checkpoint['states'], id: QuantityId): QuantityState {
    const state = states[id];
    if (state === undefined || !known.has(id)) {
      throw new UnknownQuantityError(id);
    }
    return state;
  }

  /**
   * The checkpoint carried forward to `at`. Pure, and the only place elapsed time
   * becomes a number.
   *
   * **Associative by construction**, which is the property the whole time model
   * rests on: projecting to t2 equals projecting to t1 and then t1 to t2. That is
   * what lets a write catch up to an event's instant and a read catch up to now
   * without the two disagreeing.
   *
   * Clamping does not break it — `min(a + r·Δ, C)` composes because clamping is
   * monotone and the rate is non-negative. What *would* break it is a rate that
   * depends on an amount, because the rate would then change partway through an
   * interval at a moment nobody computed. That is the invariant to protect: a
   * mechanic wanting production to halt when a store fills, or units to starve as
   * a stock runs out, must become a scheduled event instead of a rate.
   */
  function project(checkpoint: Checkpoint, at: Timestamp): Checkpoint {
    const seconds = elapsed(checkpoint.at, at) / MS_PER_SECOND;
    if (seconds === 0) {
      return checkpoint;
    }

    const states: Record<QuantityId, QuantityState> = {};
    for (const [id, state] of Object.entries(checkpoint.states)) {
      const grown = state.amount + state.ratePerSecond * seconds;
      states[id] = {
        ...state,
        amount: state.capacity === null ? grown : Math.min(grown, state.capacity),
      };
    }

    return { at, states };
  }

  function canAfford(
    checkpoint: Checkpoint,
    at: Timestamp,
    cost: QuantityDelta,
  ): boolean {
    const current = project(checkpoint, at);
    return Object.entries(cost).every(
      ([id, required]) => require(current.states, id).amount >= required,
    );
  }

  /**
   * Deducts `cost`, catching up first. The catch-up is inside on purpose: every
   * mutation has to happen at a known instant, and leaving that to the caller is
   * how resources quietly go missing.
   */
  function spend(checkpoint: Checkpoint, at: Timestamp, cost: QuantityDelta): Checkpoint {
    const current = project(checkpoint, at);
    const states = { ...current.states };

    for (const [id, required] of Object.entries(cost)) {
      const state = require(states, id);
      if (state.amount < required) {
        throw new InsufficientQuantityError(id, state.amount, required);
      }
      states[id] = { ...state, amount: state.amount - required };
    }

    return { at, states };
  }

  /**
   * Adds `amounts` — a convoy unloading, a synthesis completing.
   *
   * Clamped at capacity like everything else, so a delivery into a full store
   * loses the excess rather than exceeding the limit.
   */
  function credit(
    checkpoint: Checkpoint,
    at: Timestamp,
    amounts: QuantityDelta,
  ): Checkpoint {
    const current = project(checkpoint, at);
    const states = { ...current.states };

    for (const [id, received] of Object.entries(amounts)) {
      const state = require(states, id);
      const raised = state.amount + received;
      states[id] = {
        ...state,
        amount: state.capacity === null ? raised : Math.min(raised, state.capacity),
      };
    }

    return { at, states };
  }

  /**
   * Changes a rate — a module comes online, a complex is destroyed.
   *
   * Catches up first, so the old rate applies to the time it was actually in
   * force. Skipping that would retroactively rewrite history at the new rate.
   */
  function setRate(
    checkpoint: Checkpoint,
    at: Timestamp,
    quantityId: QuantityId,
    ratePerSecond: number,
  ): Checkpoint {
    if (ratePerSecond < 0) {
      // Negative rates are how continuous upkeep would be expressed, and upkeep
      // is what makes a stock run out at a moment that depends on the stock —
      // the one thing `project` cannot represent. Fleet size is capped by
      // shipyard berths instead, and fuel is charged when a fleet is dispatched.
      throw new RangeError(
        `Rates must be non-negative, got ${ratePerSecond} for ${quantityId}`,
      );
    }

    const current = project(checkpoint, at);
    const state = require(current.states, quantityId);

    return {
      at,
      states: { ...current.states, [quantityId]: { ...state, ratePerSecond } },
    };
  }

  /**
   * How long until `cost` can be paid, or null if never.
   *
   * "Never" covers two cases that look different to a player and identical here:
   * nothing is producing the quantity, or the store cannot physically hold as
   * much as is being asked for.
   *
   * This is a question, not a schedule. Nothing needs to fire when the answer
   * comes true — the client uses it to show "affordable in 2h" and recomputes on
   * its own — which is why the model has no events whose time must be recomputed
   * every time a checkpoint is written.
   */
  function timeUntilAffordable(
    checkpoint: Checkpoint,
    cost: QuantityDelta,
  ): Duration | null {
    let longestMs = 0;

    for (const [id, required] of Object.entries(cost)) {
      const state = require(checkpoint.states, id);

      const missing = required - state.amount;
      if (missing <= 0) {
        continue;
      }
      if (state.ratePerSecond <= 0) {
        return null;
      }
      if (state.capacity !== null && required > state.capacity) {
        return null;
      }

      longestMs = Math.max(longestMs, (missing / state.ratePerSecond) * MS_PER_SECOND);
    }

    return duration(longestMs);
  }

  return { project, canAfford, spend, credit, setRate, timeUntilAffordable };
}
