import { InlineFormat } from '../core/format.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import { execFormat, queryFormatState } from '../utils/exec-command.js';

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
