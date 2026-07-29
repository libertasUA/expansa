import { Logger, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { ACCOUNT_REPOSITORY } from './account';
import { AuthGuard } from './auth.guard';
import { AUTHENTICATOR, type Authenticator } from './authenticator';
import { CredentialsUseCase } from './credentials.use-case';
import { InMemoryAccountRepository } from './in-memory-account.repository';
import { StubAuthenticator } from './stub-authenticator';

/**
 * Chooses the authenticator, and refuses to start rather than guess.
 *
 * `AUTH_MODE` has no permissive default on purpose. The failure everyone in this
 * genre eventually ships is a development bypass that survived to production
 * because it was the fallback; here the fallback is a crash. Unset or `real`
 * cannot boot at all — real authentication is not written yet — so a deployment
 * that forgets the variable fails loudly at startup instead of accepting any
 * account id from anyone.
 */
function selectAuthenticator(): Authenticator {
  const mode = process.env.AUTH_MODE;

  if (mode === 'stub') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'AUTH_MODE=stub refuses to run with NODE_ENV=production. The stub accepts ' +
          'any account id as its own proof of identity.',
      );
    }
    new Logger('Auth').warn(
      'Authentication is STUBBED: the bearer token is taken as the account id, ' +
        'unverified. Development only.',
    );
    return new StubAuthenticator();
  }

  if (mode === 'real') {
    throw new Error(
      'AUTH_MODE=real is not implemented yet — identity providers need the database ' +
        '(#13, #17). Use AUTH_MODE=stub in development.',
    );
  }

  throw new Error(
    `AUTH_MODE must be set explicitly to "stub" or "real", got ${
      mode === undefined ? 'nothing' : JSON.stringify(mode)
    }. There is no default: an unset variable must not silently pick the ` +
      'development bypass.',
  );
}

@Module({
  providers: [
    { provide: AUTHENTICATOR, useFactory: selectAuthenticator },
    // Global, so routes are protected unless they opt out with @Public().
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: ACCOUNT_REPOSITORY, useClass: InMemoryAccountRepository },
    CredentialsUseCase,
  ],
  exports: [AUTHENTICATOR, CredentialsUseCase],
})
export class AuthModule {}
