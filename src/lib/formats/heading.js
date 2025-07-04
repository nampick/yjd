import { BlockFormat } from '../core/format.js';
import CustomSelect from '../ui/customselect.js';

/**
 * Heading Format - Handles heading and paragraph formatting
 */
class Heading extends BlockFormat {
  static formatName = 'heading';
  static tagName = 'H1'; // Default tag, will be overridden
  
  constructor() {
    super();
    // Create custom select instance if not exists
    if (!Heading.selectInstance) {
      const tagMap = Heading.getTagMap();
      const items = Object.values(tagMap).map(tagData => ({
        value: tagData.tag,
        label: tagData.element,
        title: tagData.title
      }));

      Heading.selectInstance = new CustomSelect({
        items: items,
        displayProperty: 'label',
        valueProperty: 'value',
        className: 'heading-select',
        onItemSelect: (value, item) => {
          Heading.applyTagToCurrentSelection(value);
        }
      });
    }
    this.customSelect = Heading.selectInstance;
  }

  /**
   * Get display name for tag
   * @param {string} tag - HTML tag name
   * @returns {string} Display name
   */
  static getTagMap() {
    return {
      'H1': { tag: 'H1', element: '<h1 style="margin:0">Heading 1</h1>', title: 'Heading 1' },
      'H2': { tag: 'H2', element: '<h2 style="margin:0">Heading 2</h2>', title: 'Heading 2' },
      'H3': { tag: 'H3', element: '<h3 style="margin:0">Heading 3</h3>', title: 'Heading 3' },
      'H4': { tag: 'H4', element: '<h4 style="margin:0">Heading 4</h4>', title: 'Heading 4' },
      'H5': { tag: 'H5', element: '<h5 style="margin:0">Heading 5</h5>', title: 'Heading 5' },
      'H6': { tag: 'H6', element: '<h6 style="margin:0">Heading 6</h6>', title: 'Heading 6' },
      'P': { tag: 'P', element: '<p style="margin:0">Paragraph</p>', title: 'Paragraph' },
      'PRE': { tag: 'PRE', element: '<pre style="margin:0">Code</pre>', title: 'Preformatted' },
      'BLOCKQUOTE': { tag: 'BLOCKQUOTE', element: '<blockquote style="margin:0">Quote</blockquote>', title: 'Quote' }
    };
  }

  static getTagDisplayName(tag) {
    const tagMap = this.getTagMap();
    return tagMap[tag]?.title || 'Paragraph';
  }

  /**
   * Update custom button text based on current tag
   */
  updateButtonText() {
    const currentTag = this.getCurrentTag();
    const displayName = Heading.getTagDisplayName(currentTag || 'P');
    
    const headingButton = document.querySelector('.rich-editor-toolbar-btn.heading-btn');
    if (headingButton && headingButton.updateText) {
      headingButton.updateText(displayName);
    } else if (headingButton) {
      headingButton.textContent = displayName;
    }
  }

  /**
   * Create element with specific tag
   * @param {string} tag - HTML tag name (H1, H2, P, etc.)
   * @returns {HTMLElement}
   */
  static create(tag = 'P') {
    const node = document.createElement(tag.toUpperCase());
    return node;
  }

  /**
   * Static method to apply tag to current selection
   */
  static applyTagToCurrentSelection(tag) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const headingFormat = new Heading();
    headingFormat.apply(tag);
    
