import { InlineFormat } from '../core/format.js';
import { saveBeforeFormat } from '../utils/history-helper.js';

/**
 * Strike Format - Handles strikethrough text formatting
 * Extracted from FormatManager.js logic
 */
class Strike extends InlineFormat {
  static formatName = 'strike';
  static tagName = 'S';
  static alternativeTagNames = ['STRIKE', 'DEL'];

  /**
   * Toggle strikethrough formatting
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

export default Strike; 