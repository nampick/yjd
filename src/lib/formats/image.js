import { InlineFormat } from '../core/format.js';
import ImagePopup from '../ui/image-popup.js';

/**
 * Image Format - Handles image insertion
 */
class Image extends InlineFormat {
  static formatName = 'image';
  static tagName = 'IMG';
  static className = 'inserted-image';

  constructor() {
    super();
    // Create image popup instance if not exists
    if (!Image.imagePopupInstance) {
      Image.imagePopupInstance = new ImagePopup({
        onImageInsert: (src, alt) => {
          Image.insertImageAtCurrentPosition(src, alt);
        }
      });
    }
    this.imagePopup = Image.imagePopupInstance;
  }

  /**
   * Create image element
   * @param {string} src - Image source URL
   * @param {string} alt - Alt text
   * @returns {HTMLElement}
   */
  static create(src, alt = '') {
    const img = document.createElement('IMG');
    img.src = src;
    img.alt = alt || 'Inserted image';
    img.className = 'inserted-image';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.setAttribute('contenteditable', 'false');
    return img;
  }

  /**
   * Insert image at current cursor position
   * @param {string} src - Image source URL
   * @param {string} alt - Alt text
   */
  static insertImageAtCurrentPosition(src, alt = '') {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    try {
      const range = selection.getRangeAt(0);
      
      // Create image element
      const imageElement = Image.create(src, alt);
      
      // Insert image at cursor position
      range.deleteContents();
      range.insertNode(imageElement);
      
      // Add a space after the image for easier editing
      const spaceNode = document.createTextNode(' ');
      range.setStartAfter(imageElement);
      range.insertNode(spaceNode);
      
      // Position cursor after the space
      range.setStartAfter(spaceNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
    } catch (error) {
      console.error('Error inserting image:', error);
    }
  }

  /**
   * Apply image formatting - shows image popup
   */
  apply(src, alt) {
    if (src) {
      Image.insertImageAtCurrentPosition(src, alt);
    } else {
      this.showImagePopup();
    }
  }

  /**
   * Remove image formatting
   */
  remove() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const imageElement = this.getImageElement(range);
    
    if (imageElement) {
      imageElement.remove();
    }
  }

  /**
   * Toggle image formatting - shows image popup
   */
  toggle() {
    if (this.imagePopup.isVisible) {
      this.imagePopup.hide();
    } else {
      this.showImagePopup();
    }
  }

  /**
   * Show image popup
   */
  showImagePopup() {
    const imageButton = document.querySelector('.rich-editor-toolbar-btn.image-btn');
    if (!imageButton) return;
    
    this.imagePopup.show(imageButton);
  }

  /**
   * Check if image formatting is active
   */
  isActive() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return false;

    const range = selection.getRangeAt(0);
    const imageElement = this.getImageElement(range);
    
    return imageElement !== null;
  }

  /**
   * Get image element from selection
   * @param {Range} range - Selection range
   * @returns {HTMLElement|null}
   */
  getImageElement(range) {
    let node = range.commonAncestorContainer;
    
    // If it's a text node, get its parent
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    
    // Check if current node is an image
    if (node.tagName === 'IMG' && node.classList && node.classList.contains('inserted-image')) {
      return node;
    }
    
    // Check if selection contains an image
    const imageInSelection = range.cloneContents().querySelector('.inserted-image');
    if (imageInSelection) {
      return imageInSelection;
    }
    
    return null;
  }

  /**
   * Handle file upload
   * @param {File} file - Image file
   * @returns {Promise<string>} - Promise that resolves to image URL
   */
  static async handleFileUpload(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        reject(new Error('Please select a valid image file'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate image URL
   * @param {string} url - Image URL
   * @returns {Promise<boolean>} - Promise that resolves to validation result
   */
  static validateImageUrl(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }
}

export default Image; 