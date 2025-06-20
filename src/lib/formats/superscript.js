import { InlineFormat } from '../core/format.js';

/**
 * Superscript Format - Handles superscript text formatting
 * Creates <sup> elements for superscript text
 */
class Superscript extends InlineFormat {
  static formatName = 'superscript';
  static tagName = 'SUP';

  static create() {
    return document.createElement(this.tagName);
  }

  static formats(domNode) {
    return domNode.tagName === this.tagName;
  }

  /**
   * Apply superscript formatting
   */
  apply() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    
    if (range.collapsed) {
      // No selection - insert superscript placeholder
      const sup = this.constructor.create();
      sup.textContent = 'sup';
      range.insertNode(sup);
      
      // Select the inserted text for editing
      range.selectNodeContents(sup);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // Has selection - wrap in superscript
      const contents = range.extractContents();
      const sup = this.constructor.create();
      sup.appendChild(contents);
      range.insertNode(sup);
      
      // Move cursor after superscript
      range.setStartAfter(sup);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  /**
   * Remove superscript formatting
   */
  remove() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    let element = range.startContainer;
    
    // Find parent superscript element
    while (element && element !== document.body) {
      if (element.tagName === 'SUP') {
        // Replace superscript with its content
        const parent = element.parentNode;
        while (element.firstChild) {
          parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);
        break;
      }
      element = element.parentNode;
    }
  }

  /**
   * Toggle superscript formatting
   */
  toggle() {
    if (this.isActive()) {
      this.remove();
    } else {
      // Remove subscript if active (they're mutually exclusive)
      this.removeSubscriptIfActive();
      this.apply();
    }
  }

  /**
   * Remove subscript if it's currently active
   */
  removeSubscriptIfActive() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    let element = range.startContainer;
    
    // Check if cursor is inside a subscript and remove it
    while (element && element !== document.body) {
      if (element.tagName === 'SUB') {
        const parent = element.parentNode;
        while (element.firstChild) {
          parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);
        break;
      }
      element = element.parentNode;
    }
  }

  /**
   * Check if superscript is active at current selection
   */
  isActive() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return false;

    const range = selection.getRangeAt(0);
    let element = range.startContainer;
    
    // Check if cursor is inside a superscript
    while (element && element !== document.body) {
      if (element.tagName === 'SUP') {
        return true;
      }
      element = element.parentNode;
    }
    
    return false;
  }

  /**
   * Optimize DOM structure
   */
  optimize(context = {}) {
    if (this.domNode && this.domNode.tagName === 'SUP') {
      // Remove empty superscript elements
      if (!this.domNode.textContent.trim()) {
        if (this.domNode.parentNode) {
          this.domNode.parentNode.removeChild(this.domNode);
        }
      }
    }
  }
}

export default Superscript; 