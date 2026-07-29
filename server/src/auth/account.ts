import type { AccountId } from '@expansa/kernel';

/**
 * A player, identified by whatever they signed in with.
 *
 * Deliberately not "user": one person may arrive through Apple, Google, Steam or
 * a login and must remain one account. The login below is the stub's stand-in for
 * an identity row, and disappears with it.
 */
export interface Account {
  readonly id: AccountId;
  readonly login: string;
  readonly passwordHash: string;
}

export interface AccountRepository {
  findByLogin(login: string): Promise<Account | null>;
  create(account: Account): Promise<void>;
}

export const ACCOUNT_REPOSITORY = Symbol('AccountRepository');
