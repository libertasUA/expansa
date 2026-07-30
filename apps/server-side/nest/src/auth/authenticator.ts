import type { Principal } from '@expansa/kernel';

/**
 * Turns a bearer token into a principal, or nothing.
 *
 * The port lives in the server rather than in the kernel because only the server
 * authenticates: a client holds a token, it does not verify one. When real
 * providers arrive this moves to `server-runtime` alongside them; the guard that
 * consumes it does not change.
 */
export interface Authenticator {
  /** Returns null for any token that is absent, malformed, expired or unknown. */
  resolve(token: string): Promise<Principal | null>;
}

export const AUTHENTICATOR = Symbol('Authenticator');
