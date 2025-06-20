import { BlockFormat } from '../core/format.js';

/**
 * Paragraph Format
 */
class Paragraph extends BlockFormat {
  static tagName = 'P';

  constructor() {
    super();
  }

  /**
   * Apply paragraph format to current selection or block
   */
  apply() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    
    // Find the current block element
    let blockElement = this.findBlockElement(range.commonAncestorContainer);
    
    if (!blockElement) {
      // If no block element found, wrap selection in paragraph
      this.wrapSelectionInParagraph(range);
    } else {
      // Convert existing block to paragraph
      this.convertBlockToParagraph(blockElement);
    }

    console.log('✅ Applied paragraph format');
  }

  /**
   * Find the block element containing the selection
   */
  findBlockElement(node) {
    while (node && node !== document.body) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'blockquote'].includes(tagName)) {
          return node;
        }
      }
      node = node.parentNode;
    }
    return null;
  }

  /**
   * Wrap selection in paragraph tag
   */
  wrapSelectionInParagraph(range) {
    if (range.collapsed) {
      // No selection - create empty paragraph at cursor
      const paragraph = document.createElement('P');
      paragraph.textContent = 'Paragraph';
      
      range.insertNode(paragraph);
      
      // Select the text in the paragraph
      const newRange = document.createRange();
      newRange.selectNodeContents(paragraph);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      // Has selection - wrap in paragraph
      const paragraph = document.createElement('P');
      
      try {
        range.surroundContents(paragraph);
      } catch (e) {
        // If we can't surround contents, extract and wrap
        const contents = range.extractContents();
        paragraph.appendChild(contents);
        range.insertNode(paragraph);
      }
    }
  }

  /**
   * Convert existing block to paragraph
   */
  convertBlockToParagraph(blockElement) {
    const paragraph = document.createElement('P');
    
    // Copy all child nodes
    while (blockElement.firstChild) {
      paragraph.appendChild(blockElement.firstChild);
    }
    
    // Copy attributes if needed
    if (blockElement.className) {
      paragraph.className = blockElement.className;
    }
    
    // Replace the block element
    blockElement.parentNode.replaceChild(paragraph, blockElement);
    
    // Set cursor at end of paragraph
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(paragraph);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Check if current selection is in a paragraph
   */
  isActive() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    let node = selection.anchorNode;
    while (node && node !== document.body) {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'P') {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }
}

/**
 * Preformatted Text Format
 */
class Pre extends BlockFormat {
  static tagName = 'PRE';

  constructor() {
    super();
  }

  /**
   * Apply preformatted format to current selection or block
   */
  apply() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    
    // Find the current block element
    let blockElement = this.findBlockElement(range.commonAncestorContainer);
    
    if (!blockElement) {
      // If no block element found, wrap selection in pre
      this.wrapSelectionInPre(range);
    } else {
      // Convert existing block to pre
      this.convertBlockToPre(blockElement);
    }

    console.log('✅ Applied preformatted text format');
  }

  /**
   * Find the block element containing the selection
   */
  findBlockElement(node) {
    while (node && node !== document.body) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'blockquote'].includes(tagName)) {
          return node;
        }
      }
      node = node.parentNode;
    }
    return null;
  }

  /**
   * Wrap selection in pre tag
   */
  wrapSelectionInPre(range) {
    if (range.collapsed) {
      // No selection - create empty pre at cursor
      const pre = document.createElement('PRE');
      pre.textContent = 'Code block';
      
      range.insertNode(pre);
      
      // Select the text in the pre
      const newRange = document.createRange();
      newRange.selectNodeContents(pre);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      // Has selection - wrap in pre
      const pre = document.createElement('PRE');
      
      try {
        range.surroundContents(pre);
      } catch (e) {
        // If we can't surround contents, extract and wrap
        const contents = range.extractContents();
        pre.appendChild(contents);
        range.insertNode(pre);
      }
    }
  }

  /**
   * Convert existing block to pre
   */
  convertBlockToPre(blockElement) {
    const pre = document.createElement('PRE');
    
    // Copy all child nodes
    while (blockElement.firstChild) {
      pre.appendChild(blockElement.firstChild);
    }
    
    // Copy attributes if needed
    if (blockElement.className) {
      pre.className = blockElement.className;
    }
    
    // Replace the block element
    blockElement.parentNode.replaceChild(pre, blockElement);
    
    // Set cursor at end of pre
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(pre);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Check if current selection is in a pre block
   */
  isActive() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    let node = selection.anchorNode;
    while (node && node !== document.body) {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'PRE') {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }
}

export { Paragraph, Pre };
export default Paragraph; 