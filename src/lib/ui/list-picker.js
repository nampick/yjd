import IconLoader from './icon-loader.js';

/**
 * List Picker Component - Popup for selecting list types
 */
class ListPicker {
  constructor(options = {}) {
    this.options = {
      listTypes: [
        { value: 'bullet', label: 'Bullet List', icon: 'list-bullet' },
        { value: 'ordered', label: 'Numbered List', icon: 'list-ordered' },
        { value: 'checklist', label: 'Checklist', icon: 'list-check' }
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
    
    // Add popup to body
    document.body.appendChild(this.popup);
  }

  /**
   * Create list type buttons
   */
  async createListTypeButtons() {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'list-button-container';
    
    // Preload icons first
    const iconNames = this.options.listTypes.map(list => list.icon);
    try {
      await IconLoader.preloadIcons(iconNames);
    } catch (error) {
      console.warn('Could not preload list icons:', error);
    }
    
    // Create buttons
    for (const listType of this.options.listTypes) {
      const listButton = document.createElement('button');
      listButton.type = 'button';
      listButton.className = 'list-button';
      listButton.dataset.listType = listType.value;
      listButton.title = listType.label;
      
      // Add icon
      try {
        const iconSvg = await IconLoader.getIcon(listType.icon);
        listButton.innerHTML = iconSvg;
      } catch (error) {
        console.warn(`Could not load icon ${listType.icon}:`, error);
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
      document.body.appendChild(this.popup);
    }
    
    // Update current list type state
    this.updateCurrentListType();
    
    // Get dimensions and position
    const anchorRect = anchor.getBoundingClientRect();
    const popupWidth = 180;
    const popupHeight = 60;
    
    let top = anchorRect.bottom + window.scrollY + 5;
    let left = anchorRect.left + window.scrollX;
    
    // Adjust if popup would go off screen
    if (left + popupWidth > window.innerWidth) {
      left = window.innerWidth - popupWidth - 10;
    }
    
    if (top + popupHeight > window.innerHeight + window.scrollY) {
      top = anchorRect.top + window.scrollY - popupHeight - 5;
    }
    
    // Keep popup on screen
    if (left < 0) left = 10;
    if (top < 0) top = 10;
    
    // Set position
    this.popup.style.top = `${top}px`;
    this.popup.style.left = `${left}px`;
    
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
    // Get current list type from selection
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    
    try {
      const range = selection.getRangeAt(0);
      const listElement = this.getParentList(range.commonAncestorContainer);
      
      if (listElement) {
        const listType = this.getListType(listElement);
        this.currentListType = listType;
        
        // Update button states
        this.updateButtonStates(listType);
      } else {
        this.currentListType = null;
        this.updateButtonStates(null);
      }
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
      'checklist': 'list-check'
    };
    
    const titleMap = {
      'bullet': 'Bullet List',
      'ordered': 'Numbered List',
      'checklist': 'Checklist'
    };
    
    const iconName = iconMap[listType] || 'list-bullet';
    
    // Update button title
    button.title = titleMap[listType] || 'List';
    
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
    if (listElement.tagName === 'OL') return 'ordered';
    if (listElement.className === 'checklist') return 'checklist';
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