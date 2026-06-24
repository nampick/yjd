import { InlineFormat } from '../core/format.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import { execFormat, queryFormatState } from '../utils/exec-command.js';

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
