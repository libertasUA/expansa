import { type JSX } from 'react';

/**
 * The ark seen head-on: a ring station turning around a core.
 *
 * Space is not the constraint — the hull is vast and mostly sealed. What limits
 * a survivor is the core: it powers and coordinates everything, and a ring stays
 * dark until the core can carry it. So the picture is the progression. A new ark
 * is a dim core with a few lit cells; a developed one is a lit disc.
 *
 * Drawn rather than generated, unlike the scenery behind it: there is one ark
 * design and every player has the same one, so it is a single asset no matter
 * how large the world gets.
 */
export type ModuleKind =
  | 'core'
  | 'collector'
  | 'storage'
  | 'synthesiser'
  | 'fabricator'
  | 'shipyard'
  | 'dock'
  | 'sensors';

export interface Compartment {
  readonly index: number;
  readonly module: ModuleKind | null;
  readonly level?: number;
  readonly restoring?: boolean;
}

interface ArkSilhouetteProps {
  readonly compartments: readonly Compartment[];
  readonly coreLevel: number;
  readonly onSelect?: (index: number) => void;
  readonly selected?: number | null;
}

/** Light colour per module, so a glance at the disc says what is running. */
const MODULE_LIGHT: Readonly<Record<ModuleKind, string>> = {
  core: '#e8d5a0',
  collector: '#ffc663',
  storage: '#7f9fc4',
  synthesiser: '#63d0a0',
  fabricator: '#ff9a5c',
  shipyard: '#63c9e0',
  dock: '#a78bd4',
  sensors: '#9fd4ef',
};

/**
 * Forty cells over three rings. The counts rise outward because the
 * circumference does, so every cell is roughly the same size — a ring of eight
 * cells at the outer edge would be absurdly long ones.
 */
const RINGS = [
  { count: 8, inner: 116, outer: 176, requiresCore: 1 },
  { count: 14, inner: 194, outer: 264, requiresCore: 4 },
  { count: 18, inner: 282, outer: 358, requiresCore: 7 },
] as const;

const CENTRE = 400;
const CORE_RADIUS = 92;

