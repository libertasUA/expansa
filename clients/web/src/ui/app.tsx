import { type JSX, useEffect, useState } from 'react';

import { useArk } from '../core/use-ark';
import { ArkSilhouette, type Compartment } from './ark-silhouette';
import { SpaceBackdrop } from './space-backdrop';
import './app.css';

const ORDER_SIZE = 5;

/**
 * Placeholder until the server owns compartments.
 *
 * Shaped like the response it will be replaced by, so wiring it up is deleting
 * this. Core level 4 so the second ring is open and the third is not — which is
 * the state worth looking at while the layout is being judged.
 */
const CORE_LEVEL = 4;

const OCCUPIED: Readonly<Record<number, Compartment>> = {
  0: { index: 0, module: 'collector', level: 3 },
  1: { index: 1, module: 'collector', level: 2 },
  2: { index: 2, module: 'storage', level: 2 },
  3: { index: 3, module: 'synthesiser', level: 1 },
  5: { index: 5, module: 'collector', level: 1, restoring: true },
  8: { index: 8, module: 'storage', level: 1 },
  9: { index: 9, module: 'fabricator', level: 1 },
  13: { index: 13, module: 'dock', level: 1 },
  17: { index: 17, module: 'sensors', level: 1, restoring: true },
};

const COMPARTMENTS: readonly Compartment[] = Array.from({ length: 40 }, (_, index) =>
  OCCUPIED[index] ?? { index, module: null },
);

const MODULE_NAMES: Readonly<Record<string, string>> = {
  core: 'Core',
  collector: 'Solar collector',
  storage: 'Holds',
  synthesiser: 'Synthesiser',
  fabricator: 'Fabricator',
  shipyard: 'Shipyard',
  dock: 'Dock',
  sensors: 'Sensor array',
};

export function App(): JSX.Element {
  const { checkpoint, pending, error, busy, synthesise } = useArk();
  const [now, setNow] = useState(Date.now());
  const [selected, setSelected] = useState<number | null>(null);

  // Only drives the countdown text. The quantities themselves are projected by
  // the engine on every animation frame, not by this.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <SpaceBackdrop />

      <div className="scene">
        <ArkSilhouette
          compartments={COMPARTMENTS}
          coreLevel={CORE_LEVEL}
          selected={selected}
          onSelect={(index) => setSelected(index === selected ? null : index)}
        />

        <aside className="panel">
          <h1>Ark</h1>

          {checkpoint === null ? (
            <p className="waiting">{error ?? 'Waking the ark…'}</p>
          ) : (
            <>
              <dl className="quantities">
                {Object.entries(checkpoint.states).map(([id, state]) => (
                  <div key={id} className="quantity">
                    <dt>{id}</dt>
                    <dd>
                      <span className="amount">
                        {Math.floor(state.amount).toLocaleString()}
                      </span>
                      <span className="capacity">
                        {state.capacity === null
                          ? ''
                          : ` / ${state.capacity.toLocaleString()}`}
                      </span>
                      {state.ratePerSecond > 0 && (
                        <span className="rate">+{state.ratePerSecond}/s</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>

              <button type="button" onClick={() => synthesise(ORDER_SIZE)} disabled={busy}>
                Synthesise {ORDER_SIZE} fuel
              </button>

              {error !== null && <p className="error">{error}</p>}

              {pending.length > 0 && (
                <ul className="pending">
                  {pending.map((order) => (
                    <li key={order.id}>
                      {order.fuel} fuel in{' '}
                      {Math.max(0, Math.ceil((order.completesAt - now) / 1000))}s
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          <p className="note">
            {selected === null ? (
              <>
                Core level {CORE_LEVEL}. Space is not the limit — the core is: a ring
                stays dark until the core can carry it.
              </>
            ) : (
              <>
                Cell {selected + 1} —{' '}
                {COMPARTMENTS[selected]?.module === undefined ||
                COMPARTMENTS[selected]?.module === null
                  ? 'empty'
                  : `${MODULE_NAMES[COMPARTMENTS[selected].module] ?? ''} ${
                      COMPARTMENTS[selected]?.level ?? 1
                    }`}
              </>
            )}
          </p>
        </aside>
      </div>
    </>
  );
}
