import { BlockFormat } from '../core/format.js';
import TextAlignPicker from '../ui/text-align-picker.js';
import IconUtils from '../ui/icons.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import Editor from '../core/editor.js';
import { execFormat } from '../utils/exec-command.js';

/**
 * Text Align Format - Handles text alignment formatting
 * Now supports multiple editor instances with separate popup instances
 */
class TextAlign extends BlockFormat {
  static formatName = 'text-align';
  static tagName = 'P';
  static attribute = 'style';

  constructor() {
    super();
    
    // Get current editor instance
    const currentEditor = Editor.getCurrentInstance();
    if (!currentEditor) {
      console.warn('No editor instance found for TextAlign format');
      return;
    }
    
    this.editorId = currentEditor.instanceId;
    
    // Check if this editor already has a text align picker instance
    let alignPicker = currentEditor.getPopupInstance('text-align');
    
    if (!alignPicker) {
      // Create new text align picker instance for this editor
      alignPicker = new TextAlignPicker({
        onAlignSelect: (alignment) => {
          TextAlign.applyAlignToCurrentSelection(alignment, this.editorId);
        },
        editor: currentEditor,
        editorId: this.editorId
      });
      
      // Store popup instance in editor
      currentEditor.setPopupInstance('text-align', alignPicker);
    }
    
    this.alignPicker = alignPicker;
  }

