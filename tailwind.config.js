/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Midnight Scholar Dark Theme ────────────────────────────────
        bg: {
          base:    '#0D0F14',
          surface: '#161A23',
          surface2:'#1E2433',
        },
        // ── Theme package roles ─────────────────────────────────────────
        // Built from RGB channels (--c-*, set by applyTheme in src/lib/themes.ts)
        // so opacity variants work: bg-accent-secondary/20, border-accent-amber/50 ...
        // NOTE: a plain `var(--x)` color would make Tailwind 3 silently drop every
        // `/opacity` class. `amber` is the legacy class name for the PRIMARY role.
        accent: {
          amber:             'rgb(var(--c-primary) / <alpha-value>)',
          'amber-dim':       'rgb(var(--c-primary-dim) / <alpha-value>)',
          'amber-light':     'rgb(var(--c-primary-light) / <alpha-value>)',
          primary:           'rgb(var(--c-primary) / <alpha-value>)',
          'primary-dim':     'rgb(var(--c-primary-dim) / <alpha-value>)',
          'primary-light':   'rgb(var(--c-primary-light) / <alpha-value>)',
          brand:             'rgb(var(--c-primary) / <alpha-value>)',
          secondary:         'rgb(var(--c-secondary) / <alpha-value>)',
          'secondary-dim':   'rgb(var(--c-secondary-dim) / <alpha-value>)',
          'secondary-light': 'rgb(var(--c-secondary-light) / <alpha-value>)',
          tertiary:          'rgb(var(--c-tertiary) / <alpha-value>)',
          'tertiary-dim':    'rgb(var(--c-tertiary-dim) / <alpha-value>)',
          'tertiary-light':  'rgb(var(--c-tertiary-light) / <alpha-value>)',
          highlight:         'rgb(var(--c-highlight) / <alpha-value>)',
          'highlight-dim':   'rgb(var(--c-highlight-dim) / <alpha-value>)',
          'highlight-light': 'rgb(var(--c-highlight-light) / <alpha-value>)',
        },
        txt: {
          primary:   '#E8EAF0',
          secondary: '#8A94A8',
          muted:     '#4A5568',
        },
        // ── Status colors (completed / paused are semantic, not themed) ──
        status: {
          'not-started': '#4A5568',
          'in-progress': 'rgb(var(--c-primary) / <alpha-value>)',
          completed:     '#00C896', // semantic success — not themed
          paused:        '#FF6B6B',
        }
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        xl2: '1rem',
        xl3: '1.5rem',
      },
      boxShadow: {
        card:   '0 0 0 1px rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.4)',
        glow:   '0 0 20px rgb(var(--c-primary) / 0.15)',
        'glow-secondary': '0 0 20px rgb(var(--c-secondary) / 0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
