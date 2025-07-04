import { InlineFormat } from '../core/format.js';
import CustomSelect from '../ui/customselect.js';

/**
 * Font Family Format - Handles font family formatting
 */
class FontFamily extends InlineFormat {
  static formatName = 'fontFamily';
  static tagName = 'SPAN';
  
  constructor() {
    super();
    // Create custom select instance if not exists
    if (!FontFamily.selectInstance) {
      const fontMap = FontFamily.getFontMap();
      const items = Object.values(fontMap).map(fontData => ({
        value: fontData.font,
        label: fontData.element,
        title: fontData.title
      }));

      FontFamily.selectInstance = new CustomSelect({
        items: items,
        displayProperty: 'label',
        valueProperty: 'value',
        className: 'font-family-select',
        onItemSelect: (value, item) => {
          FontFamily.applyFontFamilyToCurrentSelection(value);
        }
      });
    }
    this.customSelect = FontFamily.selectInstance;
  }

  /**
   * Get font map with different font families
   */
  static getFontMap() {
    return {
        'Arial': { 
        font: 'Arial, sans-serif', 
        element: '<span style="font-family: Arial, sans-serif">Arial</span>', 
        title: 'Arial' 
        },
        'Helvetica': { 
        font: 'Helvetica, Arial, sans-serif', 
        element: '<span style="font-family: Helvetica, Arial, sans-serif">Helvetica</span>', 
        title: 'Helvetica' 
        },
        'Times New Roman': { 
        font: '"Times New Roman", Times, serif', 
        element: '<span style="font-family: \'Times New Roman\', Times, serif">Times New Roman</span>', 
        title: 'Times New Roman' 
        },
        'Georgia': { 
        font: 'Georgia, serif', 
        element: '<span style="font-family: Georgia, serif">Georgia</span>', 
        title: 'Georgia' 
        },
        'Verdana': { 
        font: 'Verdana, Geneva, sans-serif', 
        element: '<span style="font-family: Verdana, Geneva, sans-serif">Verdana</span>', 
        title: 'Verdana' 
        },
        'Courier New': { 
        font: '"Courier New", Courier, monospace', 
        element: '<span style="font-family: \'Courier New\', Courier, monospace">Courier New</span>', 
        title: 'Courier New' 
        },
        'Trebuchet MS': { 
        font: '"Trebuchet MS", Helvetica, sans-serif', 
        element: '<span style="font-family: \'Trebuchet MS\', Helvetica, sans-serif">Trebuchet MS</span>', 
        title: 'Trebuchet MS' 
        },
        'Comic Sans MS': { 
        font: '"Comic Sans MS", cursive', 
        element: '<span style="font-family: \'Comic Sans MS\', cursive">Comic Sans MS</span>', 
        title: 'Comic Sans MS' 
        },
        'Impact': { 
        font: 'Impact, Charcoal, sans-serif', 
        element: '<span style="font-family: Impact, Charcoal, sans-serif">Impact</span>', 
        title: 'Impact' 
        },
        'Lucida Console': { 
        font: '"Lucida Console", Monaco, monospace', 
        element: '<span style="font-family: \'Lucida Console\', Monaco, monospace">Lucida Console</span>', 
        title: 'Lucida Console' 
        }
    };
    }


  /**
   * Get display name for font
   * @param {string} font - Font family value
   * @returns {string} Display name
   */
  static getFontDisplayName(font) {
    const fontMap = this.getFontMap();
    // Find by font value
    for (const [key, value] of Object.entries(fontMap)) {
      if (value.font === font || key === font) {
        return value.title;
      }
    }
    return 'Arial';
  }

  /**
   * Update custom button text based on current font
   */
  updateButtonText() {
    const currentFont = this.getCurrentFont();
    const displayName = FontFamily.getFontDisplayName(currentFont || 'Arial, sans-serif');
    
    const fontFamilyButton = document.querySelector('.rich-editor-toolbar-btn.font-family-btn');
    if (fontFamilyButton && fontFamilyButton.updateText) {
      fontFamilyButton.updateText(displayName);
    } else if (fontFamilyButton) {
      fontFamilyButton.textContent = displayName;
    }
  }

