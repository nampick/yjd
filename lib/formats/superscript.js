import { InlineFormat } from '../core/format.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import registry from '../core/registry.js';
import { registerIcons, S } from '../ui/icons.js';

registerIcons({
  superscript: S('<path d="m4 19 8-8"/><path d="m12 19-8-8"/><path d="M20 12h-4c0-1.5.44-2 1.5-2.5S20 8.33 20 7c0-.47-.17-.93-.48-1.29a2.11 2.11 0 0 0-2.62-.44c-.42.24-.74.62-.9 1.07"/>')
});

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