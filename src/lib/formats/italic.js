import { InlineFormat } from '../core/format.js';

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
    if (this.isActive()) {
      this.remove();
    } else {
      this.apply();
    }
  }
}

export default Italic;
