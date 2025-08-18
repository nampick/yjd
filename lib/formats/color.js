import { InlineFormat } from '../core/format.js';
import ColorPicker from '../ui/color-picker.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import Editor from '../core/editor.js';

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
        },
        editor: Editor.getCurrentInstance()
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

    // Save state before applying format
    saveBeforeFormat();
        const colorbutton = document.querySelector('.rich-editor-toolbar-btn.color-btn');

    try {
      console.log(color);
      
      document.execCommand('styleWithCSS', false, true);
      if(color === 'transparent') {
        document.execCommand('foreColor', false, '#2c3e50');
        colorbutton.classList.remove('active');

      } else {
        document.execCommand('foreColor', false, color);
        colorbutton.classList.add('active');

      }
    } catch (error) {
      console.error('Error applying color format:', error);
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
    if (!colorButton) 
    {
      console.log("return ");
      
      return;
    }
    
    this.colorPicker.show(colorButton);
  }

  /**
   * Check if color formatting is active in current selection
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
        const bg = window.getComputedStyle(node).color;
        if ((bg && bg != 'rgb(44, 62, 80)'&& bg!= 'rgb(0, 0, 0)')) {
   
          console.log("2",(bg && bg != 'rgb(44, 62, 80)'&& bg!= 'rgb(0, 0, 0)'));
          
          return true;
        }
      }
      node = node.parentNode;
    }
    
    return false;
  }
}

export default Color; 