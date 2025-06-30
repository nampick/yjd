import { InlineFormat } from '../core/format.js';

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
    if (this.isActive()) {
      this.remove();
    } else {
      this.apply();
    }
  }

}

export default Underline; 