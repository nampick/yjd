import { InlineFormat } from '../core/format.js';

/**
 * Bold Format - Handles bold text formatting
 */
class Bold extends InlineFormat {
  static formatName = 'bold';
  static tagName = 'B';
  static alternativeTagNames = ['STRONG'];

  static create() {
    return document.createElement(this.tagName);
  }

  static formats() {
    return true;
  }

  /**
   * Kiểm tra selection có đang nằm trong <strong> hay không
   */
  isActive() {
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return false;

    let node = selection.anchorNode;
    while (node && node !== document.body) {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        (node.nodeName === 'STRONG' || node.nodeName === 'B' || node.nodeName === 'H1'||node.nodeName === 'H2'||node.nodeName === 'H3'||node.nodeName === 'H4'||node.nodeName === 'H5'||node.nodeName === 'H6' )
      ) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }

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
