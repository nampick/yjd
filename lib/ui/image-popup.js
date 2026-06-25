/**
 * Image Popup Component - Popup for inserting images
 */
import { appendPopup, calculatePopupPosition, setPopupPosition } from '../utils/popup-helper.js';

class ImagePopup {
  constructor(options = {}) {
    this.options = {
      onImageInsert: null,
      editor: null,
      ...options
    };
    
    this.popup = null;
    this.isVisible = false;
    this.clickOutsideHandler = null;
    this.selectedImageSrc = null;
    this.savedSelection = null; // Save editor selection
    this.resizeHandler = null;
    
    this.createImagePopup();
  }

  /**
   * Create image popup
   */
  createImagePopup() {
    this.popup = document.createElement('div');
    this.popup.className = 'image-popup';
    
    const content = document.createElement('div');
    content.className = 'image-popup-content';
    
    // Title
    const title = document.createElement('h3');
    title.textContent = 'Insert image';
    title.className = 'yjd-input-title';
    content.appendChild(title);
    
    // Container
    const uploadContainer = document.createElement('div');
    uploadContainer.className = 'image-input-container';

    const textLabel = document.createElement('p');
    textLabel.textContent = 'Your image url';
    textLabel.className = 'yjd-input-label';

    const inputgroup1 = document.createElement('div');
    inputgroup1.className = 'yjd-input-upload-group';
    this.inputGroup = inputgroup1; // Store reference


    // input url
    this.urlInput = document.createElement('input');
    this.urlInput.type = 'url';
    this.urlInput.className = 'yjd-input';
    this.urlInput.placeholder = 'Please enter your image URL';
    

    // Hidden file input
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = 'image/*';
    this.fileInput.className = 'image-input-hidden'; // ẩn bằng CSS
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

    // Custom button
    const customButton = document.createElement('button');
    customButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>`;
    customButton.className = 'yjd-custom-upload-button';
    this.customButton = customButton;
    customButton.addEventListener('click', () => this.fileInput.click());

    // Create preview container
    this.createPreviewContainer();

    // Append elements
    inputgroup1.appendChild(this.urlInput);
    inputgroup1.appendChild(this.fileInput);
    inputgroup1.appendChild(customButton);
    uploadContainer.appendChild(textLabel);
    uploadContainer.appendChild(inputgroup1);
    uploadContainer.appendChild(this.previewContainer);
    content.appendChild(uploadContainer);
    this.urlInput.addEventListener('input', () => {
      this.updateInsertButton();
      // Show preview if URL is valid
      const url = this.urlInput.value.trim();
      if (url && this.isValidImageUrl(url)) {
        this.showPreview(url);
      } else {
        this.removePreview();
      }
      if(this.urlInput.value.trim()){
        this.customButton.style.display = 'none';
      }else{
        this.customButton.style.display = 'flex';
      }
    });
    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'yjd-button-container';
    
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'image-button yjd-button-cancel';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => {
      this.hide();
      // Maintain editor focus after popup close
      if (this.options.editor) {
        setTimeout(() => this.options.editor.focus(), 0);
      }
    });
    
    this.insertButton = document.createElement('button');
    this.insertButton.type = 'button';
    this.insertButton.className = 'image-button yjd-button-confirm button-disable';
    this.insertButton.textContent = 'Add image';
    this.insertButton.disabled = true;
    this.insertButton.addEventListener('click', () => {
      this.insertImage();
      // Maintain editor focus after insert
      if (this.options.editor) {
        setTimeout(() => this.options.editor.focus(), 0);
      }
    });
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(this.insertButton);
    content.appendChild(buttonContainer);
    
    this.popup.appendChild(content);
    appendPopup(this.popup);
    
    // Prevent focus loss when clicking on popup
    if (this.options.editor && typeof this.options.editor.preventFocusLoss === 'function') {
      this.options.editor.preventFocusLoss(this.popup);
    }
  }

  async handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const { default: Image } = await import('../formats/image.js');
      this.selectedImageSrc = await Image.handleFileUpload(file);
      this.urlInput.value = '';
      this.showPreview(this.selectedImageSrc);
      this.updateInsertButton();
    } catch (error) {
      alert(error.message);
    }
  }

  updateInsertButton() {
    const hasImage = this.selectedImageSrc || this.urlInput.value.trim();
    this.insertButton.disabled = !hasImage;
    this.insertButton.classList.toggle('button-disable', !hasImage);
  }

  /**
   * Show image preview
   */
  showPreview(imageSrc) {
    if (!imageSrc) return;
    
    this.imagePreview.src = imageSrc;
    this.previewContainer.style.display = 'block';
    this.selectedImageSrc = imageSrc;
    
    // Hide input group
    this.toggleInputGroup(false);
    
    // Recalculate position after preview is shown to ensure buttons remain visible
    this.recalculatePosition();
  }

  /**
   * Remove image preview and show input again
   */
  removePreview() {
    this.selectedImageSrc = null;
    this.previewContainer.style.display = 'none';
    this.imagePreview.src = '';
    
    // Show input group and reset file input
    this.toggleInputGroup(true);
    if (this.fileInput) {
      this.fileInput.value = '';
    }
    
    this.updateInsertButton();
    
    // Recalculate position after preview is removed
    this.recalculatePosition();
  }

  /**
   * Toggle input group visibility
   */
  toggleInputGroup(show) {
    if (!this.inputGroup) return;
    
    if (show) {
      this.inputGroup.style.display = 'flex';
      this.inputGroup.style.visibility = 'visible';
      if (this.customButton) {
        this.customButton.style.pointerEvents = 'auto';
      }
    } else {
      this.inputGroup.style.display = 'none';
      this.inputGroup.style.visibility = 'hidden';
    }
  }

  /**
   * Create preview container with image and remove button
   */
  createPreviewContainer() {
    this.previewContainer = document.createElement('div');
    this.previewContainer.className = 'image-preview-container';
    this.previewContainer.style.cssText = 'display: none; position: relative;';
    
    // Image preview
    this.imagePreview = document.createElement('img');
    this.imagePreview.className = 'image-preview';
    this.imagePreview.style.cssText = 'max-width: 100%; max-height: 200px; border-radius: 8px; object-fit: contain;';
    
    // Remove button
    this.removeButton = document.createElement('button');
    this.removeButton.className = 'image-remove-button';
    this.removeButton.innerHTML = '×';
    this.removeButton.style.cssText = `
      position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7);
      color: white; border: none; border-radius: 50%; width: 24px; height: 24px;
      cursor: pointer; font-size: 16px; font-weight: bold;
    `;
    this.removeButton.addEventListener('click', () => this.removePreview());
    
    this.previewContainer.appendChild(this.imagePreview);
    this.previewContainer.appendChild(this.removeButton);
  }

  /**
   * Check if URL is a valid image URL
   */
  isValidImageUrl(url) {
    try {
      const urlObj = new URL(url);
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
      const imageHosts = ['imgur.com', 'images.unsplash.com', 'picsum.photos', 'via.placeholder.com'];
      
      const pathname = urlObj.pathname.toLowerCase();
      const hasImageExtension = imageExtensions.some(ext => pathname.endsWith(ext));
      const isFromImageHost = imageHosts.some(host => urlObj.hostname.includes(host));
      
      return hasImageExtension || isFromImageHost;
    } catch {
      return false;
    }
  }

  async insertImage() {
    let src = this.selectedImageSrc || this.urlInput.value.trim();
    const alt = '';
    
    if (!src) return;
    
    // Always validate URL (both file upload and URL input)
    try {
      const { default: Image } = await import('../formats/image.js');
      const isValid = await Image.validateImageUrl(src);
      if (!isValid) {
        alert('Invalid image URL. Please check the URL and try again.');
        return;
      }
    } catch (error) {
      alert('Error validating image URL.');
      return;
    }
    
    // Restore editor selection before inserting
    this.restoreSelection();
    
    if (this.options.onImageInsert) {
      this.options.onImageInsert(src, alt);
    }
    
    this.hide();
    this.reset();
  }

  reset() {
    this.fileInput.value = '';
    this.urlInput.value = '';
    this.selectedImageSrc = null;
    
    // Hide preview and show input
    this.previewContainer.style.display = 'none';
    this.imagePreview.src = '';
    this.toggleInputGroup(true);
    
    this.updateInsertButton();
    this.customButton.style.display = 'block';
  }

  /**
   * Save current editor selection
   */
  saveSelection() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      this.savedSelection = selection.getRangeAt(0).cloneRange();
    }
  }

  /**
   * Restore editor selection
   */
  restoreSelection() {
    if (this.savedSelection) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(this.savedSelection);
    }
  }

  setupClickOutside() {
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler);
    }
    
    this.clickOutsideHandler = (e) => {
      if (!this.popup.contains(e.target)) {
        this.hide();
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', this.clickOutsideHandler);
    }, 100);
  }

  setupResizeHandler() {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    
    this.resizeHandler = () => {
      if (this.isVisible) {
        this.recalculatePosition();
      }
    };
    
    window.addEventListener('resize', this.resizeHandler);
  }

  removeResizeHandler() {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
  }

  removeClickOutside() {
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler);
      this.clickOutsideHandler = null;
    }
  }

  show(anchor) {
    if (!anchor) return;
    
    // Save current editor selection before showing popup
    this.saveSelection();
    
    // Reset state when showing popup
    this.reset();
    
    // Store anchor for recalculation
    this.currentAnchor = anchor;
    
    // Calculate and set popup position
    const position = calculatePopupPosition(anchor, this.popup, {
      offsetY: 5,
      offsetX: 0
    });
    setPopupPosition(this.popup, position);
    
    this.popup.classList.add('visible');
    this.isVisible = true;
    
    this.setupClickOutside();
  }

  /**
   * Recalculate popup position to ensure it stays within viewport
   */
  recalculatePosition() {
    if (!this.currentAnchor || !this.isVisible) return;
    
    // Small delay to ensure DOM updates are complete
    setTimeout(() => {
      const position = calculatePopupPosition(this.currentAnchor, this.popup, {
        offsetY: 5,
        offsetX: 0
      });
      setPopupPosition(this.popup, position);
    }, 10);
  }

  hide() {
    this.popup.classList.remove('visible');
    this.isVisible = false;
    this.removeClickOutside();
    // Clear saved selection to avoid memory leaks
    this.savedSelection = null;
  }

  destroy() {
    this.removeClickOutside();
    
    if (this.popup && this.popup.parentNode) {
      this.popup.parentNode.removeChild(this.popup);
    }
    
    this.popup = null;
    this.isVisible = false;
  }
}

export default ImagePopup; 