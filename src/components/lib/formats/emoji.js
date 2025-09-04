import { InlineFormat } from '../core/format.js';
import EmojiPicker from '../ui/emoji-picker.js';
import Editor from '../core/editor.js';

/**
 * Emoji Format - Handles emoji insertion
 * Now supports multiple editor instances with separate popup instances
 */
class Emoji extends InlineFormat {
  static formatName = 'emoji';
  static tagName = 'SPAN';
  static className = 'emoji';

  constructor() {
    super();
    
    // Get current editor instance
    const currentEditor = Editor.getCurrentInstance();
    if (!currentEditor) {
      console.warn('No editor instance found for Emoji format');
      return;
    }
    
    this.editorId = currentEditor.instanceId;
    
    // Check if this editor already has an emoji picker instance
    let emojiPicker = currentEditor.getPopupInstance('emoji');
    
    if (!emojiPicker) {
      // Create new emoji picker instance for this editor
      emojiPicker = new EmojiPicker({
        onEmojiSelect: (emoji) => {
          Emoji.insertEmojiAtCurrentPosition(emoji, this.editorId);
        },
        editor: currentEditor,
        editorId: this.editorId
      });
      
      // Store popup instance in editor
      currentEditor.setPopupInstance('emoji', emojiPicker);
    }
    
    this.emojiPicker = emojiPicker;
  }

  /**
   * Create a new Emoji format instance for a specific editor
   * @param {string} editorId - Editor instance ID
   * @returns {Emoji} Emoji format instance
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
    const format = new Emoji();
    
    // Restore original current instance
    Editor.currentInstance = originalCurrent;
    
    return format;
  }

  /**
   * Create emoji element
   * @param {string} value - Emoji character
   * @returns {HTMLElement}
   */
  static create(value) {
    const span = document.createElement('SPAN');
    span.className = 'emoji';
    span.textContent = value;
    span.setAttribute('data-emoji', value);
    return span;
  }

  /**
   * Insert emoji at current cursor position
   * @param {string} emoji - Emoji character to insert
   * @param {string} editorId - Editor instance ID
   */
  static insertEmojiAtCurrentPosition(emoji, editorId = null) {
    // Get the correct editor instance
    let editor = null;
    if (editorId) {
      editor = Editor.getInstanceById(editorId);
    } else {
      editor = Editor.getCurrentInstance();
    }
    
    if (!editor) {
      console.warn('No editor instance found for emoji insertion');
      return;
    }
    
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    try {
      const range = selection.getRangeAt(0);
      
      // Check if cursor is inside an existing emoji span
      let currentNode = range.startContainer;
      let emojiParent = null;
      
      // If cursor is in a text node, check its parent
      if (currentNode.nodeType === Node.TEXT_NODE) {
        currentNode = currentNode.parentNode;
      }
      
      // Find if we're inside an emoji span
      while (currentNode && currentNode !== editor.element) {
        if (currentNode.classList && currentNode.classList.contains('emoji')) {
          emojiParent = currentNode;
          break;
        }
        currentNode = currentNode.parentNode;
      }
      
      // If cursor is inside an emoji span, move it outside
      if (emojiParent) {
        // Move cursor after the emoji span
        range.setStartAfter(emojiParent);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      // Create emoji element
      const emojiElement = Emoji.create(emoji);
      
      // Insert emoji at cursor position
      range.deleteContents();
      range.insertNode(emojiElement);
      
      // Create a zero-width space character after the emoji
      const zeroWidthSpace = document.createTextNode('\u200B'); // Zero-width space
      
      // Insert zero-width space after emoji
      range.setStartAfter(emojiElement);
      range.insertNode(zeroWidthSpace);
      
      // Position cursor after the zero-width space
      range.setStartAfter(zeroWidthSpace);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Trigger content change event
      if (editor && typeof editor.onContentChange === 'function') {
        editor.onContentChange();
      }
      
    } catch (error) {
      console.error('Error inserting emoji:', error);
    }
  }

  /**
   * Apply emoji formatting - shows emoji picker
   */
  apply(value) {
    if (value) {
      Emoji.insertEmojiAtCurrentPosition(value, this.editorId);
    } else {
      this.showEmojiPicker();
    }
  }

  /**
   * Remove emoji formatting
   */
  remove() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const emojiElement = this.getEmojiElement(range);
    
    if (emojiElement) {
      // Replace emoji element with its text content
      const textNode = document.createTextNode(emojiElement.textContent);
      emojiElement.parentNode.replaceChild(textNode, emojiElement);
    }
  }

  /**
   * Toggle emoji formatting - shows emoji picker
   */
  toggle() {
    if (this.emojiPicker.isVisible) {
      this.emojiPicker.hide();
    } else {
      this.showEmojiPicker();
    }
  }

  /**
   * Show emoji picker popup
   */
  showEmojiPicker() {
    // Find emoji button in the current editor's toolbar
    const editor = Editor.getInstanceById(this.editorId);
    if (!editor) return;
    
    const toolbar = editor.getModule('toolbar');
    let emojiButton = null;
    
    if (toolbar) {
      emojiButton = toolbar.getButton('emoji');
    }
    
    // Fallback: find button by class in the current editor's toolbar
    if (!emojiButton) {
      const toolbarContainer = toolbar?.getContainer();
      if (toolbarContainer) {
        emojiButton = toolbarContainer.querySelector('.rich-editor-toolbar-btn.emoji-btn');
      }
    }
    
    // Final fallback: find any emoji button in the current editor's wrapper
    if (!emojiButton) {
      emojiButton = editor.wrapper.querySelector('.rich-editor-toolbar-btn.emoji-btn');
    }
    
    if (!emojiButton) {
      console.warn('Emoji button not found for editor:', this.editorId);
      return;
    }
    
    this.emojiPicker.show(emojiButton);
  }

  /**
   * Check if emoji formatting is active
   */
  isActive() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return false;

    const range = selection.getRangeAt(0);
    const emojiElement = this.getEmojiElement(range);
    
    return emojiElement !== null;
  }

  /**
   * Get emoji element from selection
   * @param {Range} range - Selection range
   * @returns {HTMLElement|null}
   */
  getEmojiElement(range) {
    let node = range.commonAncestorContainer;
    
    // If it's a text node, get its parent
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    
    // Check if current node is an emoji
    if (node.classList && node.classList.contains('emoji')) {
      return node;
    }
    
    // Check if selection contains an emoji
    const emojiInSelection = range.cloneContents().querySelector('.emoji');
    if (emojiInSelection) {
      return emojiInSelection;
    }
    
    return null;
  }
}

export default Emoji; 