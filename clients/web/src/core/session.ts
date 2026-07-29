import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'expansa.token';

/**
 * The session, as the client sees it: a token and nothing else.
 *
 * In stub mode the token happens to be the account id, but nothing here relies on
 * that — it is an opaque string that goes in a header. When real tokens arrive
 * with an expiry and a refresh, this file learns about it and no other does.
 */
export interface Session {
  readonly token: string | null;
  readonly signIn: (login: string, password: string) => Promise<void>;
  readonly register: (login: string, password: string) => Promise<void>;
  readonly signOut: () => void;
}

export class CredentialsError extends Error {}

function read(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private browsing and some embedded webviews refuse storage. Losing the
    // session on reload is worse than a crash but better than a blank page.
    return null;
  }
}

let current = read();
const listeners = new Set<(token: string | null) => void>();

function set(token: string | null): void {
  current = token;
  try {
    if (token === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, token);
    }
  } catch {
    // See read(): the session simply does not survive a reload.
  }
  for (const listener of listeners) listener(token);
}

/** Read by the API client on every request, and cleared by it on a 401. */
export function currentToken(): string | null {
  return current;
}

export function clearSession(): void {
  set(null);
}

async function authenticate(
  path: 'sign-in' | 'register',
  login: string,
  password: string,
): Promise<void> {
  const response = await fetch(`/v1/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password }),
  });

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? String((body as { message: unknown }).message)
        : 'Could not reach the server';
    throw new CredentialsError(message);
  }

  set((body as { token: string }).token);
}

export function useSession(): Session {
  const [token, setToken] = useState(current);

  useEffect(() => {
    listeners.add(setToken);
    return () => {
      listeners.delete(setToken);
    };
  }, []);

  return {
    token,
    signIn: useCallback(
      (login, password) => authenticate('sign-in', login, password),
      [],
    ),
    register: useCallback(
      (login, password) => authenticate('register', login, password),
      [],
    ),
    signOut: useCallback(() => {
      set(null);
    }, []),
  };
}
