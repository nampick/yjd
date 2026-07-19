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
import { htmlToMarkdown, markdownToHtml, domToJson, jsonToHtml } from '../serialize.js';
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
  return Editor;
}

export default applySerializeMethods;
