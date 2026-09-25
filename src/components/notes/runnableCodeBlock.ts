import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { common, createLowlight } from 'lowlight';
import { RUN_BLOCK_EVENT } from '../../lib/codeRunner';
import { RunnableCodeBlockView } from './RunnableCodeBlockView';

const lowlight = createLowlight(common);

/**
 * Replaces StarterKit's plain code block (same node name, `codeBlock`, so notes
 * saved before this change load unchanged). Adds syntax highlighting plus a
 * language picker / Run button / output area rendered by RunnableCodeBlockView.
 *
 * `defaultLanguage: null` on purpose: until the person picks a language the
 * block is auto-highlighted but can't be run, so nothing runs as the wrong one.
 */
export const RunnableCodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(RunnableCodeBlockView);
  },

  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      // Tab indents inside a code block (Python cares) instead of leaving the editor.
      Tab: ({ editor }) => (editor.isActive('codeBlock') ? editor.commands.insertContent('    ') : false),
      // Replaces the default Mod-Enter ("exit the code block") with "run this block".
      'Mod-Enter': ({ editor }) => {
        if (!editor.isActive(this.name)) return false;
        const { $from } = editor.state.selection;
        const dom = editor.view.nodeDOM($from.before($from.depth));
        const view = dom instanceof HTMLElement
          ? (dom.matches('[data-node-view-wrapper]') ? dom : dom.querySelector('[data-node-view-wrapper]'))
          : null;
        view?.dispatchEvent(new CustomEvent(RUN_BLOCK_EVENT));
        return true;
      },
    };
  },
}).configure({ lowlight, defaultLanguage: null });
