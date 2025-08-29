import { InlineFormat } from '../core/format.js';
import ImagePopup from '../ui/image-popup.js';
import Editor from '../core/editor.js';

/**
 * Image Format - Handles image insertion
 * Now supports multiple editor instances with separate popup instances
 */
class Image extends InlineFormat {
  static formatName = 'image';
  static tagName = 'IMG';
  static className = 'inserted-image';

  constructor() {
    super();
    
    // Get current editor instance
    const currentEditor = Editor.getCurrentInstance();
    if (!currentEditor) {
      console.warn('No editor instance found for Image format');
      return;
    }
    
    this.editorId = currentEditor.instanceId;
    
    // Check if this editor already has an image popup instance
    let imagePopup = currentEditor.getPopupInstance('image');
    
    if (!imagePopup) {
      // Create new image popup instance for this editor
      imagePopup = new ImagePopup({
        onImageInsert: (src, alt) => {
          Image.insertImageAtCurrentPosition(src, alt, this.editorId);
        },
        editor: currentEditor,
        editorId: this.editorId
      });
      
      // Store popup instance in editor
      currentEditor.setPopupInstance('image', imagePopup);
    }
    
    this.imagePopup = imagePopup;
  }

  /**
   * Create a new Image format instance for a specific editor
   * @param {string} editorId - Editor instance ID
   * @returns {Image} Image format instance
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
    const format = new Image();
    
    // Restore original current instance
    Editor.currentInstance = originalCurrent;
    
    return format;
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
   * @param {string} editorId - Editor instance ID
   */
  static insertImageAtCurrentPosition(src, alt = '', editorId = null) {
    // Get the correct editor instance
    let editor = null;
    if (editorId) {
      editor = Editor.getInstanceById(editorId);
    } else {
      editor = Editor.getCurrentInstance();
    }
    
    if (!editor) {
      console.warn('No editor instance found for image insertion');
      return;
    }
    
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) {
      return;
    }

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
      
      // Trigger content change event
      if (editor && typeof editor.onContentChange === 'function') {
        editor.onContentChange();
      }
    } catch (error) {
      console.error('Error inserting image:', error);
    }
    
    // Trigger content change after applying format
    setTimeout(() => {
      const currentEditor = Editor.getCurrentInstance();
      if (currentEditor && typeof currentEditor.onContentChange === 'function') {
        currentEditor.onContentChange();
      }
    }, 0);
  }

  /**
   * Apply image formatting - shows image popup
   */
  apply(src, alt) {
    if (src) {
      Image.insertImageAtCurrentPosition(src, alt, this.editorId);
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
    // Find image button in the current editor's toolbar
    const editor = Editor.getInstanceById(this.editorId);
    if (!editor) return;
    
    const toolbar = editor.getModule('toolbar');
    let imageButton = null;
    
    if (toolbar) {
      imageButton = toolbar.getButton('image');
    }
    
    // Fallback: find button by class in the current editor's toolbar
    if (!imageButton) {
      const toolbarContainer = toolbar?.getContainer();
      if (toolbarContainer) {
        imageButton = toolbarContainer.querySelector('.rich-editor-toolbar-btn.image-btn');
      }
    }
    
    // Final fallback: find any image button in the current editor's wrapper
    if (!imageButton) {
      imageButton = editor.wrapper.querySelector('.rich-editor-toolbar-btn.image-btn');
    }
    
    if (!imageButton) {
      console.warn('Image button not found for editor:', this.editorId);
      return;
    }
    
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
      // Check if it's a valid image URL format
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
      const hasValidExtension = imageExtensions.some(ext => 
        url.toLowerCase().includes(`.${ext}`)
      );
      
      // Check if it's a data URL
      if (url.startsWith('data:image/')) {
        resolve(true);
        return;
      }
      
      // Check if it's a valid HTTP(S) URL
      if (!/^https?:\/\//.test(url)) {
        resolve(false);
        return;
      }
      
      // If it has a valid extension, assume it's valid
      if (hasValidExtension) {
        resolve(true);
        return;
      }
      
      // Try to load the image (fallback)
      const img = new Image();
      img.onload = () => {
        resolve(true);
      };
      img.onerror = () => {
        // If loading fails, but URL looks like an image, still allow it
        // This handles cases where CORS blocks loading but the URL is valid
        if (url.includes('imgur.com') || url.includes('drive.google.com') || hasValidExtension) {
          resolve(true);
        } else {
          resolve(false);
        }
      };
      
      // Set timeout to avoid hanging
      setTimeout(() => {
        // If no response after 5 seconds, still allow if URL looks valid
        if (hasValidExtension || url.includes('imgur.com') || url.includes('drive.google.com')) {
          resolve(true);
        } else {
          resolve(false);
        }
      }, 5000);
      
      img.src = url;
    });
  }
}

export default Image; 