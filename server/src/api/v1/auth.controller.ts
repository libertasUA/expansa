import { Body, Controller, Post } from '@nestjs/common';

import { CredentialsUseCase } from '../../auth/credentials.use-case';
import { Public } from '../../auth/public.decorator';

interface SessionResponse {
  readonly token: string;
  readonly accountId: string;
}

/**
 * The only two public routes in the game contract.
 *
 * Registration and sign-in stay separate. One endpoint that creates an account
 * when it fails to find one turns a typo in a login into a second account, and
 * the player discovers this by finding their ark empty.
 */
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly credentials: CredentialsUseCase) {}

  @Public()
  @Post('register')
  async register(
    @Body() body: { login?: unknown; password?: unknown },
  ): Promise<SessionResponse> {
    const principal = await this.credentials.register(
      body?.login as string,
      body?.password as string,
    );
    return { token: principal.accountId, accountId: principal.accountId };
  }

  @Public()
  @Post('sign-in')
  async signIn(
    @Body() body: { login?: unknown; password?: unknown },
  ): Promise<SessionResponse> {
    const principal = await this.credentials.signIn(
      body?.login as string,
      body?.password as string,
    );
    return { token: principal.accountId, accountId: principal.accountId };
  }
}