export function ArkSilhouette({
  compartments,
  coreLevel,
  onSelect,
  selected = null,
}: ArkSilhouetteProps): JSX.Element {
  return (
    <svg
      className="ark-hull"
      viewBox="0 0 800 800"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="The ark"
    >
      <defs>
        {/* Lit from the upper left, matching the star in the backdrop. */}
        <linearGradient id="hull" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#1c2534" />
          <stop offset="45%" stopColor="#0e141d" />
          <stop offset="100%" stopColor="#070a0f" />
        </linearGradient>

        <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff2cf" stopOpacity="0.9" />
          <stop offset="35%" stopColor="#e8d5a0" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#e8d5a0" stopOpacity="0" />
        </radialGradient>

        <filter id="lamp" x="-90%" y="-90%" width="280%" height="280%">
          <feGaussianBlur stdDeviation="6" result="halo" />
          <feMerge>
            <feMergeNode in="halo" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer hull: the rim that holds the whole disc together. */}
      <circle cx={CENTRE} cy={CENTRE} r="382" fill="none" stroke="#111925" strokeWidth="30" />
      <circle cx={CENTRE} cy={CENTRE} r="382" fill="none" stroke="#26313f" strokeWidth="1.4" />
      <circle cx={CENTRE} cy={CENTRE} r="366" fill="none" stroke="#1a232f" strokeWidth="1" />

      {/* Docking pylons, evenly spaced around the rim. */}
      {Array.from({ length: 8 }, (_, index) => {
        const angle = (index / 8) * Math.PI * 2 - Math.PI / 2;
        const [x0, y0] = polar(382, angle);
        const [x1, y1] = polar(408, angle);
        return (
          <g key={`pylon-${index}`}>
            <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#232f3f" strokeWidth="7" />
            <circle cx={x1} cy={y1} r="6" fill="#0c121b" stroke="#2c3a4c" strokeWidth="1.2" />
          </g>
        );
      })}

      {/* Spokes: structure, and the reason a ring cannot live without the core. */}
      {Array.from({ length: 8 }, (_, index) => {
        const angle = (index / 8) * Math.PI * 2 - Math.PI / 2 + Math.PI / 8;
        const [x0, y0] = polar(CORE_RADIUS - 6, angle);
        const [x1, y1] = polar(378, angle);
        return (
          <line
            key={`spoke-${index}`}
            x1={x0}
            y1={y0}
            x2={x1}
            y2={y1}
            stroke="#141c27"
            strokeWidth="9"
          />
        );
      })}

      {/* Cells, ring by ring. */}
      {RINGS.map((ring, ringIndex) => {
        const offset = RINGS.slice(0, ringIndex).reduce((sum, r) => sum + r.count, 0);
        const locked = coreLevel < ring.requiresCore;
        const step = (Math.PI * 2) / ring.count;
        const pad = step * 0.07;

        return (
          <g key={`ring-${ringIndex}`} className={locked ? 'ring locked' : 'ring'}>
            {Array.from({ length: ring.count }, (_, cellIndex) => {
              const index = offset + cellIndex;
              const compartment = compartments[index];
              const module = locked ? null : (compartment?.module ?? null);
              const light = module === null ? null : MODULE_LIGHT[module];
              const start = cellIndex * step - Math.PI / 2 + pad;
              const end = start + step - pad * 2;
              const path = annulus(ring.inner, ring.outer, start, end);
              const isSelected = selected === index;

              return (
                <g
                  key={index}
                  className={`cell${module === null ? ' empty' : ''}${locked ? ' locked' : ''}${
                    isSelected ? ' selected' : ''
                  }`}
                  onClick={locked ? undefined : () => onSelect?.(index)}
                >
                  <path
                    d={path}
                    fill={locked ? '#070a0f' : 'url(#hull)'}
                    stroke={isSelected ? '#8fb0d0' : locked ? '#131a24' : '#26313f'}
                    strokeWidth={isSelected ? 2 : 1.1}
                    strokeDasharray={locked ? '4 5' : undefined}
                  />

                  {light !== null && (
                    <g filter="url(#lamp)" opacity={compartment?.restoring === true ? 0.5 : 1}>
                      <path d={path} fill={light} opacity="0.16" />
                      <path
                        d={arc(ring.outer - 7, start + pad, end - pad)}
                        fill="none"
                        stroke={light}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        opacity="0.85"
                      />
                      <path
                        d={arc(ring.inner + 7, start + pad, end - pad)}
                        fill="none"
                        stroke={light}
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        opacity="0.4"
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}

      {/* The core. Everything else is gated on it, so it is the brightest thing
          on the disc and grows more detailed as it rises. */}
      <circle cx={CENTRE} cy={CENTRE} r={CORE_RADIUS + 60} fill="url(#core-glow)" />
      <circle
        cx={CENTRE}
        cy={CENTRE}
        r={CORE_RADIUS}
        fill="url(#hull)"
        stroke="#3a4a5e"
        strokeWidth="1.6"
      />
      <circle cx={CENTRE} cy={CENTRE} r={CORE_RADIUS - 14} fill="none" stroke="#243040" strokeWidth="1" />

      {Array.from({ length: Math.min(coreLevel, 10) }, (_, index) => {
        const angle = (index / 10) * Math.PI * 2 - Math.PI / 2;
        const [x, y] = polar(CORE_RADIUS - 26, angle);
        return <circle key={`pip-${index}`} cx={x} cy={y} r="4.5" fill="#e8d5a0" opacity="0.8" />;
      })}

      <circle cx={CENTRE} cy={CENTRE} r="34" fill="#0b111a" stroke="#4a5c73" strokeWidth="1.2" />
      <circle cx={CENTRE} cy={CENTRE} r="18" fill="#e8d5a0" opacity="0.9" filter="url(#lamp)" />
    </svg>
  );
}

function polar(radius: number, angle: number): [number, number] {
  return [CENTRE + radius * Math.cos(angle), CENTRE + radius * Math.sin(angle)];
}

/** An annular sector — the shape of one cell in a ring. */
function annulus(inner: number, outer: number, start: number, end: number): string {
  const [x0, y0] = polar(outer, start);
  const [x1, y1] = polar(outer, end);
  const [x2, y2] = polar(inner, end);
  const [x3, y3] = polar(inner, start);
  const large = end - start > Math.PI ? 1 : 0;
  return (
    `M${x0} ${y0} A${outer} ${outer} 0 ${large} 1 ${x1} ${y1} ` +
    `L${x2} ${y2} A${inner} ${inner} 0 ${large} 0 ${x3} ${y3} Z`
  );
}

function arc(radius: number, start: number, end: number): string {
  const [x0, y0] = polar(radius, start);
  const [x1, y1] = polar(radius, end);
  const large = end - start > Math.PI ? 1 : 0;
  return `M${x0} ${y0} A${radius} ${radius} 0 ${large} 1 ${x1} ${y1}`;
}
