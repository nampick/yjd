import { InlineFormat } from '../core/format.js';

/**
 * Underline Format - Handles underline text formatting
 * Extracted from FormatManager.js logic
 */
class Underline extends InlineFormat {
  static formatName = 'underline';
  static tagName = 'U';
  static alternativeTagNames = ['SPAN'];

  static create() {
    return document.createElement(this.tagName);
  }
  
  static formats() {
    return true;
  }

  isActive() {
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return false;

    let node = selection.anchorNode;

    // Nếu là text node, kiểm tra cha nó
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }

    while (node && node !== document.body) {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        (node.tagName === 'U')
      ) {
        return true;
      }
      node = node.parentNode;
    }

    return false;
  }
  /**
   * Toggle underline formatting
   */

  toggle() {
    if (this.isActive()) {
      this.remove();
    } else {
      this.apply();
    }
  }

}

export default Underline; 