// ── Theme Packages ──────────────────────────────────────────────────────────
// Every theme is a PACKAGE of four coordinated colors with fixed roles:
//
//   primary    main CTAs, active states, key numbers, focus rings
//   secondary  icons, progress bars, tonal buttons, links, supporting data
//   tertiary   tags/chips, phase labels, charts, info banners
//   highlight  small pops only: notification dots, streak flame, quote card
//
// Gradients are TONAL (a color → its own lighter shade). Two distant hues are
// never blended into one gradient; they sit next to each other instead.
//
// Every role is exposed to the UI in three ways, so nothing has to hard-code a hex:
//   • Tailwind:    bg-accent-{amber|secondary|tertiary|highlight}[/opacity], -dim, -light
//                  (`amber` is the legacy class name for the PRIMARY role)
//   • CSS:         var(--accent-amber), rgb(var(--c-primary) / .2), ...
//   • JS / D3:     getThemeColors(), getPhasePalette(), withAlpha()
//
// Semantic colors (success / danger / warning) are deliberately NOT themed.

export type ThemeRole = 'primary' | 'secondary' | 'tertiary' | 'highlight';

export interface ThemePackage {
  id: string;
  name: string;
  tagline: string;
  primary: string;
  secondary: string;
  tertiary: string;
  highlight: string;
  /** Tonal variants derived from each role (darker / lighter shade of the same hue) */
  primaryDim: string;
  primaryLight: string;
  secondaryDim: string;
  secondaryLight: string;
  tertiaryDim: string;
  tertiaryLight: string;
  highlightDim: string;
  highlightLight: string;
  /** "r,g,b" of primary, for legacy rgba() glows */
  glowRgb: string;
}

// ── Color helpers ───────────────────────────────────────────────────────────
export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/** Linear mix of two hex colors. t = 0 → a, t = 1 → b. */
export function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

export const lighten = (hex: string, amount: number) => mixHex(hex, '#FFFFFF', amount);
export const darken = (hex: string, amount: number) => mixHex(hex, '#000000', amount);

/** "#RRGGBB" + alpha → "rgba(r, g, b, alpha)" (for SVG / D3 / canvas where Tailwind can't reach) */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const channels = (hex: string) => hexToRgb(hex).join(' ');

// ── Semantic colors (never themed) ──────────────────────────────────────────
export const SEMANTIC = {
  success: '#00C896',
  danger:  '#FF6B6B',
  warning: '#FFB020',
  neutral: '#8A94A8',
} as const;

// ── Theme definitions ───────────────────────────────────────────────────────
interface ThemeDef {
  id: string;
  name: string;
  tagline: string;
  primary: string;
  secondary: string;
  tertiary: string;
  highlight: string;
}

const THEME_DEFS: ThemeDef[] = [
  {
    id: 'amber', name: 'Scholar Amber', tagline: 'Warm gold with a cool counterpoint',
    primary: '#F0A500',   // amber
    secondary: '#E8703A', // ember
    tertiary: '#3FB8AF',  // teal
    highlight: '#F3E2B3', // parchment
  },
  {
    id: 'mint', name: 'Emerald Mint', tagline: 'Fresh and botanical',
    primary: '#B4E33D',   // lime — kept clear of the fixed success-green below
    secondary: '#00C896', // mint
    tertiary: '#5B8DEF',  // cobalt
    highlight: '#FF9F80', // peach
  },
  {
    id: 'sky', name: 'Electric Sky', tagline: 'Cool with a warm spark',
    primary: '#4FC3F7',   // sky
    secondary: '#818CF8', // indigo
    tertiary: '#2DD4BF',  // teal
    highlight: '#FFB86B', // apricot
  },
  {
    id: 'coral', name: 'Vibrant Coral', tagline: 'Sunset with a lagoon accent',
    primary: '#FF6B6B',   // coral
    secondary: '#FF9F5A', // tangerine
    tertiary: '#3BC9DB',  // lagoon
    highlight: '#FFD166', // sun
  },
  {
    id: 'violet', name: 'Royal Violet', tagline: 'Regal with a gold spark',
    primary: '#A78BFA',   // violet
    secondary: '#F472B6', // rose
    tertiary: '#60A5FA',  // blue
    highlight: '#FBBF24', // gold
  },
];

