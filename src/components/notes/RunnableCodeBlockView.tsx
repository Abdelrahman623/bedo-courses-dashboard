import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { Play, LoaderCircle, Keyboard, X } from 'lucide-react';
import {
  RUNNABLE_LANGUAGES,
  RUNNER_HOST,
  RUN_BLOCK_EVENT,
  normalizeLanguage,
  runCode,
} from '../../lib/codeRunner';
import type { RunResult } from '../../lib/codeRunner';

type RunState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'done'; result: RunResult }
  | { phase: 'error'; message: string };

const formatTime = (s: number) => (s < 1 ? `${Math.round(s * 1000)} ms` : `${s.toFixed(2)} s`);
const formatMemory = (kb: number) => `${(kb / 1024).toFixed(1)} MB`;

const STATUS_LABEL: Record<RunResult['kind'], string> = {
  'success': 'Finished',
  'compile-error': 'Compilation error',
  'runtime-error': 'Runtime error',
  'timeout': 'Time limit exceeded',
  'system-error': 'Runner error',
};

/** One labelled chunk of output (stdout / stderr / compiler messages). */
const OutputBlock = ({ label, text, tone }: { label?: string; text: string; tone: 'out' | 'err' }) => (
  <div>
    {label && <div className="text-[10px] uppercase tracking-wide text-txt-muted mb-0.5">{label}</div>}
    <div className={`whitespace-pre-wrap break-words ${tone === 'err' ? 'text-rose-400' : 'text-txt-primary'}`}>
      {text}
    </div>
  </div>
);

