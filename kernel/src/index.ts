// Contour 1, portable half. Descriptions only: types, ports and pure functions,
// with no dependency on a platform, a framework or a database.
//
// Contour 2 engines may import this package and nothing else from the
// repository — see ADR 0003.

export {
  type Timestamp,
  type Duration,
  timestamp,
  duration,
  seconds,
  minutes,
  hours,
  days,
  addDuration,
  elapsed,
  isBefore,
  earliest,
} from './time/timestamp';

export { type Clock, type ManualClock, systemClock, manualClock } from './time/clock';

export { type AccountId, accountId, isAccountId } from './id/account-id';

export { type Principal } from './auth/principal';
