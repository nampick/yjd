import IconUtils from './icons.js';
import { appendPopup, calculatePopupPosition, setPopupPosition } from '../utils/popup-helper.js';

/**
 * List Picker Component - Popup for selecting list types
 */
class ListPicker {
  constructor(options = {}) {
    this.options = {
      listTypes: [
        { value: 'bullet', label: 'Bullet List', icon: 'list-bullet' },
        { value: 'ordered', label: 'Numbered List', icon: 'list-ordered' },
        { value: 'roman', label: 'Roman Numerals List', icon: 'list-roman' },
        { value: 'alpha', label: 'Alphabetical List', icon: 'list-alpha' }
      ],
      onListSelect: null,
      ...options
    };
    
    this.popup = null;
    this.isVisible = false;
    this.currentListType = null;
    this.clickOutsideHandler = null;
    
    this.createListPicker();
  }

  /**
   * Create list picker popup
   */
  createListPicker() {
    // Create popup
    this.popup = document.createElement('div');
    this.popup.className = 'list-picker-popup';
    
    // Create list type buttons
    this.createListTypeButtons();
    
    // Add popup to container
    appendPopup(this.popup);
  }

  /**
   * Create list type buttons
   */
  async createListTypeButtons() {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'list-button-container';
    
    // Icons are now inline, no need to preload
    
    // Create buttons
    for (const listType of this.options.listTypes) {
      const listButton = document.createElement('button');
      listButton.type = 'button';
      listButton.className = 'list-button';
      listButton.dataset.listType = listType.value;
      listButton.title = listType.label;
      
      // Add icon
      const iconSvg = IconUtils.getIcon(listType.icon);
      if (iconSvg) {
        listButton.innerHTML = iconSvg;
      } else {
        listButton.textContent = listType.label.charAt(0);
      }
      
      listButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.selectListType(listType.value);
      });
      
      buttonContainer.appendChild(listButton);
    }
    
    this.popup.appendChild(buttonContainer);
  }

  /**
   * Setup click outside handler
   */
  setupClickOutside() {
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler);
    }
    
    this.clickOutsideHandler = (e) => {
      if (!this.popup.contains(e.target)) {
        this.hide();
      }
    };
    
    // Add slight delay to avoid immediate close
    setTimeout(() => {
      document.addEventListener('click', this.clickOutsideHandler);
    }, 100);
  }

  /**
   * Remove click outside handler
   */
  removeClickOutside() {
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler);
      this.clickOutsideHandler = null;
    }
  }

  /**
   * Show list picker popup
   * @param {HTMLElement} anchor - Element to position popup relative to
   */
  show(anchor) {
    if (!anchor) return;
    
    // Ensure popup is in DOM
    if (!document.body.contains(this.popup)) {
      appendPopup(this.popup);
    }
    
    // Update current list type state
    this.updateCurrentListType();
    
    // Calculate and set popup position
    const position = calculatePopupPosition(anchor, this.popup, {
      offsetY: 5,
      offsetX: 0
    });
    setPopupPosition(this.popup, position);
    
    // Show popup by adding visible class
    this.popup.classList.add('visible');
    this.isVisible = true;
    
    // Setup click outside handler
    this.setupClickOutside();
  }

  /**
   * Hide list picker popup
   */
  hide() {
    this.popup.classList.remove('visible');
    this.isVisible = false;
    this.removeClickOutside();
  }

  /**
   * Select list type and trigger callback
   * @param {string} listType - Selected list type
   */
  selectListType(listType) {
    this.currentListType = listType;
    
    if (this.options.onListSelect) {
      this.options.onListSelect(listType);
    }
    
    this.hide();
  }

  /**
   * Update current list type state based on selection
   */
  updateCurrentListType() {
    try {
      const listType = this.getCurrentListType();
      this.currentListType = listType;
      
      // Update button states
      this.updateButtonStates(listType);
    } catch (error) {
      console.warn('Error updating current list type:', error);
    }
  }

  /**
   * Update button states based on current list type
   * @param {string|null} currentListType - Current active list type
   */
  updateButtonStates(currentListType) {
    const buttons = this.popup.querySelectorAll('.list-button');
    buttons.forEach(button => {
      button.classList.remove('active');
      if (currentListType && button.dataset.listType === currentListType) {
        button.classList.add('active');
      }
    });
  }

  /**
   * Update toolbar button icon based on selection
   * @param {string} listType - Current list type
   */
  updateToolbarButtonIcon(listType) {
    const button = document.querySelector('.rich-editor-toolbar-btn.list-btn');
    if (!button) return;

    const iconMap = {
      'bullet': 'list-bullet',
      'ordered': 'list-ordered',
      'roman': 'list-roman',
      'alpha': 'list-alpha'
    };

    const titleMap = {
      'bullet': 'Bullet List',
      'ordered': 'Numbered List',
      'roman': 'Roman Numerals List',
      'alpha': 'Alphabetical List'
    };
    
    const iconName = iconMap[listType] || 'list-bullet';
    
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
   * Get parent list of an element
   */
  getParentList(element) {
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
   * Get list type from list element
   */
  getListType(listElement) {
    if (listElement.tagName === 'OL') {
      const type = listElement.style.listStyleType;
      if (type === 'upper-roman') return 'roman';
      if (type === 'lower-alpha') return 'alpha';
      return 'ordered';
    }
    return 'bullet';
  }

  /**
   * Get block element containing the given node
   */
  getBlockElement(node) {
    if (!node) return null;
    
    let currentNode = node;
    while (currentNode && currentNode !== document.body) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const tagName = currentNode.tagName;
        if (['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'LI', 'UL', 'OL'].includes(tagName)) {
          return currentNode;
        }
      }
      currentNode = currentNode.parentNode;
    }
    return null;
  }

  /**
   * Get current list type
   * @returns {string|null}
   */
  getCurrentListType() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;

    const range = selection.getRangeAt(0);
    const listElement = this.getParentList(range.commonAncestorContainer);
    
    return listElement ? this.getListType(listElement) : null;
  }

  /**
   * Destroy the list picker
   */
  destroy() {
    this.removeClickOutside();
    
    if (this.popup && this.popup.parentNode) {
      this.popup.parentNode.removeChild(this.popup);
    }
    
    this.popup = null;
    this.isVisible = false;
    this.currentListType = null;
  }
}

export default ListPicker; 