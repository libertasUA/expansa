import { and, eq } from 'drizzle-orm';

import type { Database } from '../database/connection';
import { accounts, identities } from './schema';

/**
 * An account together with the identity it was found by.
 *
 * `secret` is whatever proving that identity requires: a password hash today,
 * nothing at all for a provider that vouches for the subject itself.
 */
export interface AccountIdentity {
  readonly accountId: string;
  readonly provider: string;
  readonly externalId: string;
  readonly secret: string | null;
}

export interface AccountRepository {
  findByIdentity(provider: string, externalId: string): Promise<AccountIdentity | null>;
  createWithIdentity(identity: AccountIdentity): Promise<void>;

  /**
   * Whether this id names an account at all.
   *
   * Needed because game rows carry a foreign key to `accounts`, so an id that
   * passes for one and is not one turns into a constraint violation several
   * layers down rather than a refusal at the edge.
   */
  exists(accountId: string): Promise<boolean>;
}

/**
 * Accounts belong to `platform`, so their storage does too — a repository
 * touching `game.*` would belong to the product instead. See ADR 0004.
 */
export class DrizzleAccountRepository implements AccountRepository {
  constructor(private readonly db: Database) {}

  async findByIdentity(
    provider: string,
    externalId: string,
  ): Promise<AccountIdentity | null> {
    const [row] = await this.db
      .select({
        accountId: identities.accountId,
        provider: identities.provider,
        externalId: identities.externalId,
        secret: identities.secret,
      })
      .from(identities)
      .where(
        and(eq(identities.provider, provider), eq(identities.externalId, externalId)),
      )
      .limit(1);

    return row ?? null;
  }

  async exists(accountId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: accounts.id })
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .limit(1);

    return row !== undefined;
  }

  /**
   * Both rows or neither. The account exists to be pointed at, so one without an
   * identity is unreachable by anyone and invisible to every query that matters.
   */
  async createWithIdentity(identity: AccountIdentity): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(accounts).values({ id: identity.accountId });
      await tx.insert(identities).values({
        provider: identity.provider,
        externalId: identity.externalId,
        secret: identity.secret,
        accountId: identity.accountId,
      });
    });
  }
}
