import { InlineFormat } from '../core/format.js';
import ColorPicker from '../ui/color-picker.js';

/**
 * Color Format - Handles text color formatting
 */
class Color extends InlineFormat {
  static formatName = 'color';
  static tagName = 'SPAN';
  static attribute = 'color';

  constructor() {
    super();
    // Create color picker instance if not exists
    if (!Color.colorPickerInstance) {
      Color.colorPickerInstance = new ColorPicker({
        onColorSelect: (color) => {
          Color.applyColorToCurrentSelection(color);
        }
      });
    }
    this.colorPicker = Color.colorPickerInstance;
  }

  /**
   * Static method to apply color to current selection
   */
  static applyColorToCurrentSelection(color) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || selection.isCollapsed) return;

    try {
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('foreColor', false, color);
    } catch (error) {
      console.error('Error applying color format:', error);
    }
  }

  /**
   * Apply color formatting with specified color value
   * @param {string} value - Color value (hex, rgb, etc.)
   */
  apply(value = '#000000') {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || selection.isCollapsed) return;

    try {
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('foreColor', false, value);
    } catch (error) {
      console.error('Error applying color format:', error);
    }
  }

  /**
   * Remove color formatting
   */
  remove() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || selection.isCollapsed) return;

    try {
      document.execCommand('removeFormat');
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('foreColor', false, '#000000');
    } catch (error) {
      console.error('Error removing formatting:', error);
    }
  }

  /**
   * Toggle color formatting - shows/hides color picker
   */
  toggle() {
    if (this.colorPicker.isVisible) {
      this.colorPicker.hide();
    } else {
      this.showColorPicker();
    }
  }

  /**
   * Show color picker positioned relative to color button on toolbar
   */
  showColorPicker() {
    const colorButton = document.querySelector('.rich-editor-toolbar-btn.color-btn');
    if (!colorButton) return;
    
    this.colorPicker.show(colorButton);
  }

  /**
   * Check if color formatting is active in current selection
   */
  isActive() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return false;
    
    const range = selection.getRangeAt(0);
    
    try {
      const container = range.commonAncestorContainer;
      let currentNode = container;
      
      while (currentNode && currentNode !== document.body) {
        if (currentNode.nodeType === Node.ELEMENT_NODE) {
          const element = currentNode;
          if (element.tagName === 'SPAN' && element.style.color) {
            return true;
          }
        }
        currentNode = currentNode.parentNode;
      }
      
      if (container.nodeType === Node.ELEMENT_NODE) {
        const spans = container.querySelectorAll('span[style*="color"]');
        for (let span of spans) {
          if (range.intersectsNode(span)) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking color format active state:', error);
      return false;
    }
  }
}

export default Color; 