// Runs the code in a Notes code block on a Judge0-compatible execution API.
//
// Why Judge0: the public Piston instance (emkc.org) went whitelist-only on
// 2026-02-15, so it can't be called from a browser app any more. Judge0 CE has
// a free public endpoint and can also be self-hosted, which is the escape hatch
// if the public one is ever rate-limited or removed — set VITE_CODE_RUNNER_URL.
//
// Privacy note: whatever is in the code block (and the optional stdin) is sent
// to that host to be compiled and run. Point the URL at your own instance if
// notes ever contain anything you don't want leaving the machine.

export type RunnableLanguage = 'python' | 'r' | 'java' | 'cpp' | 'go';

interface LanguageSpec {
  key: RunnableLanguage;
  label: string;
  /** Judge0 CE v1.13 id — used only if /languages can't be read. */
  fallbackId: number;
  /** Matches this language's name in Judge0's /languages list. */
  namePattern: RegExp;
}

export const RUNNABLE_LANGUAGES: readonly LanguageSpec[] = [
  { key: 'python', label: 'Python', fallbackId: 71, namePattern: /^Python \(\d/ },
  { key: 'r',      label: 'R',      fallbackId: 80, namePattern: /^R \(\d/ },
  { key: 'java',   label: 'Java',   fallbackId: 62, namePattern: /^Java \(OpenJDK/ },
  { key: 'cpp',    label: 'C++',    fallbackId: 54, namePattern: /^C\+\+ \(GCC/ },
  { key: 'go',     label: 'Go',     fallbackId: 60, namePattern: /^Go \(\d/ },
];

// Names people (and ```lang markdown shortcuts) use for the same language.
const ALIASES = new Map<string, RunnableLanguage>([
  ['python', 'python'], ['py', 'python'], ['python3', 'python'],
  ['r', 'r'],
  ['java', 'java'],
  ['cpp', 'cpp'], ['c++', 'cpp'], ['cc', 'cpp'], ['cxx', 'cpp'],
  ['go', 'go'], ['golang', 'go'],
]);

/** Maps whatever is stored on the code block to a runnable language, or null. */
export function normalizeLanguage(raw: string | null | undefined): RunnableLanguage | null {
  if (!raw) return null;
  return ALIASES.get(raw.trim().toLowerCase()) ?? null;
}

/**
 * Fired on a code block's node view when Ctrl/⌘+Enter is pressed inside it.
 * Key events in a contenteditable target the editor root, not the block the
 * caret is in, so the editor's keymap has to hand the request to the view.
 */
export const RUN_BLOCK_EVENT = 'run-code-block';

// ─── Config ─────────────────────────────────────────────────────────────────
const DEFAULT_RUNNER_URL = 'https://ce.judge0.com';

const configuredUrl = (import.meta.env.VITE_CODE_RUNNER_URL as string | undefined)?.trim();
const BASE_URL = (configuredUrl || DEFAULT_RUNNER_URL).replace(/\/+$/, '');
// Only for a self-hosted Judge0 started with AUTHN_TOKEN. Anything in a VITE_
// variable is shipped to the browser, so treat it as a low-value shared key.
const AUTH_TOKEN = (import.meta.env.VITE_CODE_RUNNER_TOKEN as string | undefined)?.trim();

export const RUNNER_HOST = (() => {
  try { return new URL(BASE_URL).host; } catch { return BASE_URL; }
})();

const REQUEST_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 1_000;
const POLL_ATTEMPTS = 20;

// ─── Result shape ───────────────────────────────────────────────────────────
export type RunKind = 'success' | 'compile-error' | 'runtime-error' | 'timeout' | 'system-error';

export interface RunResult {
  kind: RunKind;
  /** Judge0's own wording, e.g. "Accepted", "Runtime Error (NZEC)". */
  statusText: string;
  stdout: string;
  stderr: string;
  compileOutput: string;
  message: string;
  timeSec: number | null;
  memoryKb: number | null;
  /** Things we changed before running that the person should know about. */
  notes: string[];
}

/** A failure to run at all (network, auth, rate limit) — not a bug in the user's code. */
export class RunnerError extends Error {}

// ─── base64 (Judge0 needs it to carry non-ASCII output safely) ──────────────
function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  // Chunked so a large paste can't overflow the argument limit of fromCharCode.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function fromBase64(value: string | null | undefined): string {
  if (!value) return '';
  try {
    // atob ignores the line breaks Judge0 puts in its base64.
    return new TextDecoder().decode(Uint8Array.from(atob(value), (c) => c.charCodeAt(0)));
  } catch {
    return value;
  }
}

// ─── Java: the entry class has to be called Main ────────────────────────────
// Judge0 saves Java as Main.java and runs `java Main`, so `public class Hello`
// fails with a confusing "should be declared in a file named Hello.java".
// Rename the class that holds main() instead — but never inside strings or
// comments, so program output and doc text stay exactly as written.
const JAVA_LITERALS_AND_COMMENTS =
  /("""[\s\S]*?"""|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|\/\/[^\n]*|\/\*[\s\S]*?\*\/)/;

function ensureJavaMainClass(source: string): { source: string; renamedFrom: string | null } {
  // With a capture group, split() puts the literals/comments at the odd indexes.
  const parts = source.split(JAVA_LITERALS_AND_COMMENTS);
  const code = parts.filter((_, i) => i % 2 === 0).join('\n');

  if (/\bclass\s+Main\b/.test(code)) return { source, renamedFrom: null };

  const mainAt = code.search(/\bvoid\s+main\s*\(/);
  if (mainAt === -1) return { source, renamedFrom: null };

  let name: string | null = null;
  for (const m of code.matchAll(/\bclass\s+([A-Za-z_][\w]*)/g)) {
    if (m.index < mainAt) name = m[1];
  }
  if (!name) return { source, renamedFrom: null };

  const identifier = new RegExp(`\\b${name}\\b`, 'g');
  const renamed = parts.map((p, i) => (i % 2 ? p : p.replace(identifier, 'Main'))).join('');
  return { source: renamed, renamedFrom: name };
}

function prepareSource(language: RunnableLanguage, source: string): { source: string; notes: string[] } {
  if (language === 'java') {
    const { source: prepared, renamedFrom } = ensureJavaMainClass(source);
    if (renamedFrom) {
      return { source: prepared, notes: [`Ran with class ${renamedFrom} renamed to Main (Java runs the class called Main).`] };
    }
  }
  return { source, notes: [] };
}

// ─── Talking to Judge0 ──────────────────────────────────────────────────────
interface Judge0Submission {
  token?: string;
  status?: { id: number; description: string };
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  time?: string | null;
  memory?: number | null;
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (AUTH_TOKEN) headers['X-Auth-Token'] = AUTH_TOKEN;
  try {
    return await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      throw new RunnerError('The code runner took too long to respond. Try again in a moment.');
    }
    // A rate-limited or blocked response reaches the browser as a plain
    // network failure (no CORS headers), so all three are listed on purpose.
    throw new RunnerError(
      `Couldn't reach the code runner at ${RUNNER_HOST}. You may be offline, rate-limited, or the server blocked the request.`,
    );
  }
}

async function httpError(res: Response): Promise<RunnerError> {
  if (res.status === 429) {
    return new RunnerError('The code runner is rate-limiting requests. Wait a few seconds and run again.');
  }
  if (res.status === 401 || res.status === 403) {
    return new RunnerError(`${RUNNER_HOST} rejected the request. If it needs a token, set VITE_CODE_RUNNER_TOKEN.`);
  }
  let detail = '';
  try { detail = (await res.text()).slice(0, 200); } catch { /* body unreadable — status is enough */ }
  return new RunnerError(`Code runner error (HTTP ${res.status}).${detail ? ` ${detail}` : ''}`);
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Language ids differ between Judge0 versions (a newer instance renumbers
// Python/Go/…), so read the list once and pick the newest of each language by
// name. If that fails we use the v1.13 ids rather than blocking the run.
let languageIds: Promise<Partial<Record<RunnableLanguage, number>>> | null = null;

function versionParts(name: string): number[] {
  const inParens = name.slice(name.indexOf('('));
  return (inParens.match(/\d+(?:\.\d+)*/)?.[0] ?? '0').split('.').map(Number);
}

function isNewer(a: string, b: string): boolean {
  const va = versionParts(a);
  const vb = versionParts(b);
  for (let i = 0; i < Math.max(va.length, vb.length); i++) {
    const diff = (va[i] ?? 0) - (vb[i] ?? 0);
    if (diff !== 0) return diff > 0;
  }
  return false;
}

/** Exported for tests. */
export function pickLanguageIds(list: { id: number; name: string }[]): Partial<Record<RunnableLanguage, number>> {
  const picked: Partial<Record<RunnableLanguage, { id: number; name: string }>> = {};
  for (const entry of list) {
    const spec = RUNNABLE_LANGUAGES.find((l) => l.namePattern.test(entry.name));
    if (!spec) continue;
    const current = picked[spec.key];
    if (!current || isNewer(entry.name, current.name)) picked[spec.key] = entry;
  }
  const ids: Partial<Record<RunnableLanguage, number>> = {};
  for (const spec of RUNNABLE_LANGUAGES) {
    const hit = picked[spec.key];
    if (hit) ids[spec.key] = hit.id;
  }
  return ids;
}

async function loadLanguageIds(): Promise<Partial<Record<RunnableLanguage, number>>> {
  const res = await request('/languages');
  if (!res.ok) throw await httpError(res);
  return pickLanguageIds((await res.json()) as { id: number; name: string }[]);
}

async function languageIdFor(language: RunnableLanguage): Promise<number> {
  const spec = RUNNABLE_LANGUAGES.find((l) => l.key === language)!;
  try {
    languageIds ??= loadLanguageIds();
    return (await languageIds)[language] ?? spec.fallbackId;
  } catch {
    languageIds = null; // try again next run
    return spec.fallbackId;
  }
}

async function submit(body: string): Promise<Judge0Submission> {
  let res = await request('/submissions?base64_encoded=true&wait=true', { method: 'POST', body });

  // Some hosts turn ?wait=true off; fall back to submit-then-poll.
  if (res.status === 400) {
    const text = await res.text();
    if (!/wait/i.test(text)) throw new RunnerError(`Code runner error (HTTP 400). ${text.slice(0, 200)}`);
    res = await request('/submissions?base64_encoded=true', { method: 'POST', body });
  }
  if (!res.ok) throw await httpError(res);

  let submission = (await res.json()) as Judge0Submission;
  // Status 1 = in queue, 2 = processing. Anything higher is a final answer.
  for (let i = 0; i < POLL_ATTEMPTS && (!submission.status || submission.status.id <= 2); i++) {
    if (!submission.token) break;
    await sleep(POLL_INTERVAL_MS);
    const poll = await request(`/submissions/${submission.token}?base64_encoded=true`);
    if (!poll.ok) throw await httpError(poll);
    submission = (await poll.json()) as Judge0Submission;
  }
  if (!submission.status || submission.status.id <= 2) {
    throw new RunnerError('The run did not finish in time. Try again.');
  }
  return submission;
}

function kindOf(statusId: number): RunKind {
  if (statusId === 3) return 'success';
  if (statusId === 5) return 'timeout';
  if (statusId === 6) return 'compile-error';
  if ((statusId >= 7 && statusId <= 12) || statusId === 14) return 'runtime-error';
  return 'system-error'; // 13 = the runner itself failed
}

export async function runCode(language: RunnableLanguage, source: string, stdin = ''): Promise<RunResult> {
  const prepared = prepareSource(language, source);
  const language_id = await languageIdFor(language);

  const submission = await submit(JSON.stringify({
    language_id,
    source_code: toBase64(prepared.source),
    stdin: stdin ? toBase64(stdin) : undefined,
  }));

  const status = submission.status!;
  const seconds = submission.time == null ? NaN : parseFloat(submission.time);
  return {
    kind: kindOf(status.id),
    statusText: status.description,
    stdout: fromBase64(submission.stdout),
    stderr: fromBase64(submission.stderr),
    compileOutput: fromBase64(submission.compile_output),
    message: fromBase64(submission.message),
    timeSec: Number.isFinite(seconds) ? seconds : null,
    memoryKb: submission.memory ?? null,
    notes: prepared.notes,
  };
}
