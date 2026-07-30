import { type JSX, useMemo } from 'react';

import { seededRandom } from '../core/random';

/**
 * The view from the ark: the planet it orbits, its star, and the dark.
 *
 * Everything here is generated from a seed rather than drawn, which is the same
 * decision already taken for sector artwork — hand-painted art would make the art
 * budget the cap on how large a world can be. The seed will come from the sector
 * once the map exists; for now it is fixed so the picture is stable while it is
 * being worked on.
 *
 * Static on purpose. Movement is easy to add later and easy to overdo now.
 */
interface SpaceBackdropProps {
  readonly seed?: number;
  /**
   * The ark view looks out at the planet it orbits. The system view has its own
   * star and planets, so it only wants the dark and the stars behind them.
   */
  readonly showPlanet?: boolean;
}

export function SpaceBackdrop({
  seed = 20260729,
  showPlanet = true,
}: SpaceBackdropProps): JSX.Element {
  const stars = useMemo(() => generateStars(seed), [seed]);

  return (
    <svg
      className="backdrop"
      viewBox="0 0 1000 1000"
      // slice, not meet: the picture should fill any window shape and be cropped,
      // never letterboxed, since it is scenery rather than content.
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="void" cx="30%" cy="20%" r="90%">
          <stop offset="0%" stopColor="#111a2b" />
          <stop offset="55%" stopColor="#0a0e18" />
          <stop offset="100%" stopColor="#05070d" />
        </radialGradient>

        <radialGradient id="nebula-cold" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2c5f7a" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#2c5f7a" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="nebula-warm" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6b3a63" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#6b3a63" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="star-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6e2" stopOpacity="0.95" />
          <stop offset="12%" stopColor="#ffe6b0" stopOpacity="0.45" />
          <stop offset="45%" stopColor="#ffbe6a" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ff9c3a" stopOpacity="0" />
        </radialGradient>

        {/* Lit from the upper left, where the star is. The terminator is the
            gradient running out of light, not a separate shape. */}
        <radialGradient id="planet-lit" cx="26%" cy="22%" r="92%">
          <stop offset="0%" stopColor="#6f8ba6" />
          <stop offset="30%" stopColor="#3f566d" />
          <stop offset="62%" stopColor="#1d2c3d" />
          <stop offset="88%" stopColor="#0a1119" />
          <stop offset="100%" stopColor="#070b11" />
        </radialGradient>

        <radialGradient id="planet-rim" cx="50%" cy="50%" r="50%">
          <stop offset="88%" stopColor="#7fb6d8" stopOpacity="0" />
          <stop offset="96%" stopColor="#7fb6d8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#bfe4f5" stopOpacity="0.06" />
        </radialGradient>

        <filter id="soften" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
      </defs>

      <rect width="1000" height="1000" fill="url(#void)" />

      <g filter="url(#soften)">
        <ellipse cx="220" cy="640" rx="360" ry="220" fill="url(#nebula-cold)" />
        <ellipse cx="760" cy="230" rx="300" ry="240" fill="url(#nebula-warm)" />
      </g>

      <g className="stars">
        {stars.map((star) => (
          <circle
            key={star.key}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill="#dce8f5"
            opacity={star.opacity}
          />
        ))}
      </g>

      {showPlanet && (
        <>
          {/* The star. Its position is not decoration: solar energy is the one
              income that cannot be taken, so how close and how bright it is
              describes the player's economy. */}
          <circle cx="128" cy="150" r="340" fill="url(#star-glow)" />
          <circle cx="128" cy="150" r="13" fill="#fffaf0" />

          {/* The planet this ark orbits, cropped by the frame so it reads near. */}
          <g className="planet">
            <circle cx="700" cy="880" r="430" fill="url(#planet-lit)" />
            <circle cx="700" cy="880" r="430" fill="url(#planet-rim)" />
          </g>
        </>
      )}
    </svg>
  );
}

interface Star {
  readonly key: string;
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly opacity: number;
}

function generateStars(seed: number): readonly Star[] {
  const random = seededRandom(seed);
  const stars: Star[] = [];

  for (let index = 0; index < 260; index += 1) {
    // Cubed so that most stars are faint pinpricks and a few are bright, which
    // is what a real field looks like; a uniform distribution reads as noise.
    const brightness = random() ** 3;
    stars.push({
      key: `star-${index}`,
      x: random() * 1000,
      y: random() * 1000,
      r: 0.4 + brightness * 1.9,
      opacity: 0.18 + brightness * 0.75,
    });
  }

  return stars;
}
