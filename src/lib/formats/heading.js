import { BlockFormat } from '../core/format.js';

/**
 * Heading Format - Handles H1-H6 heading formatting
 */
class Heading extends BlockFormat {
  static formatName = 'heading';
  static tagName = 'H1'; // Default to H1
  static levels = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

  constructor(level = 1) {
    super();
    this.level = Math.max(1, Math.min(6, level)); // Ensure level is between 1-6
    this.tagName = `H${this.level}`;
  }

  /**
   * Create heading element
   * @param {number} level - Heading level (1-6)
   */
  static create(level = 1) {
    const tagName = `H${Math.max(1, Math.min(6, level))}`;
    return document.createElement(tagName);
  }

  /**
   * Apply heading format to current selection or block
   * @param {number} level - Heading level (1-6)
   */
  apply(level = this.level) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    
    // Find the current block element
    let blockElement = this.findBlockElement(range.commonAncestorContainer);
    
    if (!blockElement) {
      // If no block element found, wrap selection in heading
      this.wrapSelectionInHeading(range, level);
    } else {
      // Convert existing block to heading
      this.convertBlockToHeading(blockElement, level);
    }

    console.log(`✅ Applied heading ${level} format`);
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
   * Wrap selection in heading tag
   */
  wrapSelectionInHeading(range, level) {
    const tagName = `H${level}`;
    const heading = document.createElement(tagName);
    
    if (range.collapsed) {
      // No selection - create empty heading at cursor
      heading.textContent = `Heading ${level}`;
      
      range.insertNode(heading);
      
      // Select the text in the heading
      const newRange = document.createRange();
      newRange.selectNodeContents(heading);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      // Has selection - wrap in heading
      try {
        range.surroundContents(heading);
      } catch (e) {
        // If we can't surround contents, extract and wrap
        const contents = range.extractContents();
        heading.appendChild(contents);
        range.insertNode(heading);
      }
    }
  }

  /**
   * Convert existing block to heading
   */
  convertBlockToHeading(blockElement, level) {
    const tagName = `H${level}`;
    const heading = document.createElement(tagName);
    
    // Copy all child nodes
    while (blockElement.firstChild) {
      heading.appendChild(blockElement.firstChild);
    }
    
    // Copy attributes if needed
    if (blockElement.className) {
      heading.className = blockElement.className;
    }
    
    // Replace the block element
    blockElement.parentNode.replaceChild(heading, blockElement);
    
    // Set cursor at end of heading
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(heading);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Check if current selection is in a heading
   * @param {number} level - Optional specific level to check
   */
  isActive(level = null) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    let node = selection.anchorNode;
    while (node && node !== document.body) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName;
        if (level) {
          return tagName === `H${level}`;
        } else {
          return ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tagName);
        }
      }
      node = node.parentNode;
    }
    return false;
  }

  /**
   * Get current heading level if in a heading
   */
  getCurrentLevel() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    let node = selection.anchorNode;
    while (node && node !== document.body) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName;
        const match = tagName.match(/^H([1-6])$/);
        if (match) {
          return parseInt(match[1]);
        }
      }
      node = node.parentNode;
    }
    return null;
  }

  /**
   * Toggle between heading and paragraph
   */
  toggle(level = 1) {
    if (this.isActive(level)) {
      // Convert to paragraph
      const ParagraphClass = window.registry?.get('formats/paragraph');
      if (ParagraphClass) {
        const paragraph = new ParagraphClass();
        paragraph.apply();
      }
    } else {
      this.apply(level);
    }
  }
}

/**
 * Individual heading classes for H1-H6
 */
class H1 extends Heading {
  static formatName = 'h1';
  static tagName = 'H1';
  
  constructor() {
    super(1);
  }
  
  apply() {
    super.apply(1);
  }
  
  toggle() {
    super.toggle(1);
  }
}

class H2 extends Heading {
  static formatName = 'h2';
  static tagName = 'H2';
  
  constructor() {
    super(2);
  }
  
  apply() {
    super.apply(2);
  }
  
  toggle() {
    super.toggle(2);
  }
}

class H3 extends Heading {
  static formatName = 'h3';
  static tagName = 'H3';
  
  constructor() {
    super(3);
  }
  
  apply() {
    super.apply(3);
  }
  
  toggle() {
    super.toggle(3);
  }
}

class H4 extends Heading {
  static formatName = 'h4';
  static tagName = 'H4';
  
  constructor() {
    super(4);
  }
  
  apply() {
    super.apply(4);
  }
  
  toggle() {
    super.toggle(4);
  }
}

class H5 extends Heading {
  static formatName = 'h5';
  static tagName = 'H5';
  
  constructor() {
    super(5);
  }
  
  apply() {
    super.apply(5);
  }
  
  toggle() {
    super.toggle(5);
  }
}

class H6 extends Heading {
  static formatName = 'h6';
  static tagName = 'H6';
  
  constructor() {
    super(6);
  }
  
  apply() {
    super.apply(6);
  }
  
  toggle() {
    super.toggle(6);
  }
}

export { Heading, H1, H2, H3, H4, H5, H6 }; 