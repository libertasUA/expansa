import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { accountId, type Principal } from '@expansa/kernel';

import { ACCOUNT_REPOSITORY, type Account, type AccountRepository } from './account';
import { hashPassword, verifyPassword } from './password';

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

    if ((await this.accounts.findByLogin(login)) !== null) {
      throw new ConflictException('That login is taken');
    }

    const account: Account = {
      id: accountId(randomUUID()),
      login,
      passwordHash: await hashPassword(password),
    };
    await this.accounts.create(account);

    return { accountId: account.id };
  }

  async signIn(login: string, password: string): Promise<Principal> {
    assertCredentials(login, password);

    const account = await this.accounts.findByLogin(login);

    // Hash even when the login is unknown, so that a missing account and a wrong
    // password take the same time. Otherwise the response time enumerates logins.
    const matches =
      account === null
        ? await verifyPassword(password, await hashPassword(password))
        : await verifyPassword(password, account.passwordHash);

    if (account === null || !matches) {
      throw new UnauthorizedException('Wrong login or password');
    }

    return { accountId: account.id };
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
