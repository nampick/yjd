import { InlineFormat } from '../core/format.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import { execFormat, queryFormatState } from '../utils/exec-command.js';
import { registerIcons, S } from '../ui/icons.js';

registerIcons({
  strike: S('<path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" x2="20" y1="12" y2="12"/>')
});

/**
 * Strike Format - Handles strikethrough text formatting.
 * Uses execCommand (like Bold) so it works on a collapsed caret / empty editor.
 */
class Strike extends InlineFormat {
  static formatName = 'strike';
  static tagName = 'S';
  static alternativeTagNames = ['STRIKE', 'DEL'];

  apply() {
    saveBeforeFormat();
    execFormat('strikeThrough');
  }

  remove() {
    execFormat('strikeThrough');
  }

  toggle() {
    saveBeforeFormat();
    execFormat('strikeThrough');
  }

  isActive() {
    return queryFormatState('strikeThrough');
  }
}

export default Strike;
