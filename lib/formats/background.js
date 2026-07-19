import { InlineFormat } from '../core/format.js';
import ColorPicker from '../ui/color-picker.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import Editor from '../core/editor.js';
import { execFormat, setStyleWithCSS } from '../utils/exec-command.js';
import { insertArmedColorSpan } from '../utils/armed-format.js';
import { registerIcons, S } from '../ui/icons.js';

registerIcons({
  background: S('<path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>')
});

/**
 * Background Color Format - Handles text background color formatting
 * Now supports multiple editor instances with separate popup instances
 */
class Background extends InlineFormat {
  static formatName = 'background';
  static tagName = 'SPAN';
  static attribute = 'background-color';

  // Selection saved when the picker opens, restored before applying (see Color).
  static savedRanges = new Map();

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
    // Focus the editor FIRST — execCommand('backColor') only applies on a focused
    // contentEditable, and clicking a swatch left focus on the picker.
    if (editor && editor.editor && document.activeElement !== editor.editor) {
      editor.editor.focus();
    }
    // Restore the selection captured when the picker opened (a tap on the
    // picker may have collapsed the live selection, especially on mobile).
    const saved = editorId != null ? Background.savedRanges.get(editorId) : null;
    if (saved) {
      selection.removeAllRanges();
      selection.addRange(saved);
    } else if (editor && typeof editor.restoreSelectionToEditor === 'function') {
      editor.restoreSelectionToEditor();
    }
    if (editorId != null) Background.savedRanges.delete(editorId);

    // Allow a collapsed caret: backColor on a collapsed selection arms the
    // highlight for the next typed character (empty/just-focused editor).
    if (!selection || !selection.rangeCount) return;

    // Save state before applying format
    saveBeforeFormat();

    const colorVal = color === 'transparent' ? 'inherit' : color;

    if (selection.isCollapsed) {
      // Collapsed caret: arm the highlight as a real DOM placeholder that also
      // carries any bold/italic/underline/strike the user just armed. Using
      // execCommand('backColor') here would wipe those pending formats.
      insertArmedColorSpan(selection, 'backgroundColor', colorVal);
    } else {
      setStyleWithCSS(true);
      execFormat('backColor', colorVal);
    }

    // Remember the armed highlight for a collapsed caret so the toolbar swatch
    // reflects it immediately (before any text is typed).
    if (selection.isCollapsed) {
      const edInst = editorId != null ? Editor.getInstanceById(editorId) : Editor.getCurrentInstance();
      if (edInst) edInst._armedBack = color === 'transparent' ? null : color;
    }

    // Refresh toolbar state (active highlight + swatch) and notify listeners.
    setTimeout(() => {
      if (editor) {
        if (typeof editor.updateToolbarButtonStates === 'function') {
          editor.updateToolbarButtonStates();
        }
        if (typeof editor.onContentChange === 'function') {
          editor.onContentChange();
        }
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

    // Capture the selection so the colour applies even if a tap clears it.
    // Fall back to the editor's last non-collapsed range (mobile touch clears it).
    const sel = window.getSelection();
    if (sel && sel.rangeCount && !sel.isCollapsed) {
      Background.savedRanges.set(this.editorId, sel.getRangeAt(0).cloneRange());
    } else if (editor._lastRange) {
      Background.savedRanges.set(this.editorId, editor._lastRange.cloneRange());
    }

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
    return !!Background.getCurrentColor();
  }

  /**
   * Return the explicit background colour applied at the current selection, or
   * null when none is set. Looks for an explicit inline background (the span
   * the editor inserts) instead of comparing the computed colour to hardcoded
   * white/transparent — which misfired against themed backgrounds.
   */
  static getCurrentColor() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;

    let node = selection.getRangeAt(0).startContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;

    while (node && node.nodeType === Node.ELEMENT_NODE) {
      if (node.classList && node.classList.contains('rich-editor-area')) break;
      if (node.style && node.style.backgroundColor && node.style.backgroundColor !== 'inherit') {
        return node.style.backgroundColor;
      }
      node = node.parentNode;
    }
    return null;
  }
}

export default Background; 