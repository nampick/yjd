import { InlineFormat } from '../core/format.js';
import ColorPicker from '../ui/color-picker.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import Editor from '../core/editor.js';

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
        },
        editor: Editor.getCurrentInstance()
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

    // Save state before applying format
    saveBeforeFormat();
    const backgroundButton = document.querySelector('.rich-editor-toolbar-btn.background-btn');

    try {
      
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('backColor', false, color);
      backgroundButton.classList.add('active');
    } catch (error) {
      console.error('Error applying background color format:', error);
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
    let node = range.startContainer;

    // Nếu là text node thì lấy parent element
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }

    while (node && node !== document.body) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const bg = window.getComputedStyle(node).backgroundColor;
        if ((bg && bg != 'rgba(0, 0, 0, 0)' && bg !== 'transparent')&&(bg && bg!= 'rgb(255, 255, 255)' && bg !== 'transparent')) {
          return true;
        }
      }
      node = node.parentNode;
    }
    
    return false;
  }
}

export default Background; 