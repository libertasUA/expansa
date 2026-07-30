import { accountId, isAccountId, type Principal } from '@expansa/kernel';
import type { AccountRepository } from '@expansa/platform';

import type { Authenticator } from './authenticator';

/**
 * Development-only authenticator: the bearer token *is* the account id.
 *
 * It exists so that use cases, guards and controllers can be written against a
 * final `Principal` before identity providers exist — those need account linking
 * and a provider (#17), and none of that changes the shape of what a use case
 * receives.
 *
 * Three things are deliberately real here even though the verification is fake:
 * the transport (`Authorization: Bearer …`), the failure mode (an unknown token
 * yields null, never a default account), and — since accounts became rows — that
 * the id names an account that exists. Only the proof is missing, so replacing
 * this class is the whole of the work when real auth lands.
 *
 * The existence check is not tidiness. Game rows carry a foreign key to
 * `accounts`, so a well-formed id that is not one would otherwise travel several
 * layers before surfacing as a constraint violation, and a mistyped test header
 * would read as a bug in the game rather than in the header.
 */
export class StubAuthenticator implements Authenticator {
  constructor(private readonly accounts: AccountRepository) {}

  async resolve(token: string): Promise<Principal | null> {
    if (!isAccountId(token)) {
      return null;
    }
    if (!(await this.accounts.exists(token))) {
      return null;
    }
    return { accountId: accountId(token) };
  }
}
