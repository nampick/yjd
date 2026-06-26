import { InlineFormat } from '../core/format.js';
import ColorPicker from '../ui/color-picker.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import Editor from '../core/editor.js';
import { execFormat, setStyleWithCSS } from '../utils/exec-command.js';

/**
 * Color Format - Handles text color formatting
 */
class Color extends InlineFormat {
  static formatName = 'color';
  static tagName = 'SPAN';
  static attribute = 'color';

  // Selection saved when the picker opens, restored before applying — so the
  // colour still lands on the right text after a tap clears the live selection
  // (mobile/touch) or focus moves to the picker.
  static savedRanges = new Map();

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
      const editorId = this.editorId;
      colorPicker = new ColorPicker({
        onColorSelect: (color) => {
          Color.applyColorToCurrentSelection(color, editorId);
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
  static applyColorToCurrentSelection(color, editorId = null) {
    const selection = window.getSelection();
    // Restore the selection captured when the picker opened (a tap on the
    // picker may have collapsed the live selection, especially on mobile).
    const saved = editorId != null ? Color.savedRanges.get(editorId) : null;
    if (saved) {
      selection.removeAllRanges();
      selection.addRange(saved);
    }
    if (editorId != null) Color.savedRanges.delete(editorId);

    if (!selection || !selection.rangeCount || selection.isCollapsed) return;

    // Save state before applying format
    saveBeforeFormat();

    setStyleWithCSS(true);
    // 'transparent' is the picker's "reset to default" entry — clear the colour
    // back to the editor default rather than painting an explicit colour.
    execFormat('foreColor', color === 'transparent' ? 'inherit' : color);

    // Refresh toolbar state (active highlight + swatch) and notify listeners.
    setTimeout(() => {
      const currentEditor = Editor.getCurrentInstance();
      if (currentEditor) {
        if (typeof currentEditor.updateToolbarButtonStates === 'function') {
          currentEditor.updateToolbarButtonStates();
        }
        if (typeof currentEditor.onContentChange === 'function') {
          currentEditor.onContentChange();
        }
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

    // Capture the current selection so we can apply the colour to it even if a
    // tap on the picker clears the live selection. Fall back to the editor's
    // last non-collapsed range (mobile clears the selection on touchstart).
    const sel = window.getSelection();
    if (sel && sel.rangeCount && !sel.isCollapsed) {
      Color.savedRanges.set(this.editorId, sel.getRangeAt(0).cloneRange());
    } else if (editor._lastRange) {
      Color.savedRanges.set(this.editorId, editor._lastRange.cloneRange());
    }

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
    return !!Color.getCurrentColor();
  }

  /**
   * Return the explicit text colour applied at the current selection, or null
   * when the text uses the editor's default colour. We look for an EXPLICIT
   * inline colour (the `<span style="color:…">` / `<font color>` that the
   * editor inserts) rather than comparing the computed colour to a hardcoded
   * default — the default depends on the active theme, so a hardcoded compare
   * made the button look permanently "active".
   */
  static getCurrentColor() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;

    let node = selection.getRangeAt(0).startContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;

    while (node && node.nodeType === Node.ELEMENT_NODE) {
      if (node.classList && node.classList.contains('rich-editor-area')) break;
      if (node.style && node.style.color && node.style.color !== 'inherit') {
        return node.style.color;
      }
      if (node.tagName === 'FONT' && node.getAttribute('color')) {
        return node.getAttribute('color');
      }
      node = node.parentNode;
    }
    return null;
  }
}

export default Color; 