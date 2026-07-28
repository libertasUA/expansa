/**
 * An instant, as milliseconds since the Unix epoch in UTC.
 *
 * Branded so that it cannot be confused with a Duration or with a plain number
 * of seconds. The two are the same runtime representation and mixing them is the
 * classic bug in a game where every quantity is a function of elapsed time —
 * a construction that finishes in 3600 instead of 3600000 fails silently and
 * looks like a balance problem.
 */
export type Timestamp = number & { readonly __unit: 'ms since epoch' };

/**
 * A length of time in milliseconds. Never negative: an interval that runs
 * backwards is a bug at the call site, not a value to represent.
 */
export type Duration = number & { readonly __unit: 'ms' };

export function timestamp(msSinceEpoch: number): Timestamp {
  if (!Number.isFinite(msSinceEpoch)) {
    throw new RangeError(`Timestamp must be finite, got ${msSinceEpoch}`);
  }
  return msSinceEpoch as Timestamp;
}

export function duration(ms: number): Duration {
  if (!Number.isFinite(ms) || ms < 0) {
    throw new RangeError(`Duration must be finite and non-negative, got ${ms}`);
  }
  return ms as Duration;
}

export const seconds = (n: number): Duration => duration(n * 1_000);
export const minutes = (n: number): Duration => duration(n * 60_000);
export const hours = (n: number): Duration => duration(n * 3_600_000);
export const days = (n: number): Duration => duration(n * 86_400_000);

export function addDuration(at: Timestamp, by: Duration): Timestamp {
  return timestamp(at + by);
}

/**
 * Elapsed time from `from` to `to`. Clamped at zero rather than returning a
 * negative Duration: projecting state to an instant in the past is meaningless,
 * and the callers that do it are catching up to an event whose scheduled time
 * has already been overtaken by a later write.
 */
export function elapsed(from: Timestamp, to: Timestamp): Duration {
  return duration(Math.max(0, to - from));
}

export function isBefore(a: Timestamp, b: Timestamp): boolean {
  return a < b;
}

export function earliest(a: Timestamp, b: Timestamp): Timestamp {
  return a <= b ? a : b;
}
