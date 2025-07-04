import { InlineFormat } from '../core/format.js';
import CustomSelect from '../ui/customselect.js';

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

    const range = selection.getRangeAt(0);
    const capFormat = new Capitalization();
    capFormat.apply(style);
    
    // Update button text after applying
    capFormat.updateButtonText();
  }

  /**
   * Apply capitalization format with specified style
   * @param {string} style - Text transform value
   */
  apply(style = 'none') {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    
    if (range.collapsed) {
      // No selection - set style for future typing
      this.setCurrentCapitalization(style);
      return;
    }

    // Remove existing capitalization from selected text
    this.removeExistingCapitalization(range);

    // Apply new capitalization if not 'none'
    if (style !== 'none') {
      const capSpan = this.constructor.create(style);
      
      try {
        const contents = range.extractContents();
        capSpan.appendChild(contents);
        range.insertNode(capSpan);
        
        // Select the content in the span
        const newRange = document.createRange();
        newRange.selectNodeContents(capSpan);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } catch (error) {
        console.warn('Failed to apply capitalization manually:', error);
      }
    }
  }

  /**
   * Remove existing capitalization formatting from range
   * @param {Range} range - Selection range
   */
  removeExistingCapitalization(range) {
    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          if (range.intersectsNode(node)) {
            const style = window.getComputedStyle(node);
            if (node.style.textTransform || node.style.fontVariant === 'small-caps' ||
                style.textTransform !== 'none' || style.fontVariant === 'small-caps') {
              return NodeFilter.FILTER_ACCEPT;
            }
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );

    const elementsToProcess = [];
    let node;
    while (node = walker.nextNode()) {
      elementsToProcess.push(node);
    }

    elementsToProcess.forEach(element => {
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