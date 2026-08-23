// src/components/ui/Doodles.jsx
//
// Every hand-drawn illustration in the app lives here so the drawing style
// stays uniform and nothing gets re-drawn per component.
//
// HOUSE STYLE (Corporate Memphis × football):
//   - One thin, uniform ink outline. Always `stroke-ink`, strokeWidth 2 at a
//     ~48-unit viewBox, round caps and joins. Never a thick/variable stroke.
//   - Flat fills from the token palette (`fill-coral`, `fill-mint`, …).
//     No gradients, no soft shadows, no highlights on figures.
//   - Amorphous <Blob> shapes sit BEHIND scenes as color fields. They are
//     never a literal grass/pitch texture laid over a UI region.
//   - Figures are noodle-limbed and faceless — celebration is expressed by
//     posture and confetti, not features.
//
// ICON POLICY: these doodles are used for identity and high-visibility
// moments (tab bar, hero, section headers, empty states, rank badges).
// Small functional affordances (chevrons, close, refresh, menu) stay on
// lucide-react, whose uniform 2px open-stroke language is already
// consistent with the outlines drawn here.

import React from 'react';

const stroke = {
  fill: 'none',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

/* ───────────────────────── Decorative primitives ───────────────────────── */

// Amorphous flat color field. `tone` is a Tailwind fill utility token.
export const Blob = ({ className = '', tone = 'fill-violet', opacity = 0.18, variant = 0 }) => {
  const paths = [
    'M56 8c22 4 40 18 42 40s-14 44-38 50S12 92 6 70 12 20 30 12 44 6 56 8Z',
    'M62 14c18 10 32 26 28 46s-24 34-46 34S6 78 8 56 22 18 40 12s16-2 22 2Z',
    'M50 6c26 0 46 20 48 44s-16 46-42 48S8 82 6 56 24 6 50 6Z',
  ];
  return (
    <svg viewBox="0 0 104 104" aria-hidden="true" className={className} style={{ opacity }}>
      <path d={paths[variant % paths.length]} className={tone} />
    </svg>
  );
};

// Scattered flat confetti. Deterministic layout — no randomness so it never
// reflows between renders.
export const Confetti = ({ className = '' }) => {
  const bits = [
    { x: 6, y: 10, r: -20, tone: 'fill-coral', w: 7, h: 3 },
    { x: 26, y: 4, r: 35, tone: 'fill-sunflower', w: 4, h: 4 },
    { x: 46, y: 14, r: -50, tone: 'fill-mint', w: 8, h: 3 },
    { x: 66, y: 6, r: 15, tone: 'fill-violet', w: 5, h: 5 },
    { x: 84, y: 16, r: -30, tone: 'fill-sky', w: 7, h: 3 },
    { x: 16, y: 30, r: 60, tone: 'fill-bubblegum', w: 6, h: 3 },
    { x: 58, y: 32, r: -15, tone: 'fill-tangerine', w: 4, h: 4 },
    { x: 92, y: 34, r: 45, tone: 'fill-mint', w: 6, h: 3 },
  ];
  return (
    <svg viewBox="0 0 104 44" aria-hidden="true" className={className}>
      {bits.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          rx={1.2}
          className={b.tone}
          transform={`rotate(${b.r} ${b.x + b.w / 2} ${b.y + b.h / 2})`}
        />
      ))}
    </svg>
  );
};

/* ───────────────────────────── Football props ──────────────────────────── */

export const Ball = ({ className = '', size = 24 }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className={className}>
    <circle cx="24" cy="24" r="19" className="fill-surface-alt stroke-ink" {...stroke} />
    <path d="M24 13.5 32 19.5 29 29H19l-3-9.5Z" className="fill-ink stroke-ink" strokeWidth="2" strokeLinejoin="round" />
    <g className="stroke-ink" {...stroke}>
      <path d="M24 5v8.5M43 19.5 32 19.5M38 38 29 29M10 38l9-9M5 19.5 16 19.5" />
    </g>
  </svg>
);

