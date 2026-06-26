/**
 * renderStatic — paint stored HTML into a read-only view that looks exactly
 * like the editor's content area, without booting an editor.
 *
 * It sanitizes the HTML (same allowlist the editor uses on paste/setContent)
 * and tags the host element with `.yjd-content`, the class the stylesheet uses
 * to style typography, lists, tables, images, and mention tokens. Load the
 * editor stylesheet (or StylesLoader.loadStyles()) on the page for it to match.
 *
 *   import { renderStatic } from '@oix1987/yjd/core';
 *   renderStatic(post.body_html, document.querySelector('#post'));
 *
 * @param {string} html        Stored HTML (untrusted — it is sanitized).
 * @param {Element} [target]   Element to render into. If omitted, a fresh
 *                             <div.yjd-content> is created and returned.
 * @returns {Element} the element the content was rendered into.
 */
import { sanitizeHtml } from './utils/sanitize.js';

export function renderStatic(html, target) {
  const safe = sanitizeHtml(html || '');
  const el = target || document.createElement('div');
  el.classList.add('yjd-content');
  el.innerHTML = safe;
  return el;
}

export default renderStatic;