    // Update button text after applying
    headingFormat.updateButtonText();
  }

  /**
   * Apply heading format with specified tag
   * @param {string} tag - HTML tag name (H1, H2, P, etc.)
   */
  apply(tag = 'P') {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const blocks = this.getBlockElements(range);

    // Save cursor position before making changes
    const startOffset = range.startOffset;
    const endOffset = range.endOffset;
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;

    if (blocks.length === 0) {
      // No block found - create new one
      this.createBlockAtCursor(range, tag);
    } else {
      // Convert existing blocks and restore cursor
      const firstBlock = blocks[0];
      const newBlock = this.convertBlock(firstBlock, tag);
      
      // Handle multiple blocks
      if (blocks.length > 1) {
        for (let i = 1; i < blocks.length; i++) {
          this.convertBlock(blocks[i], tag);
        }
      }

      // Restore cursor position in the new block
      this.restoreCursorInBlock(newBlock, startContainer, startOffset, endContainer, endOffset);
    }
  }

  /**
   * Create new block at cursor position
   * @param {Range} range - Current range
   * @param {string} tag - HTML tag name
   */
  createBlockAtCursor(range, tag) {
    const blockNode = this.constructor.create(tag);
    
    if (range.collapsed) {
      // No selection - create empty block
      blockNode.appendChild(document.createTextNode(''));
      range.insertNode(blockNode);
      
      // Position cursor inside the block
      const newRange = document.createRange();
      newRange.setStart(blockNode, 0);
      newRange.collapse(true);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      // Has selection - wrap in block
      const contents = range.extractContents();
      blockNode.appendChild(contents);
      range.insertNode(blockNode);
      
      // Select the content in the block
      const newRange = document.createRange();
      newRange.selectNodeContents(blockNode);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  }

  /**
   * Convert existing block to new format
   * @param {Element} block - Block element to convert
   * @param {string} tag - HTML tag name
   * @returns {Element} - The new block element
   */
  convertBlock(block, tag) {
    const newBlock = this.constructor.create(tag);
    
    // Copy all child nodes
    while (block.firstChild) {
      newBlock.appendChild(block.firstChild);
    }
    
    // Copy relevant attributes
    if (block.className && this.shouldPreserveClass(block.className)) {
      newBlock.className = block.className;
    }
    
    // Replace the block
    block.parentNode.replaceChild(newBlock, block);
    
    return newBlock;
  }

  /**
   * Restore cursor position in the new block
   * @param {Element} newBlock - The new block element
   * @param {Node} originalStartContainer - Original start container
   * @param {number} startOffset - Original start offset
   * @param {Node} originalEndContainer - Original end container  
   * @param {number} endOffset - Original end offset
   */
  restoreCursorInBlock(newBlock, originalStartContainer, startOffset, originalEndContainer, endOffset) {
    try {
      const selection = window.getSelection();
      const range = document.createRange();

      // Find equivalent position in new block
      let startNode = this.findEquivalentNode(newBlock, originalStartContainer);
      let endNode = this.findEquivalentNode(newBlock, originalEndContainer);

      // If we can't find equivalent nodes, fallback to block positioning
      if (!startNode) {
        startNode = newBlock.firstChild || newBlock;
        startOffset = 0;
      }
      
      if (!endNode) {
        endNode = startNode;
        endOffset = startOffset;
      }

      // Set cursor position
      if (startNode.nodeType === Node.TEXT_NODE) {
        const maxOffset = startNode.textContent.length;
        range.setStart(startNode, Math.min(startOffset, maxOffset));
      } else {
        range.setStart(startNode, Math.min(startOffset, startNode.childNodes.length));
      }

      if (endNode.nodeType === Node.TEXT_NODE) {
        const maxOffset = endNode.textContent.length;
        range.setEnd(endNode, Math.min(endOffset, maxOffset));
      } else {
        range.setEnd(endNode, Math.min(endOffset, endNode.childNodes.length));
      }

      selection.removeAllRanges();
      selection.addRange(range);
    } catch (error) {
      // Fallback: position cursor at start of block
      console.warn('Failed to restore cursor position, falling back to start of block', error);
      this.setCursorAtStartOfBlock(newBlock);
    }
  }

  /**
   * Find equivalent node in new block structure
   * @param {Element} newBlock - The new block element
   * @param {Node} originalNode - The original node to find equivalent for
   * @returns {Node|null} - Equivalent node or null
   */
  findEquivalentNode(newBlock, originalNode) {
    if (!originalNode) return null;

    // If it's a text node, find the text node with same content in the new block
    if (originalNode.nodeType === Node.TEXT_NODE) {
      const walker = document.createTreeWalker(
        newBlock,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while (node = walker.nextNode()) {
        if (node.textContent === originalNode.textContent) {
          return node;
        }
      }
      
      // If exact match not found, return first text node
      walker.currentNode = newBlock;
      return walker.nextNode();
    }

    // For element nodes, try to find by tag name and position
    if (originalNode.nodeType === Node.ELEMENT_NODE) {
      const sameTagElements = newBlock.querySelectorAll(originalNode.tagName);
      if (sameTagElements.length > 0) {
        return sameTagElements[0];
      }
    }

    return null;
  }

  /**
   * Set cursor at start of block (fallback method)
   * @param {Element} block - Block element
   */
  setCursorAtStartOfBlock(block) {
    const selection = window.getSelection();
    const range = document.createRange();
    
    // Find first text node or position at start of block
    const walker = document.createTreeWalker(
      block,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    const firstTextNode = walker.nextNode();
    if (firstTextNode) {
      range.setStart(firstTextNode, 0);
      range.collapse(true);
    } else {
      range.setStart(block, 0);
      range.collapse(true);
    }

    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Toggle heading format - shows/hides tag picker
   */
  async toggle() {
    if (this.customSelect.isVisible) {
      this.customSelect.hide();
    } else {
      await this.showTagPicker();
    }
  }

  /**
   * Show custom select positioned relative to heading button on toolbar
   */
  async showTagPicker() {
    const headingButton = document.querySelector('.rich-editor-toolbar-btn.heading-btn');
    if (!headingButton) return;
    
    // Update current selection before showing
    const currentTag = this.getCurrentTag();
    if (currentTag) {
      this.customSelect.setCurrentValue(currentTag);
    }
    
    await this.customSelect.show(headingButton);
  }

  /**
   * Check if heading format is active - always return false (no active state)
   * Only update button text to show current tag
   * @param {string} tag - Optional specific tag to check
   * @returns {boolean}
   */
  isActive(tag = null) {
    // Always update button text to show current tag
    this.updateButtonText();
    
    // Never show active state for heading button
    return false;
  }

  /**
   * Get current tag of the selection
   * @returns {string|null} Current tag name or null
   */
  getCurrentTag() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;

    const range = selection.getRangeAt(0);
    const block = this.getBlockElement(range.startContainer);
    
    if (!block) return null;

    const headingTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'PRE', 'BLOCKQUOTE'];
    if (headingTags.includes(block.tagName)) {
      return block.tagName;
    }

    return null;
  }
}

export default Heading; 