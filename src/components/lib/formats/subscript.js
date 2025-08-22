import { InlineFormat } from '../core/format.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import Superscript from './superscript.js';
/**
 * Subscript Format - Handles subscript text formatting
 * Creates <sub> elements for subscript text
 */
class Subscript extends InlineFormat {
  static formatName = 'subscript';
  static tagName = 'SUB';

  removeSuperscriptBeforeApply() {
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