  /**
   * Create a new TextAlign format instance for a specific editor
   * @param {string} editorId - Editor instance ID
   * @returns {TextAlign} TextAlign format instance
   */
  static createForEditor(editorId) {
    const editor = Editor.getInstanceById(editorId);
    if (!editor) {
      console.warn('No editor instance found for ID:', editorId);
      return null;
    }
    
    // Temporarily set as current instance
    const originalCurrent = Editor.currentInstance;
    Editor.currentInstance = editor;
    
    // Create format instance
    const format = new TextAlign();
    
    // Restore original current instance
    Editor.currentInstance = originalCurrent;
    
    return format;
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
   * @param {string} alignment - Alignment value
   * @param {string} editorId - Editor instance ID
   */
  static applyAlignToCurrentSelection(alignment, editorId = null) {
    // Get the correct editor instance
    let editor = null;
    if (editorId) {
      editor = Editor.getInstanceById(editorId);
    } else {
      editor = Editor.getCurrentInstance();
    }
    
    if (!editor) {
      console.warn('No editor instance found for text alignment application');
      return;
    }
    
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    // Save state before applying format
    saveBeforeFormat();
     // Lưu vị trí caret trước khi thay đổi
  const originalRange = selection.getRangeAt(0);
  const caretContainer = originalRange.endContainer;
  const caretOffset = originalRange.endOffset;
    try {
      const range = selection.getRangeAt(0);
      const blockElements = TextAlign.getSelectedBlockElements(range);
      
      if (blockElements.length === 0) {
        // If no block elements found, create one
        execFormat('formatBlock', 'p');
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
      TextAlign.updateToolbarButtonIcon(alignment, editorId);
       // Khôi phục caret
      selection.removeAllRanges();
      const newCaretRange = document.createRange();
      newCaretRange.setStart(caretContainer, caretOffset);
      newCaretRange.collapse(true);
      selection.addRange(newCaretRange);

    } catch (error) {
      console.error('Error applying text alignment:', error);
    }
    
    // Trigger content change after applying format
    setTimeout(() => {
      if (editor && typeof editor.onContentChange === 'function') {
        editor.onContentChange();
      }
    }, 0);
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
    return iconMap[alignment] || 'align-center';
  }

  /**
   * Update toolbar button icon based on alignment
   * @param {string} alignment - Current alignment
   * @param {string} editorId - Editor instance ID
   */
  static updateToolbarButtonIcon(alignment, editorId = null) {
    // Get the correct editor instance
    let editor = null;
    if (editorId) {
      editor = Editor.getInstanceById(editorId);
    } else {
      editor = Editor.getCurrentInstance();
    }
    
    if (!editor) return;
    
    const toolbar = editor.getModule('toolbar');
    let button = null;
    
    if (toolbar) {
      button = toolbar.getButton('text-align');
    }
    
    // Fallback: find button by class in the current editor's toolbar
    if (!button) {
      const toolbarContainer = toolbar?.getContainer();
      if (toolbarContainer) {
        button = toolbarContainer.querySelector('.rich-editor-toolbar-btn.text-align-btn');
      }
    }
    
    // Final fallback: find any text-align button in the current editor's wrapper
    if (!button) {
      button = editor.wrapper.querySelector('.rich-editor-toolbar-btn.text-align-btn');
    }
    
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
    const svgContent = IconUtils.getIcon(iconName);
    if (svgContent) {
      const iconSpan = button.querySelector('.icon');
      if (iconSpan) {
        iconSpan.innerHTML = svgContent;
      } else {
        button.innerHTML = `<span class="icon">${svgContent}</span>`;
      }
    }
  }

  /**
   * Get all selected block elements
   */
  static getSelectedBlockElements(range) {
  const blocks = [];

  // Xác định block chứa điểm bắt đầu và kết thúc
  const startBlock = TextAlign.getBlockElement(range.startContainer);
  const endBlock = TextAlign.getBlockElement(range.endContainer);

  if (!startBlock || !endBlock) return blocks;

  // Nếu chỉ trong 1 block
  if (startBlock === endBlock) {
    blocks.push(startBlock);
    return blocks;
  }

  // Duyệt từ startBlock tới endBlock
  let currentBlock = startBlock;
  while (currentBlock) {
    // Chỉ thêm block nếu nó giao với range
    const blockRange = document.createRange();
    blockRange.selectNodeContents(currentBlock);

    if (range.compareBoundaryPoints(Range.END_TO_START, blockRange) < 0 &&
        range.compareBoundaryPoints(Range.START_TO_END, blockRange) > 0) {
      blocks.push(currentBlock);
    }

    if (currentBlock === endBlock) break;
    currentBlock = TextAlign.getNextBlockElement(currentBlock);
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
    TextAlign.applyAlignToCurrentSelection(value, this.editorId);
  }

  /**
   * Remove alignment formatting (reset to left)
   */
  remove() {
    TextAlign.applyAlignToCurrentSelection('left', this.editorId);
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
    // Find text-align button in the current editor's toolbar
    const editor = Editor.getInstanceById(this.editorId);
    if (!editor) return;
    
    const toolbar = editor.getModule('toolbar');
    let alignButton = null;
    
    if (toolbar) {
      alignButton = toolbar.getButton('text-align');
    }
    
    // Fallback: find button by class in the current editor's toolbar
    if (!alignButton) {
      const toolbarContainer = toolbar?.getContainer();
      if (toolbarContainer) {
        alignButton = toolbarContainer.querySelector('.rich-editor-toolbar-btn.text-align-btn');
      }
    }
    
    // Final fallback: find any text-align button in the current editor's wrapper
    if (!alignButton) {
      alignButton = editor.wrapper.querySelector('.rich-editor-toolbar-btn.text-align-btn');
    }
    
    if (!alignButton) {
      console.warn('Text-align button not found for editor:', this.editorId);
      return;
    }
    
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
    TextAlign.updateToolbarButtonIcon(currentAlignment, this.editorId);
    
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
    // Lấy tất cả block trong vùng chọn
    const blocks = TextAlign.getSelectedBlockElements(range);

    // Nếu có nhiều block -> lấy block đầu tiên
    const firstBlock = blocks.length > 0 
      ? blocks[0] 
      : TextAlign.getBlockElement(range.commonAncestorContainer);

    if (!firstBlock) return 'left';

    const textAlign = window.getComputedStyle(firstBlock).textAlign;
    return textAlign === 'left' || textAlign === 'start' || !textAlign ? 'left' : textAlign;
  } catch (error) {
    console.error('Error getting current alignment:', error);
    return 'left';
  }
}

}

export default TextAlign; 