import { InlineFormat } from '../core/format.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import registry from '../core/registry.js';
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
    // Resolved via registry (not a static import) to avoid a circular
    // dependency between superscript.js and subscript.js.
    const Subscript = registry.get('formats/subscript');
    if (!Subscript) return;
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