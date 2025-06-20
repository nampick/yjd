import { InlineFormat } from '../core/format.js';

/**
 * Italic Format - Handles italic text formatting
 */
class Italic extends InlineFormat {
  static formatName = 'italic';
  static tagName = 'I';
  static alternativeTagNames = ['EM'];

  static create() {
    return document.createElement(this.tagName);
  }

  static formats() {
    return true;
  }

  /**
   * Kiểm tra xem italic có đang active tại selection không
   */
  isActive() {
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return false;

    let node = selection.anchorNode;
    while (node && node !== document.body) {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        (node.nodeName === 'EM' || node.nodeName === 'I')
      ) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }
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
