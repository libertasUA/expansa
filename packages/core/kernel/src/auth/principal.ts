import type { AccountId } from '../id/account-id';

/**
 * Who is acting.
 *
 * Every use case takes one of these rather than a request, a token or a session:
 * the same use case is invoked from HTTP, from a scheduled event handler and
 * from a script, and only the first of those has a request to read.
 *
 * It carries identity and nothing else. Permissions are a separate question with
 * a separate lifetime — clan roles change while a session does not — and putting
 * them here would mean a principal minted at sign-in going stale mid-session.
 */
export interface Principal {
  readonly accountId: AccountId;
}
