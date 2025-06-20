import { BlockFormat } from '../core/format.js';

/**
 * Text Alignment Format
 * Handles text alignment: left, center, right, justify
 */
class Align extends BlockFormat {
  static tagName = 'div';
  static className = 'ql-align';

  /**
   * Apply alignment to selection
   * @param {string} value - Alignment value: 'left', 'center', 'right', 'justify'
   */
  apply(value = 'left') {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const blocks = this.getBlockElements(range);

    blocks.forEach(block => {
      if (block) {
        // Remove existing alignment classes
        block.classList.remove('text-left', 'text-center', 'text-right', 'text-justify');
        
        // Apply new alignment
        if (value && value !== 'left') {
          block.classList.add(`text-${value}`);
        }
        
        // Set text-align style for immediate visual feedback
        block.style.textAlign = value;
      }
    });

    console.log(`✅ Text alignment applied: ${value}`);
  }

  /**
   * Remove alignment from selection
   */
  remove() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const blocks = this.getBlockElements(range);

    blocks.forEach(block => {
      if (block) {
        block.classList.remove('text-left', 'text-center', 'text-right', 'text-justify');
        block.style.textAlign = '';
      }
    });

    console.log('✅ Text alignment removed');
  }

  /**
   * Get current alignment value
   * @returns {string} Current alignment value
   */
  getCurrentAlignment() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return 'left';

    const range = selection.getRangeAt(0);
    const block = this.getBlockElement(range.startContainer);
    
    if (block) {
      // Check class names
      if (block.classList.contains('text-center')) return 'center';
      if (block.classList.contains('text-right')) return 'right';
      if (block.classList.contains('text-justify')) return 'justify';
      
      // Check computed style
      const computedStyle = window.getComputedStyle(block);
      const textAlign = computedStyle.textAlign;
      
      if (textAlign === 'center') return 'center';
      if (textAlign === 'right') return 'right';
      if (textAlign === 'justify') return 'justify';
    }

    return 'left';
  }

  /**
   * Check if alignment is active
   * @param {string} value - Alignment value to check
   * @returns {boolean}
   */
  isActive(value = null) {
    const current = this.getCurrentAlignment();
    return value ? current === value : current !== 'left';
  }

  /**
   * Toggle alignment
   * @param {string} value - Alignment value
   */
  toggle(value = 'left') {
    if (this.isActive(value)) {
      this.remove();
    } else {
      this.apply(value);
    }
  }

  /**
   * Get block elements in range
   * @param {Range} range - Selection range
   * @returns {Element[]} Array of block elements
   */
  getBlockElements(range) {
    const blocks = [];
    const startBlock = this.getBlockElement(range.startContainer);
    const endBlock = this.getBlockElement(range.endContainer);

    if (startBlock === endBlock) {
      if (startBlock) blocks.push(startBlock);
    } else {
      // Handle multiple blocks
      let current = startBlock;
      while (current && current !== endBlock) {
        if (this.isBlockElement(current)) {
          blocks.push(current);
        }
        current = this.getNextBlockElement(current);
      }
      if (endBlock && this.isBlockElement(endBlock)) {
        blocks.push(endBlock);
      }
    }

    return blocks;
  }

  /**
   * Get block element containing node
   * @param {Node} node - DOM node
   * @returns {Element|null} Block element
   */
  getBlockElement(node) {
    while (node && node.nodeType !== Node.ELEMENT_NODE) {
      node = node.parentNode;
    }

    while (node) {
      if (this.isBlockElement(node)) {
        return node;
      }
      node = node.parentNode;
    }

    return null;
  }

  /**
   * Check if element is a block element
   * @param {Element} element - DOM element
   * @returns {boolean}
   */
  isBlockElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
    
    const blockTags = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE'];
    return blockTags.includes(element.tagName.toUpperCase());
  }

  /**
   * Get next block element
   * @param {Element} element - Current element
   * @returns {Element|null} Next block element
   */
  getNextBlockElement(element) {
    let next = element.nextElementSibling;
    while (next) {
      if (this.isBlockElement(next)) {
        return next;
      }
      next = next.nextElementSibling;
    }
    return null;
  }
}

export default Align; 