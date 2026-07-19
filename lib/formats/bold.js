import { InlineFormat } from '../core/format.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import { execFormat, queryFormatState } from '../utils/exec-command.js';
import { registerIcons, S } from '../ui/icons.js';

registerIcons({
  bold: S('<path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>')
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
    return queryFormatState('bold');
  }


}


export default Bold;
