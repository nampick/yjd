import { InlineFormat } from '../core/format.js';

/**
 * Subscript Format - Handles subscript text formatting
 * Creates <sub> elements for subscript text
 */
class Subscript extends InlineFormat {
  static formatName = 'subscript';
  static tagName = 'SUB';

  static create() {
    return document.createElement(this.tagName);
  }

  static formats(domNode) {
    return domNode.tagName === this.tagName;
  }

  /**
   * Apply subscript formatting
   */
  apply() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    
    if (range.collapsed) {
      // No selection - insert subscript placeholder
      const sub = this.constructor.create();
      sub.textContent = 'sub';
      range.insertNode(sub);
      
      // Select the inserted text for editing
      range.selectNodeContents(sub);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // Has selection - wrap in subscript
      const contents = range.extractContents();
      const sub = this.constructor.create();
      sub.appendChild(contents);
      range.insertNode(sub);
      
      // Move cursor after subscript
      range.setStartAfter(sub);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  /**
   * Remove subscript formatting
   */
  remove() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    let element = range.startContainer;
    
    // Find parent subscript element
    while (element && element !== document.body) {
      if (element.tagName === 'SUB') {
        // Replace subscript with its content
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
   * Toggle subscript formatting
   */
  toggle() {
    if (this.isActive()) {
      this.remove();
    } else {
      // Remove superscript if active (they're mutually exclusive)
      this.removeSuperscriptIfActive();
      this.apply();
    }
  }

  /**
   * Remove superscript if it's currently active
   */
  removeSuperscriptIfActive() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    let element = range.startContainer;
    
    // Check if cursor is inside a superscript and remove it
    while (element && element !== document.body) {
      if (element.tagName === 'SUP') {
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
   * Check if subscript is active at current selection
   */
  isActive() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return false;

    const range = selection.getRangeAt(0);
    let element = range.startContainer;
    
    // Check if cursor is inside a subscript
    while (element && element !== document.body) {
      if (element.tagName === 'SUB') {
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
    if (this.domNode && this.domNode.tagName === 'SUB') {
      // Remove empty subscript elements
      if (!this.domNode.textContent.trim()) {
        if (this.domNode.parentNode) {
          this.domNode.parentNode.removeChild(this.domNode);
        }
      }
    }
  }
}

export default Subscript; 