import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { accountId, type Principal } from '@expansa/kernel';
import type { AccountRepository } from '@expansa/platform';

import { ACCOUNT_REPOSITORY } from './account-repository.token';
import { hashPassword, verifyPassword } from './password';

/**
 * A login and a password is one identity provider among the several to come —
 * Apple, Google, Steam. Naming it here rather than inlining the string is what
 * makes adding one an insert rather than a schema change.
 */
const PASSWORD = 'password';

const MIN_LOGIN = 3;
const MIN_PASSWORD = 8;

/**
 * Registration and sign-in against a login and a password.
 *
 * The credentials are the stub; the result is not. Both paths end in a
 * `Principal`, which is what every use case takes and what identity providers
 * will produce instead — so replacing this file changes nothing above it.
 */
@Injectable()
export class CredentialsUseCase {
  constructor(@Inject(ACCOUNT_REPOSITORY) private readonly accounts: AccountRepository) {}

  async register(login: string, password: string): Promise<Principal> {
    assertCredentials(login, password);

    if ((await this.accounts.findByIdentity(PASSWORD, login)) !== null) {
      throw new ConflictException('That login is taken');
    }

    const id = accountId(randomUUID());
    await this.accounts.createWithIdentity({
      accountId: id,
      provider: PASSWORD,
      externalId: login,
      secret: await hashPassword(password),
    });

    return { accountId: id };
  }

  async signIn(login: string, password: string): Promise<Principal> {
    assertCredentials(login, password);

    const identity = await this.accounts.findByIdentity(PASSWORD, login);

    // Hash even when the login is unknown, so that a missing account and a wrong
    // password take the same time. Otherwise the response time enumerates logins.
    const matches = await verifyPassword(
      password,
      identity?.secret ?? (await hashPassword(password)),
    );

    if (identity === null || !matches) {
      throw new UnauthorizedException('Wrong login or password');
    }

    return { accountId: accountId(identity.accountId) };
  }
}

/**
 * Hand-checked rather than validated by a schema: the validation approach is
 * still open (#14), and guessing at it here would be harder to undo than four
 * lines of arithmetic.
 */
function assertCredentials(login: unknown, password: unknown): asserts login is string {
  if (typeof login !== 'string' || login.trim().length < MIN_LOGIN) {
    throw new BadRequestException(`login must be at least ${MIN_LOGIN} characters`);
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
    throw new BadRequestException(`password must be at least ${MIN_PASSWORD} characters`);
  }
}
