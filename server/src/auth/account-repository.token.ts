/**
 * The port itself lives in `@expansa/platform`, which owns `platform.accounts`.
 * Only the injection token belongs here, because only NestJS needs one.
 */
export const ACCOUNT_REPOSITORY = Symbol('AccountRepository');
