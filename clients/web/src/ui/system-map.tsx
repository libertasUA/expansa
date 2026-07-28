import { type JSX, useMemo } from 'react';

import { seededRandom } from '../core/random';

/**
 * The system, as far as anyone knows it.
 *
 * Two rules from the concept decide everything on this screen. **Bodies are
 * public astronomy** — every planet, moon and large asteroid is on the map from
 * the first day, with its orbital slot count, so the map is complete and empty.
 * **Occupancy is not** — who sits in those slots stays dark until someone looks,
 * except around your own planet, where you hang a few thousand kilometres away
 * and watch for free.
 *
 * So the map shows a fully drawn system in which almost nothing is known, and
 * the one lit neighbourhood is your own. A clan is worth joining because its
 * members light up theirs.
 */
export interface Body {
  readonly id: string;
  readonly name: string;
  readonly kind: 'planet' | 'belt';
  readonly orbit: number;
  readonly slots: number;
  /** Slots you can see as taken. Null when the orbit has never been observed. */
  readonly occupied: number | null;
  readonly home?: boolean;
  /** Which slot holds your own ark, when this is your planet. */
  readonly yourSlot?: number;
}

interface SystemMapProps {
  readonly bodies: readonly Body[];
  readonly seed?: number;
  readonly selected?: string | null;
  readonly onSelect?: (id: string) => void;
}

const CENTRE = 430;

export function SystemMap({
  bodies,
  seed = 4771,
  selected = null,
  onSelect,
}: SystemMapProps): JSX.Element {
  const layout = useMemo(() => layOut(bodies, seed), [bodies, seed]);

  return (
    <svg
      className="system"
      viewBox="0 0 860 860"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="The system"
    >
      <defs>
        <radialGradient id="sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff8e6" stopOpacity="1" />
          <stop offset="10%" stopColor="#ffe6ae" stopOpacity="0.65" />
          <stop offset="34%" stopColor="#ffb85e" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#ff9330" stopOpacity="0" />
        </radialGradient>

        {layout.map((body) => (
          <radialGradient
            key={`grad-${body.id}`}
            id={`body-${body.id}`}
            // Lit from the star: the focal point leans towards the centre of the
            // system, so every planet's terminator faces outward on its own.
            cx="50%"
            cy="50%"
            r="50%"
            fx={`${50 - body.towardsStar.x * 32}%`}
            fy={`${50 - body.towardsStar.y * 32}%`}
          >
            <stop offset="0%" stopColor={body.highlight} />
            <stop offset="52%" stopColor={body.base} />
            <stop offset="88%" stopColor="#0a1018" />
            <stop offset="100%" stopColor="#070a10" />
          </radialGradient>
        ))}
      </defs>

      {/* Orbits. Faint, because they are geometry rather than information. */}
      {layout.map((body) =>
        body.kind === 'belt' ? null : (
          <circle
            key={`orbit-${body.id}`}
            cx={CENTRE}
            cy={CENTRE}
            r={body.radius}
            fill="none"
            stroke={body.home === true ? '#3c5f7d' : '#1a2432'}
            strokeWidth="1"
            strokeDasharray={body.home === true ? undefined : '2 6'}
          />
        ),
      )}

      {/* The asteroid belt: finite, depletable, and the thing everybody fights
          over, so it is drawn as scatter rather than as a tidy ring. */}
      {layout
        .filter((body) => body.kind === 'belt')
        .map((belt) => (
          <g key={belt.id} className="belt">
            {belt.rocks.map((rock, index) => (
              <circle
                key={`${belt.id}-${index}`}
                cx={rock.x}
                cy={rock.y}
                r={rock.r}
                fill="#4a5769"
                opacity={rock.opacity}
              />
            ))}
          </g>
        ))}

      <circle cx={CENTRE} cy={CENTRE} r="270" fill="url(#sun)" />
      <circle cx={CENTRE} cy={CENTRE} r="21" fill="#fffbf2" />

      {layout
        .filter((body) => body.kind === 'planet')
        .map((body) => {
          const isSelected = selected === body.id;
          return (
            <g
              key={body.id}
              className={`body${body.home === true ? ' home' : ''}${
                isSelected ? ' selected' : ''
              }`}
              onClick={() => onSelect?.(body.id)}
            >
              {/* Generous invisible target: the planets are small and this is a
                  touch screen as often as not. */}
              <circle cx={body.x} cy={body.y} r={Math.max(body.size + 20, 30)} fill="transparent" />

              <circle cx={body.x} cy={body.y} r={body.size} fill={`url(#body-${body.id})`} />

              {/* One mark per orbital slot. How many there are is public
                  astronomy; who is in them is not, so an unobserved planet shows
                  its slots as empty outlines rather than as free berths. */}
              <g className="slots">
                {Array.from({ length: body.slots }, (_, slot) => {
                  const angle = (slot / body.slots) * Math.PI * 2 - Math.PI / 2;
                  const ring = body.size + 13;
                  const sx = body.x + ring * Math.cos(angle);
                  const sy = body.y + ring * Math.sin(angle);
                  const known = body.occupied !== null;
                  const taken = known && slot < body.occupied;
                  const mine = body.yourSlot === slot;

                  if (mine) {
                    return (
                      <g key={slot}>
                        <circle cx={sx} cy={sy} r="5.5" fill="#7fb6d8" />
                        <circle
                          cx={sx}
                          cy={sy}
                          r="9"
                          fill="none"
                          stroke="#7fb6d8"
                          strokeWidth="1"
                          opacity="0.7"
                        />
                      </g>
                    );
                  }

                  return (
                    <circle
                      key={slot}
                      cx={sx}
                      cy={sy}
                      r={taken ? 4 : 3}
                      fill={taken ? '#5d7d9c' : 'none'}
                      stroke={taken ? 'none' : known ? '#334357' : '#2a3646'}
                      strokeWidth="1.2"
                    />
                  );
                })}
              </g>

              {body.home === true && (
                <circle
                  cx={body.x}
                  cy={body.y}
                  r={body.size + 22}
                  fill="none"
                  stroke="#3c5f7d"
                  strokeWidth="1"
                  opacity="0.55"
                />
              )}

              {isSelected && (
                <circle
                  cx={body.x}
                  cy={body.y}
                  r={body.size + 28}
                  fill="none"
                  stroke="#c8d0dc"
                  strokeWidth="1"
                  strokeDasharray="3 4"
                />
              )}

              <text
                x={body.x}
                y={body.y + body.size + 36}
                textAnchor="middle"
                className="body-label"
              >
                {body.name}
              </text>

              <text
                x={body.x}
                y={body.y + body.size + 50}
                textAnchor="middle"
                className={body.occupied === null ? 'body-unknown' : 'body-known'}
              >
                {body.occupied === null ? '?' : `${body.occupied}/${body.slots}`}
              </text>
            </g>
          );
        })}
    </svg>
  );
}

