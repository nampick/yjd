import { InlineFormat } from '../core/format.js';

/**
 * Strike Format - Handles strikethrough text formatting
 * Extracted from FormatManager.js logic
 */
class Strike extends InlineFormat {
  static formatName = 'strikeThrough';
  static tagName = 'S';
  static alternativeTagNames = ['STRIKE', 'DEL'];

  static create() {
    return document.createElement(this.tagName);
  }

  static formats() {
    return true;
  }


  /**
   * Check if strikethrough is active
   */
 
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
        (node.tagName === 'S' || node.tagName === 'STRIKE' || node.tagName === 'DEL')
      ) {
        return true;
      }
      node = node.parentNode;
    }

    return false;
  }

  /**
   * Toggle strikethrough formatting
   */
  toggle() {
    if (this.isActive()) {
      this.remove();
    } else {
      this.apply();
    }
  }


 
}

export default Strike; 