export function RunnableCodeBlockView({ node, updateAttributes, editor }: NodeViewProps) {
  const rawLanguage = (node.attrs.language as string | null) ?? '';
  const language = normalizeLanguage(rawLanguage);

  const [state, setState] = useState<RunState>({ phase: 'idle' });
  const [stdin, setStdin] = useState('');
  const [showStdin, setShowStdin] = useState(false);
  const latestRun = useRef(0);
  const running = state.phase === 'running';

  const run = useCallback(async () => {
    if (!language || running) return;
    const code = node.textContent;
    if (!code.trim()) {
      setState({ phase: 'error', message: 'Write some code first.' });
      return;
    }
    const runId = ++latestRun.current;
    setState({ phase: 'running' });
    try {
      const result = await runCode(language, code, stdin);
      if (runId === latestRun.current) setState({ phase: 'done', result });
    } catch (err) {
      if (runId !== latestRun.current) return;
      setState({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Something went wrong while running this code.',
      });
    }
  }, [language, running, node, stdin]);

  // Ctrl/⌘+Enter inside the code is caught by the editor's keymap (see
  // runnableCodeBlock.ts), which signals this element; keep the newest `run`
  // in a ref so the listener never goes stale between keystrokes.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const runRef = useRef(run);
  useEffect(() => { runRef.current = run; });
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const onRunRequested = () => void runRef.current();
    el.addEventListener(RUN_BLOCK_EVENT, onRunRequested);
    return () => el.removeEventListener(RUN_BLOCK_EVENT, onRunRequested);
  }, []);

  // The stdin box is a real <textarea> outside the editor, so it handles its own shortcut.
  const onStdinKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      void run();
    }
  };

  const onLanguageChange = (value: string) => {
    updateAttributes({ language: value });
    setState({ phase: 'idle' }); // the old output belongs to the old language
  };

  const result = state.phase === 'done' ? state.result : null;

  return (
    <NodeViewWrapper ref={wrapperRef} className="code-runner">
      {/* ── Controls ─────────────────────────────────────────────────── */}
      <div
        contentEditable={false}
        className="flex items-center gap-2 px-2.5 py-1.5 border-b border-white/[0.06] select-none"
      >
        <select
          aria-label="Code language"
          value={language ?? rawLanguage}
          disabled={!editor.isEditable}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="bg-bg-surface text-txt-primary text-xs rounded-md border border-white/10 px-2 py-1 outline-none focus:border-accent-amber/60 disabled:opacity-60"
        >
          {!language && (
            <option value={rawLanguage} disabled>
              {rawLanguage ? `${rawLanguage} (can't run)` : 'Select language…'}
            </option>
          )}
          {RUNNABLE_LANGUAGES.map((l) => (
            <option key={l.key} value={l.key}>{l.label}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => void run()}
          disabled={!language || running}
          title={language ? `Run (Ctrl/⌘ + Enter) — code is sent to ${RUNNER_HOST}` : 'Pick a language to run this code'}
          className="flex items-center gap-1.5 text-xs font-medium rounded-md px-2.5 py-1 border border-accent-tertiary/40 bg-accent-tertiary/10 text-accent-tertiary hover:bg-accent-tertiary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {running ? <LoaderCircle size={13} className="animate-spin" /> : <Play size={13} />}
          {running ? 'Running…' : 'Run'}
        </button>

        <button
          type="button"
          onClick={() => setShowStdin((v) => !v)}
          aria-pressed={showStdin}
          title="Program input (stdin)"
          className={`ml-auto flex items-center gap-1 text-xs rounded-md px-2 py-1 transition-colors ${
            showStdin ? 'text-accent-amber bg-accent-amber/10' : 'text-txt-muted hover:text-txt-primary'
          }`}
        >
          <Keyboard size={13} />
          Input
        </button>
      </div>

      {/* ── The code itself (editable, highlighted by lowlight) ─────── */}
      <pre spellCheck={false}>
        <NodeViewContent<'code'> as="code" />
      </pre>

      {/* ── stdin ────────────────────────────────────────────────────── */}
      {showStdin && (
        <div contentEditable={false} className="px-2.5 py-2 border-t border-white/[0.06]">
          <textarea
            aria-label="Program input (stdin)"
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            onKeyDown={onStdinKeyDown}
            placeholder="Text your program reads from standard input…"
            rows={2}
            className="w-full resize-y bg-bg-surface text-txt-primary text-xs font-mono rounded-md border border-white/10 px-2 py-1.5 outline-none focus:border-accent-amber/60 placeholder:text-txt-muted"
          />
        </div>
      )}

      {/* ── Output ───────────────────────────────────────────────────── */}
      {state.phase !== 'idle' && (
        <div
          contentEditable={false}
          role="status"
          aria-live="polite"
          className="border-t border-white/[0.06] bg-bg-base/40 px-3 py-2 text-xs font-mono select-text"
        >
          {state.phase === 'running' && (
            <div className="text-txt-secondary">Running on {RUNNER_HOST}…</div>
          )}

          {state.phase === 'error' && (
            <div className="text-rose-400 whitespace-pre-wrap">{state.message}</div>
          )}

          {result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-sans text-[11px]">
                <span className={result.kind === 'success' ? 'text-status-completed font-medium' : 'text-rose-400 font-medium'}>
                  {STATUS_LABEL[result.kind]}
                </span>
                {(result.timeSec !== null || result.memoryKb !== null) && (
                  <span className="text-txt-muted">
                    {[
                      result.timeSec !== null ? formatTime(result.timeSec) : null,
                      result.memoryKb !== null ? formatMemory(result.memoryKb) : null,
                    ].filter(Boolean).join(' · ')}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setState({ phase: 'idle' })}
                  title="Clear output"
                  aria-label="Clear output"
                  className="ml-auto text-txt-muted hover:text-txt-primary"
                >
                  <X size={13} />
                </button>
              </div>

              {result.notes.map((n) => (
                <div key={n} className="font-sans text-[11px] text-txt-muted">{n}</div>
              ))}
              {result.compileOutput && <OutputBlock label="Compiler" text={result.compileOutput} tone="err" />}
              {result.stdout && <OutputBlock label={result.kind === 'success' ? undefined : 'Output'} text={result.stdout} tone="out" />}
              {result.stderr && <OutputBlock label="Errors" text={result.stderr} tone="err" />}
              {/* Judge0 "message" is only useful when nothing more specific came back. */}
              {result.message && !result.stderr && !result.compileOutput && result.kind !== 'success' && (
                <OutputBlock text={result.message} tone="err" />
              )}
              {result.kind === 'success' && !result.stdout && !result.stderr && (
                <div className="text-txt-muted font-sans">Finished with no output.</div>
              )}
            </div>
          )}
        </div>
      )}
    </NodeViewWrapper>
  );
}
