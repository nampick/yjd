import { InlineFormat } from '../core/format.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import registry from '../core/registry.js';
import { registerIcons, S } from '../ui/icons.js';

registerIcons({
  subscript: S('<path d="m4 5 8 8"/><path d="m12 5-8 8"/><path d="M20 19h-4c0-1.5.44-2 1.5-2.5S20 15.33 20 14c0-.47-.17-.93-.48-1.29a2.11 2.11 0 0 0-2.62-.44c-.42.24-.74.62-.9 1.07"/>')
});

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