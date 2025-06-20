import { Format } from '../core/format.js';

/**
 * Image Format - Handles image embedding
 * Extracted from MediaManager.js logic
 */
class Image extends Format {
  static formatName = 'image';
  static tagName = 'IMG';

  static create(src = '') {
    const img = document.createElement(this.tagName);
    if (src) {
      img.src = src;
      img.setAttribute('data-resizable', 'true');
      // Default styling handled by CSS (.rich-editor-area img)
    }
    return img;
  }

  static formats(domNode) {
    return domNode.getAttribute('src') || true;
  }

  /**
   * Insert image at current selection
   * @param {string} src - Image source URL
   * @param {object} options - Image options (alt, title, width, height)
   */
  apply(src, options = {}) {
    if (!src) return;

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const img = this.constructor.create(src);

    // Apply options
    if (options.alt) img.alt = options.alt;
    if (options.title) img.title = options.title;
    if (options.width) img.style.width = options.width;
    if (options.height) img.style.height = options.height;

    // Insert image
    range.deleteContents();
    range.insertNode(img);
    
    // Move cursor after image
    range.setStartAfter(img);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    return img;
  }

  /**
   * Toggle image functionality (for toolbar)
   */
  toggle() {
    this.insertWithPrompt();
  }

  /**
   * Insert image with style - extracted from insertImageWithStyle()
   * @param {string} url - Image URL
   */
  insertWithStyle(url) {
    if (!url) return;

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    
    // Create image with default styling
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Inserted image';
    img.setAttribute('data-resizable', 'true');
    
    // Apply default styling - using CSS classes
    img.classList.add('align-center'); // Default to center alignment

    // Insert image
    range.deleteContents();
    range.insertNode(img);
    
    // Move cursor after image
    range.setStartAfter(img);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    return img;
  }

  /**
   * Resize image
   * @param {HTMLImageElement} img - Image element
   * @param {number} width - New width
   * @param {number} height - New height
   */
  static resize(img, width, height) {
    if (!img || img.tagName !== 'IMG') return;

    if (width) img.style.width = width + 'px';
    if (height) img.style.height = height + 'px';
  }

  /**
   * Set image alignment
   * @param {HTMLImageElement} img - Image element
   * @param {string} alignment - 'left', 'center', 'right'
   */
  static setAlignment(img, alignment) {
    if (!img || img.tagName !== 'IMG') return;

    // Remove previous alignment classes
    img.classList.remove('align-left', 'align-right', 'align-center', 'align-inline');

    switch (alignment) {
      case 'left':
        img.classList.add('align-left');
        break;
      case 'right':
        img.classList.add('align-right');
        break;
      case 'center':
        img.classList.add('align-center');
        break;
      default:
        img.classList.add('align-inline');
    }
  }

  /**
   * Convert image to base64 - for file uploads
   * @param {File} file - Image file
   * @returns {Promise<string>} Base64 string
   */
  static fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate image file
   * @param {File} file - File to validate
   * @returns {boolean} True if valid image
   */
  static isValidImageFile(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    return validTypes.includes(file.type) && file.size <= maxSize;
  }

  /**
   * Handle file drop/upload
   * @param {File} file - Image file
   */
  async handleFileUpload(file) {
    if (!this.constructor.isValidImageFile(file)) {
      console.error('Invalid image file');
      return;
    }

    try {
      const base64 = await this.constructor.fileToBase64(file);
      return this.insertWithStyle(base64);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  }

  /**
   * Insert image with prompt
   */
  insertWithPrompt() {
    const url = prompt('Enter image URL:', 'https://');
    if (url && url.trim()) {
      return this.insertWithStyle(url.trim());
    }
  }

  /**
   * Get image at current selection
   */
  getCurrentImage() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;

    const range = selection.getRangeAt(0);
    let element = range.startContainer;
    
    // Check if cursor is on an image
    if (element.nodeType === 1 && element.tagName === 'IMG') {
      return element;
    }
    
    // Check parent elements
    while (element && element !== document.body) {
      if (element.tagName === 'IMG') {
        return element;
      }
      element = element.parentNode;
    }
    
    // Check if selection contains an image
    const container = range.commonAncestorContainer;
    if (container.nodeType === 1) {
      const images = container.querySelectorAll('img');
      for (const img of images) {
        if (range.intersectsNode(img)) {
          return img;
        }
      }
    }
    
    return null;
  }

  /**
   * Select an image element
   * @param {HTMLImageElement} img - Image to select
   */
  static selectImage(img) {
    if (!img || img.tagName !== 'IMG') return;

    // Remove previous selections
    const prevSelected = document.querySelectorAll('.rich-editor-area img.selected');
    prevSelected.forEach(el => el.classList.remove('selected'));

    // Add selection to current image
    img.classList.add('selected');

    // Create selection range
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNode(img);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Show image context menu
   * @param {HTMLImageElement} img - Image element
   * @param {Event} event - Click event
   */
  static showImageMenu(img, event) {
    event.preventDefault();
    
    // Simple context menu with prompt
    const action = prompt(
      'Image options:\n' +
      '1. Change URL\n' +
      '2. Set alignment (left/center/right/inline)\n' +
      '3. Delete image\n' +
      'Enter 1, 2, or 3:'
    );

    switch (action) {
      case '1':
        const newUrl = prompt('Enter new image URL:', img.src);
        if (newUrl && newUrl.trim()) {
          img.src = newUrl.trim();
        }
        break;
      case '2':
        const alignment = prompt('Enter alignment (left/center/right/inline):', 'center');
        if (alignment) {
          this.setAlignment(img, alignment.toLowerCase());
        }
        break;
      case '3':
        if (confirm('Delete this image?')) {
          img.parentNode.removeChild(img);
        }
        break;
    }
  }

  /**
   * Remove image
   */
  remove() {
    const img = this.getCurrentImage();
    if (img && img.parentNode) {
      img.parentNode.removeChild(img);
    }
  }

  /**
   * Check if image is active at current selection
   */
  isActive() {
    return this.getCurrentImage() !== null;
  }

  /**
   * Optimize DOM structure
   */
  optimize(context = {}) {
    if (this.domNode && this.domNode.tagName === 'IMG') {
      // Ensure alt attribute exists
      if (!this.domNode.hasAttribute('alt')) {
        this.domNode.setAttribute('alt', 'Image');
      }
      
      // Ensure data-resizable attribute
      if (!this.domNode.hasAttribute('data-resizable')) {
        this.domNode.setAttribute('data-resizable', 'true');
      }
      
      // Responsive styling handled by CSS (.rich-editor-area img)
      // No need for inline styles
    }
  }
}

export default Image; 