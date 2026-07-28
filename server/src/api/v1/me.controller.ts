import { Controller, Get } from '@nestjs/common';
import type { Principal } from '@expansa/kernel';

import { CurrentPrincipal } from '../../auth/current-principal.decorator';

interface MeResponse {
  accountId: string;
}

/**
 * The smallest authenticated endpoint, and the one a client calls on startup to
 * find out whether its stored token is still good.
 *
 * Versioned, unlike `/health`: this is the game contract, and a mobile client
 * pinned to `/v1` may keep calling it for weeks after the server has moved on.
 */
@Controller('v1/me')
export class MeController {
  @Get()
  me(@CurrentPrincipal() principal: Principal): MeResponse {
    return { accountId: principal.accountId };
  }
}
