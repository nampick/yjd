import { InlineFormat } from '../core/format.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import { execFormat, queryFormatState } from '../utils/exec-command.js';

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
