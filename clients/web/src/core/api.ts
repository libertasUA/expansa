import type { Checkpoint } from '@expansa/engine-quantity';
import { timestamp } from '@expansa/kernel';

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

/**
 * Authentication is stubbed server-side, so the bearer token is simply an account
 * id and there is no sign-in flow to build yet. Kept in one place so that the day
 * real tokens arrive, only this file learns about it.
 */
const ACCOUNT_ID = '3f6b1c22-9a44-4c31-8b7e-2d5a90ff1e07';

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ACCOUNT_ID}`,
      ...init?.headers,
    },
  });

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
