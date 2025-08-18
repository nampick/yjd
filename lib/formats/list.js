import { BlockFormat } from '../core/format.js';
import ListPicker from '../ui/list-picker.js';
import IconUtils from '../ui/icons.js';
import { saveBeforeFormat } from '../utils/history-helper.js';

/**
 * List Format - Handles list formatting (bullet, ordered, checklist)
 */
class List extends BlockFormat {
  static formatName = 'list';
  static tagName = 'UL';
  static attribute = 'class';

  constructor() {
    super();
    // Create list picker instance if not exists
    if (!List.listPickerInstance) {
      List.listPickerInstance = new ListPicker({
        onListSelect: (listType) => {
          List.applyListToCurrentSelection(listType);
        }
      });
    }
    this.listPicker = List.listPickerInstance;
  }

  /**
   * Create list element with specified type
   * @param {string} value - List type (bullet, ordered, checklist)
   * @returns {HTMLElement}
   */
  static create(value) {
    let node;
    
    switch(value) {
      case 'ordered':
        node = document.createElement('OL');
        break;
      case 'roman':
        node = document.createElement('OL');
        node.style.listStyleType = 'upper-roman'; // I, II, III...
        break;
      case 'alpha':
        node = document.createElement('OL');
        node.style.listStyleType = 'lower-alpha'; // a, b, c...
        break;

      case 'bullet':
      default:
        node = document.createElement('UL');
        break;
    }
    
    return node;
  }

  /**
   * Static method to apply list to current selection or cursor position
   */
  static applyListToCurrentSelection(listType) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    // Save state before applying format
    saveBeforeFormat();

