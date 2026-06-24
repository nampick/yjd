import { InlineFormat } from '../core/format.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import registry from '../core/registry.js';
/**
 * Subscript Format - Handles subscript text formatting
 * Creates <sub> elements for subscript text
 */
class Subscript extends InlineFormat {
  static formatName = 'subscript';
  static tagName = 'SUB';

  removeSuperscriptBeforeApply() {
    // Resolved via registry (not a static import) to avoid a circular
    // dependency between subscript.js and superscript.js.
    const Superscript = registry.get('formats/superscript');
    if (!Superscript) return;
    const superscript = new Superscript();
    if (superscript.isActive()) {
      superscript.remove();
    }
  }
  /**
   * Toggle subscript formatting
   */
  toggle() {
    // Save state before applying format
    saveBeforeFormat();

    if (this.isActive()) {
      this.remove();
    } else {
      this.removeSuperscriptBeforeApply();
      this.apply();
    }
  }


}

export default Subscript; 