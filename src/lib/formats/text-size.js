import { InlineFormat } from '../core/format.js';
import CustomSelect from '../ui/customselect.js';

/**
 * Text Size Format - Handles font size formatting
 */
class TextSize extends InlineFormat {
  static formatName = 'textSize';
  static tagName = 'SPAN';
  
  constructor() {
    super();
    // Create custom select instance if not exists
    if (!TextSize.selectInstance) {
      const sizeMap = TextSize.getSizeMap();
      const items = Object.values(sizeMap).map(sizeData => ({
        value: sizeData.size,
        label: sizeData.element,
        title: sizeData.title
      }));

      TextSize.selectInstance = new CustomSelect({
        items: items,
        displayProperty: 'label',
        valueProperty: 'value',
        className: 'text-size-select',
        onItemSelect: (value, item) => {
          TextSize.applyTextSizeToCurrentSelection(value);
        }
      });
    }
    this.customSelect = TextSize.selectInstance;
  }

  /**
   * Get size map with different text sizes
   */
  static getSizeMap() {
  return {
    '8px':  { size: '8px',  element: '8px',  title: '8px' },
    '9px':  { size: '9px',  element: '9px',  title: '9px' },
    '10px': { size: '10px', element: '10px', title: '10px' },
    '11px': { size: '11px', element: '11px', title: '11px' },
    '12px': { size: '12px', element: '12px', title: '12px' },
    '14px': { size: '14px', element: '14px', title: '14px' },
    '16px': { size: '16px', element: '16px', title: '16px' },
    '18px': { size: '18px', element: '18px', title: '18px' },
    '20px': { size: '20px', element: '20px', title: '20px' },
    '22px': { size: '22px', element: '22px', title: '22px' },
    '24px': { size: '24px', element: '24px', title: '24px' },
    '26px': { size: '26px', element: '26px', title: '26px' },
    '28px': { size: '28px', element: '28px', title: '28px' },
    '30px': { size: '30px', element: '30px', title: '30px' },
    '32px': { size: '32px', element: '32px', title: '32px' },
    '34px': { size: '34px', element: '34px', title: '34px' },
    '36px': { size: '36px', element: '36px', title: '36px' },
    '48px': { size: '48px', element: '48px', title: '48px' },
    '72px': { size: '72px', element: '72px', title: '72px' }
    };
    }


  /**
   * Get display name for size
   * @param {string} size - Font size value
   * @returns {string} Display name
   */
  static getSizeDisplayName(size) {
    const sizeMap = this.getSizeMap();
    return sizeMap[size]?.title || 'Normal';
  }

  /**
   * Update custom button text based on current size
   */
  updateButtonText() {
    const currentSize = this.getCurrentSize();
    const displayName = TextSize.getSizeDisplayName(currentSize || '14px');
    
    const textSizeButton = document.querySelector('.rich-editor-toolbar-btn.text-size-btn');
    if (textSizeButton && textSizeButton.updateText) {
      textSizeButton.updateText(displayName);
    } else if (textSizeButton) {
      textSizeButton.textContent = displayName;
    }
  }

  /**
   * Create element with specific font size
   * @param {string} size - Font size value (12px, 14px, etc.)
   * @returns {HTMLElement}
   */
  static create(size = '14px') {
    const node = document.createElement('span');
    node.style.fontSize = size;
    return node;
  }

  /**
   * Static method to apply size to current selection
   */
  static applyTextSizeToCurrentSelection(size) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const textSizeFormat = new TextSize();
    textSizeFormat.apply(size);
    
    // Update button text after applying
   
