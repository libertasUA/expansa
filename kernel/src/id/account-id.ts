/**
 * A player account.
 *
 * Deliberately not "user id". One person may sign in through Apple, Google,
 * Steam or email and must remain one account; the identities are separate rows
 * pointing here. Anything owned by a person hangs off this id, never off a
 * credential.
 */
export type AccountId = string & { readonly __brand: 'AccountId' };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function accountId(value: string): AccountId {
  if (!UUID.test(value)) {
    throw new TypeError(`AccountId must be a UUID, got ${JSON.stringify(value)}`);
  }
  return value.toLowerCase() as AccountId;
}

export function isAccountId(value: string): boolean {
  return UUID.test(value);
}
