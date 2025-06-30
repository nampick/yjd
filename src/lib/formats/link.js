import { InlineFormat } from '../core/format.js';

/**
 * Link Dropdown UI Component
 * Provides a dropdown interface for creating and editing links
 */
class LinkDropdown {
  constructor() {
    this.container = null;
    this.isVisible = false;
    this.currentUrl = '';
    this.currentText = '';
    this.mode = 'create'; // 'create' or 'edit'
    this.currentLinkInstance = null; // Store current Link instance
    
    this.init();
  }

  init() {
    this.createDropdown();
    this.setupEventListeners();
  }

  /**
   * Create dropdown DOM structure
   */
  createDropdown() {
    this.container = document.createElement('div');
    this.container.className = 'link-dropdown';
    
    this.container.innerHTML = `
      <div class="link-dropdown-header">
        <span class="link-dropdown-title">🔗 Add Link</span>
        <button class="link-dropdown-close" type="button">×</button>
      </div>
      
      <div class="link-dropdown-body">
        <div class="link-input-group">
          <label class="link-input-label">URL:</label>
          <input type="url" class="link-url-input" placeholder="https://example.com" value="">
        </div>
        
        <div class="link-input-group">
          <label class="link-input-label">Link Text:</label>
          <input type="text" class="link-text-input" placeholder="Link text (optional)" value="">
        </div>
        
        <div class="link-dropdown-actions">
          <button type="button" class="link-btn link-btn-cancel">Cancel</button>
          <button type="button" class="link-btn link-btn-apply">Apply Link</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.container);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Close button
    this.container.querySelector('.link-dropdown-close').addEventListener('click', () => {
      this.hide();
    });

    // Cancel button
    this.container.querySelector('.link-btn-cancel').addEventListener('click', () => {
      this.hide();
    });

    // Apply button
    this.container.querySelector('.link-btn-apply').addEventListener('click', () => {
      this.applyLink();
    });

    // Enter key in inputs
    const inputs = this.container.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.applyLink();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.hide();
        }
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (this.isVisible && !this.container.contains(e.target)) {
        this.hide();
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  /**
   * Show dropdown at position
   */
  show(x, y, options = {}) {
    this.mode = options.mode || 'create';
    this.currentUrl = options.url || '';
    this.currentText = options.text || '';
    this.currentLinkInstance = options.linkInstance || null;

    // Update title based on mode
    const title = this.container.querySelector('.link-dropdown-title');
    title.textContent = this.mode === 'edit' ? '🔗 Edit Link' : '🔗 Add Link';

    // Update button text
    const applyBtn = this.container.querySelector('.link-btn-apply');
    applyBtn.textContent = this.mode === 'edit' ? 'Update Link' : 'Apply Link';

    // Set input values
    this.container.querySelector('.link-url-input').value = this.currentUrl;
    this.container.querySelector('.link-text-input').value = this.currentText;

    // Position dropdown
    this.container.style.left = x + 'px';
    this.container.style.top = y + 'px';
    this.container.classList.add('visible');
    this.isVisible = true;

    // Focus URL input
    setTimeout(() => {
      this.container.querySelector('.link-url-input').focus();
    }, 100);

    // Adjust position if off-screen
    this.adjustPosition();
  }

  /**
   * Hide dropdown
   */
  hide() {
    this.container.classList.remove('visible');
    this.isVisible = false;
  }

  /**
   * Apply link with current input values
   */
  applyLink() {
    const urlInput = this.container.querySelector('.link-url-input');
    const textInput = this.container.querySelector('.link-text-input');
    
    const url = urlInput.value.trim();
    const text = textInput.value.trim();

    if (!url) {
      urlInput.focus();
      return;
    }

    if (this.currentLinkInstance) {
      if (this.mode === 'edit') {
        this.currentLinkInstance.updateLink(url, text);
      } else if (this.mode === 'create') {
        this.currentLinkInstance.createLink(url, text);
      }
    }

    this.hide();
  }

  /**
   * Adjust dropdown position if off-screen
   */
  adjustPosition() {
    const rect = this.container.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust horizontal position
    if (rect.right > viewportWidth) {
      this.container.style.left = (viewportWidth - rect.width - 10) + 'px';
    }
    if (rect.left < 0) {
      this.container.style.left = '10px';
    }

    // Adjust vertical position
    if (rect.bottom > viewportHeight) {
      this.container.style.top = (viewportHeight - rect.height - 10) + 'px';
    }
    if (rect.top < 0) {
      this.container.style.top = '10px';
    }
  }

  /**
   * Destroy dropdown
   */
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

/**
 * Link Format - Handles hyperlink formatting
 * Extracted from MediaManager.js and ToolbarManager.js logic
 */
class Link extends InlineFormat {
  static formatName = 'link';
  static tagName = 'A';

  constructor(domNode) {
    super(domNode);
    // Initialize dropdown as a static instance
    if (!Link.dropdownInstance) {
      Link.dropdownInstance = new LinkDropdown();
    }
    this.dropdown = Link.dropdownInstance;
  }

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
   * Create link with dropdown interface
   * @param {string} url - The URL to link to
   * @param {string} text - Optional link text
   */
  createLink(url, text) {
    if (!url) return;

    // Normalize URL
    url = this.constructor.normalizeUrl(url);

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    
    if (range.collapsed) {
      // No selection - create link with provided text or URL as text
      const link = this.constructor.create(url);
      link.textContent = text || url;
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
      
      if (text) {
        link.textContent = text;
      } else {
        link.appendChild(contents);
      }
      
      range.insertNode(link);
      
      // Move cursor after link
      range.setStartAfter(link);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  /**
   * Update existing link
   * @param {string} url - New URL
   * @param {string} text - New link text (optional)
   */
  updateLink(url, text) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    let element = range.startContainer;
    
    while (element && element !== document.body) {
      if (element.tagName === 'A') {
        element.href = this.constructor.normalizeUrl(url);
        if (text) {
          element.textContent = text;
        }
        return true;
      }
      element = element.parentNode;
    }
    
    return false;
  }

  /**
   * Toggle link formatting
   */
  toggle(url = null) {
    if (this.isActive()) {
      // If already a link, show edit dropdown
      this.showDropdown('edit');
    } else {
      // Create new link
      if (url) {
        this.apply(url);
      } else {
        this.showDropdown('create');
      }
    }
  }

  /**
   * Show link dropdown at current cursor position
   */
  showDropdown(mode = 'create') {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    let x = rect.left;
    let y = rect.bottom + 5;

    // Default position if rect is empty
    if (rect.width === 0 && rect.height === 0) {
      x = window.innerWidth / 2 - 150; // Center horizontally
      y = window.innerHeight / 2 - 100; // Center vertically
    }

    const options = { 
      mode,
      linkInstance: this // Pass current Link instance
    };

    if (mode === 'edit') {
      // Get current link data
      const currentUrl = this.getCurrentUrl();
      const currentText = this.getCurrentText();
      options.url = currentUrl;
      options.text = currentText;
    } else {
      // For create mode, use selected text if any
      if (!range.collapsed) {
        options.text = range.toString().trim();
      }
    }

    this.dropdown.show(x, y, options);
  }

  /**
   * Insert link with dropdown interface (replaces prompt-based method)
   */
  insertWithPrompt() {
    this.showDropdown('create');
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
   * Get current link text if cursor is inside a link
   */
  getCurrentText() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;

    const range = selection.getRangeAt(0);
    let element = range.startContainer;
    
    while (element && element !== document.body) {
      if (element.tagName === 'A') {
        return element.textContent;
      }
      element = element.parentNode;
    }
    
    return null;
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