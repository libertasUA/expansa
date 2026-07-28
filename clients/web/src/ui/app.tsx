import { type JSX, useEffect, useState } from 'react';

import { useArk } from '../core/use-ark';
import './app.css';

const ORDER_SIZE = 5;

export function App(): JSX.Element {
  const { checkpoint, pending, error, busy, synthesise } = useArk();
  const [now, setNow] = useState(Date.now());

  // Only drives the countdown text. The quantities themselves are projected by
  // the engine on every animation frame, not by this.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  if (checkpoint === null) {
    return <main className="ark">{error ?? 'Waking the ark…'}</main>;
  }

  return (
    <main className="ark">
      <h1>Ark</h1>

      <dl className="quantities">
        {Object.entries(checkpoint.states).map(([id, state]) => (
          <div key={id} className="quantity">
            <dt>{id}</dt>
            <dd>
              <span className="amount">{Math.floor(state.amount).toLocaleString()}</span>
              <span className="capacity">
                {state.capacity === null ? '' : ` / ${state.capacity.toLocaleString()}`}
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
              {order.fuel} fuel in {Math.max(0, Math.ceil((order.completesAt - now) / 1000))}s
            </li>
          ))}
        </ul>
      )}

      <p className="note">
        The counter is computed in this tab from a checkpoint the server sent once —
        no polling. Close it, come back later, and it will have caught up.
      </p>
    </main>
  );
}
