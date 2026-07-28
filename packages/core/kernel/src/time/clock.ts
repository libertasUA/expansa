import { type Timestamp, addDuration, type Duration, timestamp } from './timestamp';

/**
 * The only sanctioned source of the current time.
 *
 * ADR 0001 requires this to be injectable and ADR 0002 forbids `Date.now()` in
 * domain code: without a clock that can be moved by hand, a two-hour
 * construction cannot be tested in less than two hours.
 */
export interface Clock {
  now(): Timestamp;
}

/**
 * Reads the wall clock.
 *
 * The one impure function in this package. It stays here rather than in a
 * platform package because `Date.now()` exists identically in Node, a browser
 * and React Native — kernel's rule is "portable and dependency-free", not
 * "pure", and duplicating this per platform would be worse.
 */
export function systemClock(): Clock {
  return {
    now: () => timestamp(Date.now()),
  };
}

export interface ManualClock extends Clock {
  advance(by: Duration): Timestamp;
  set(to: Timestamp): void;
}

/**
 * A clock under test control. Deterministic and portable, so it belongs beside
 * the port rather than in a test-only package that every consumer would have to
 * depend on separately.
 */
export function manualClock(startAt: Timestamp): ManualClock {
  let current = startAt;

  return {
    now: () => current,
    advance: (by) => {
      current = addDuration(current, by);
      return current;
    },
    set: (to) => {
      current = to;
    },
  };
}
