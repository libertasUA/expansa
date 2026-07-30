import { accountId, isAccountId, type Principal } from '@expansa/kernel';

import type { Authenticator } from './authenticator';

/**
 * Development-only authenticator: the bearer token *is* the account id.
 *
 * It exists so that use cases, guards and controllers can be written against a
 * final `Principal` before identity providers exist — those need the database
 * (#13, #17) and account linking, and none of that changes the shape of what a
 * use case receives.
 *
 * Two things are deliberately real here even though the check is fake: the
 * transport (`Authorization: Bearer …`) and the failure mode (unknown token
 * yields null, never a default account). Only the verification is missing, so
 * replacing this class is the whole of the work when real auth lands.
 *
 * There is no account table yet, so any well-formed id is accepted. Once
 * accounts exist this must also confirm the row is there — otherwise a typo in a
 * test header silently becomes a different, non-existent player.
 */
export class StubAuthenticator implements Authenticator {
  resolve(token: string): Promise<Principal | null> {
    if (!isAccountId(token)) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ accountId: accountId(token) });
  }
}
