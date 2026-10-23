import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Code, Check, Copy, Download, RotateCcw, AlertTriangle, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import type { RoadmapTemplate } from '../../data/roadmapTemplates';
import type { RoadmapNode, RoadmapEdge } from '../../types';

export function normalizeToRoadmapTemplate(parsed: any): RoadmapTemplate {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('JSON root must be an object');
  }

  // Determine Title / Name
  const name = String(parsed.name || parsed.title || 'Untitled Default Course').trim();

  // Determine ID / Slug
  let id = '';
  if (typeof parsed.id === 'string' && parsed.id.trim()) {
    id = parsed.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  } else if (name && name !== 'Untitled Default Course') {
    id = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  } else if (typeof parsed.course_id === 'string' && parsed.course_id.trim()) {
    id = parsed.course_id.trim();
  }
  if (!id) {
    id = 'course_' + Date.now().toString(36);
  }

  // Determine Category based on keywords if not provided
  let category = parsed.category;
  if (!category) {
    const lower = (name + ' ' + (parsed.description || '')).toLowerCase();
    if (lower.includes('data') || lower.includes('analyst') || lower.includes('ai') || lower.includes('machine learning') || lower.includes('python')) {
      category = 'ai_data';
    } else if (lower.includes('devops') || lower.includes('security') || lower.includes('cloud') || lower.includes('docker') || lower.includes('k8s')) {
      category = 'devops_security';
    } else if (lower.includes('architect') || lower.includes('design') || lower.includes('system')) {
      category = 'architecture_design';
    } else if (lower.includes('product') || lower.includes('scrum') || lower.includes('agile') || lower.includes('management')) {
      category = 'product_management';
    } else {
      category = 'development';
    }
  }

  // Determine Nodes from either `nodes` or `topics`
  const rawNodes = Array.isArray(parsed.nodes)
    ? parsed.nodes
    : (Array.isArray(parsed.topics) ? parsed.topics : []);

  const nodes: RoadmapNode[] = rawNodes.map((n: any, idx: number) => {
    const rawId = n.id ? String(n.id) : `step_${idx + 1}`;
    const label = String(n.label || n.title || `Topic ${idx + 1}`).trim();
    const phase = String(n.phase || 'Foundations').trim();
    const status = (n.status === 'completed' || n.status === 'in_progress' || n.status === 'not_started')
      ? n.status
      : 'not_started';
    const description = typeof n.description === 'string' ? n.description : undefined;

    return {
      id: rawId,
      label,
      phase,
      status,
      ...(description ? { description } : {}),
    };
  });

  // Determine Edges
  let edges: RoadmapEdge[] = [];
  if (Array.isArray(parsed.edges)) {
    edges = parsed.edges.map((e: any) => ({
      source: String(e.source),
      target: String(e.target),
      id: e.id ? String(e.id) : undefined,
    }));
  }

  return {
    id,
    name,
    category,
    icon: parsed.icon || (category === 'ai_data' ? 'BarChart2' : 'Route'),
    badge: parsed.badge || 'Curriculum',
    description: parsed.description || '',
    roadmapUrl: parsed.roadmapUrl || parsed.source_url || '',
    nodes,
    edges,
  };
}

interface CourseJsonEditorModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  initialJson: object;
  onSave: (parsedJson: any) => Promise<{ success: boolean; error?: string }>;
  schemaType?: 'default_template' | 'user_course';
}

