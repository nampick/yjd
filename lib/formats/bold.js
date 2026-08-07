import { InlineFormat } from '../core/format.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import { execFormat, queryFormatState } from '../utils/exec-command.js';
import { registerIcons, S } from '../ui/icons.js';

registerIcons({
  bold: S('<path d="M6 4h8a4 4 0 0 1 0 8H6z"/><path d="M6 12h9a4 4 0 0 1 0 8H6z"/>')
});

/**
 * Bold Format - Handles bold text formatting
 */
class Bold extends InlineFormat {
  static formatName = 'bold';
  static tagName = 'B';
  static alternativeTagNames = ['STRONG'];

   /**
   * Apply bold formatting
   */
  apply() {
    // Save state before applying format
    saveBeforeFormat();
    execFormat('bold');
  }

  /**
   * Remove bold formatting
   */
  remove() {
    execFormat('bold');
  }

  /**
   * Toggle bold formatting
   */
  toggle() {
    // Save state before applying format
    saveBeforeFormat();
    execFormat('bold');
  }

  /**
   * Check if bold formatting is active
   */
  isActive() {
    if (!queryFormatState('bold')) return false;
    // queryCommandState('bold') is true anywhere the COMPUTED weight is bold —
    // including plain headings, where no bold mark exists. Only report active
    // when an actual inline bold mark wraps the caret (b/strong or an inline
    // font-weight), so a plain H1 doesn't light the button and invite an
    // accidental "un-bold".
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    let node = sel.getRangeAt(0).startContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    while (node && !/^(H[1-6]|P|DIV|LI|BLOCKQUOTE|PRE|TD|TH|BODY)$/.test(node.tagName)) {
      if (node.tagName === 'B' || node.tagName === 'STRONG') return true;
      const w = node.style && node.style.fontWeight;
      if (w && (w === 'bold' || parseInt(w, 10) >= 600)) return true;
      node = node.parentElement;
    }
    // No inline mark: only headings legitimately compute bold — anywhere else
    // (e.g. Firefox reporting styleWithCSS runs) trust the command state.
    return !(node && /^H[1-6]$/.test(node.tagName));
  }


}


export default Bold;
