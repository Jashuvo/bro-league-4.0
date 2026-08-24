/** @type {import('tailwindcss').Config} */
//
// ─── BRO LEAGUE — "MEMPHIS × FOOTBALL" DESIGN TOKENS ────────────────────────
//
// THIS FILE IS THE SINGLE SOURCE OF TRUTH FOR COLOR IN THE APP.
//
// The palette below is declared once, in `palette`, and is then used to
// generate three things that always stay in sync:
//   1. CSS custom properties (`--c-<token>`, as "R G B" channels) emitted on
//      `:root` for light and on `[data-theme="dark"]` for dark.
//   2. Tailwind color utilities (`bg-coral`, `text-ink`, `border-line/20`, …)
//      that resolve to those variables, so every utility is theme-aware and
//      still supports opacity modifiers.
//   3. The daisyUI `light` / `dark` theme blocks, so daisyUI's own
//      `base-100` / `base-200` / `base-content` / `error` / … semantics land
//      on exactly the same colors as our named tokens.
//
// Components must never hardcode a hex value or reach for a stock Tailwind
// palette entry (indigo-600, slate-800, emerald-500 …). If a new color is
// genuinely needed, add it here and use it by name everywhere.
//
// Direction: "Memphis × Football" — the page-3 artboards of the design canvas
// (FusionMobile / FusionDesktop / FusionGameweeks / FusionPrizes / …), NOT the
// page-2 "Corporate Memphis" alternative. The difference is the whole point of
// the third direction and it is a difference of SATURATION:
//
//   page-2 (rejected):  #FF6B54 coral, #FFC94A gold, #6C4BF4 violet, #2ED9A6 mint
//   page-3 (this one):  #D98C7F clay,  #EFCB7C ochre, #6B5AA8 lavender, #A8C4A2 sage
//
// The first reskin pass shipped the page-2 saturation by mistake. The palette
// below is lifted value-for-value from the page-3 artboards: warm cream ground
// (#FFF4E6), plain white paper, one deep indigo ink (#2B2350) for every outline
// and every piece of type, and flat DUSTY fills — clay, peach, ochre, sage,
// powder blue, lavender, dusty rose. No gradients. No shadows. Colour arrives
// as small tinted tiles and irregular blobs behind an illustrated scene; it
// never floods a card, a banner or the page.
//
// Each accent is a PAIR: `<name>` is the flat FILL (a pastel — use it for
// backgrounds, borders and SVG fills) and `<name>-ink` is the matching TYPE
// colour (dark enough to read on white — use it for text and icon strokes).
// Writing `text-mint` where you mean `text-mint-ink` gives you sage-on-white
// and no contrast; that pairing is the whole reason both exist.

const plugin = require('tailwindcss/plugin');

/** "#ff5964" -> "255 89 100" (channel form, so Tailwind can inject alpha). */
const channels = (hex) => {
  const raw = hex.replace('#', '');
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const int = parseInt(full, 16);
  return `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`;
};

const palette = {
  light: {
    // Surfaces — the page-3 ground: plain warm cream, plain white paper.
    surface: '#fff4e6',       // page
    'surface-alt': '#ffffff',  // cards / paper
    'surface-sunk': '#fbf6ee', // wells, expanded rows, segmented-control track

    // Ink — outlines and type. One ink, used at varying opacity.
    ink: '#2b2350',
    // The artboards carry two muted inks: #8B84AE for larger secondary text
    // and #6B6390 for the small uppercase labels on tinted tiles. Almost every
    // `text-ink-soft` in this app is the second kind — 9-11px labels sitting
    // on a sage or ochre tile — where #8B84AE measures under 3:1. So the token
    // takes the artboards' own label ink.
    'ink-soft': '#6b6390',
    line: '#2b2350',

    // Flat dusty fills.
    coral: '#d98c7f',      // clay
    tangerine: '#e8c4a0',  // peach
    sunflower: '#efcb7c',  // ochre
    mint: '#a8c4a2',       // sage
    pitch: '#4e7a61',      // deep sage — also carries white type
    sky: '#a9c3dc',        // powder blue
    violet: '#6b5aa8',     // lavender — also carries white type
    bubblegum: '#e8b4b8',  // dusty rose
    silver: '#b4aec8',

    // Matching type colours — each is its accent pushed dark enough to read
    // on white paper.
    'coral-ink': '#c4705e',
    'tangerine-ink': '#a5703f',
    'sunflower-ink': '#9a7523',
    'mint-ink': '#3f6b54',
    'pitch-ink': '#3f6b54',
    'sky-ink': '#3f5a75',
    'violet-ink': '#5a4a93',
    'bubblegum-ink': '#a85f68',
    'silver-ink': '#6b6390',
  },
  dark: {
    // Same hues on a deep indigo field, but the light/dark roles SWAP.
    //
    // In light mode the ink is near-black and the fills are pale, so pale
    // fills carry dark type. Invert the ground and that stops working: the
    // ink is now cream, and cream on a pale ochre chip is ~2:1 — the leader
    // chip and the top-three pills became unreadable the moment the palette
    // went dusty. So every dark-mode FILL is the deep end of its hue, dark
    // enough that cream type clears 4.5:1 on it, while the *-ink pairs go the
    // other way and lift, because they sit on the dark paper as type.
    surface: '#1b1730',
    'surface-alt': '#262046',
    'surface-sunk': '#141024',

    ink: '#fff4e6',
    'ink-soft': '#bab2d3',
    line: '#fff4e6',

    coral: '#8a4d43',
    tangerine: '#82623c',
    sunflower: '#7d6129',
    mint: '#456140',
    pitch: '#356248',
    sky: '#42597a',
    violet: '#5a4a93',
    bubblegum: '#8a4f56',
    silver: '#565073',

    'coral-ink': '#f0b4a8',
    'tangerine-ink': '#eac79e',
    'sunflower-ink': '#f2d79b',
    'mint-ink': '#a9cfb4',
    'pitch-ink': '#8fc3a2',
    'sky-ink': '#afcbe4',
    'violet-ink': '#bcacec',
    'bubblegum-ink': '#f0c2c7',
    'silver-ink': '#bdb6ce',
  },
};