export const CourseJsonEditorModal: React.FC<CourseJsonEditorModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  initialJson,
  onSave,
  schemaType = 'default_template',
}) => {
  const showToast = useUIStore(s => s.showToast);
  const [jsonText, setJsonText] = useState('');
  const [initialFormatted, setInitialFormatted] = useState('');
  const [syntaxError, setSyntaxError] = useState<string | null>(null);
  const [schemaWarning, setSchemaWarning] = useState<string | null>(null);
  const [adaptedNotice, setAdaptedNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      try {
        const formatted = JSON.stringify(initialJson, null, 2);
        setJsonText(formatted);
        setInitialFormatted(formatted);
        setSyntaxError(null);
        setSchemaWarning(null);
        setAdaptedNotice(null);
      } catch (e: any) {
        setJsonText('{}');
        setSyntaxError('Failed to serialize initial data: ' + e.message);
      }
    }
  }, [open, initialJson]);

  const validateJson = (text: string): { valid: boolean; data?: any } => {
    try {
      const parsed = JSON.parse(text);
      setSyntaxError(null);

      // Schema check
      if (schemaType === 'default_template') {
        if (!parsed || typeof parsed !== 'object') {
          setSchemaWarning('Root must be an object.');
          setAdaptedNotice(null);
          return { valid: false };
        }

        const isCourseFormat = !parsed.nodes && Array.isArray(parsed.topics);
        const isAlternateKey = !parsed.id || !parsed.name || !parsed.nodes;

        const normalized = normalizeToRoadmapTemplate(parsed);

        if (!normalized.id) {
          setSchemaWarning('Course ID or title is required to generate template id.');
          setAdaptedNotice(null);
          return { valid: false };
        }
        if (!normalized.name) {
          setSchemaWarning('Course title or name is required.');
          setAdaptedNotice(null);
          return { valid: false };
        }

        if (isCourseFormat || isAlternateKey) {
          setAdaptedNotice(
            `✨ Auto-detected & adapted into Template "${normalized.name}" (${normalized.id}) with ${normalized.nodes.length} topics.`
          );
        } else {
          setAdaptedNotice(null);
        }

        setSchemaWarning(null);
        return { valid: true, data: normalized };
      } else if (schemaType === 'user_course') {
        if (!parsed.title && !parsed.name) {
          setSchemaWarning('Course "title" (string) is required.');
          return { valid: false };
        }
        const normalizedCourse = {
          ...parsed,
          title: parsed.title || parsed.name,
          topics: parsed.topics || (Array.isArray(parsed.nodes) ? parsed.nodes.map((n: any) => ({
            id: n.id,
            title: n.label || n.title,
            phase: n.phase || 'General',
            status: n.status || 'not_started',
            description: n.description,
          })) : []),
        };
        setSchemaWarning(null);
        return { valid: true, data: normalizedCourse };
      }

      setSchemaWarning(null);
      return { valid: true, data: parsed };
    } catch (e: any) {
      setSyntaxError(e.message);
      setSchemaWarning(null);
      setAdaptedNotice(null);
      return { valid: false };
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonText(val);
    validateJson(val);
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      let targetObj = parsed;
      if (schemaType === 'default_template') {
        targetObj = normalizeToRoadmapTemplate(parsed);
      }
      const formatted = JSON.stringify(targetObj, null, 2);
      setJsonText(formatted);
      validateJson(formatted);
      showToast('info', 'JSON formatted and normalized to template schema.');
    } catch (e: any) {
      setSyntaxError('Cannot format invalid JSON: ' + e.message);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('success', 'JSON copied to clipboard.');
    } catch {
      showToast('error', 'Failed to copy to clipboard.');
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([jsonText], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_course.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('success', 'JSON file downloaded.');
    } catch (e: any) {
      showToast('error', 'Download failed: ' + e.message);
    }
  };

  const handleReset = () => {
    setJsonText(initialFormatted);
    validateJson(initialFormatted);
    showToast('info', 'Reset to initial values.');
  };

  const handleSave = async () => {
    const res = validateJson(jsonText);
    if (!res.valid || !res.data) {
      showToast('error', syntaxError || schemaWarning || 'Please fix the JSON errors before saving.');
      return;
    }

    setSaving(true);
    try {
      const saveRes = await onSave(res.data);
      if (saveRes.success) {
        showToast('success', 'Course JSON successfully saved & updated globally.');
        onClose();
      } else {
        showToast('error', saveRes.error || 'Failed to save JSON to database.');
      }
    } catch (err: any) {
      showToast('error', 'Save error: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-5xl">
      <div className="space-y-3.5">
        {subtitle && (
          <p className="text-xs text-zinc-400 -mt-2 leading-relaxed">
            {subtitle}
          </p>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button variant="secondary" size="sm" icon={<Sparkles size={12} className="text-accent-amber" />} onClick={handleFormat}>
              Format & Beautify
            </Button>
            <Button variant="secondary" size="sm" icon={<RotateCcw size={12} />} onClick={handleReset}>
              Reset
            </Button>

            <span className="h-4 w-px bg-white/[0.1] mx-1 hidden sm:inline-block" />

            {syntaxError ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                <AlertTriangle size={11} /> Syntax Error
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 size={11} /> Syntax Valid
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              icon={copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              onClick={handleCopy}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button variant="secondary" size="sm" icon={<Download size={12} />} onClick={handleDownload}>
              Export .json
            </Button>
          </div>
        </div>

        {/* Errors / Warnings Banner */}
        {syntaxError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-300 rounded-xl text-xs flex items-start gap-2.5">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-rose-400" />
            <div className="min-w-0">
              <span className="font-bold">JSON Syntax Error:</span> {syntaxError}
            </div>
          </div>
        )}

        {schemaWarning && !syntaxError && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/25 text-accent-amber rounded-xl text-xs flex items-start gap-2.5">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-accent-amber" />
            <div className="min-w-0">
              <span className="font-bold">Schema Warning:</span> {schemaWarning}
            </div>
          </div>
        )}

        {/* Adaptation / Auto-conversion Banner */}
        {adaptedNotice && !syntaxError && (
          <div className="p-3 bg-accent-amber/10 border border-accent-amber/30 text-amber-300 rounded-xl text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-accent-amber flex-shrink-0" />
              <span>{adaptedNotice}</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="text-[11px] py-1 px-2.5 whitespace-nowrap cursor-pointer"
              onClick={handleFormat}
            >
              Apply & Beautify
            </Button>
          </div>
        )}

        {/* Editor Area with clean dark monospace canvas */}
        <div className="relative rounded-xl border border-white/[0.1] bg-[#0A0D14] overflow-hidden focus-within:border-accent-amber/50 transition-colors shadow-2xl">
          <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.03] border-b border-white/[0.08] text-[11px] text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Code size={13} className="text-accent-amber" />
              <span>course-definition.json</span>
            </span>
            <span>{jsonText.split('\n').length} lines · {jsonText.length} characters</span>
          </div>

          <textarea
            value={jsonText}
            onChange={handleTextChange}
            rows={19}
            spellCheck={false}
            className="w-full p-4 font-mono text-xs sm:text-[13px] text-zinc-200 bg-transparent resize-y outline-none leading-relaxed selection:bg-accent-amber/30 min-h-[420px]"
            placeholder="{\n  &quot;id&quot;: &quot;...&quot;,\n  &quot;name&quot;: &quot;...&quot;\n}"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
          <Button variant="secondary" size="md" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={Boolean(syntaxError) || saving}
            icon={saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            onClick={handleSave}
          >
            {saving ? 'Saving to Database...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
