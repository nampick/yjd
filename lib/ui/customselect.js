import IconUtils from './icons.js';
import { appendPopup, calculatePopupPosition, setPopupPosition } from '../utils/popup-helper.js';
import Editor from '../core/editor.js';

/**
 * Custom Select Component - Reusable dropdown/popup select component
 */
class CustomSelect {
  constructor(options = {}) {
    this.options = {
      items: [], // Array of items to display
      onItemSelect: null, // Callback when item is selected
      displayProperty: 'label', // Property to display as text
      valueProperty: 'value', // Property to use as value
      className: 'custom-select', // CSS class for the popup
      title: '', // Optional header label shown at the top of the popup
      width: 200, // Popup width
      height: 280, // Popup height
      ...options
    };
    
    this.popup = null;
    this.isVisible = false;
    this.currentValue = null;
    this.clickOutsideHandler = null;
    this.initialized = false;
    
    this.createSelect();
  }

  /**
   * Create select popup
   */
  createSelect() {
    // Create popup
    this.popup = document.createElement('div');
    this.popup.className = `${this.options.className}-popup`;

    // Optional header so it's clear what the dropdown controls.
    if (this.options.title) {
      const header = document.createElement('div');
      header.className = 'custom-select-header';
      header.textContent = this.options.title;
      this.popup.appendChild(header);
    }

    // Add popup to container
    appendPopup(this.popup);
    
    // Initialize async
    this.init();
  }

  /**
   * Initialize component with async operations
   */
  async init() {
    // Create item list
    await this.createItemList();
    this.initialized = true;
  }

