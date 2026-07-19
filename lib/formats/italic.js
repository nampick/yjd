import { InlineFormat } from '../core/format.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import { execFormat, queryFormatState } from '../utils/exec-command.js';
import { registerIcons, S } from '../ui/icons.js';

registerIcons({
  italic: S('<line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/>')
});

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
