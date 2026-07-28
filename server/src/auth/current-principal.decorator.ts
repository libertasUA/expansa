import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Principal } from '@expansa/kernel';

import { PRINCIPAL_KEY, type RequestWithPrincipal } from './auth.guard';

/**
 * Injects the authenticated principal into a handler.
 *
 * Throws rather than returning undefined if the guard did not run: a handler
 * asking for the principal on an unguarded route is a wiring mistake, and the
 * alternative is an endpoint that quietly acts on behalf of nobody.
 */
export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Principal => {
    const request = context.switchToHttp().getRequest<RequestWithPrincipal>();
    const principal = request[PRINCIPAL_KEY];
    if (principal === undefined) {
      throw new Error(
        'No principal on the request. @CurrentPrincipal() was used on a route that ' +
          'the AuthGuard did not protect — most likely it is marked @Public().',
      );
    }
    return principal;
  },
);
