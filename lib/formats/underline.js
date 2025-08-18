import { InlineFormat } from '../core/format.js';
import { saveBeforeFormat } from '../utils/history-helper.js';

/**
 * Underline Format - Handles underline text formatting
 * Extracted from FormatManager.js logic
 */
class Underline extends InlineFormat {
  static formatName = 'underline';
  static tagName = 'U';
  static alternativeTagNames = ['SPAN'];

  /**
   * Toggle underline formatting
   */

  toggle() {
    // Save state before applying format
    saveBeforeFormat();

    if (this.isActive()) {
      this.remove();
    } else {
      this.apply();
    }
  }

}

export default Underline; 