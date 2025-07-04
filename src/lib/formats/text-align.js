import { BlockFormat } from '../core/format.js';
import TextAlignPicker from '../ui/text-align-picker.js';
import IconLoader from '../ui/icon-loader.js';

/**
 * Text Align Format - Handles text alignment formatting
 */
class TextAlign extends BlockFormat {
  static formatName = 'text-align';
  static tagName = 'P';
  static attribute = 'style';

  constructor() {
    super();
    // Create text align picker instance if not exists
    if (!TextAlign.alignPickerInstance) {
      TextAlign.alignPickerInstance = new TextAlignPicker({
        onAlignSelect: (alignment) => {
          TextAlign.applyAlignToCurrentSelection(alignment);
        }
      });
    }
    this.alignPicker = TextAlign.alignPickerInstance;
  }

  /**
   * Create block element with text alignment
   * @param {string} value - Alignment value (left, center, right, justify)
   * @returns {HTMLElement}
   */
  static create(value) {
    const node = document.createElement(this.tagName);
    if (value && value !== 'left') {
      node.style.textAlign = value;
    }
    return node;
  }

  /**
   * Static method to apply alignment to current selection or cursor position
   */
  static applyAlignToCurrentSelection(alignment) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    try {
      const range = selection.getRangeAt(0);
      const blockElements = TextAlign.getSelectedBlockElements(range);
      
      if (blockElements.length === 0) {
        // If no block elements found, create one
        document.execCommand('formatBlock', false, 'p');
        const newRange = selection.getRangeAt(0);
        const newBlocks = TextAlign.getSelectedBlockElements(newRange);
        newBlocks.forEach(block => {
          TextAlign.applyAlignmentToBlock(block, alignment);
        });
      } else {
        // Apply alignment to existing blocks
        blockElements.forEach(block => {
          TextAlign.applyAlignmentToBlock(block, alignment);
        });
      }
      
      // Update toolbar button icon after applying alignment
      TextAlign.updateToolbarButtonIcon(alignment);
    } catch (error) {
      console.error('Error applying text alignment:', error);
    }
  }

  /**
   * Apply alignment to a specific block element
   */
  static applyAlignmentToBlock(block, alignment) {
    if (alignment === 'left') {
      block.style.textAlign = '';
    } else {
      block.style.textAlign = alignment;
    }
  }

  /**
   * Get icon name for alignment value
   * @param {string} alignment - Alignment value
   * @returns {string} Icon name
   */
  static getIconNameForAlignment(alignment) {
    const iconMap = {
      'left': 'align-left',
      'center': 'align-center',
      'right': 'align-right',
      'justify': 'align-justify'
    };
    return iconMap[alignment] || 'align-left';
  }

  /**
   * Update toolbar button icon based on alignment
   * @param {string} alignment - Current alignment
   */
  static updateToolbarButtonIcon(alignment) {
    const button = document.querySelector('.rich-editor-toolbar-btn.text-align-btn');
    if (!button) return;

    const iconName = TextAlign.getIconNameForAlignment(alignment);
    const titleMap = {
      'left': 'Align Left',
      'center': 'Align Center', 
      'right': 'Align Right',
      'justify': 'Justify'
    };
    
    // Update button title
    button.title = titleMap[alignment] || 'Text Alignment';
    
    // Update icon
    IconLoader.getIcon(iconName).then(svgContent => {
      const iconSpan = button.querySelector('.icon');
      if (iconSpan) {
        iconSpan.innerHTML = svgContent;
      } else {
        button.innerHTML = `<span class="icon">${svgContent}</span>`;
      }
    }).catch(error => {
      console.warn(`Could not load icon ${iconName}:`, error);
    });
  }

  /**
   * Get all selected block elements
   */
  static getSelectedBlockElements(range) {
    const blocks = [];
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;
    
    // Get start block
    const startBlock = TextAlign.getBlockElement(startContainer);
    if (startBlock) blocks.push(startBlock);
    
    // If selection spans multiple blocks, get all blocks in between
    if (startContainer !== endContainer) {
      let currentNode = startBlock;
      while (currentNode && currentNode !== endContainer) {
        const nextBlock = TextAlign.getNextBlockElement(currentNode);
        if (nextBlock && !blocks.includes(nextBlock)) {
          blocks.push(nextBlock);
          currentNode = nextBlock;
        } else {
          break;
        }
      }
      
      // Get end block
      const endBlock = TextAlign.getBlockElement(endContainer);
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
   * Apply alignment formatting with specified value
   * @param {string} value - Alignment value (left, center, right, justify)
   */
  apply(value = 'left') {
    TextAlign.applyAlignToCurrentSelection(value);
  }

  /**
   * Remove alignment formatting (reset to left)
   */
  remove() {
    TextAlign.applyAlignToCurrentSelection('left');
  }

  /**
   * Toggle alignment formatting - shows/hides alignment picker
   */
  toggle() {
    if (this.alignPicker.isVisible) {
      this.alignPicker.hide();
    } else {
      this.showAlignPicker();
    }
  }

  /**
   * Show alignment picker positioned relative to align button on toolbar
   */
  showAlignPicker() {
    const alignButton = document.querySelector('.rich-editor-toolbar-btn.text-align-btn');
    if (!alignButton) return;
    
    this.alignPicker.show(alignButton);
  }

  /**
   * Check if specific alignment is active in current selection
   * Always returns false because text-align button should not have active state
   * Instead, the button icon changes to reflect current alignment
   */
  isActive(alignment = null) {
    // Update button icon based on current alignment
    const currentAlignment = TextAlign.getCurrentAlignment();
    TextAlign.updateToolbarButtonIcon(currentAlignment);
    
    // Always return false - no active state for this button
    return false;
  }

  /**
   * Get current alignment of selection
   */
  static getCurrentAlignment() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return 'left';
    
    try {
      const range = selection.getRangeAt(0);
      const blockElement = TextAlign.getBlockElement(range.commonAncestorContainer);
      
      if (!blockElement) return 'left';
      
      const textAlign = window.getComputedStyle(blockElement).textAlign;
      return textAlign === 'left' || textAlign === 'start' || !textAlign ? 'left' : textAlign;
    } catch (error) {
      console.error('Error getting current alignment:', error);
      return 'left';
    }
  }

  /**
   * Get current alignment of selection (instance method)
   */
  getCurrentAlignment() {
    return TextAlign.getCurrentAlignment();
  }
}

export default TextAlign; 