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
        accent: {
          amber: 'var(--accent-amber, #F0A500)',
          'amber-dim': 'var(--accent-amber-dim, #B87A00)',
          brand: 'var(--accent-amber, #F0A500)',
          mint:  '#00C896',
          'mint-dim': '#008F6B',
          coral: '#FF6B6B',
          sky:   '#4FC3F7',
          violet:'#A78BFA',
        },
        txt: {
          primary:   '#E8EAF0',
          secondary: '#8A94A8',
          muted:     '#4A5568',
        },
        // ── Status colors ─────────────────────────────────────────────
        status: {
          'not-started': '#4A5568',
          'in-progress': '#F0A500',
          completed:     '#00C896',
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
        glow:   '0 0 20px rgba(240,165,0,0.15)',
        'glow-mint': '0 0 20px rgba(0,200,150,0.15)',
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
