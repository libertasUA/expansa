import type { Timestamp } from '@expansa/kernel';

/**
 * Identifies one accumulating quantity — energy, fuel, material.
 *
 * A string rather than a union or an enum, deliberately. The moment this becomes
 * `'energy' | 'fuel'`, adding a quantity means editing TypeScript, and the whole
 * point of an engine is that a new Contour 3 entity costs zero lines of code.
 */
export type QuantityId = string;

/**
 * What a quantity is, as declared by content. The engine is built from these and
 * knows nothing else about them.
 */
export interface QuantityDefinition {
  readonly id: QuantityId;

  /**
   * What happens on reaching capacity. Only clamping exists so far: the excess is
   * lost, and the alternative — halting whatever produces it — would make one
   * quantity's rate depend on another's amount, which is exactly what
   * `project` cannot survive. See the invariant on `project`.
   */
  readonly overflow: 'clamp';
}

export interface QuantityState {
  readonly amount: number;

  /**
   * Units per second. Content expresses rates per hour because that is what a
   * player reads; the conversion happens when content is loaded, so the engine
   * never carries two units for one idea.
   */
  readonly ratePerSecond: number;

  /** Null means unbounded. */
  readonly capacity: number | null;
}

/**
 * Everything known about a holding's quantities at one instant.
 *
 * Stored as-is and sent to clients as-is: the server does not send a computed
 * number, it sends this, and both sides run the same projection. That is what
 * keeps a client's ticking counter from disagreeing with the server when the
 * player spends.
 */
export interface Checkpoint {
  readonly at: Timestamp;
  readonly states: Readonly<Record<QuantityId, QuantityState>>;
}

/** A cost or a credit, keyed by quantity. Costs are positive; see `spend`. */
export type QuantityDelta = Readonly<Record<QuantityId, number>>;
