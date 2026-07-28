import type { QuantityDefinition } from '@expansa/engine-quantity';

/**
 * Contour 3 — content, as data.
 *
 * A TypeScript constant for now rather than the `content` package, because three
 * entries do not justify a package yet. What matters is that it is *passed* to
 * the engine and never imported by it: moving this to YAML later changes this
 * file and nothing else.
 */
export const QUANTITIES: readonly QuantityDefinition[] = [
  { id: 'energy', overflow: 'clamp' },
  { id: 'fuel', overflow: 'clamp' },
  { id: 'material', overflow: 'clamp' },
];

/**
 * What a survivor starts with. Energy accrues on its own — sunlight is the one
 * thing nobody can take — and everything else has to be synthesised or fetched.
 */
export const STARTING_STATE = {
  energy: { amount: 50, ratePerSecond: 1, capacity: 500 },
  fuel: { amount: 0, ratePerSecond: 0, capacity: 200 },
  material: { amount: 0, ratePerSecond: 0, capacity: 1_000 },
} as const;

/**
 * Synthesis converts energy into fuel at a deliberately poor rate: it is the
 * floor that keeps a stripped player alive, not a way to prosper. Extraction is
 * supposed to be the good option.
 */
export const SYNTHESIS = {
  energyPerFuel: 4,
  secondsPerFuel: 3,
  maxPerOrder: 50,
} as const;
