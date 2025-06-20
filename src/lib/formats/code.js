import { InlineFormat } from '../core/format.js';

/**
 * Code Format - Inline code styling
 */
class Code extends InlineFormat {
  static tagName = 'CODE';
  static className = 'code';

  constructor() {
    super();
  }

  /**
   * Apply code formatting
   */
  apply() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    // Check if already has code formatting
    if (this.isActive()) {
      this.remove();
      return;
    }

    // Create code element
    const codeElement = document.createElement('code');
    codeElement.className = 'inline-code';
    
    try {
      range.surroundContents(codeElement);
    } catch (e) {
      // If we can't surround contents, extract and wrap
      const contents = range.extractContents();
      codeElement.appendChild(contents);
      range.insertNode(codeElement);
    }
    
    // Clear selection
    selection.removeAllRanges();
    console.log('✅ Code format applied');
  }

  /**
   * Remove code formatting
   */
  remove() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    let node = selection.anchorNode;
    while (node && node.nodeType !== Node.ELEMENT_NODE) {
      node = node.parentNode;
    }

    // Find code element
    const codeElement = node.closest('code');
    if (codeElement) {
      // Replace code element with its contents
      const parent = codeElement.parentNode;
      while (codeElement.firstChild) {
        parent.insertBefore(codeElement.firstChild, codeElement);
      }
      parent.removeChild(codeElement);
      console.log('✅ Code format removed');
    }
  }

  /**
   * Toggle code formatting
   */
  toggle() {
    if (this.isActive()) {
      this.remove();
    } else {
      this.apply();
    }
  }

  /**
   * Check if code format is active
   */
  isActive() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return false;

    let node = selection.anchorNode;
    while (node && node !== document.body) {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'CODE') {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }
}

export default Code; 