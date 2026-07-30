import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'auth:public';

/**
 * Opts a route out of authentication.
 *
 * The guard is registered globally, so routes are protected by default and
 * forgetting to annotate one makes it unreachable rather than open. The
 * annotation that can be forgotten should be the one that fails closed.
 */
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC, true);
