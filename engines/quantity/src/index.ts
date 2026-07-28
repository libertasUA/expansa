// Contour 2 — projected quantities.
//
// A family of scenarios, not a resource system: this package does not know that
// energy, fuel or material exist. It knows that some things accumulate at a rate
// and stop at a ceiling. See ADR 0002 for the time model it implements.
//
// Depends on @expansa/kernel and nothing else, so it runs unchanged in the
// server and in a client bundle — which is the point, since both sides must
// compute the same number from the same checkpoint.

export {
  type Checkpoint,
  type QuantityDefinition,
  type QuantityDelta,
  type QuantityId,
  type QuantityState,
} from './types';

export { InsufficientQuantityError, UnknownQuantityError } from './errors';

export { type QuantityEngine, createQuantityEngine } from './engine';
