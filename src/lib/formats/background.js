import { InlineFormat } from '../core/format.js';
import ColorPicker from '../ui/color-picker.js';

/**
 * Background Color Format - Handles text background color formatting
 */
class Background extends InlineFormat {
  static formatName = 'background';
  static tagName = 'SPAN';
  static attribute = 'background-color';

  constructor() {
    super();
    // Initialize color picker as static instance
    if (!Background.colorPickerInstance) {
      Background.colorPickerInstance = new ColorPicker({
        onColorSelect: (color) => {
          Background.applyBackgroundToCurrentSelection(color);
        }
      });
    }
    this.colorPicker = Background.colorPickerInstance;
  }

  /**
   * Static method to apply background color to current selection
   */
  static applyBackgroundToCurrentSelection(color) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || selection.isCollapsed) return;

    try {
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('backColor', false, color);
    } catch (error) {
      console.error('Error applying background color format:', error);
    }
  }

  /**
   * Apply background color formatting with specified color value
   * @param {string} value - Color value (hex, rgb, etc.)
   */
  apply(value = '#ffff00') {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || selection.isCollapsed) return;

    try {
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('backColor', false, value);
    } catch (error) {
      console.error('Error applying background color format:', error);
    }
  }

  /**
   * Remove background color formatting
   */
  remove() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || selection.isCollapsed) return;

    try {
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('backColor', false, 'transparent');
    } catch (error) {
      console.error('Error removing background color formatting:', error);
    }
  }

  /**
   * Toggle background color formatting - shows/hides color picker
   */
  toggle() {
    if (this.colorPicker.isVisible) {
      this.colorPicker.hide();
    } else {
      this.showColorPicker();
    }
  }

  /**
   * Show color picker positioned relative to background button on toolbar
   */
  showColorPicker() {
    const backgroundButton = document.querySelector('.rich-editor-toolbar-btn.background-btn');
    if (!backgroundButton) return;
    
    this.colorPicker.show(backgroundButton);
  }

  /**
   * Check if background color formatting is active in current selection
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
          if (element.tagName === 'SPAN' && element.style.backgroundColor) {
            return true;
          }
        }
        currentNode = currentNode.parentNode;
      }
      
      if (container.nodeType === Node.ELEMENT_NODE) {
        const spans = container.querySelectorAll('span[style*="background-color"]');
        for (let span of spans) {
          if (range.intersectsNode(span)) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking background color format active state:', error);
      return false;
    }
  }
}

export default Background; 