    try {
      const range = selection.getRangeAt(0);
      const blockElements = List.getSelectedBlockElements(range);
      
      if (blockElements.length === 0) {
        // If no block elements found, create one
        List.createListFromSelection(listType);
      } else {
        // Apply list to existing blocks
        List.convertBlocksToList(blockElements, listType);

      }
      
      // Update toolbar button icon after applying list
      List.updateToolbarButtonIcon(listType);

    } catch (error) {
      console.error('Error applying list:', error);
    }
  }

  /**
   * Create list from current selection
   */
  static createListFromSelection(listType) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString() || 'List item';
    
    // Create list element
    const listElement = List.create(listType);
    const listItem = document.createElement('LI');
    
    listItem.textContent = selectedText;
    
    // Try to preserve style from existing block if cursor is inside one
    const existingBlock = List.getBlockElement(range.startContainer);
    if (existingBlock && existingBlock.style && existingBlock.style.cssText) {
      listItem.style.cssText = existingBlock.style.cssText;
    }
    
    listElement.appendChild(listItem);
    
    // Replace selection with list
    range.deleteContents();
    range.insertNode(listElement);
    
    // Position cursor in the list item
    const newRange = document.createRange();
    newRange.selectNodeContents(listItem);
    newRange.collapse(false);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }

  /**
   * Convert existing block elements to list
   */
  static convertBlocksToList(blocks, listType) {
    if (blocks.length === 0) return;

    // Check if blocks are already in a list
    const existingList = List.getParentList(blocks[0]);
    if (existingList) {
      // If already in a list, toggle or change list type
      List.toggleOrChangeListType(existingList, listType);
      return;
    }

    // Create new list
    const listElement = List.create(listType);
    const firstBlock = blocks[0];
    
    // Insert list before first block
    firstBlock.parentNode.insertBefore(listElement, firstBlock);
    
    let firstListItem = null;
    
    // Convert each block to list item
    blocks.forEach((block, index) => {
      const listItem = document.createElement('LI');
      
      listItem.textContent = block.textContent || '';
      
      // Copy style attributes to preserve formatting like text-align
      if (block.style && block.style.cssText) {
        listItem.style.cssText = block.style.cssText;
      }
      
      listElement.appendChild(listItem);
      block.remove();
      
      // Lưu lại list item đầu tiên để đặt con trỏ
      if (index === 0) {
        firstListItem = listItem;
      }
    });
    
    // Đặt con trỏ vào list item đầu tiên
    if (firstListItem) {
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(firstListItem);
      range.collapse(false); // false = cuối nội dung để dễ tiếp tục gõ
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  /**
   * Toggle or change list type
   */
  static toggleOrChangeListType(existingList, newListType) {
    const currentType = List.getListType(existingList);
    
    if (currentType === newListType) {
      // Same type - remove list formatting
      List.removeListFormatting(existingList);
    } else {
      // Different type - change list type
      List.changeListType(existingList, newListType);
    }
  }

  /**
   * Get list type from list element
   */
  static getListType(listElement) {
    if (listElement.tagName === 'OL') {
      const type = listElement.style.listStyleType;
      if (type === 'upper-roman') return 'roman';
      if (type === 'lower-alpha') return 'alpha';
      return 'ordered';
    }
    return 'bullet';
  }

  /**
   * Change list type
   */
  static changeListType(existingList, newListType) {
    const newList = List.create(newListType);
    
    // Copy all list items
    Array.from(existingList.children).forEach(item => {
      const newItem = document.createElement('LI');
      
      const text = item.textContent || '';
      newItem.textContent = text;
      
      // Copy style attributes to preserve formatting like text-align
      if (item.style && item.style.cssText) {
        newItem.style.cssText = item.style.cssText;
      }
      
      newList.appendChild(newItem);
    });
    
    // Replace existing list
    existingList.parentNode.replaceChild(newList, existingList);
    
    // Đặt con trỏ vào list item đầu tiên
    if (newList.firstElementChild) {
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(newList.firstElementChild);
      range.collapse(false); // false = cuối nội dung để dễ tiếp tục gõ
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  /**
   * Remove list formatting
   */
  static removeListFormatting(listElement) {
    const parent = listElement.parentNode;
    let firstParagraph = null;
    
    // Convert list items back to paragraphs
    Array.from(listElement.children).forEach((item, index) => {
      const p = document.createElement('P');
      p.textContent = item.textContent || '';
      
      // Copy style attributes to preserve formatting like text-align
      if (item.style && item.style.cssText) {
        p.style.cssText = item.style.cssText;
      }
      
      parent.insertBefore(p, listElement);
      
      // Lưu lại paragraph đầu tiên để đặt con trỏ
      if (index === 0) {
        firstParagraph = p;
      }
    });
    
    // Remove the list element
    listElement.remove();
    
    // Đặt con trỏ vào paragraph đầu tiên
    if (firstParagraph) {
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(firstParagraph);
      range.collapse(false); // false = cuối nội dung để dễ tiếp tục gõ
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  /**
   * Get parent list of an element
   */
  static getParentList(element) {
    let current = element;
    while (current && current !== document.body) {
      if (current.tagName === 'UL' || current.tagName === 'OL') {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  /**
   * Get icon name for list type
   * @param {string} listType - List type
   * @returns {string} Icon name
   */
  static getIconNameForListType(listType) {
    const iconMap = {
      'bullet': 'list-bullet',
      'ordered': 'list-ordered',
      'roman': 'list-roman',
      'alpha': 'list-alpha'
    };
    return iconMap[listType] || 'list-bullet';
  }

  /**
   * Update toolbar button icon based on list type
   * @param {string} listType - Current list type
   */
  static updateToolbarButtonIcon(listType) {
    const button = document.querySelector('.rich-editor-toolbar-btn.list-btn');
    if (!button) return;

    const iconName = List.getIconNameForListType(listType);
    const titleMap = {
      'bullet': 'Bullet List',
      'ordered': 'Numbered List',
      'roman': 'Roman Numerals List',
      'alpha': 'Alphabetical List'
    };
    
    // Update button title
    button.title = titleMap[listType] || 'List';
    
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
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;
    
    // Get start block
    const startBlock = List.getBlockElement(startContainer);
    if (startBlock) blocks.push(startBlock);
    
    // If selection spans multiple blocks, get all blocks in between
    if (startContainer !== endContainer) {
      let currentNode = startBlock;
      while (currentNode && currentNode !== endContainer) {
        const nextBlock = List.getNextBlockElement(currentNode);
        if (nextBlock && !blocks.includes(nextBlock)) {
          blocks.push(nextBlock);
          currentNode = nextBlock;
        } else {
          break;
        }
      }
      
      // Get end block
      const endBlock = List.getBlockElement(endContainer);
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
   * Apply list formatting
   * @param {string} value - List type
   */
  apply(value = 'bullet') {
    List.applyListToCurrentSelection(value);
  }

  /**
   * Remove list formatting
   */
  remove() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const listElement = List.getParentList(range.commonAncestorContainer);
    
    if (listElement) {
      List.removeListFormatting(listElement);
    }
  }

  /**
   * Toggle list formatting - shows/hides list picker
   */
  toggle() {
    if (this.listPicker.isVisible) {
      this.listPicker.hide();
    } else {
      this.showListPicker();
    }
  }

  /**
   * Show list picker popup positioned relative to list button on toolbar
   */
  showListPicker() {
    const listButton = document.querySelector('.rich-editor-toolbar-btn.list-btn');
    if (!listButton) return;
    
    this.listPicker.show(listButton);
  }

  /**
   * Check if list formatting is active
   * Always returns false because list button should not have active state
   * Instead, the button icon changes to reflect current list type
   */
  isActive(listType = null) {
    // Update button icon based on current list type
    const currentListType = List.getCurrentListType();
    if (currentListType) {
      List.updateToolbarButtonIcon(currentListType);
    } else {
      // Reset to default bullet list icon
      List.updateToolbarButtonIcon('bullet');
    }
    
    // Always return false - no active state for this button
    return false;
  }

  /**
   * Get current list type
   * @returns {string|null}
   */
  static getCurrentListType() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;

    const range = selection.getRangeAt(0);
    const listElement = List.getParentList(range.commonAncestorContainer);
    
    return listElement ? List.getListType(listElement) : null;
  }

  /**
   * Get current list type (instance method)
   * @returns {string|null}
   */
  getCurrentListType() {
    return List.getCurrentListType();
  }
}

export default List; 