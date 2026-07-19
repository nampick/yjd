import { InlineFormat } from '../core/format.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import { execFormat, queryFormatState } from '../utils/exec-command.js';
import { registerIcons, S } from '../ui/icons.js';

registerIcons({
  underline: S('<path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" x2="20" y1="20" y2="20"/>')
});

/**
 * Underline Format - Handles underline text formatting.
 * Uses execCommand (like Bold) so it works on a collapsed caret / empty editor.
 */
class Underline extends InlineFormat {
  static formatName = 'underline';
  static tagName = 'U';
  static alternativeTagNames = ['SPAN'];

  apply() {
    saveBeforeFormat();
    execFormat('underline');
  }

  remove() {
    execFormat('underline');
  }

  toggle() {
    saveBeforeFormat();
    execFormat('underline');
  }

  isActive() {
    return queryFormatState('underline');
  }
}

export default Underline;