  /**
   * Create element with specific font family
   * @param {string} font - Font family value
   * @returns {HTMLElement}
   */
  static create(font = 'Arial, sans-serif') {
    const node = document.createElement('span');
    node.style.fontFamily = font;
    return node;
  }

  /**
   * Static method to apply font family to current selection
   */
  static applyFontFamilyToCurrentSelection(font) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const fontFamilyFormat = new FontFamily();
    fontFamilyFormat.apply(font);
    
    // Update button text after applying
    fontFamilyFormat.updateButtonText();
  }

  /**
   * Apply font family format with specified font
   * @param {string} font - Font family value
   */
  apply(font = 'Arial, sans-serif') {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    try {
      // Use execCommand to apply font family
      document.execCommand('fontName', false, font);
      
    } catch (error) {
      console.warn('Failed to apply font family with execCommand, falling back to manual method:', error);
      
      // Fallback to manual method
      const range = selection.getRangeAt(0);
      
      if (range.collapsed) {
        // No selection - set style for future typing
        this.setCurrentFont(font);
        return;
      }

      // Has selection - wrap in span with font-family
      const fontSpan = this.constructor.create(font);
      
      try {
        const contents = range.extractContents();
        fontSpan.appendChild(contents);
        range.insertNode(fontSpan);
        
        // Select the content in the span
        const newRange = document.createRange();
        newRange.selectNodeContents(fontSpan);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } catch (fallbackError) {
        console.warn('Failed to apply font family manually:', fallbackError);
      }
    }
  }

  /**
   * Toggle font family format - shows/hides font picker
   */
  async toggle() {
    if (this.customSelect.isVisible) {
      this.customSelect.hide();
    } else {
      await this.showFontPicker();
    }
  }

  /**
   * Show custom select positioned relative to font family button on toolbar
   */
  async showFontPicker() {
    const fontFamilyButton = document.querySelector('.rich-editor-toolbar-btn.font-family-btn');
    if (!fontFamilyButton) return;
    
    // Update current selection before showing
    const currentFont = this.getCurrentFont();
    if (currentFont) {
      this.customSelect.setCurrentValue(currentFont);
    }
    
    await this.customSelect.show(fontFamilyButton);
  }

  /**
   * Check if font family format is active - always return false (no active state)
   * Only update button text to show current font
   * @param {string} font - Optional specific font to check
   * @returns {boolean}
   */
  isActive(font = null) {
    // Always update button text to show current font
    this.updateButtonText();
    
    // Never show active state for font family button
    return false;
  }

  /**
   * Get current font family of the selection
   * @returns {string|null} Current font family or null
   */
  getCurrentFont() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;

    const range = selection.getRangeAt(0);
    let currentNode = range.startContainer;
    
    // If text node, get parent element
    if (currentNode.nodeType === Node.TEXT_NODE) {
      currentNode = currentNode.parentElement;
    }
    
    // Find element with font-family style
    while (currentNode && currentNode !== document.body) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const element = currentNode;
        
        // Priority 1: Check if this element has explicit inline font-family
        if (element.style.fontFamily) {
          return element.style.fontFamily;
        }
        
        // Priority 2: Check computed font-family
        const computedStyle = window.getComputedStyle(element);
        const fontFamily = computedStyle.fontFamily;
        if (fontFamily && fontFamily !== 'initial' && fontFamily !== 'inherit') {
          return fontFamily;
        }
      }
      currentNode = currentNode.parentElement;
    }

    // Default fallback
    return 'Arial, sans-serif';
  }

  /**
   * Set current font for future typing
   * @param {string} font - Font family value
   */
  setCurrentFont(font) {
    // Store for future typing operations
    this.currentFont = font;
  }
}

export default FontFamily; 