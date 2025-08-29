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
    
    // Get current editor instance
    const currentEditor = Editor.getCurrentInstance();
    if (!currentEditor) {
      console.warn('No editor instance found for Color format');
      return;
    }
    
    this.editorId = currentEditor.instanceId;
    
    // Check if this editor already has a color picker instance
    let colorPicker = currentEditor.getPopupInstance('color');
    
    if (!colorPicker) {
      // Create new color picker instance for this editor
      colorPicker = new ColorPicker({
        onColorSelect: (color) => {
          Color.applyColorToCurrentSelection(color);
        },
        editor: Editor.getCurrentInstance()
      });
      
      // Store popup instance in editor
      currentEditor.setPopupInstance('color', colorPicker);
    }
    
    this.colorPicker = colorPicker;
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
    
    // Trigger content change after applying format
    setTimeout(() => {
      const currentEditor = Editor.getCurrentInstance();
      if (currentEditor && typeof currentEditor.onContentChange === 'function') {
        currentEditor.onContentChange();
      }
    }, 0);
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
    // Find color button in the current editor's toolbar
    const editor = Editor.getInstanceById(this.editorId);
    if (!editor) return;
    
    const toolbar = editor.getModule('toolbar');
    let colorButton = null;
    
    if (toolbar) {
      colorButton = toolbar.getButton('color');
    }
    
    // Fallback: find button by class in the current editor's toolbar
    if (!colorButton) {
      const toolbarContainer = toolbar?.getContainer();
      if (toolbarContainer) {
        colorButton = toolbarContainer.querySelector('.rich-editor-toolbar-btn.color-btn');
      }
    }
    
    // Final fallback: find any color button in the current editor's wrapper
    if (!colorButton) {
      colorButton = editor.wrapper.querySelector('.rich-editor-toolbar-btn.color-btn');
    }
    
    if (!colorButton) {
      console.warn('Color button not found for editor:', this.editorId);
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
        const color = window.getComputedStyle(node).color;

        // Nếu gặp đúng màu mặc định -> dừng lại, coi như chưa đổi màu
        if (color === 'rgb(44, 62, 80)') {
          return false;
        }

        // Nếu gặp màu khác mặc định (và không phải transparent)
        if (color && color !== 'rgba(0, 0, 0, 0)') {
          return true;
        }
      }

      node = node.parentNode;
    }
    
    return false;
  }
}

export default Color; 