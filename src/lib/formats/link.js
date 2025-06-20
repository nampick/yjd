import { InlineFormat } from '../core/format.js';

/**
 * Link Format - Handles hyperlink formatting
 * Extracted from MediaManager.js and ToolbarManager.js logic
 */
class Link extends InlineFormat {
  static formatName = 'link';
  static tagName = 'A';

  static create(url = '') {
    const link = document.createElement(this.tagName);
    if (url) {
      link.href = url;
    }
    return link;
  }

  static formats(domNode) {
    return domNode.getAttribute('href') || true;
  }

  /**
   * Apply link formatting with URL
   * @param {string} url - The URL to link to
   */
  apply(url) {
    if (!url) return;

    // Normalize URL
    url = this.constructor.normalizeUrl(url);

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    
    if (range.collapsed) {
      // No selection - create link with URL as text
      const link = this.constructor.create(url);
      link.textContent = url;
      range.insertNode(link);
      
      // Move cursor after link
      range.setStartAfter(link);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // Has selection - wrap selected content in link
      const contents = range.extractContents();
      const link = this.constructor.create(url);
      link.appendChild(contents);
      range.insertNode(link);
      
      // Move cursor after link
      range.setStartAfter(link);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  /**
   * Toggle link formatting
   */
  toggle(url = null) {
    if (this.isActive()) {
      this.remove();
    } else {
      if (!url) {
        this.insertWithPrompt();
      } else {
        this.apply(url);
      }
    }
  }

  /**
   * Remove link formatting
   */
  remove() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    let element = range.startContainer;
    
    // Find parent link element
    while (element && element !== document.body) {
      if (element.tagName === 'A') {
        // Replace link with its content
        const parent = element.parentNode;
        while (element.firstChild) {
          parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);
        break;
      }
      element = element.parentNode;
    }
  }

  /**
   * Check if link is active at current selection
   */
  isActive() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return false;

    const range = selection.getRangeAt(0);
    let element = range.startContainer;
    
    // Check if cursor is inside a link
    while (element && element !== document.body) {
      if (element.tagName === 'A') {
        return true;
      }
      element = element.parentNode;
    }
    
    return false;
  }

  /**
   * Get current link URL if cursor is inside a link
   */
  getCurrentUrl() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;

    const range = selection.getRangeAt(0);
    let element = range.startContainer;
    
    while (element && element !== document.body) {
      if (element.tagName === 'A') {
        return element.href;
      }
      element = element.parentNode;
    }
    
    return null;
  }

  /**
   * Update existing link URL
   * @param {string} newUrl - New URL for the link
   */
  updateUrl(newUrl) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    let element = range.startContainer;
    
    while (element && element !== document.body) {
      if (element.tagName === 'A') {
        element.href = newUrl;
        return true;
      }
      element = element.parentNode;
    }
    
    return false;
  }

  /**
   * Insert link with prompt - extracted from showLinkDropdown logic
   */
  insertWithPrompt() {
    const selection = window.getSelection();
    let defaultUrl = 'https://';
    let defaultText = '';

    // If there's selected text, use it as potential URL or link text
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (!range.collapsed) {
        const selectedText = range.toString().trim();
        if (this.constructor.isValidUrl(selectedText)) {
          defaultUrl = selectedText;
        } else {
          defaultText = selectedText;
        }
      }
    }

    const url = prompt('Enter URL:', defaultUrl);
    if (url && url.trim()) {
      const normalizedUrl = this.constructor.normalizeUrl(url.trim());
      
      // If no text was selected, ask for link text
      if (!defaultText && selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (range.collapsed) {
          const linkText = prompt('Enter link text:', normalizedUrl);
          if (linkText) {
            // Insert text first, then apply link
            range.insertNode(document.createTextNode(linkText));
            range.selectNode(range.startContainer);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }
      
      this.apply(normalizedUrl);
    }
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      // Try with https:// prefix
      try {
        new URL('https://' + url);
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Normalize URL (add protocol if missing)
   * @param {string} url - URL to normalize
   */
  static normalizeUrl(url) {
    if (!url) return '';
    
    // If already has protocol, return as is
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    
    // Add https:// prefix
    return 'https://' + url;
  }

  /**
   * Optimize DOM structure
   */
  optimize(context = {}) {
    if (this.domNode && this.domNode.tagName === 'A') {
      // Ensure href attribute exists
      if (!this.domNode.hasAttribute('href')) {
        this.domNode.setAttribute('href', '#');
      }
      
      // Add target="_blank" for external links
      const href = this.domNode.getAttribute('href');
      if (href && href.startsWith('http') && !href.includes(window.location.hostname)) {
        this.domNode.setAttribute('target', '_blank');
        this.domNode.setAttribute('rel', 'noopener noreferrer');
      }
    }
  }
}

export default Link; 