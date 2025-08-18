import { InlineFormat } from '../core/format.js';
import LinkPopup from '../ui/link-popup.js';
import Editor from '../core/editor.js';

/**
 * Link Format - Simple link insertion
 */
class Link extends InlineFormat {
  static formatName = 'link';
  static tagName = 'A';
  static savedRange = null; // Lưu vị trí con trỏ

  constructor() {
    super();
    // Create shared popup instance
    if (!Link.linkPopup) {
      Link.linkPopup = new LinkPopup({
        onLinkSelect: (linkData) => {
          Link.insertLink(linkData);
        },
        editor: Editor.getCurrentInstance()
      });
    }
    this.linkPopup = Link.linkPopup;
  }

  /**
   * Insert link at saved cursor position
   */
  static insertLink(linkData) {
    // Khôi phục vị trí con trỏ đã lưu
    if (!Link.savedRange) return;
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(Link.savedRange);
    
    const range = selection.getRangeAt(0);
    
    if (range.collapsed) {
      // No selection - insert link at cursor
      const linkElement = document.createElement('A');
      linkElement.href = linkData.url;
      linkElement.target = '_blank';
      linkElement.rel = 'noopener noreferrer';
      linkElement.textContent = linkData.text || linkData.url;
      range.insertNode(linkElement);
    } else {
      // Has selection - wrap existing content with link while preserving styles
      const fragment = range.extractContents();
      const linkElement = document.createElement('A');
      linkElement.href = linkData.url;
      linkElement.target = '_blank';
      linkElement.rel = 'noopener noreferrer';
      
      // Move all nodes from fragment to link element
      while (fragment.firstChild) {
        linkElement.appendChild(fragment.firstChild);
      }
      
      range.insertNode(linkElement);
    }
    
    // Position cursor after link
    const newRange = document.createRange();
    newRange.setStartAfter(range.endContainer);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    
    // Clear saved range
    Link.savedRange = null;
  }

  /**
   * Toggle link popup
   */
  toggle() {
    if (this.linkPopup.isVisible) {
      this.linkPopup.hide();
    } else {
      this.showPopup();
    }
  }

  /**
   * Show link popup
   */
  showPopup() {
    // Lưu vị trí con trỏ hiện tại
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      Link.savedRange = selection.getRangeAt(0).cloneRange();
    }
    
    const linkButton = document.querySelector('.rich-editor-toolbar-btn.link-btn');
    if (!linkButton) return;
    
    // Check if cursor is in existing link
    const existingLink = this.getCurrentLink();
    
    // Get selected text for display
    let selectedText = '';
    if (selection && !selection.isCollapsed) {
      selectedText = selection.toString().trim();
    }
    
    this.linkPopup.show(linkButton, existingLink, selectedText);
  }

  /**
   * Get current link if cursor is in one
   */
  getCurrentLink() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;
    
    let node = selection.getRangeAt(0).startContainer;
    
    // Find parent link element
    while (node && node !== document.body) {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'A') {
        return {
          url: node.href || '',
          text: node.textContent || ''
        };
      }
      node = node.parentNode;
    }
    
    return null;
  }

  /**
   * Check if cursor is in a link
   */
  isActive() {
    return this.getCurrentLink() !== null;
  }
}

export default Link; 