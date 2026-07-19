import { BlockFormat } from '../core/format.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import Editor from '../core/editor.js';
import { registerIcons, S } from '../ui/icons.js';

registerIcons({
  'indent-increase': S('<polyline points="3 8 7 12 3 16"/><line x1="21" x2="11" y1="6" y2="6"/><line x1="21" x2="11" y1="12" y2="12"/><line x1="21" x2="11" y1="18" y2="18"/>'),
  'indent-decrease': S('<polyline points="7 8 3 12 7 16"/><line x1="21" x2="11" y1="6" y2="6"/><line x1="21" x2="11" y1="12" y2="12"/><line x1="21" x2="11" y1="18" y2="18"/>')
});

/**
 * Indent Format - Handles text indentation (increase/decrease)
 */
class Indent extends BlockFormat {
  static formatName = 'indent';
  static tagName = 'DIV';
  static attribute = 'style';

  constructor() {
    super();
  }

  /**
   * Create element with indentation
   * @param {string} value - Indent level (e.g., '20px', '40px')
   * @returns {HTMLElement}
   */
  static create(value) {
    const node = document.createElement('DIV');
    if (value) {
      node.style.paddingLeft = value;
    }
    return node;
  }

  /**
   * Apply indent to current selection
   * @param {string} direction - 'increase' or 'decrease'
   */
  static applyIndentToCurrentSelection(direction) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    // Save state before applying format
    saveBeforeFormat();

    try {
      const range = selection.getRangeAt(0);
      const blockElements = Indent.getSelectedBlockElements(range);
      
      if (blockElements.length === 0) {
        // If no block elements found, create one and apply indent
        const newBlock = document.createElement('DIV');
        newBlock.style.paddingLeft = direction === 'increase' ? '20px' : '0px';
        
        // Get selected text or use default
        const selectedText = range.toString() || '';
        if (selectedText) {
          newBlock.textContent = selectedText;
          range.deleteContents();
          range.insertNode(newBlock);
        } else {
          // Insert at cursor position
          range.insertNode(newBlock);
          newBlock.innerHTML = '<br>'; // Make it editable
        }
        
        // Position cursor in the new block
        const newRange = document.createRange();
        newRange.selectNodeContents(newBlock);
        newRange.collapse(false);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } else {
        // Apply indent to existing blocks
        blockElements.forEach(block => {
          Indent.applyIndentToBlock(block, direction);
        });
      }
    } catch (error) {
      console.error('Error applying indent:', error);
    }
    
    // Trigger content change after applying format
    setTimeout(() => {
      const currentEditor = Editor.getCurrentInstance();
      if (currentEditor && typeof currentEditor.onContentChange === 'function') {
        currentEditor.onContentChange();
      }
    }, 0);
  }

  /**
   * Apply indent to a specific block element
   * @param {HTMLElement} block - Block element to indent
   * @param {string} direction - 'increase' or 'decrease'
   */
  static applyIndentToBlock(block, direction) {
    if (!block || !block.style) return;

    const currentIndent = parseInt(block.style.paddingLeft) || 0;
    let newIndent;

    if (direction === 'increase') {
      newIndent = currentIndent + 20; // Increase by 20px
    } else {
      newIndent = Math.max(0, currentIndent - 20); // Decrease by 20px, minimum 0
    }

    if (newIndent === 0) {
      block.style.paddingLeft = '';
    } else {
      block.style.paddingLeft = newIndent + 'px';
    }
  }

  /**
   * Get all selected block elements
   */
  static getSelectedBlockElements(range) {
    const blocks = [];
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;
    
    // Get start block
    const startBlock = Indent.getBlockElement(startContainer);
    if (startBlock) blocks.push(startBlock);
    
    // If selection spans multiple blocks, get all blocks in between
    if (startContainer !== endContainer) {
      let currentNode = startBlock;
      while (currentNode && currentNode !== endContainer) {
        const nextBlock = Indent.getNextBlockElement(currentNode);
        if (nextBlock && !blocks.includes(nextBlock)) {
          blocks.push(nextBlock);
          currentNode = nextBlock;
        } else {
          break;
        }
      }
      
      // Get end block
      const endBlock = Indent.getBlockElement(endContainer);
      if (endBlock && !blocks.includes(endBlock)) {
        blocks.push(endBlock);
      }
    }
    
    return blocks;
  }

  /**
   * Get the block element containing the given node
   */
  static getBlockElement(node) {
    if (!node) return null;
    
    let currentNode = node;
    while (currentNode && currentNode !== document.body) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const tagName = currentNode.tagName;
        if (['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'LI'].includes(tagName)) {
          return currentNode;
        }
      }
      currentNode = currentNode.parentNode;
    }
    return null;
  }

  /**
   * Get next block element in document order
   */
  static getNextBlockElement(element) {
    let currentNode = element.nextSibling;
    
    while (currentNode) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const tagName = currentNode.tagName;
        if (['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'LI'].includes(tagName)) {
          return currentNode;
        }
      }
      currentNode = currentNode.nextSibling;
    }
    
    return null;
  }

  /**
   * Apply indent formatting
   * @param {string} value - Direction ('increase' or 'decrease')
   */
  apply(value = 'increase') {
    Indent.applyIndentToCurrentSelection(value);
  }

  /**
   * Remove indent formatting (reset to 0)
   */
  remove() {
    Indent.applyIndentToCurrentSelection('remove');
  }

  /**
   * Check if indent formatting is active
   * @returns {boolean}
   */
  isActive() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return false;

    const range = selection.getRangeAt(0);
    const blockElement = Indent.getBlockElement(range.commonAncestorContainer);
    
    if (!blockElement) return false;
    
    const paddingLeft = parseInt(blockElement.style.paddingLeft) || 0;
    return paddingLeft > 0;
  }

  /**
   * Get current indent level
   * @returns {number}
   */
  static getCurrentIndentLevel() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return 0;

    const range = selection.getRangeAt(0);
    const blockElement = Indent.getBlockElement(range.commonAncestorContainer);
    
    if (!blockElement) return 0;
    
    return parseInt(blockElement.style.paddingLeft) || 0;
  }

  /**
   * Get current indent level (instance method)
   * @returns {number}
   */
  getCurrentIndentLevel() {
    return Indent.getCurrentIndentLevel();
  }
}

/**
 * Indent Increase Format - Handles increasing indentation
 */
class IndentIncrease extends Indent {
  static formatName = 'indent-increase';

  /**
   * Apply increase indent formatting
   */
  apply() {
    Indent.applyIndentToCurrentSelection('increase');
  }

  /**
   * Toggle increase indent - always increases
   */
  toggle() {
    this.apply();
  }

  /**
   * Never active - this is an action button
   */
  isActive() {
    return false;
  }
}

/**
 * Indent Decrease Format - Handles decreasing indentation
 */
class IndentDecrease extends Indent {
  static formatName = 'indent-decrease';

  /**
   * Apply decrease indent formatting
   */
  apply() {
    Indent.applyIndentToCurrentSelection('decrease');
  }

  /**
   * Toggle decrease indent - always decreases
   */
  toggle() {
    this.apply();
  }

  /**
   * Never active - this is an action button
   */
  isActive() {
    return false;
  }
}

export { Indent as default, IndentIncrease, IndentDecrease }; 