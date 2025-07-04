import { InlineFormat } from '../core/format.js';
import EmojiPicker from '../ui/emoji-picker.js';

/**
 * Emoji Format - Handles emoji insertion
 */
class Emoji extends InlineFormat {
  static formatName = 'emoji';
  static tagName = 'SPAN';
  static className = 'emoji';

  constructor() {
    super();
    // Create emoji picker instance if not exists
    if (!Emoji.emojiPickerInstance) {
      Emoji.emojiPickerInstance = new EmojiPicker({
        onEmojiSelect: (emoji) => {
          Emoji.insertEmojiAtCurrentPosition(emoji);
        }
      });
    }
    this.emojiPicker = Emoji.emojiPickerInstance;
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
   */
  static insertEmojiAtCurrentPosition(emoji) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    try {
      const range = selection.getRangeAt(0);
      
      // Create emoji element
      const emojiElement = Emoji.create(emoji);
      
      // Insert emoji at cursor position
      range.deleteContents();
      range.insertNode(emojiElement);
      
      // Position cursor after the emoji
      range.setStartAfter(emojiElement);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
    } catch (error) {
      console.error('Error inserting emoji:', error);
    }
  }

  /**
   * Apply emoji formatting - shows emoji picker
   */
  apply(value) {
    if (value) {
      Emoji.insertEmojiAtCurrentPosition(value);
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
    const emojiButton = document.querySelector('.rich-editor-toolbar-btn.emoji-btn');
    if (!emojiButton) return;
    
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