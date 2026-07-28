import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { addDuration, seconds, timestamp } from '@expansa/kernel';

import { createQuantityEngine } from './engine';
import { InsufficientQuantityError, UnknownQuantityError } from './errors';
import type { Checkpoint, QuantityDefinition } from './types';

const definitions: readonly QuantityDefinition[] = [
  { id: 'energy', overflow: 'clamp' },
  { id: 'fuel', overflow: 'clamp' },
];

const engine = createQuantityEngine(definitions);

const T0 = timestamp(1_700_000_000_000);

function checkpoint(overrides: Partial<Checkpoint['states']> = {}): Checkpoint {
  return {
    at: T0,
    states: {
      energy: { amount: 100, ratePerSecond: 2, capacity: 500 },
      fuel: { amount: 0, ratePerSecond: 0, capacity: null },
      ...overrides,
    },
  };
}

describe('project', () => {
  it('accumulates at the rate', () => {
    const result = engine.project(checkpoint(), addDuration(T0, seconds(10)));
    assert.equal(result.states.energy?.amount, 120);
  });

  it('leaves a quantity with no rate alone', () => {
    const result = engine.project(checkpoint(), addDuration(T0, seconds(10)));
    assert.equal(result.states.fuel?.amount, 0);
  });

  it('stops at capacity', () => {
    const result = engine.project(checkpoint(), addDuration(T0, seconds(10_000)));
    assert.equal(result.states.energy?.amount, 500);
  });

  it('does not run backwards', () => {
    // Catching up to an instant already passed is not an error: a scheduled event
    // can be overtaken by a later write, and its handler must still be safe.
    const result = engine.project(checkpoint(), timestamp(T0 - 60_000));
    assert.equal(result.states.energy?.amount, 100);
  });

  it('is associative — the property the whole time model rests on', () => {
    // One projection to t2 must equal two projections through t1. If this ever
    // fails, a write catching up to an event time and a read catching up to now
    // will disagree, and resources will drift with no visible cause.
    for (let seed = 0; seed < 200; seed += 1) {
      const rate = (seed % 7) * 0.5;
      const capacity = seed % 3 === 0 ? null : 50 + (seed % 11) * 40;
      const start: Checkpoint = {
        at: T0,
        states: { energy: { amount: seed % 90, ratePerSecond: rate, capacity } },
      };

      const t1 = addDuration(T0, seconds(seed % 60));
      const t2 = addDuration(t1, seconds(seed % 137));

      const direct = engine.project(start, t2);
      const viaT1 = engine.project(engine.project(start, t1), t2);

      assert.equal(
        direct.states.energy?.amount,
        viaT1.states.energy?.amount,
        `associativity broken at seed ${seed}`,
      );
    }
  });
});

describe('spend', () => {
  it('catches up before deducting', () => {
    // 100 + 2/s for 10s = 120, then 20 spent.
    const result = engine.spend(checkpoint(), addDuration(T0, seconds(10)), {
      energy: 20,
    });
    assert.equal(result.states.energy?.amount, 100);
    assert.equal(result.at, addDuration(T0, seconds(10)));
  });

  it('refuses rather than going negative', () => {
    assert.throws(
      () => engine.spend(checkpoint(), T0, { energy: 101 }),
      InsufficientQuantityError,
    );
  });

  it('leaves the input untouched', () => {
    const before = checkpoint();
    engine.spend(before, addDuration(T0, seconds(10)), { energy: 20 });
    assert.equal(before.states.energy?.amount, 100);
  });
});

describe('credit', () => {
  it('adds on arrival', () => {
    const result = engine.credit(checkpoint(), T0, { fuel: 40 });
    assert.equal(result.states.fuel?.amount, 40);
  });

  it('loses the excess when the store is full', () => {
    const result = engine.credit(checkpoint(), T0, { energy: 1_000 });
    assert.equal(result.states.energy?.amount, 500);
  });
});

describe('setRate', () => {
  it('applies the old rate to the time it was in force', () => {
    const at = addDuration(T0, seconds(10));
    const result = engine.setRate(checkpoint(), at, 'energy', 5);
    assert.equal(result.states.energy?.amount, 120);
    assert.equal(result.states.energy?.ratePerSecond, 5);
  });

  it('rejects a negative rate', () => {
    // Continuous drain is how upkeep would be expressed, and upkeep makes a stock
    // run out at a moment that depends on the stock — which project cannot model.
    assert.throws(() => engine.setRate(checkpoint(), T0, 'energy', -1), RangeError);
  });
});

describe('timeUntilAffordable', () => {
  it('reports zero when already affordable', () => {
    assert.equal(engine.timeUntilAffordable(checkpoint(), { energy: 50 }), 0);
  });

  it('divides the shortfall by the rate', () => {
    assert.equal(engine.timeUntilAffordable(checkpoint(), { energy: 120 }), 10_000);
  });

  it('reports never when nothing produces it', () => {
    assert.equal(engine.timeUntilAffordable(checkpoint(), { fuel: 1 }), null);
  });

  it('reports never when the store cannot hold that much', () => {
    assert.equal(engine.timeUntilAffordable(checkpoint(), { energy: 501 }), null);
  });

  it('waits for the slowest of several costs', () => {
    const result = engine.timeUntilAffordable(
      { at: T0, states: { energy: { amount: 0, ratePerSecond: 1, capacity: null } } },
      { energy: 30 },
    );
    assert.equal(result, 30_000);
  });
});

describe('unknown quantities', () => {
  it('rejects content and code disagreeing', () => {
    assert.throws(() => engine.spend(checkpoint(), T0, { plutonium: 1 }), UnknownQuantityError);
  });
});
