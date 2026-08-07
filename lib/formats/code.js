import { InlineFormat } from '../core/format.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import { registerIcons, S } from '../ui/icons.js';

registerIcons({
  code: S('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>')
});

/**
 * Inline code format — wraps the selection in `<code>` (UI 2.0: the design's
 * chrome bar has an inline-code button between strikethrough and colour).
 * Block code (`<pre>`) stays a block type via the heading picker / slash menu;
 * this format never applies inside one.
 */
class Code extends InlineFormat {
  static formatName = 'code';
  static tagName = 'CODE';

  /** The CODE ancestor of the caret when it's an *inline* code (not in <pre>). */
  _currentCode() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;
    let node = selection.getRangeAt(0).startContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
    const code = node && node.closest ? node.closest('code') : null;
    if (!code || code.closest('pre')) return null;
    return code;
  }

  apply() {
    // Never nest inline code inside a code block.
    const selection = window.getSelection();
    if (selection && selection.rangeCount) {
      let node = selection.getRangeAt(0).startContainer;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
      if (node && node.closest && node.closest('pre')) return;
    }
    saveBeforeFormat();
    super.apply();
  }

  remove() {
    saveBeforeFormat();
    const code = this._currentCode();
    if (code) {
      // Unwrap the whole element — partial unwrap of a short code chip is
      // rarely what anyone wants.
      const parent = code.parentNode;
      const selection = window.getSelection();
      const first = code.firstChild;
      const last = code.lastChild;
      while (code.firstChild) parent.insertBefore(code.firstChild, code);
      parent.removeChild(code);
      parent.normalize();
      if (first && selection) {
        const r = document.createRange();
        try {
          r.setStartBefore(first);
          r.setEndAfter(last || first);
          selection.removeAllRanges();
          selection.addRange(r);
        } catch (e) { /* best effort */ }
      }
      return;
    }
    super.remove();
  }

  toggle() {
    if (this.isActive()) this.remove();
    else this.apply();
  }

  isActive() {
    return !!this._currentCode();
  }
}

export default Code;
