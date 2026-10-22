import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Code, Check, Copy, Download, RotateCcw, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

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
          return { valid: false };
        }
        if (!parsed.id || typeof parsed.id !== 'string') {
          setSchemaWarning('Template "id" (string slug) is required.');
          return { valid: false };
        }
        if (!parsed.name || typeof parsed.name !== 'string') {
          setSchemaWarning('Template "name" (title string) is required.');
          return { valid: false };
        }
        if (!Array.isArray(parsed.nodes)) {
          setSchemaWarning('"nodes" must be an array of roadmap nodes.');
          return { valid: false };
        }
        if (!Array.isArray(parsed.edges)) {
          setSchemaWarning('"edges" must be an array of roadmap connections.');
          return { valid: false };
        }
      } else if (schemaType === 'user_course') {
        if (!parsed.title || typeof parsed.title !== 'string') {
          setSchemaWarning('Course "title" (string) is required.');
          return { valid: false };
        }
      }

      setSchemaWarning(null);
      return { valid: true, data: parsed };
    } catch (e: any) {
      setSyntaxError(e.message);
      setSchemaWarning(null);
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
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonText(formatted);
      validateJson(formatted);
      showToast('info', 'JSON formatted successfully.');
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
    <Modal open={open} onClose={onClose} title={title} width="max-w-4xl">
      <div className="space-y-4">
        {subtitle && (
          <p className="text-xs text-zinc-400 -mt-2 leading-relaxed">
            {subtitle}
          </p>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/[0.08] flex-wrap">
          <div className="flex items-center gap-1.5">
            <Button variant="secondary" size="sm" icon={<Sparkles size={12} className="text-accent-amber" />} onClick={handleFormat}>
              Format & Beautify
            </Button>
            <Button variant="secondary" size="sm" icon={<RotateCcw size={12} />} onClick={handleReset}>
              Reset
            </Button>
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
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start gap-2">
            <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-rose-400" />
            <div className="min-w-0">
              <span className="font-semibold">JSON Syntax Error:</span> {syntaxError}
            </div>
          </div>
        )}

        {schemaWarning && !syntaxError && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-accent-amber rounded-xl text-xs flex items-start gap-2">
            <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-accent-amber" />
            <div className="min-w-0">
              <span className="font-semibold">Schema Warning:</span> {schemaWarning}
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className="relative rounded-xl border border-white/[0.1] bg-[#0A0D14] overflow-hidden focus-within:border-accent-amber/50 transition-colors">
          <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.03] border-b border-white/[0.08] text-[11px] text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Code size={13} className="text-accent-amber" />
              <span>json-editor.json</span>
            </span>
            <span>{jsonText.split('\n').length} lines</span>
          </div>

          <textarea
            value={jsonText}
            onChange={handleTextChange}
            rows={18}
            spellCheck={false}
            className="w-full p-3 font-mono text-xs text-zinc-200 bg-transparent resize-y outline-none leading-relaxed selection:bg-accent-amber/25"
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
