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
// Direction: Corporate-Memphis flat illustration (thin uniform ink outlines,
// flat fills, no gradients on figures) crossed with football, pushed to a
// celebratory saturation — confetti and trophy-lift, not muted onboarding
// pastel. `pitch` is an ACCENT green for football motifs, never a background
// texture.

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
    // Surfaces — warm cream field the flat fills sit on.
    surface: '#fff6ec',      // page
    'surface-alt': '#ffffff', // cards / paper
    'surface-sunk': '#f8e7d5', // wells, expanded rows, table stripes

    // Ink — outlines and type. One ink, used at varying opacity.
    ink: '#221a2e',
    'ink-soft': '#6e6480',
    line: '#221a2e',

    // Celebration accents.
    coral: '#ff4d5e',
    tangerine: '#ff8a3c',
    sunflower: '#ffc233',
    mint: '#12cf9b',
    pitch: '#12a854',
    sky: '#2b9ff0',
    violet: '#7250f5',
    bubblegum: '#ff5cbe',
    silver: '#9aa6b8',
  },
  dark: {
    // Deep ink base — same hues, lifted for contrast on a dark field.
    surface: '#17131f',
    'surface-alt': '#221b2e',
    'surface-sunk': '#100d16',

    ink: '#fff3e4',
    'ink-soft': '#a99cba',
    line: '#fff3e4',

    coral: '#ff7b86',
    tangerine: '#ffa262',
    sunflower: '#ffd35f',
    mint: '#3fe3b8',
    pitch: '#35c973',
    sky: '#5cbdf7',
    violet: '#9d84ff',
    bubblegum: '#ff85d3',
    silver: '#c2cad7',
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
        // Flat "sticker" shadows — a hard offset in ink, never a soft blur.
        // Keeps figures/cards reading as cut paper rather than material.
        pop: '4px 4px 0 0 rgb(var(--c-ink) / 1)',
        'pop-sm': '2px 2px 0 0 rgb(var(--c-ink) / 1)',
        'pop-lg': '6px 6px 0 0 rgb(var(--c-ink) / 1)',
        card: '3px 3px 0 0 rgb(var(--c-ink) / 0.14)',
        'card-hover': '5px 5px 0 0 rgb(var(--c-ink) / 0.2)',
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