    textSizeFormat.updateButtonText();
 
  }

  /**
   * Apply text size format with specified size
   * @param {string} size - Font size value (12px, 14px, etc.)
   */
  apply(size = '14px') {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    try {
      // Use execCommand to apply font size
      document.execCommand('fontSize', false, '7'); // Use size 7 as placeholder
      
      // Find the font elements created by execCommand and replace with our size
      const fontElements = document.querySelectorAll('font[size="7"]');
      fontElements.forEach(fontEl => {
        const span = document.createElement('span');
        span.style.fontSize = size;
        
        // Move all child nodes from font to span
        while (fontEl.firstChild) {
          span.appendChild(fontEl.firstChild);
        }
        
        // Replace font element with span
        fontEl.parentNode.replaceChild(span, fontEl);
      });
      
    } catch (error) {
      console.warn('Failed to apply text size with execCommand, falling back to manual method:', error);
      
      // Fallback to manual method
      const range = selection.getRangeAt(0);
      
      if (range.collapsed) {
        // No selection - set style for future typing
        this.setCurrentSize(size);
        return;
      }

      // Has selection - wrap in span with font-size
      const sizeSpan = this.constructor.create(size);
      
      try {
        const contents = range.extractContents();
        sizeSpan.appendChild(contents);
        range.insertNode(sizeSpan);
        
        // Select the content in the span
        const newRange = document.createRange();
        newRange.selectNodeContents(sizeSpan);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } catch (fallbackError) {
        console.warn('Failed to apply text size manually:', fallbackError);
      }
    }
  }

  /**
   * Toggle text size format - shows/hides size picker
   */
  async toggle() {
    if (this.customSelect.isVisible) {
      this.customSelect.hide();
    } else {
      await this.showSizePicker();
    }
  }

  /**
   * Show custom select positioned relative to text size button on toolbar
   */
  async showSizePicker() {
    const textSizeButton = document.querySelector('.rich-editor-toolbar-btn.text-size-btn');
    if (!textSizeButton) return;
    
    // Update current selection before showing
    const currentSize = this.getCurrentSize();
    if (currentSize) {
      this.customSelect.setCurrentValue(currentSize);
    }
    
    await this.customSelect.show(textSizeButton);
  }

  /**
   * Check if text size format is active - always return false (no active state)
   * Only update button text to show current size
   * @param {string} size - Optional specific size to check
   * @returns {boolean}
   */
  isActive(size = null) {
    // Always update button text to show current size
    this.updateButtonText();
    
    // Never show active state for text size button
    return false;
  }

  /**
   * Get current size of the selection
   * @returns {string|null} Current font size or null
   */
  getCurrentSize() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;

    const range = selection.getRangeAt(0);
    let currentNode = range.startContainer;
    
    // If text node, get parent element
    if (currentNode.nodeType === Node.TEXT_NODE) {
      currentNode = currentNode.parentElement;
    }
    
    // Find element with font-size style
    while (currentNode && currentNode !== document.body) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const element = currentNode;
        
        // Priority 1: Check if this element has explicit inline font-size
        if (element.style.fontSize) {
          return element.style.fontSize;
        }
        
        // Priority 2: Check computed font-size and compare with our size map
        const computedStyle = window.getComputedStyle(element);
        const fontSize = computedStyle.fontSize;
        
        if (fontSize) {
          // Convert computed size to integer pixels for comparison
          const pixelSize = parseInt(fontSize);
          const pixelSizeStr = pixelSize + 'px';
          
          // Check if this size exists in our size map
          const sizeMap = TextSize.getSizeMap();
          if (sizeMap[pixelSizeStr]) {
            return pixelSizeStr;
          }
          
          // For heading elements, return their computed size
          const tagName = element.tagName;
          if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tagName)) {
            return pixelSizeStr;
          }
        }
      }
      currentNode = currentNode.parentElement;
    }

    // Default fallback - check if 14px is in our map
    const sizeMap = TextSize.getSizeMap();
    return sizeMap['14px'] ? '14px' : null;
  }

  /**
   * Set current size for future typing
   * @param {string} size - Font size value
   */
  setCurrentSize(size) {
    // Store for future typing operations
    this.currentSize = size;
  }
}

export default TextSize; 