export const Jersey = ({ className = '', size = 24, tone = 'fill-coral', number }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className={className}>
    <path
      d="M18 7 9 12 6 22l7 2.5V41h22V24.5L42 22l-3-10-9-5c0 3.5-2.7 5.5-6 5.5S18 10.5 18 7Z"
      className={`${tone} stroke-ink`}
      {...stroke}
    />
    <path d="M18 7c0 3.5 2.7 5.5 6 5.5S30 10.5 30 7" className="stroke-ink" {...stroke} />
    {number !== undefined && (
      <text
        x="24"
        y="33"
        textAnchor="middle"
        className="fill-ink"
        style={{ font: '700 13px Fredoka, Nunito, sans-serif' }}
      >
        {number}
      </text>
    )}
  </svg>
);

export const Boot = ({ className = '', size = 24, tone = 'fill-sky' }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className={className}>
    <path
      d="M8 14h11l5 8 12 3c4 1 6 3.5 6 7v5H8Z"
      className={`${tone} stroke-ink`}
      {...stroke}
    />
    <path d="M8 30h34" className="stroke-ink" {...stroke} />
    <g className="stroke-ink" {...stroke}>
      <path d="M13 37v3M22 37v3M31 37v3M39 37v3" />
    </g>
    <path d="M12 18h6M14 22h6" className="stroke-ink" {...stroke} />
  </svg>
);

export const Whistle = ({ className = '', size = 24, tone = 'fill-sunflower' }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className={className}>
    <path
      d="M10 18h16l4-4h8v9a11 11 0 1 1-22 0v-1h-6Z"
      className={`${tone} stroke-ink`}
      {...stroke}
    />
    <circle cx="27" cy="24" r="4" className="fill-surface-alt stroke-ink" {...stroke} />
    <path d="M6 12c3-2 6-2 8 0M4 26c2 2 4 3 7 3" className="stroke-ink" {...stroke} />
  </svg>
);

export const TrophyCup = ({ className = '', size = 24, tone = 'fill-sunflower' }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className={className}>
    <path d="M14 8h20v11a10 10 0 0 1-20 0Z" className={`${tone} stroke-ink`} {...stroke} />
    <path d="M14 11H8v4c0 4 3 6 6 6M34 11h6v4c0 4-3 6-6 6" className="stroke-ink" {...stroke} />
    <path d="M21 29h6v6h-6Z" className={`${tone} stroke-ink`} {...stroke} />
    <path d="M14 40h20v-5H14Z" className={`${tone} stroke-ink`} {...stroke} />
  </svg>
);

export const Medal = ({ className = '', size = 24, tone = 'fill-mint' }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className={className}>
    <path d="M15 5 22 21M33 5 26 21" className="stroke-ink" {...stroke} />
    <circle cx="24" cy="31" r="12" className={`${tone} stroke-ink`} {...stroke} />
    <path d="M24 25.5 26.4 30l5 .7-3.6 3.4.9 4.9-4.7-2.4-4.7 2.4.9-4.9L16.6 30l5-.7Z" className="fill-surface-alt stroke-ink" {...stroke} />
  </svg>
);

export const CornerFlags = ({ className = '', size = 24 }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className={className}>
    <path d="M13 42V8" className="stroke-ink" {...stroke} />
    <path d="M13 9h13l-4 5 4 5H13Z" className="fill-coral stroke-ink" {...stroke} />
    <path d="M35 42V8" className="stroke-ink" {...stroke} />
    <path d="M35 9H22l4 5-4 5h13Z" className="fill-sky stroke-ink" {...stroke} />
  </svg>
);

export const ChipCard = ({ className = '', size = 24 }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className={className}>
    <rect x="6" y="9" width="22" height="30" rx="4" transform="rotate(-9 17 24)" className="fill-mint stroke-ink" {...stroke} />
    <rect x="19" y="9" width="22" height="30" rx="4" transform="rotate(9 30 24)" className="fill-bubblegum stroke-ink" {...stroke} />
    <path d="M30 18.5 32.6 24l5.4.8-4 3.7 1 5.4-4.8-2.6-4.9 2.6 1-5.4-4-3.7 5.5-.8Z" className="fill-surface-alt stroke-ink" {...stroke} />
  </svg>
);

