/**
 * Optional serialize methods (Markdown / JSON) for the Editor.
 *
 * These are NOT part of the tree-shakeable `/core` Editor — importing them here
 * would drag `serialize.js` (~3 KB gzip) into every bundle, including a Minimal
 * comment box that never exports Markdown/JSON. The all-in-one entry (index.js)
 * calls `applySerializeMethods(Editor)` so the default build keeps them; `/core`
 * users who need them call it themselves:
 *
 *   import { Editor } from '@oix1987/yjd/core';
 *   import { applySerializeMethods } from '@oix1987/yjd/lib/core/serialize-methods.js';
 *   applySerializeMethods(Editor);
 */
import { htmlToMarkdown, markdownToHtml, balancePartialMarkdown, domToJson, jsonToHtml } from '../serialize.js';
import { sanitizeHtml } from '../utils/sanitize.js';

export function applySerializeMethods(Editor) {
  /** Structured JSON document `{ type:'doc', content:[…] }`. */
  Editor.prototype.getJSON = function getJSON() {
    return domToJson(this.getContent());
  };
  /** Set content from a JSON document (produced by getJSON). */
  Editor.prototype.setJSON = function setJSON(json) {
    this.setContent(sanitizeHtml(jsonToHtml(json)));
  };
  /** Markdown string. */
  Editor.prototype.getMarkdown = function getMarkdown() {
    return htmlToMarkdown(this.getContent());
  };
  /** Set content from a Markdown string. */
  Editor.prototype.setMarkdown = function setMarkdown(md) {
    this.setContent(sanitizeHtml(markdownToHtml(md || '')));
  };

  /**
   * Stream a Markdown response and render it as formatted HTML token-by-token,
   * partial-safe (an open **bold or code fence renders cleanly). Perfect for
   * showing an LLM reply "typing" with real formatting. Returns a sink:
   *
   *   const s = editor.streamMarkdown();
   *   for await (const chunk of res) s.append(chunk);
   *   s.commit();                 // finalize (renders the complete markdown)
   *   // s.cancel();              // undo the whole stream
   *
   * The output goes into a block at the caret; commit() unwraps it into normal
   * editable content.
   */
  Editor.prototype.streamMarkdown = function streamMarkdown() {
    this.focus();
    const history = this.getModule && this.getModule('history');
    if (history && typeof history.saveBeforeFormat === 'function') history.saveBeforeFormat();
    const snapshot = this.editor.innerHTML;

    const host = document.createElement('div');
    host.className = 'yjd-md-stream';
    const sel = window.getSelection();
    if (sel && sel.rangeCount && this.editor.contains(sel.getRangeAt(0).startContainer)) {
      const r = sel.getRangeAt(0);
      r.collapse(false);
      r.insertNode(host);
    } else {
      this.editor.appendChild(host);
    }

    let acc = '';
    const paint = (md) => { host.innerHTML = sanitizeHtml(markdownToHtml(md)); };
    return {
      append: (chunk) => {
        if (typeof chunk !== 'string' || chunk === '') return;
        acc += chunk;
        paint(balancePartialMarkdown(acc)); // live view: partial-safe
        this.onContentChange();
      },
      commit: () => {
        paint(acc); // final: render the exact, complete markdown
        if (this.options.ai && this.options.ai.trackAuthorship) {
          host.className = 'yjd-ai-mark'; // keep the block as an authorship mark
          host.setAttribute('data-ai', '1');
        } else {
          const frag = document.createDocumentFragment();
          while (host.firstChild) frag.appendChild(host.firstChild);
          host.replaceWith(frag); // unwrap into normal editable content
        }
        this.onContentChange();
      },
      cancel: () => {
        this.editor.innerHTML = snapshot;
        this.onContentChange();
      },
    };
  };

  return Editor;
}

export default applySerializeMethods;
