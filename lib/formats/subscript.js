import { InlineFormat } from '../core/format.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import registry from '../core/registry.js';
import { registerIcons, S } from '../ui/icons.js';

registerIcons({
  subscript: S('<path d="M5 6v-1h11v1"/><path d="M10 5v9"/><path d="M8 14h4"/><path d="M17 19h4"/><path d="M19 17v4"/>')
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