export const Coins = ({ className = '', size = 24 }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className={className}>
    <ellipse cx="24" cy="35" rx="15" ry="6" className="fill-tangerine stroke-ink" {...stroke} />
    <ellipse cx="24" cy="27" rx="15" ry="6" className="fill-sunflower stroke-ink" {...stroke} />
    <ellipse cx="24" cy="19" rx="15" ry="6" className="fill-sunflower stroke-ink" {...stroke} />
    <path d="M9 19v8M39 19v8M9 27v8M39 27v8" className="stroke-ink" {...stroke} />
  </svg>
);

export const CalendarDoodle = ({ className = '', size = 24 }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className={className}>
    <rect x="7" y="11" width="34" height="30" rx="5" className="fill-surface-alt stroke-ink" {...stroke} />
    <path d="M7 21h34" className="stroke-ink" {...stroke} />
    <path d="M7 16a5 5 0 0 1 5-5h24a5 5 0 0 1 5 5v5H7Z" className="fill-violet stroke-ink" {...stroke} />
    <path d="M16 6v8M32 6v8" className="stroke-ink" {...stroke} />
    <circle cx="17" cy="29" r="3" className="fill-coral" />
    <circle cx="31" cy="29" r="3" className="fill-mint" />
    <circle cx="17" cy="36" r="3" className="fill-sunflower" />
  </svg>
);

export const Standings = ({ className = '', size = 24 }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className={className}>
    <rect x="17" y="10" width="14" height="31" rx="3" className="fill-sunflower stroke-ink" {...stroke} />
    <rect x="4" y="20" width="14" height="21" rx="3" className="fill-silver stroke-ink" {...stroke} />
    <rect x="30" y="26" width="14" height="15" rx="3" className="fill-tangerine stroke-ink" {...stroke} />
  </svg>
);

/* ─────────────────────────── Composite pieces ──────────────────────────── */

// Shirt-number-style rank badge. Top three get a metal tone; everyone else
// gets the plain league jersey with their position printed on it.
export const RankBadge = ({ rank, size = 40, className = '' }) => {
  const tone =
    rank === 1 ? 'fill-sunflower' :
      rank === 2 ? 'fill-silver' :
        rank === 3 ? 'fill-tangerine' :
          'fill-surface-sunk';

  return (
    <span className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <Jersey size={size} tone={tone} />
      <span
        className="absolute font-display font-bold text-ink leading-none"
        style={{ fontSize: size * 0.32, transform: `translateY(${size * 0.11}px)` }}
      >
        {rank}
      </span>
    </span>
  );
};