  /**
   * Create item list
   */
  async createItemList() {
    const list = document.createElement('div');
    list.className = 'item-list';
    
    // Get check icon
    const checkIconSvg = IconUtils.getIcon('check');
    
    this.options.items.forEach(item => {
      const itemButton = document.createElement('button');
      itemButton.type = 'button';
      itemButton.className = 'custom-select-item-button';
      itemButton.dataset.value = this.getItemValue(item);
      
      // Create item content with text and checkmark
      const itemText = document.createElement('div');
      itemText.className = 'item-text';
      itemText.innerHTML = this.getItemDisplay(item);
      
      const checkmark = document.createElement('span');
      checkmark.className = 'item-checkmark';
      checkmark.innerHTML = checkIconSvg || '';
      
      itemButton.appendChild(itemText);
      itemButton.appendChild(checkmark);
      
      itemButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.selectItem(item);
      });
      
      list.appendChild(itemButton);
    });
    
    this.popup.appendChild(list);
  }

  /**
   * Get display text for item
   */
  getItemDisplay(item) {
    return item[this.options.displayProperty] || item.toString();
  }

  /**
   * Get value for item
   */
  getItemValue(item) {
    return item[this.options.valueProperty] || item[this.options.displayProperty] || item;
  }

  /**
   * Update items in the select
   */
  async updateItems(items) {
    this.options.items = items;
    
    // Remove existing list
    const existingList = this.popup.querySelector('.item-list');
    if (existingList) {
      existingList.remove();
    }
    
    // Create new list
    await this.createItemList();
  }

  /**
   * Setup click outside handler
   */
  setupClickOutside() {
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler);
    }
    
    this.clickOutsideHandler = (e) => {
      // Don't hide if clicking on block toolbar or its buttons
      if (e.target.closest('.block-toolbar')) {
        return;
      }
      
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
   * Setup scroll handler to update popup position
   */
  setupScrollHandler() {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
    
    this.scrollHandler = () => {
      if (this.isVisible) {
        this.updatePosition();
      }
    };
    
    window.addEventListener('scroll', this.scrollHandler);
  }
  
  /**
   * Remove scroll handler
   */
  removeScrollHandler() {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
      this.scrollHandler = null;
    }
  }

  /**
   * Show select popup
   */
  async show(anchor) {
    if (!anchor) return;

    // Capture the editor selection NOW so the format applies to the right place
    // even if a tap on the popup clears the live selection (mobile/touch).
    // Prefer the LIVE selection when it's inside the editor — including a
    // collapsed caret (needed for "apply then keep typing"). Only fall back to
    // the last real range when the selection is genuinely gone/outside.
    const sel = window.getSelection();
    const ed = Editor.getCurrentInstance && Editor.getCurrentInstance();
    const editorEl = ed && ed.editor;
    if (sel && sel.rangeCount && editorEl && editorEl.contains(sel.anchorNode)) {
      this._savedRange = sel.getRangeAt(0).cloneRange();
    } else {
      this._savedRange = ed && ed._lastRange ? ed._lastRange.cloneRange() : null;
    }

    // Wait for initialization if not ready
    if (!this.initialized) {
      await new Promise(resolve => {
        const checkInit = () => {
          if (this.initialized) {
            resolve();
          } else {
            setTimeout(checkInit, 10);
          }
        };
        checkInit();
      });
    }
    
    // Ensure popup is in DOM
    if (!document.body.contains(this.popup)) {
      appendPopup(this.popup);
    }
    
    // Update current selection highlight
    this.highlightCurrentItem(this.currentValue);
    
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
    
    // Setup scroll handler to update position
    this.setupScrollHandler();
    
    // Store reference to anchor for potential repositioning
    this.currentAnchor = anchor;
  }

  /**
   * Hide select popup
   */
  hide() {
    this.popup.classList.remove('visible');
    this.isVisible = false;
    this.removeClickOutside();
    this.currentAnchor = null;
  }
  
  /**
   * Update popup position based on current anchor
   */
  updatePosition() {
    if (this.isVisible && this.currentAnchor) {
      // Calculate and set popup position
      const position = calculatePopupPosition(this.currentAnchor, this.popup, {
        offsetY: 5,
        offsetX: 0
      });
      setPopupPosition(this.popup, position);
    }
  }

  /**
   * Set current value
   */
  setCurrentValue(value) {
    this.currentValue = value;
    this.highlightCurrentItem(value);
  }

  /**
   * Highlight current item in the list
   */
  highlightCurrentItem(value) {
    // Remove previous highlights
    this.popup.querySelectorAll('.custom-select-item-button.current').forEach(btn => {
      btn.classList.remove('current');
    });
    
    // Highlight current item - find by comparing dataset.value directly
    if (value != null) {
      const buttons = this.popup.querySelectorAll('.custom-select-item-button');
      for (const button of buttons) {
        if (button.dataset.value === value.toString()) {
          button.classList.add('current');
          break;
        }
      }
    }
  }

  /**
   * Select item and trigger callback
   */
  selectItem(item) {
    const value = this.getItemValue(item);
    this.currentValue = value;

    // Focus the editor FIRST, then restore the selection captured when the popup
    // opened — so the format applies to a focused editor (block converts like
    // heading no-op on a blurred editor) even if the tap cleared the live
    // selection (mobile/touch) or the editor was empty/never-focused.
    const ed = this.options.editor
      || (this.options.editorId && Editor.getInstanceById && Editor.getInstanceById(this.options.editorId))
      || (Editor.getCurrentInstance && Editor.getCurrentInstance());
    if (ed && typeof ed.focus === 'function') ed.focus();
    if (this._savedRange) {
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(this._savedRange);
    } else if (ed && typeof ed.restoreSelectionToEditor === 'function') {
      ed.restoreSelectionToEditor();
    }

    if (this.options.onItemSelect) {
      this.options.onItemSelect(value, item);
    }

    this.hide();
  }

  /**
   * Get current selected value
   */
  getCurrentValue() {
    return this.currentValue;
  }

  /**
   * Destroy select component
   */
  destroy() {
    this.removeClickOutside();
    if (this.popup && this.popup.parentNode) {
      this.popup.parentNode.removeChild(this.popup);
    }
  }
}

export default CustomSelect; 