interface Rock {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly opacity: number;
}

interface LaidOut extends Body {
  readonly radius: number;
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly base: string;
  readonly highlight: string;
  readonly towardsStar: { readonly x: number; readonly y: number };
  readonly rocks: readonly Rock[];
}

const PALETTE = [
  ['#8a6a4f', '#c9a37c'],
  ['#4d6d7a', '#82aabb'],
  ['#5c6e52', '#93ab84'],
  ['#7a5560', '#bb8b98'],
  ['#4f5a7a', '#8894bd'],
  ['#7a7150', '#bfb283'],
  ['#4a6f6a', '#84b3ac'],
] as const;

function layOut(bodies: readonly Body[], seed: number): readonly LaidOut[] {
  const random = seededRandom(seed);

  return bodies.map((body, index) => {
    const radius = 96 + body.orbit * 45;
    const angle = random() * Math.PI * 2;
    const x = CENTRE + radius * Math.cos(angle);
    const y = CENTRE + radius * Math.sin(angle);
    const palette = PALETTE[index % PALETTE.length] ?? PALETTE[0];

    const rocks: Rock[] =
      body.kind === 'belt'
        ? Array.from({ length: 90 }, () => {
            const a = random() * Math.PI * 2;
            const r = radius + (random() - 0.5) * 34;
            return {
              x: CENTRE + r * Math.cos(a),
              y: CENTRE + r * Math.sin(a),
              r: 0.7 + random() * 1.5,
              opacity: 0.25 + random() * 0.5,
            };
          })
        : [];

    return {
      ...body,
      radius,
      x,
      y,
      // Slot count drives size: a bigger world holds more arks.
      size: body.kind === 'belt' ? 0 : 13 + body.slots * 1.5,
      base: palette[0],
      highlight: palette[1],
      towardsStar: { x: Math.cos(angle), y: Math.sin(angle) },
      rocks,
    };
  });
}
