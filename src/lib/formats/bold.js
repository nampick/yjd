import { InlineFormat } from '../core/format.js';

/**
 * Bold Format - Handles bold text formatting
 */
class Bold extends InlineFormat {
  static formatName = 'bold';
  static tagName = 'B';
  static alternativeTagNames = ['STRONG'];

  /**
   * Toggle bold formatting
   */
  toggle() {
    if (this.isActive()) {
      this.remove();
    } else {
      this.apply();
    }
  }

}


export default Bold;
