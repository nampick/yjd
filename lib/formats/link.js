import { InlineFormat } from '../core/format.js';
import LinkPopup, { LinkBar } from '../ui/link-popup.js';
import Editor from '../core/editor.js';
import { isSafeUrl } from '../utils/sanitize.js';
import { registerIcons, S } from '../ui/icons.js';

registerIcons({
  link: S('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.8 1.8"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.8-1.8"/>')
});

/**
 * Link Format - Simple link insertion
 * Now supports multiple editor instances with separate popup instances
 */
class Link extends InlineFormat {
  static formatName = 'link';
  static tagName = 'A';
  
  // Map to store saved ranges for each editor instance
  static savedRanges = new Map();

  constructor() {
    super();
    
    // Get current editor instance
    const currentEditor = Editor.getCurrentInstance();
    if (!currentEditor) {
      console.warn('No editor instance found for Link format');
      return;
    }
    
    this.editorId = currentEditor.instanceId;
    
    // Check if this editor already has a link popup instance
    let linkPopup = currentEditor.getPopupInstance('link');
    
    if (!linkPopup) {
      // Create new popup instance for this editor
      linkPopup = new LinkPopup({
        onLinkSelect: (linkData) => {
          // An edit started from the link bar updates the element in place —
          // re-wrapping through insertLink would nest an <a> inside the old one.
          const target = Link.editTargets.get(this.editorId);
          if (target && target.isConnected) {
            Link.updateLink(target, linkData, this.editorId);
          } else {
            Link.insertLink(linkData, this.editorId);
          }
          Link.editTargets.delete(this.editorId);
        },
        editor: currentEditor,
        editorId: this.editorId
      });

      // Store popup instance in editor
      currentEditor.setPopupInstance('link', linkPopup);
    }

    this.linkPopup = linkPopup;

    // Link view bar (UI 2.0): clicking a link inside the editor shows
    // href · edit · copy · unlink instead of doing nothing.
    let linkBar = currentEditor.getPopupInstance('link-bar');
    if (!linkBar) {
      const editorId = this.editorId;
      linkBar = new LinkBar({
        editor: currentEditor,
        onEdit: (el) => Link.editFromBar(el, editorId),
        onUnlink: (el) => Link.unlink(el, editorId)
      });
      currentEditor.setPopupInstance('link-bar', linkBar);
      currentEditor.editor.addEventListener('click', (e) => {
        const a = e.target && e.target.closest ? e.target.closest('a') : null;
        if (a && currentEditor.editor.contains(a)) {
          // Links inside contenteditable don't navigate; surface the bar.
          e.preventDefault();
          linkBar.show(a);
        } else if (linkBar.isVisible) {
          linkBar.hide();
        }
      });
      currentEditor.editor.addEventListener('input', () => {
        if (linkBar.isVisible) linkBar.hide();
      });
    }
    this.linkBar = linkBar;
  }

  // Per-editor link element currently being edited from the link bar.
  static editTargets = new Map();

  /**
   * Open the link popup prefilled from a link element (edit-in-place flow).
   */
  static editFromBar(linkEl, editorId) {
    const editor = Editor.getInstanceById(editorId);
    if (!editor) return;
    const popup = editor.getPopupInstance('link');
    if (!popup) return;
    Link.editTargets.set(editorId, linkEl);
    popup.show(linkEl, { url: linkEl.getAttribute('href') || '', text: linkEl.textContent || '' },
      linkEl.textContent.trim());
  }

  /**
   * Update an existing link element in place (href + optional new text).
   */
  static updateLink(linkEl, linkData, editorId) {
    if (!linkData || !linkData.url || !isSafeUrl(linkData.url)) return;
    const editor = Editor.getInstanceById(editorId);
    const h = editor && editor.getModule ? editor.getModule('history') : null;
    if (h && typeof h.saveBeforeFormat === 'function') h.saveBeforeFormat();
    linkEl.setAttribute('href', linkData.url);
    if (linkData.text && linkData.text !== linkEl.textContent) {
      linkEl.textContent = linkData.text;
    }
    if (editor && typeof editor.onContentChange === 'function') editor.onContentChange();
  }

