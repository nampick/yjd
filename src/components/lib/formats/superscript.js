import { InlineFormat } from '../core/format.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import Subscript from './subscript.js';
/**
 * Superscript Format - Handles superscript text formatting
 * Creates <sup> elements for superscript text
 */
class Superscript extends InlineFormat {
  static formatName = 'superscript';
  static tagName = 'SUP';

  /**
   * Toggle superscript formatting
   */
  removeSubscriptBeforeApply() {
    const subscript = new Subscript();
    if (subscript.isActive()) {
      subscript.remove();
    }
  }
  toggle() {
    // Save state before applying format
    saveBeforeFormat();

    if (this.isActive()) {
      this.remove();
    } else {
      // Ensure mutual exclusivity: remove subscript before applying superscript
      this.removeSubscriptBeforeApply();
      this.apply();
    }
  }
}

export default Superscript; 