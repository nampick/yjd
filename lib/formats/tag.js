import { InlineFormat } from '../core/format.js';
import TagPopup from '../ui/tag-popup.js';
import Editor from '../core/editor.js';

/**
 * Tag Format - Handles custom tag insertion
 */
class Tag extends InlineFormat {
  static formatName = 'tag';
  static tagName = 'SPAN';
  static className = 'custom-tag';
  static savedRange = null;

  constructor() {
    super();
    // Create tag popup instance if not exists
    if (!Tag.tagPopupInstance) {
      Tag.tagPopupInstance = new TagPopup({
        onTagInsert: (tagType, tagContent) => {
          Tag.insertTagAtCurrentPosition(tagType, tagContent);
        },
        editor: Editor.getCurrentInstance()
      });
    }
    this.tagPopup = Tag.tagPopupInstance;
  }

  /**
   * Create tag element
   * @param {string} tagType - Type of tag (@, #, custom)
   * @param {string} content - Tag content
   * @returns {HTMLElement}
   */
  static create(tagType, content) {
    const span = document.createElement('SPAN');
    span.className = `custom-tag tag-${tagType}`;
    
    let displayText = content;
    if (tagType === 'mention') {
      displayText = `@${content}`;
    } else if (tagType === 'hashtag') {
      displayText = `#${content}`;
    } else if (tagType === 'custom') {
      displayText = `<${content}>`;
    }
    
    span.textContent = displayText;
    span.setAttribute('data-tag-type', tagType);
    span.setAttribute('data-tag-content', content);
    span.setAttribute('contenteditable', 'false');
    
    return span;
  }

  /**
   * Insert tag at current cursor position
   * @param {string} tagType - Type of tag
   * @param {string} content - Tag content
   */
  static insertTagAtCurrentPosition(tagType, content) {
    // Use saved range if available, otherwise get current selection
    const selection = window.getSelection();
    if (!selection) return;

    try {
      // Restore saved range if exists
      if (Tag.savedRange) {
        selection.removeAllRanges();
        selection.addRange(Tag.savedRange);
        Tag.savedRange = null;
      } else if (!selection.rangeCount) {
        return;
      }

      const range = selection.getRangeAt(0);
      
      // Create tag element
      const tagElement = Tag.create(tagType, content);
      
      // Insert tag at cursor position
      range.deleteContents();
      range.insertNode(tagElement);
      
      // Add a space after the tag for easier editing
      const spaceNode = document.createTextNode(' ');
      range.setStartAfter(tagElement);
      range.insertNode(spaceNode);
      
      // Position cursor after the space
      range.setStartAfter(spaceNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Focus back on editor
      const editor = Editor.getCurrentInstance();
      if (editor && editor.element) {
        editor.element.focus();
      }
      
    } catch (error) {
      console.error('Error inserting tag:', error);
    }
  }

  /**
   * Apply tag formatting - shows tag popup
   */
  apply(tagType, content) {
    if (tagType && content) {
      Tag.insertTagAtCurrentPosition(tagType, content);
    } else {
      // Save current selection before showing popup
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        Tag.savedRange = selection.getRangeAt(0).cloneRange();
      }
      this.showTagPopup();
    }
  }

  /**
   * Remove tag formatting
   */
  remove() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const tagElement = this.getTagElement(range);
    
    if (tagElement) {
      // Replace tag element with its text content
      const textNode = document.createTextNode(tagElement.textContent);
      tagElement.parentNode.replaceChild(textNode, tagElement);
    }
  }

  /**
   * Toggle tag formatting - shows tag popup
   */
  toggle() {
    if (this.tagPopup.isVisible) {
      this.tagPopup.hide();
    } else {
      // Save current selection before showing popup
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        Tag.savedRange = selection.getRangeAt(0).cloneRange();
      }
      this.showTagPopup();
    }
  }

  /**
   * Show tag popup
   */
  showTagPopup() {
    const tagButton = document.querySelector('.rich-editor-toolbar-btn.tag-btn');
    if (!tagButton) return;
    
    this.tagPopup.show(tagButton);
  }

  /**
   * Check if tag formatting is active
   */
  isActive() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return false;

    const range = selection.getRangeAt(0);
    return this.getTagElement(range) !== null;
  }

  /**
   * Get tag element from selection
   * @param {Range} range - Selection range
   * @returns {HTMLElement|null}
   */
  getTagElement(range) {
    let node = range.commonAncestorContainer;
    
    // If it's a text node, get its parent
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    
    // Check if current node is a tag
    if (node.classList && node.classList.contains('custom-tag')) {
      return node;
    }
    
    // Check if selection contains a tag
    const tagInSelection = range.cloneContents().querySelector('.custom-tag');
    return tagInSelection || null;
  }

  /**
   * Get predefined tag suggestions
   * @param {string} tagType - Type of tag
   * @returns {Array} - Array of suggestions
   */
  static getSuggestions(tagType) {
    const suggestions = {
      mention: ['john', 'sarah', 'admin', 'team', 'support'],
      hashtag: ['urgent', 'todo', 'done', 'review', 'important'],
      custom: ['note', 'warning', 'tip', 'info', 'success']
    };
    
    return suggestions[tagType] || [];
  }
}

export default Tag; 