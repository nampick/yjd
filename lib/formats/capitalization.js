import { InlineFormat } from '../core/format.js';
import CustomSelect from '../ui/customselect.js';
import { saveBeforeFormat } from '../utils/history-helper.js';

/**
 * Capitalization Format - Handles text capitalization
 */
class Capitalization extends InlineFormat {
  static formatName = 'capitalization';
  static tagName = 'SPAN';
  
  constructor() {
    super();
    // Create custom select instance if not exists
    if (!Capitalization.selectInstance) {
      const capMap = Capitalization.getCapitalizationMap();
      const items = Object.values(capMap).map(capData => ({
        value: capData.style,
        label: capData.element,
        title: capData.title
      }));

      Capitalization.selectInstance = new CustomSelect({
        items: items,
        displayProperty: 'label',
        valueProperty: 'value',
        className: 'capitalization-select',
        onItemSelect: (value, item) => {
          Capitalization.applyCapitalizationToCurrentSelection(value);
        }
      });
    }
    this.customSelect = Capitalization.selectInstance;
  }

  /**
   * Get capitalization map with different text transformations
   */
  static getCapitalizationMap() {
    return {
      'capitalize': { 
        style: 'capitalize', 
        element: '<span>Capitalize</span>', 
        title: 'Capitalize' 
      },
      'uppercase': { 
        style: 'uppercase', 
        element: '<span>UPPERCASE</span>', 
        title: 'UPPERCASE' 
      },
      'lowercase': { 
        style: 'lowercase', 
        element: '<span>lowercase</span>', 
        title: 'lowercase' 
      },
      'small-caps': { 
        style: 'small-caps', 
        element: '<span>Small Caps</span>', 
        title: 'Small Caps' 
      }
    };
  }

  /**
   * Get display name for capitalization
   * @param {string} style - Text transform value
   * @returns {string} Display name
   */
  static getCapitalizationDisplayName(style) {
    const capMap = this.getCapitalizationMap();
    return capMap[style]?.title || 'Capitalization';
  }

  /**
   * Update custom button text based on current capitalization
   */
  updateButtonText() {
    const currentCap = this.getCurrentCapitalization();
    const displayName = Capitalization.getCapitalizationDisplayName(currentCap || 'none');
    
    const capitalizationButton = document.querySelector('.rich-editor-toolbar-btn.capitalization-btn');
    if (capitalizationButton && capitalizationButton.updateText) {
      capitalizationButton.updateText(displayName);
    } else if (capitalizationButton) {
      capitalizationButton.textContent = displayName;
    }
  }

  /**
   * Create element with specific text transformation
   * @param {string} style - Text transform value
   * @returns {HTMLElement}
   */
  static create(style = 'none') {
    const node = document.createElement('span');
    if (style === 'small-caps') {
      node.style.fontVariant = 'small-caps';
    } else {
      node.style.textTransform = style;
    }
    return node;
  }

  /**
   * Static method to apply capitalization to current selection
   */
  static applyCapitalizationToCurrentSelection(style) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    // Save state before applying format
    saveBeforeFormat();

    const range = selection.getRangeAt(0);
    const capFormat = new Capitalization();
    capFormat.apply(style);
    