  /**
   * Unwrap a link element, keeping its content (one undoable step).
   */
  static unlink(linkEl, editorId) {
    const editor = Editor.getInstanceById(editorId);
    const h = editor && editor.getModule ? editor.getModule('history') : null;
    if (h && typeof h.saveBeforeFormat === 'function') h.saveBeforeFormat();
    const parent = linkEl.parentNode;
    if (!parent) return;
    while (linkEl.firstChild) parent.insertBefore(linkEl.firstChild, linkEl);
    parent.removeChild(linkEl);
    parent.normalize();
    if (editor && typeof editor.onContentChange === 'function') editor.onContentChange();
  }

  /**
   * Create a new Link format instance for a specific editor
   * @param {string} editorId - Editor instance ID
   * @returns {Link} Link format instance
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
    const format = new Link();
    
    // Restore original current instance
    Editor.currentInstance = originalCurrent;
    
    return format;
  }

  /**
   * Insert link at saved cursor position
   * @param {Object} linkData - Link data with url and text
   * @param {string} editorId - Editor instance ID
   */
  static insertLink(linkData, editorId = null) {
    // Get the correct editor instance
    let editor = null;
    if (editorId) {
      editor = Editor.getInstanceById(editorId);
    } else {
      editor = Editor.getCurrentInstance();
    }
    
    if (!editor) {
      console.warn('No editor instance found for link insertion');
      return;
    }

    // Block unsafe URL schemes (javascript:, data:text/html, vbscript:, ...)
    if (!isSafeUrl(linkData.url)) {
      console.warn('Blocked unsafe link URL:', linkData.url);
      return;
    }

    // Get saved range for this specific editor
    const savedRange = Link.savedRanges.get(editorId);
    if (!savedRange) {
      console.warn('No saved range found for editor:', editorId);
      return;
    }
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedRange);
    
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
    
    // Trigger content change after applying format
    setTimeout(() => {
      if (editor && typeof editor.onContentChange === 'function') {
        editor.onContentChange();
      }
    }, 0);
    
    // Clear saved range for this editor
    Link.savedRanges.delete(editorId);
    
    // Trigger content change event
    if (editor && typeof editor.onContentChange === 'function') {
      editor.onContentChange();
    }
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
    const editor = Editor.getInstanceById(this.editorId);
    if (!editor) {
      console.warn('No editor found for ID:', this.editorId);
      return;
    }

    // A toolbar-opened popup always inserts/wraps — clear any stale edit
    // target left behind by a cancelled link-bar edit.
    Link.editTargets.delete(this.editorId);

    // Save the current range and anchor the popup right at the selected text.
    const selection = window.getSelection();
    let rect = null;
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0).cloneRange();
      Link.savedRanges.set(this.editorId, range);
      rect = range.getBoundingClientRect();
      // A collapsed caret can report an empty rect — fall back to its element.
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        const node = range.startContainer.nodeType === Node.TEXT_NODE
          ? range.startContainer.parentElement
          : range.startContainer;
        if (node && node.getBoundingClientRect) rect = node.getBoundingClientRect();
      }
    }

    const existingLink = this.getCurrentLink();
    let selectedText = '';
    if (selection && !selection.isCollapsed) {
      selectedText = selection.toString().trim();
    }

    // Anchor at the selection rect (virtual anchor); fall back to the toolbar
    // button when there's no usable rect.
    let anchor = null;
    if (rect && (rect.width || rect.height)) {
      anchor = { getBoundingClientRect: () => rect };
    } else {
      const toolbar = editor.getModule('toolbar');
      anchor = toolbar && (toolbar.getButton('link')
        || editor.wrapper.querySelector('.rich-editor-toolbar-btn[data-command="link"]'));
    }
    if (!anchor) {
      console.warn('No anchor for link popup, editor:', this.editorId);
      return;
    }

    this.linkPopup.show(anchor, existingLink, selectedText);
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