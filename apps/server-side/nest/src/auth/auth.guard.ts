import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';

import type { Principal } from '@expansa/kernel';

import { AUTHENTICATOR, type Authenticator } from './authenticator';
import { IS_PUBLIC } from './public.decorator';

/** Where the resolved principal is parked for the param decorator to pick up. */
export const PRINCIPAL_KEY = 'expansaPrincipal';

export type RequestWithPrincipal = FastifyRequest & {
  [PRINCIPAL_KEY]?: Principal;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTHENTICATOR) private readonly authenticator: Authenticator,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithPrincipal>();
    const token = bearerToken(request.headers.authorization);
    if (token === null) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const principal = await this.authenticator.resolve(token);
    if (principal === null) {
      // Deliberately the same message as a missing token: distinguishing
      // "unknown" from "malformed" tells an attacker which ids exist.
      throw new UnauthorizedException('Missing bearer token');
    }

    request[PRINCIPAL_KEY] = principal;
    return true;
  }
}

function bearerToken(header: string | undefined): string | null {
  if (header === undefined) {
    return null;
  }
  const [scheme, value, ...rest] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || value === undefined || rest.length > 0) {
    return null;
  }
  return value;
}
