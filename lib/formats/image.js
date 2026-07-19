import { InlineFormat } from '../core/format.js';
import Editor from '../core/editor.js';
import { isSafeUrl } from '../utils/sanitize.js';
import { registerIcons, S } from '../ui/icons.js';

registerIcons({
  image: S('<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>')
});

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
    // Allow http(s)/relative URLs and raster data: image URIs; reject the rest.
    if (!isSafeUrl(src, { allowDataImage: true })) {
      console.warn('Blocked unsafe image URL:', src);
      return null;
    }
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
    if (!selection) return;
    // No caret (or caret outside this editor) → append at the end of the editor.
    if (!selection.rangeCount || !editor.editor.contains(selection.anchorNode)) {
      const r = document.createRange();
      r.selectNodeContents(editor.editor);
      r.collapse(false);
      selection.removeAllRanges();
      selection.addRange(r);
    }

    try {
      const range = selection.getRangeAt(0);
      // Create image element
      const imageElement = Image.create(src, alt);
      // Abort if the URL was rejected as unsafe
      if (!imageElement) return;
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
   * Apply image formatting — insert a known src, or open the file picker.
   */
  apply(src, alt) {
    if (src) {
      Image.insertImageAtCurrentPosition(src, alt, this.editorId);
    } else {
      this.openFilePicker();
    }
  }

  /**
   * Open the native file browser, then insert the chosen image straight into
   * the editor (visible immediately). The selection is captured before the
   * dialog steals focus and restored before insertion.
   */
  openFilePicker() {
    const editor = Editor.getInstanceById(this.editorId);
    if (!editor) return;

    const selection = window.getSelection();
    const savedRange = selection && selection.rangeCount
      ? selection.getRangeAt(0).cloneRange()
      : null;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = (editor.options.image && editor.options.image.accept) || 'image/*';
    input.style.display = 'none';
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (file) {
        // Restore the caret captured before the file dialog stole focus.
        editor.focus();
        const sel = window.getSelection();
        if (savedRange) {
          sel.removeAllRanges();
          sel.addRange(savedRange);
        } else if (!sel.rangeCount || !editor.editor.contains(sel.anchorNode)) {
          const r = document.createRange();
          r.selectNodeContents(editor.editor);
          r.collapse(false);
          sel.removeAllRanges();
          sel.addRange(r);
        }
        // Single insertion path → honours the image.upload hook + validation.
        // insertImageFile is an optional (all-in-one) capability — a /core build
        // using the image format must call applyEditorInput(Editor) to enable it.
        if (typeof editor.insertImageFile === 'function') {
          editor.insertImageFile(file);
        } else {
          console.warn('[yjd] image insert needs applyEditorInput(Editor) — see docs/ENGINE-MIGRATION.md');
        }
      }
      input.remove();
    });
    document.body.appendChild(input);
    input.click();
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
   * Toggle image — opens the native file picker.
   */
  toggle() {
    this.openFilePicker();
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