function derive(def: ThemeDef): ThemePackage {
  const dim = (c: string) => darken(c, 0.28);
  const light = (c: string) => lighten(c, 0.22);
  return {
    ...def,
    primaryDim: dim(def.primary),     primaryLight: light(def.primary),
    secondaryDim: dim(def.secondary), secondaryLight: light(def.secondary),
    tertiaryDim: dim(def.tertiary),   tertiaryLight: light(def.tertiary),
    highlightDim: dim(def.highlight), highlightLight: light(def.highlight),
    glowRgb: hexToRgb(def.primary).join(','),
  };
}

export const ACCENT_THEMES: ThemePackage[] = THEME_DEFS.map(derive);
export const DEFAULT_THEME = ACCENT_THEMES[0];

/** Look a theme up by id, or by legacy raw hex (older saved value), or fall back to default. */
export function resolveTheme(idOrHex: string | null | undefined): ThemePackage {
  if (!idOrHex) return DEFAULT_THEME;
  const byId = ACCENT_THEMES.find(t => t.id === idOrHex);
  if (byId) return byId;
  const byHex = ACCENT_THEMES.find(t => t.primary.toLowerCase() === idOrHex.toLowerCase());
  return byHex || DEFAULT_THEME;
}

// ── Runtime state ───────────────────────────────────────────────────────────
let activeTheme: ThemePackage = DEFAULT_THEME;

/** The theme currently applied to the document. */
export function getActiveTheme(): ThemePackage {
  return activeTheme;
}

/** Current hex for each role — use for SVG / D3 / recharts props that need a plain string. */
export function getThemeColors() {
  const t = activeTheme;
  return {
    primary: t.primary, secondary: t.secondary, tertiary: t.tertiary, highlight: t.highlight,
    primaryDim: t.primaryDim, secondaryDim: t.secondaryDim, tertiaryDim: t.tertiaryDim, highlightDim: t.highlightDim,
    primaryLight: t.primaryLight, secondaryLight: t.secondaryLight, tertiaryLight: t.tertiaryLight, highlightLight: t.highlightLight,
  };
}

/** 12 categorical colors built from the four roles (base, light, dim of each) — for phases/series. */
export function getPhasePalette(): string[] {
  const c = getThemeColors();
  return [
    c.primary, c.secondary, c.tertiary, c.highlight,
    c.primaryLight, c.secondaryLight, c.tertiaryLight, c.highlightLight,
    c.primaryDim, c.secondaryDim, c.tertiaryDim, c.highlightDim,
  ];
}

/** Apply a theme package to the document root as CSS custom properties. */
export function applyTheme(idOrHex: string | null | undefined): ThemePackage {
  const theme = resolveTheme(idOrHex);
  activeTheme = theme;

  const root = document.documentElement;
  const set = (name: string, value: string) => root.style.setProperty(name, value);

  // hex vars (`amber` is the legacy name for the primary role)
  const roles: Array<{ hex: string; ch: string; base: string; dim: string; light: string }> = [
    { hex: '--accent-amber',     ch: '--c-primary',   base: theme.primary,   dim: theme.primaryDim,   light: theme.primaryLight },
    { hex: '--accent-secondary', ch: '--c-secondary', base: theme.secondary, dim: theme.secondaryDim, light: theme.secondaryLight },
    { hex: '--accent-tertiary',  ch: '--c-tertiary',  base: theme.tertiary,  dim: theme.tertiaryDim,  light: theme.tertiaryLight },
    { hex: '--accent-highlight', ch: '--c-highlight', base: theme.highlight, dim: theme.highlightDim, light: theme.highlightLight },
  ];
  for (const r of roles) {
    set(r.hex, r.base);
    set(`${r.hex}-dim`, r.dim);
    set(`${r.hex}-light`, r.light);
    // space-separated RGB channels → lets Tailwind build `bg-accent-x/20` etc.
    set(r.ch, channels(r.base));
    set(`${r.ch}-dim`, channels(r.dim));
    set(`${r.ch}-light`, channels(r.light));
  }
  set('--accent-primary', theme.primary);
  set('--accent-glow-rgb', theme.glowRgb);
  root.dataset.theme = theme.id;
  return theme;
}

/** Read the saved theme id (raw or JSON-quoted, or the legacy hex) from localStorage. */
export function readStoredThemeId(): string | null {
  try {
    const raw = localStorage.getItem('theme_accent') ?? localStorage.getItem('bedo_theme_accent');
    if (!raw) return null;
    return raw.startsWith('"') && raw.endsWith('"') ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

/** Apply the saved theme — call once before the first render so there is no color flash. */
export function initTheme(): ThemePackage {
  return applyTheme(readStoredThemeId());
}
