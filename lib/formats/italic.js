import { InlineFormat } from '../core/format.js';
import { saveBeforeFormat } from '../utils/history-helper.js';

/**
 * Italic Format - Handles italic text formatting
 */
class Italic extends InlineFormat {
  static formatName = 'italic';
  static tagName = 'I';
  static alternativeTagNames = ['EM'];

  /**
   * Toggle italic formatting
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

export default Italic;
