import { InlineFormat } from '../core/format.js';
import ColorPicker from '../ui/color-picker.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import Editor from '../core/editor.js';

/**
 * Background Color Format - Handles text background color formatting
 * Now supports multiple editor instances with separate popup instances
 */
class Background extends InlineFormat {
  static formatName = 'background';
  static tagName = 'SPAN';
  static attribute = 'background-color';

  constructor() {
    super();
    
    // Get current editor instance
    const currentEditor = Editor.getCurrentInstance();
    if (!currentEditor) {
      console.warn('No editor instance found for Background format');
      return;
    }
    
    this.editorId = currentEditor.instanceId;
    
    // Check if this editor already has a background color picker instance
    let colorPicker = currentEditor.getPopupInstance('background');
    
    if (!colorPicker) {
      // Create new color picker instance for this editor
      colorPicker = new ColorPicker({
        onColorSelect: (color) => {
          Background.applyBackgroundToCurrentSelection(color, this.editorId);
        },
        editor: currentEditor,
        editorId: this.editorId
      });
      
      // Store popup instance in editor
      currentEditor.setPopupInstance('background', colorPicker);
    }
    
    this.colorPicker = colorPicker;
  }

  /**
   * Create a new Background format instance for a specific editor
   * @param {string} editorId - Editor instance ID
   * @returns {Background} Background format instance
   */
  static createForEditor(editorId) {
    const editor = Editor.getInstanceById(editorId);
    if (!editor) {
      console.warn('No editor instance found for ID:', editorId);
      return null;
    }
    
    // Temporarily set as current instance
    const originalCurrent = Editor.currentInstance;
    Editor.currentInstance = editor;
    
    // Create format instance
    const format = new Background();
    
    // Restore original current instance
    Editor.currentInstance = originalCurrent;
    
    return format;
  }

  /**
   * Static method to apply background color to current selection
   * @param {string} color - Background color value
   * @param {string} editorId - Editor instance ID
   */
  static applyBackgroundToCurrentSelection(color, editorId = null) {
    // Get the correct editor instance
    let editor = null;
    if (editorId) {
      editor = Editor.getInstanceById(editorId);
    } else {
      editor = Editor.getCurrentInstance();
    }
    
    if (!editor) {
      console.warn('No editor instance found for background color application');
      return;
    }
    
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || selection.isCollapsed) return;

    // Save state before applying format
    saveBeforeFormat();
    
    // Find background button in the current editor's toolbar
    const toolbar = editor.getModule('toolbar');
    let backgroundButton = null;
    
    if (toolbar) {
      backgroundButton = toolbar.getButton('background');
    }
    
    // Fallback: find button by class in the current editor's toolbar
    if (!backgroundButton) {
      const toolbarContainer = toolbar?.getContainer();
      if (toolbarContainer) {
        backgroundButton = toolbarContainer.querySelector('.rich-editor-toolbar-btn.background-btn');
      }
    }
    
    // Final fallback: find any background button in the current editor's wrapper
    if (!backgroundButton) {
      backgroundButton = editor.wrapper.querySelector('.rich-editor-toolbar-btn.background-btn');
    }

    try {
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('backColor', false, color);
      if (backgroundButton) {
        backgroundButton.classList.add('active');
      }
    } catch (error) {
      console.error('Error applying background color format:', error);
    }
    
    // Trigger content change after applying format
    setTimeout(() => {
      if (editor && typeof editor.onContentChange === 'function') {
        editor.onContentChange();
      }
    }, 0);
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
    // Find background button in the current editor's toolbar
    const editor = Editor.getInstanceById(this.editorId);
    if (!editor) return;
    
    const toolbar = editor.getModule('toolbar');
    let backgroundButton = null;
    
    if (toolbar) {
      backgroundButton = toolbar.getButton('background');
    }
    
    // Fallback: find button by class in the current editor's toolbar
    if (!backgroundButton) {
      const toolbarContainer = toolbar?.getContainer();
      if (toolbarContainer) {
        backgroundButton = toolbarContainer.querySelector('.rich-editor-toolbar-btn.background-btn');
      }
    }
    
    // Final fallback: find any background button in the current editor's wrapper
    if (!backgroundButton) {
      backgroundButton = editor.wrapper.querySelector('.rich-editor-toolbar-btn.background-btn');
    }
    
    if (!backgroundButton) {
      console.warn('Background button not found for editor:', this.editorId);
      return;
    }
    
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