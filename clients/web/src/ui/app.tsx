import { type JSX, useEffect, useState } from 'react';

import { useArk } from '../core/use-ark';
import { ArkSilhouette, type Compartment } from './ark-silhouette';
import { SpaceBackdrop } from './space-backdrop';
import { SystemMap, type Body } from './system-map';
import './app.css';

const ORDER_SIZE = 5;

/**
 * Placeholders until the server owns any of this.
 *
 * Both are shaped like the responses that will replace them, so wiring the
 * server up is deleting constants. Core level 4 so the second ring is open and
 * the third is not, which is the state worth looking at while the layout is
 * being judged.
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

const COMPARTMENTS: readonly Compartment[] = Array.from(
  { length: 40 },
  (_, index) => OCCUPIED[index] ?? { index, module: null },
);

/**
 * Occupancy is null everywhere except home: bodies are public astronomy, but who
 * sits in their slots is not, and your own orbit is the one you watch for free.
 */
const BODIES: readonly Body[] = [
  { id: 'i', name: 'Kerith I', kind: 'planet', orbit: 0, slots: 4, occupied: null },
  { id: 'ii', name: 'Kerith II', kind: 'planet', orbit: 1, slots: 8, occupied: null },
  {
    id: 'iii',
    name: 'Kerith III',
    kind: 'planet',
    orbit: 2,
    slots: 8,
    occupied: 6,
    home: true,
    yourSlot: 0,
  },
  { id: 'belt', name: 'The Scatter', kind: 'belt', orbit: 3, slots: 0, occupied: null },
  { id: 'iv', name: 'Kerith IV', kind: 'planet', orbit: 4, slots: 10, occupied: null },
  { id: 'v', name: 'Kerith V', kind: 'planet', orbit: 5, slots: 6, occupied: null },
  { id: 'vi', name: 'Kerith VI', kind: 'planet', orbit: 6, slots: 4, occupied: null },
];

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

type View = 'ark' | 'system';

export function App(): JSX.Element {
  const { checkpoint, pending, error, busy, synthesise } = useArk();
  const [view, setView] = useState<View>('ark');
  const [now, setNow] = useState(Date.now());
  const [cell, setCell] = useState<number | null>(null);
  const [body, setBody] = useState<string | null>(null);

  // Only drives the countdown text. The quantities themselves are projected by
  // the engine on every animation frame, not by this.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  const selectedBody = BODIES.find((candidate) => candidate.id === body) ?? null;

  return (
    <>
      {/* Inside the ark you look out at your planet; on the map that planet is
          one dot among several, so the scenery drops it and keeps the dark. */}
      <SpaceBackdrop showPlanet={view === 'ark'} />

      <div className="scene">
        <div className="stage">
          {view === 'ark' ? (
            <ArkSilhouette
              compartments={COMPARTMENTS}
              coreLevel={CORE_LEVEL}
              selected={cell}
              onSelect={(index) => setCell(index === cell ? null : index)}
            />
          ) : (
            <SystemMap
              bodies={BODIES}
              selected={body}
              onSelect={(id) => setBody(id === body ? null : id)}
            />
          )}
        </div>

        <aside className="panel">
          <nav className="views">
            <button
              type="button"
              className={view === 'ark' ? 'active' : ''}
              onClick={() => setView('ark')}
            >
              Ark
            </button>
            <button
              type="button"
              className={view === 'system' ? 'active' : ''}
              onClick={() => setView('system')}
            >
              System
            </button>
          </nav>

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

              <button
                type="button"
                onClick={() => synthesise(ORDER_SIZE)}
                disabled={busy}
              >
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

          {view === 'ark' ? (
            <p className="note">
              {cell === null
                ? `Core level ${CORE_LEVEL}. Space is not the limit — the core is: a ring stays dark until the core can carry it.`
                : `Cell ${cell + 1} — ${describeCell(cell)}`}
            </p>
          ) : (
            <p className="note">
              {selectedBody === null
                ? 'Every body is on the map from the first day. Who is in orbit around them is not.'
                : describeBody(selectedBody)}
            </p>
          )}
        </aside>
      </div>
    </>
  );
}

function describeCell(index: number): string {
  const compartment = COMPARTMENTS[index];
  if (compartment?.module == null) {
    return 'empty';
  }
  return `${MODULE_NAMES[compartment.module] ?? compartment.module} ${compartment.level ?? 1}`;
}

function describeBody(selected: Body): string {
  if (selected.kind === 'belt') {
    return `${selected.name} — a debris field. Finite, and everyone wants it.`;
  }
  if (selected.occupied === null) {
    return `${selected.name} — ${selected.slots} orbital slots. Nobody has looked; send a probe.`;
  }
  return `${selected.name} — ${selected.occupied} of ${selected.slots} slots taken. Your own orbit, watched for free.`;
}
