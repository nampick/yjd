import { InlineFormat } from '../core/format.js';
import { saveBeforeFormat } from '../utils/history-helper.js';

/**
 * Bold Format - Handles bold text formatting
 */
class Bold extends InlineFormat {
  static formatName = 'bold';
  static tagName = 'B';
  static alternativeTagNames = ['STRONG'];

   /**
   * Apply bold formatting using execCommand
   */
  apply() {
    // Save state before applying format
    saveBeforeFormat();

    try {
      document.execCommand('bold', false, null);
    } catch (error) {
      console.error('Error applying bold format:', error);
    }
  }

  /**
   * Remove bold formatting using execCommand
   */
  remove() {
    try {
      document.execCommand('bold', false, null);
    } catch (error) {
      console.error('Error removing bold format:', error);
    }
  }

  /**
   * Toggle bold formatting
   */
  toggle() {
    // Save state before applying format
    saveBeforeFormat();

    try {
      document.execCommand('bold', false, null);
    } catch (error) {
      console.error('Error toggling bold format:', error);
    }
  }

  /**
   * Check if bold formatting is active using execCommand
   */
  isActive() {
    try {
      return document.queryCommandState('bold');
    } catch (error) {
      console.error('Error checking bold state:', error);
      return false;
    }
  }


}


export default Bold;