// Hero moment: two faceless figures lifting the cup, confetti in the air,
// blob color fields behind. Flat fills, single ink outline throughout.
export const CheerScene = ({ className = '' }) => (
  <svg viewBox="0 0 280 172" aria-hidden="true" className={className}>
    {/* Blob backdrop */}
    <path d="M44 30c26-16 60-16 82 2s34 44 20 66-52 34-84 26S8 92 12 68s16-28 32-38Z" className="fill-violet" opacity="0.16" />
    <path d="M188 22c26-6 54 8 62 32s-4 54-28 66-56 6-70-14-2-46 12-58 12-22 24-26Z" className="fill-mint" opacity="0.18" />
    <circle cx="248" cy="34" r="16" className="fill-sunflower" opacity="0.3" />

    {/* Confetti */}
    <g>
      <rect x="30" y="14" width="9" height="4" rx="2" transform="rotate(-24 34 16)" className="fill-coral" />
      <rect x="86" y="6" width="6" height="6" rx="1.5" transform="rotate(30 89 9)" className="fill-sky" />
      <rect x="150" y="10" width="10" height="4" rx="2" transform="rotate(-40 155 12)" className="fill-bubblegum" />
      <rect x="212" y="16" width="6" height="6" rx="1.5" transform="rotate(18 215 19)" className="fill-mint" />
      <rect x="60" y="42" width="8" height="3.5" rx="1.75" transform="rotate(52 64 44)" className="fill-sunflower" />
      <rect x="196" y="52" width="8" height="3.5" rx="1.75" transform="rotate(-32 200 54)" className="fill-tangerine" />
      <circle cx="122" cy="24" r="3" className="fill-mint" />
      <circle cx="178" cy="34" r="2.6" className="fill-coral" />
    </g>

    {/* Ground: a single center-circle arc — a football reference, not a texture */}
    <path d="M36 158a104 104 0 0 1 208 0" className="stroke-ink" fill="none" strokeWidth="2" opacity="0.25" strokeLinecap="round" />

    {/* ── Left figure ── */}
    <g>
      <rect x="66" y="118" width="10" height="34" rx="5" className="fill-violet stroke-ink" {...stroke} />
      <rect x="80" y="118" width="10" height="34" rx="5" className="fill-violet stroke-ink" {...stroke} />
      <path d="M62 122V96a16 16 0 0 1 32 0v26Z" className="fill-coral stroke-ink" {...stroke} />
      <path d="M64 100 44 78" className="stroke-ink" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M64 100 44 78" className="stroke-tangerine" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M92 100l20-22" className="stroke-ink" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M92 100l20-22" className="stroke-tangerine" strokeWidth="5" strokeLinecap="round" fill="none" />
      <circle cx="78" cy="72" r="14" className="fill-tangerine stroke-ink" {...stroke} />
      <path d="M64 70c0-9 6-14 14-14s14 5 14 14c-4-4-8-5-14-5s-10 1-14 5Z" className="fill-ink" />
    </g>

    {/* ── Right figure ── */}
    <g>
      <rect x="190" y="118" width="10" height="34" rx="5" className="fill-sky stroke-ink" {...stroke} />
      <rect x="204" y="118" width="10" height="34" rx="5" className="fill-sky stroke-ink" {...stroke} />
      <path d="M186 122V96a16 16 0 0 1 32 0v26Z" className="fill-mint stroke-ink" {...stroke} />
      <path d="M188 100 168 78" className="stroke-ink" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M188 100 168 78" className="stroke-sunflower" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M216 100l20-22" className="stroke-ink" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M216 100l20-22" className="stroke-sunflower" strokeWidth="5" strokeLinecap="round" fill="none" />
      <circle cx="202" cy="72" r="14" className="fill-sunflower stroke-ink" {...stroke} />
      <path d="M188 72c2-12 10-16 18-14s10 8 8 14c-4-5-8-6-14-6s-8 2-12 6Z" className="fill-ink" />
    </g>

    {/* ── The cup, held up between them ── */}
    <g>
      <path d="M124 44h32v20a16 16 0 0 1-32 0Z" className="fill-sunflower stroke-ink" {...stroke} />
      <path d="M124 48h-10v6c0 6 5 9 10 9M156 48h10v6c0 6-5 9-10 9" className="stroke-ink" {...stroke} />
      <rect x="134" y="80" width="12" height="10" rx="2" className="fill-sunflower stroke-ink" {...stroke} />
      <path d="M124 100h32v-10h-32Z" className="fill-tangerine stroke-ink" {...stroke} />
      <path d="M133 54h14" className="stroke-ink" {...stroke} />
    </g>
  </svg>
);

// Flat pitch graphic for the team formation view. A drawn diagram — flat
// fill, thin lines, no grass texture, no stripes, no gradient.
export const PitchGraphic = ({ className = '' }) => (
  <svg viewBox="0 0 300 420" preserveAspectRatio="none" aria-hidden="true" className={className}>
    <rect x="0" y="0" width="300" height="420" rx="18" className="fill-pitch" opacity="0.16" />
    <g className="stroke-pitch" fill="none" strokeWidth="2.5" opacity="0.55" strokeLinejoin="round">
      <rect x="10" y="10" width="280" height="400" rx="12" />
      <path d="M10 210h280" />
      <circle cx="150" cy="210" r="46" />
      <circle cx="150" cy="210" r="4" className="fill-pitch" />
      <path d="M90 410v-56h120v56" />
      <path d="M118 410v-24h64v24" />
      <path d="M90 10v56h120V10" />
      <path d="M118 10v24h64V10" />
    </g>
  </svg>
);

export default {
  Blob,
  Confetti,
  Ball,
  Jersey,
  Boot,
  Whistle,
  TrophyCup,
  Medal,
  CornerFlags,
  ChipCard,
  Coins,
  CalendarDoodle,
  Standings,
  RankBadge,
  CheerScene,
  PitchGraphic,
};
