import { InlineFormat } from '../core/format.js';
import TagPopup from '../ui/tag-popup.js';
import Editor from '../core/editor.js';
import { registerIcons, S } from '../ui/icons.js';

registerIcons({
  tag: S('<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none"/>')
});

/**
 * Tag Format - Handles custom tag insertion
 * Now supports multiple editor instances with separate popup instances
 */
class Tag extends InlineFormat {
  static formatName = 'tag';
  static tagName = 'SPAN';
  static className = 'custom-tag';
  static savedRanges = new Map(); // Map to store saved ranges for each editor

  constructor() {
    super();
    
    // Get current editor instance
    const currentEditor = Editor.getCurrentInstance();
    if (!currentEditor) {
      console.warn('No editor instance found for Tag format');
      return;
    }
    
    this.editorId = currentEditor.instanceId;
    
    // Check if this editor already has a tag popup instance
    let tagPopup = currentEditor.getPopupInstance('tag');
    
    if (!tagPopup) {
      // Create new tag popup instance for this editor
      tagPopup = new TagPopup({
        onTagInsert: (tagType, tagContent) => {
          Tag.insertTagAtCurrentPosition(tagType, tagContent, this.editorId);
        },
        editor: currentEditor,
        editorId: this.editorId
      });
      
      // Store popup instance in editor
      currentEditor.setPopupInstance('tag', tagPopup);
    }
    
    this.tagPopup = tagPopup;
  }

  /**
   * Create a new Tag format instance for a specific editor
   * @param {string} editorId - Editor instance ID
   * @returns {Tag} Tag format instance
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
    const format = new Tag();
    
    // Restore original current instance
    Editor.currentInstance = originalCurrent;
    
    return format;
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
   * @param {string} editorId - Editor instance ID
   */
  static insertTagAtCurrentPosition(tagType, content, editorId = null) {
    // Get the correct editor instance
    let editor = null;
    if (editorId) {
      editor = Editor.getInstanceById(editorId);
    } else {
      editor = Editor.getCurrentInstance();
    }
    
    if (!editor) {
      console.warn('No editor instance found for tag insertion');
      return;
    }
    
    // Use saved range if available, otherwise get current selection
    const selection = window.getSelection();
    if (!selection) return;

    try {
      // Restore saved range if exists for this editor
      const savedRange = Tag.savedRanges.get(editorId);
      if (savedRange) {
        selection.removeAllRanges();
        selection.addRange(savedRange);
        Tag.savedRanges.delete(editorId);
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
      if (editor && editor.element) {
        editor.element.focus();
      }
      
      // Trigger content change event
      if (editor && typeof editor.onContentChange === 'function') {
        editor.onContentChange();
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
      Tag.insertTagAtCurrentPosition(tagType, content, this.editorId);
    } else {
      // Save current selection before showing popup
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        Tag.savedRanges.set(this.editorId, selection.getRangeAt(0).cloneRange());
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
        Tag.savedRanges.set(this.editorId, selection.getRangeAt(0).cloneRange());
      }
      this.showTagPopup();
    }
  }

  /**
   * Show tag popup
   */
  showTagPopup() {
    // Find tag button in the current editor's toolbar
    const editor = Editor.getInstanceById(this.editorId);
    if (!editor) return;
    
    const toolbar = editor.getModule('toolbar');
    let tagButton = null;
    
    if (toolbar) {
      tagButton = toolbar.getButton('tag');
    }
    
    // Fallback: find button by class in the current editor's toolbar
    if (!tagButton) {
      const toolbarContainer = toolbar?.getContainer();
      if (toolbarContainer) {
        tagButton = toolbarContainer.querySelector('.rich-editor-toolbar-btn.tag-btn');
      }
    }
    
    // Final fallback: find any tag button in the current editor's wrapper
    if (!tagButton) {
      tagButton = editor.wrapper.querySelector('.rich-editor-toolbar-btn.tag-btn');
    }
    
    if (!tagButton) {
      console.warn('Tag button not found for editor:', this.editorId);
      return;
    }
    
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