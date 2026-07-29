import { Injectable } from '@nestjs/common';

import type { Account, AccountRepository } from './account';

/**
 * Accounts for the stub, behind the port `platform.accounts` will implement.
 *
 * Lost on restart and wrong behind more than one server. Both are fine while the
 * credentials themselves are a placeholder, and neither is fine afterwards —
 * swapping this class for one backed by the database is the whole of that change,
 * once #13 provides a `Database`.
 */
@Injectable()
export class InMemoryAccountRepository implements AccountRepository {
  private readonly byLogin = new Map<string, Account>();

  findByLogin(login: string): Promise<Account | null> {
    return Promise.resolve(this.byLogin.get(login.toLowerCase()) ?? null);
  }

  create(account: Account): Promise<void> {
    this.byLogin.set(account.login.toLowerCase(), account);
    return Promise.resolve();
  }
}
