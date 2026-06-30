import { InlineFormat } from '../core/format.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import { execFormat, queryFormatState } from '../utils/exec-command.js';

/**
 * Italic Format - Handles italic text formatting.
 * Uses execCommand (like Bold) so it reliably arms typing mode on a collapsed
 * caret — including on an empty/just-focused editor — instead of inserting a
 * zero-width marker that the empty-content reset would strip.
 */
class Italic extends InlineFormat {
  static formatName = 'italic';
  static tagName = 'I';
  static alternativeTagNames = ['EM'];

  apply() {
    saveBeforeFormat();
    execFormat('italic');
  }

  remove() {
    execFormat('italic');
  }

  toggle() {
    saveBeforeFormat();
    execFormat('italic');
  }

  isActive() {
    return queryFormatState('italic');
  }
}

export default Italic;