const tokens = Object.keys(palette.light);

const varsFor = (mode) =>
  Object.fromEntries(tokens.map((name) => [`--c-${name}`, channels(palette[mode][name])]));

const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

// Named tokens + semantic aliases pointing at the same variables, so intent
// reads clearly in components ("text-positive" vs "text-mint").
const colors = {
  ...Object.fromEntries(tokens.map((name) => [name, token(name)])),
  gold: token('sunflower'),
  bronze: token('tangerine'),
  positive: token('mint'),
  negative: token('coral'),
  'positive-ink': token('mint-ink'),
  'negative-ink': token('coral-ink'),
};

const daisyTheme = (mode) => {
  const p = palette[mode];
  return {
    primary: p.violet,
    'primary-content': mode === 'light' ? '#ffffff' : p.ink,
    secondary: p.mint,
    'secondary-content': palette.light.ink,
    accent: p.coral,
    'accent-content': '#ffffff',
    neutral: p.ink,
    'neutral-content': p.surface,
    'base-100': p.surface,
    'base-200': p['surface-alt'],
    'base-300': p['surface-sunk'],
    'base-content': p.ink,
    info: p.sky,
    success: p.pitch,
    warning: p.sunflower,
    error: p.coral,
    '--rounded-box': '1.25rem',
    '--rounded-btn': '0.9rem',
    '--rounded-badge': '999px',
  };
};

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors,
      // Full 1% opacity scale. The outline/tint system leans on precise
      // alpha steps (border-ink/85, border-ink/12, bg-mint/25 …) and the
      // stock scale only ships a handful of values — which makes those
      // classes silently fail to compile, including inside @apply.
      opacity: Object.fromEntries(
        Array.from({ length: 101 }, (_, i) => [String(i), String(i / 100)])
      ),
      fontFamily: {
        // Fredoka (display) + Nunito (body) are loaded from Google Fonts in
        // index.html. Previously `Inter`/`Outfit` were named here but never
        // actually loaded anywhere — everything silently fell back to
        // system-ui.
        sans: ['Nunito', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Fredoka', 'Nunito', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // The page-3 artboards carry NO box-shadow at all — not a blur, not a
        // hard offset. Depth is drawn instead: white paper on cream ground,
        // and a thin ink outline on the few blocks that need to sit forward.
        // These keys are kept (a lot of markup names them) but resolve to
        // nothing, so a stray `shadow-card` can't quietly reintroduce depth.
        pop: 'none',
        'pop-sm': 'none',
        'pop-lg': 'none',
        card: 'none',
        'card-hover': 'none',
      },
      borderRadius: {
        blob: '58% 42% 47% 53% / 43% 51% 49% 57%',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'wiggle': 'wiggle 2.4s ease-in-out infinite',
        'roll': 'roll 6s linear infinite',
        'confetti': 'confetti 3.2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-4deg)' },
          '50%': { transform: 'rotate(4deg)' },
        },
        roll: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        confetti: {
          '0%': { transform: 'translateY(-10%) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '1' },
          '100%': { transform: 'translateY(220%) rotate(340deg)', opacity: '0' },
        },
      },
    },
  },
  plugins: [
    require('daisyui'),
    // Emits the token variables. Both selectors are defined so the daisyUI
    // `data-theme` attribute (set by ThemeContext) drives our tokens too.
    plugin(({ addBase }) => {
      addBase({
        ':root': varsFor('light'),
        '[data-theme="light"]': varsFor('light'),
        '[data-theme="dark"]': varsFor('dark'),
      });
    }),
  ],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          ...daisyTheme('light'),
        },
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          ...daisyTheme('dark'),
        },
      },
    ],
  },
}
