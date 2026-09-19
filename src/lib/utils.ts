// ── Date helpers ──────────────────────────────────────────────────────────
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function isoToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function daysBetween(a: string, b: string): number {
  const diff = new Date(b).getTime() - new Date(a).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── Progress helpers ──────────────────────────────────────────────────────
export function pct(done: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

/** Circumference of a circle for SVG progress rings */
export function ringCircumference(r: number): number {
  return 2 * Math.PI * r;
}

export function ringOffset(r: number, percentage: number): number {
  const circ = ringCircumference(r);
  return circ - (percentage / 100) * circ;
}

/** Read the current theme accent color from the CSS variable at runtime.
 *  Falls back to Scholar Amber (#F0A500) if the variable is not set.
 *  Use this anywhere a plain hex string is needed (SVG attrs, chart colors, etc.)
 */
export function getAccentColor(): string {
  if (typeof window === 'undefined') return '#F0A500';
  const val = window.getComputedStyle(document.documentElement)
    .getPropertyValue('--accent-amber')
    .trim();
  return val || '#F0A500';
}

// ── Color helpers ─────────────────────────────────────────────────────────
export const STATUS_COLORS = {
  not_started: '#4A5568',
  in_progress: '#F0A500', // overridden at call-site via getAccentColor() where needed
  completed:   '#00C896',
  paused:      '#FF6B6B',
  idea:        '#8A94A8',
  deployed:    '#4FC3F7',
} as const;

export const STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed:   'Completed',
  paused:      'Paused',
  idea:        'Idea',
  deployed:    'Deployed',
} as const;

// ── String helpers ────────────────────────────────────────────────────────
export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 3) + '…';
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/**
 * Sanitises any URL string before using it in an href or window.open.
 * Handles:
 *   - Markdown-style links: [https://example.com]  →  https://example.com
 *   - No protocol:          example.com             →  https://example.com
 *   - Already valid:        https://example.com     →  https://example.com
 *   - Empty / undefined                             →  '#'
 */
export function safeUrl(url?: string | null): string {
  if (!url) return '#';
  // Strip surrounding brackets like [https://...]
  let clean = url.trim().replace(/^\[+/, '').replace(/\]+$/, '').trim();
  // If still no protocol, prepend https://
  if (clean && !clean.match(/^https?:\/\//i) && !clean.startsWith('#') && !clean.startsWith('mailto:')) {
    clean = 'https://' + clean;
  }
  return clean || '#';
}

/**
 * Opens a URL safely in a new tab, applying safeUrl sanitisation.
 * Use instead of window.open(url) for user-supplied URLs.
 */
export function openExternal(url?: string | null): void {
  const safe = safeUrl(url);
  if (safe === '#') return;
  window.open(safe, '_blank', 'noopener,noreferrer');
}


// ── Time helpers ──────────────────────────────────────────────────────────
export function minsToHHMM(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function hhmm(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
}

// ── Array helpers ─────────────────────────────────────────────────────────
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key]);
    (acc[k] = acc[k] || []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

// ── Debounce ─────────────────────────────────────────────────────────────
export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

// ── Heatmap weeks builder ─────────────────────────────────────────────────
export function buildHeatmapWeeks(
  activity: Array<{ date: string; total_mins: number }>,
  weeks = 26
): Array<Array<{ date: string; level: number }>> {
  const today = new Date();
  const totalDays = weeks * 7;
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - totalDays + 1);

  const actMap: Record<string, number> = {};
  for (const a of activity) actMap[a.date] = a.total_mins;

  const maxMins = Math.max(...Object.values(actMap), 1);

  const days: Array<{ date: string; level: number }> = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const mins = actMap[iso] || 0;
    const level = mins === 0 ? 0 : Math.ceil((mins / maxMins) * 4);
    days.push({ date: iso, level });
  }

  // chunk into weeks
  const result: typeof days[] = [];
  for (let w = 0; w < weeks; w++) {
    result.push(days.slice(w * 7, w * 7 + 7));
  }
  return result;
}
