import { useCallback, useEffect, useRef, useState } from 'react';
import { createQuantityEngine, type Checkpoint } from '@expansa/engine-quantity';
import { timestamp } from '@expansa/kernel';

import { ApiError, type ArkView, fetchArk, orderSynthesis } from './api';

/**
 * The same engine the server runs, built from the same definitions.
 *
 * This is the whole reason `engines/quantity` is a portable package rather than
 * server code: the counter below ticks sixty times a second without a single
 * request, and when the player finally spends, the server arrives at the same
 * number. Two implementations of this arithmetic would drift, and the drift
 * would look like the game cheating.
 *
 * Hardcoded here for the slice; it comes from the content package once one exists.
 */
const quantities = createQuantityEngine([
  { id: 'energy', overflow: 'clamp' },
  { id: 'fuel', overflow: 'clamp' },
  { id: 'material', overflow: 'clamp' },
]);

export interface ArkState {
  readonly checkpoint: Checkpoint | null;
  readonly pending: ArkView['pending'];
  readonly error: string | null;
  readonly busy: boolean;
  readonly synthesise: (fuel: number) => void;
}

export function useArk(): ArkState {
  const [server, setServer] = useState<ArkView | null>(null);
  const [projected, setProjected] = useState<Checkpoint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const latest = useRef<ArkView | null>(null);
  latest.current = server;

  useEffect(() => {
    void fetchArk().then(setServer, (cause: unknown) => {
      setError(cause instanceof Error ? cause.message : 'Could not reach the server');
    });
  }, []);

  // Project locally on every frame. No polling: the checkpoint is enough to know
  // the value at any instant, so the network is only touched when something
  // actually changes.
  useEffect(() => {
    let frame = 0;
    const tick = (): void => {
      const current = latest.current;
      if (current !== null) {
        setProjected(quantities.project(current.checkpoint, timestamp(Date.now())));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // A pending order lands at a known instant, so refresh exactly then rather
  // than polling for it.
  useEffect(() => {
    const next = server?.pending[0];
    if (next === undefined) {
      return;
    }
    const delay = Math.max(0, next.completesAt - Date.now()) + 250;
    const timer = setTimeout(() => {
      void fetchArk().then(setServer, () => undefined);
    }, delay);
    return () => clearTimeout(timer);
  }, [server]);

  const synthesise = useCallback((fuel: number) => {
    setBusy(true);
    setError(null);
    void orderSynthesis(fuel)
      .then(setServer, (cause: unknown) => {
        setError(cause instanceof ApiError ? cause.message : 'Something went wrong');
      })
      .finally(() => setBusy(false));
  }, []);

  return {
    checkpoint: projected ?? server?.checkpoint ?? null,
    pending: server?.pending ?? [],
    error,
    busy,
    synthesise,
  };
}
