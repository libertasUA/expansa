import type { Checkpoint } from '@expansa/engine-quantity';
import { timestamp } from '@expansa/kernel';

import { clearSession, currentToken } from './session';

export interface PendingSynthesis {
  readonly id: string;
  readonly fuel: number;
  readonly completesAt: number;
}

export interface ArkView {
  readonly checkpoint: Checkpoint;
  readonly pending: readonly PendingSynthesis[];
}

interface ArkResponse {
  readonly at: number;
  readonly quantities: Checkpoint['states'];
  readonly pending: readonly PendingSynthesis[];
}

export class ApiError extends Error {}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const token = currentToken();

  const response = await fetch(`/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token === null ? {} : { Authorization: `Bearer ${token}` }),
      ...init?.headers,
    },
  });

  // A token the server will not honour is a token worth forgetting: expired,
  // revoked, or left over from a database that has since been reset. Clearing it
  // here means every caller gets sent back to sign-in without knowing about it.
  if (response.status === 401) {
    clearSession();
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? String((body as { message: unknown }).message)
        : `Request failed with ${response.status}`;
    throw new ApiError(message);
  }
  return body as T;
}

function toArk(response: ArkResponse): ArkView {
  return {
    checkpoint: { at: timestamp(response.at), states: response.quantities },
    pending: response.pending,
  };
}

export async function fetchArk(): Promise<ArkView> {
  return toArk(await call<ArkResponse>('/ark'));
}

export async function orderSynthesis(fuel: number): Promise<ArkView> {
  return toArk(
    await call<ArkResponse>('/ark/synthesise', {
      method: 'POST',
      body: JSON.stringify({ fuel }),
    }),
  );
}