    // Update button text after applying
    capFormat.updateButtonText();
  }

  /**
   * Check if an element has capitalization-related inline or computed styles
   * @param {Element} element
   * @returns {boolean}
   */
  hasCapitalizationStyling(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
    if (element.style.fontVariant === 'small-caps') return true;
    if (element.style.textTransform && element.style.textTransform !== 'none') return true;
    const computed = window.getComputedStyle(element);
    if (computed.fontVariant === 'small-caps') return true;
    if (computed.textTransform && computed.textTransform !== 'none') return true;
    return false;
  }

  /**
   * Determine whether an element is our capitalization wrapper (inline styles only)
   * @param {Element} element
   * @returns {boolean}
   */
  isCapitalizationElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
    if (element.style.fontVariant === 'small-caps') return true;
    if (element.style.textTransform && element.style.textTransform !== 'none') return true;
    return false;
  }

  /**
   * Find nearest ancestor element that is a capitalization wrapper
   * @param {Node} node
   * @returns {Element|null}
   */
  findAncestorCapitalizationElement(node) {
    let current = node;
    if (!current) return null;
    if (current.nodeType === Node.TEXT_NODE) current = current.parentElement;
    while (current && current !== document.body) {
      if (this.isCapitalizationElement(current)) return current;
      current = current.parentElement;
    }
    return null;
  }

  /**
   * Apply capitalization style directly to an element
   * @param {Element} element
   * @param {string} style
   */
  setElementCapitalizationStyle(element, style) {
    if (!element) return;
    if (style === 'small-caps') {
      element.style.fontVariant = 'small-caps';
      element.style.textTransform = '';
    } else if (style === 'none') {
      element.style.fontVariant = '';
      element.style.textTransform = '';
    } else {
      element.style.fontVariant = '';
      element.style.textTransform = style;
    }
  }

  /**
   * Apply capitalization format with specified style
   * @param {string} style - Text transform value
   */
    apply(style = 'none') {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    // Lưu trạng thái trước khi format
    saveBeforeFormat();

    const range = selection.getRangeAt(0);

    // Hàm đổi chữ theo style
    function transformText(text, style) {
      switch (style) {
        case 'uppercase':
          return text.toUpperCase();
        case 'lowercase':
          return text.toLowerCase();
        case 'capitalize':
          text =text.toLowerCase();
          return text.replace(/\b\w/g, char => char.toUpperCase());
        default:
          return text; // 'none' hoặc không đổi
      }
    }
    function removeEmptyElements(node) {
      if (!node) return;

      // Duyệt cây DOM từ node này xuống
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT, null);
      const toRemove = [];

      while (walker.nextNode()) {
        const el = walker.currentNode;
        // Nếu không có text hoặc chỉ toàn khoảng trắng & không có element con
        if (!el.textContent.trim() && el.childElementCount === 0) {
          toRemove.push(el);
        }
      }

      toRemove.forEach(el => el.remove());
    }

    // if (range.collapsed) {
      
    //   return;
    // }

    // Nếu có selection: đổi text bên trong
    const contents = range.extractContents();
    const walker = document.createTreeWalker(contents, NodeFilter.SHOW_TEXT, null);

    while (walker.nextNode()) {
      const textNode = walker.currentNode;
      textNode.textContent = transformText(textNode.textContent, style);
    }

    range.deleteContents();
    range.insertNode(contents);
    removeEmptyElements(range.commonAncestorContainer);

    // Giữ nguyên selection
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Remove existing capitalization formatting from range
   * @param {Range} range - Selection range
   */
  removeExistingCapitalization(range) {
    const root = range.commonAncestorContainer;
    const elementsToProcess = new Set();

    // Helper to maybe add element
    const maybeAdd = (el) => {
      if (el && el.nodeType === Node.ELEMENT_NODE && this.hasCapitalizationStyling(el) && range.intersectsNode(el)) {
        elementsToProcess.add(el);
      }
    };

    // Include the root if applicable
    if (root && root.nodeType === Node.ELEMENT_NODE) {
      maybeAdd(root);
    }

    // Walk descendants
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => (range.intersectsNode(node) && this.hasCapitalizationStyling(node)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
      }
    );
    let node;
    while ((node = walker.nextNode())) {
      elementsToProcess.add(node);
    }

    // Include ancestors from start and end containers
    const addAncestors = (startNode) => {
      let current = startNode.nodeType === Node.TEXT_NODE ? startNode.parentElement : startNode;
      while (current && current !== document.body) {
        maybeAdd(current);
        current = current.parentElement;
      }
    };
    addAncestors(range.startContainer);
    addAncestors(range.endContainer);

    Array.from(elementsToProcess).forEach(element => {
      // Clear text transform and font variant styles
      element.style.textTransform = '';
      element.style.fontVariant = '';
      
      // If element has no other styles, unwrap it
      if (!element.style.cssText.trim() && !element.className) {
        this.unwrapElement(element);
      }
    });
  }

  /**
   * Unwrap an element, moving its children to its parent
   * @param {Element} element - Element to unwrap
   */
  unwrapElement(element) {
    const parent = element.parentNode;
    if (!parent) return;

    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }
    parent.removeChild(element);
  }

  /**
   * Toggle capitalization format - shows/hides capitalization picker
   */
  async toggle() {
    if (this.customSelect.isVisible) {
      this.customSelect.hide();
    } else {
      await this.showCapitalizationPicker();
    }
  }

  /**
   * Show custom select positioned relative to capitalization button on toolbar
   */
  async showCapitalizationPicker() {
    const capitalizationButton = document.querySelector('.rich-editor-toolbar-btn.capitalization-btn');
    if (!capitalizationButton) return;
    
    // Update current selection before showing
    const currentCap = this.getCurrentCapitalization();
    if (currentCap) {
      this.customSelect.setCurrentValue(currentCap);
    }
    
    await this.customSelect.show(capitalizationButton);
  }

  /**
   * Check if capitalization format is active - always return false (no active state)
   * Only update button text to show current capitalization
   * @param {string} style - Optional specific style to check
   * @returns {boolean}
   */
  isActive(style = null) {
    // Always update button text to show current capitalization
    this.updateButtonText();
    
    // Never show active state for capitalization button
    return false;
  }

  /**
   * Get current capitalization of the selection
   * @returns {string|null} Current text transform or null
   */
  getCurrentCapitalization() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;

    const range = selection.getRangeAt(0);
    let currentNode = range.startContainer;
    
    // If text node, get parent element
    if (currentNode.nodeType === Node.TEXT_NODE) {
      currentNode = currentNode.parentElement;
    }
    
    // Find element with text-transform or font-variant style
    while (currentNode && currentNode !== document.body) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const element = currentNode;
        
        // Priority 1: Check if this element has explicit inline styles
        if (element.style.fontVariant === 'small-caps') {
          return 'small-caps';
        }
        if (element.style.textTransform && element.style.textTransform !== 'none') {
          return element.style.textTransform;
        }
        
        // Priority 2: Check computed styles
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.fontVariant === 'small-caps') {
          return 'small-caps';
        }
        if (computedStyle.textTransform && computedStyle.textTransform !== 'none') {
          return computedStyle.textTransform;
        }
      }
      currentNode = currentNode.parentElement;
    }

    // Default fallback
    return 'none';
  }

  /**
   * Set current capitalization for future typing
   * @param {string} style - Text transform value
   */
  setCurrentCapitalization(style) {
    // Store for future typing operations
    this.currentCapitalization = style;
  }

  /**
   * Quick toggle methods for common capitalizations
   */
  static toggleUppercase() {
    const cap = new Capitalization();
    const current = cap.getCurrentCapitalization();
    const newStyle = current === 'uppercase' ? 'none' : 'uppercase';
    Capitalization.applyCapitalizationToCurrentSelection(newStyle);
  }

  static toggleLowercase() {
    const cap = new Capitalization();
    const current = cap.getCurrentCapitalization();
    const newStyle = current === 'lowercase' ? 'none' : 'lowercase';
    Capitalization.applyCapitalizationToCurrentSelection(newStyle);
  }

  static toggleCapitalize() {
    const cap = new Capitalization();
    const current = cap.getCurrentCapitalization();
    const newStyle = current === 'capitalize' ? 'none' : 'capitalize';
    Capitalization.applyCapitalizationToCurrentSelection(newStyle);
  }

  static toggleSmallCaps() {
    const cap = new Capitalization();
    const current = cap.getCurrentCapitalization();
    const newStyle = current === 'small-caps' ? 'none' : 'small-caps';
    Capitalization.applyCapitalizationToCurrentSelection(newStyle);
  }
}

export default Capitalization; 