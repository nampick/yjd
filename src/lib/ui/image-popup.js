/**
 * Image Popup Component - Popup for inserting images
 */
class ImagePopup {
  constructor(options = {}) {
    this.options = {
      onImageInsert: null,
      ...options
    };
    
    this.popup = null;
    this.isVisible = false;
    this.clickOutsideHandler = null;
    this.selectedImageSrc = null;
    
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
    title.textContent = 'Insert Image';
    title.className = 'image-popup-title';
    content.appendChild(title);
    
    // File input
    const uploadContainer = document.createElement('div');
    uploadContainer.className = 'image-input-container';
    
    const uploadLabel = document.createElement('label');
    uploadLabel.textContent = 'Upload Image:';
    uploadLabel.className = 'image-input-label';
    
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = 'image/*';
    this.fileInput.className = 'image-input';
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    
    uploadContainer.appendChild(uploadLabel);
    uploadContainer.appendChild(this.fileInput);
    content.appendChild(uploadContainer);
    
    // URL input
    const urlContainer = document.createElement('div');
    urlContainer.className = 'image-input-container';
    
    const urlLabel = document.createElement('label');
    urlLabel.textContent = 'Or Image URL:';
    urlLabel.className = 'image-input-label';
    
    this.urlInput = document.createElement('input');
    this.urlInput.type = 'url';
    this.urlInput.className = 'image-input';
    this.urlInput.placeholder = 'https://example.com/image.jpg';
    this.urlInput.addEventListener('input', () => this.updateInsertButton());
    
    urlContainer.appendChild(urlLabel);
    urlContainer.appendChild(this.urlInput);
    content.appendChild(urlContainer);
    
    // Alt text input
    const altContainer = document.createElement('div');
    altContainer.className = 'image-input-container';
    
    const altLabel = document.createElement('label');
    altLabel.textContent = 'Alt text (optional):';
    altLabel.className = 'image-input-label';
    
    this.altInput = document.createElement('input');
    this.altInput.type = 'text';
    this.altInput.className = 'image-input';
    this.altInput.placeholder = 'Describe this image...';
    
    altContainer.appendChild(altLabel);
    altContainer.appendChild(this.altInput);
    content.appendChild(altContainer);
    
    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'image-button-container';
    
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'image-button cancel-button';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => this.hide());
    
    this.insertButton = document.createElement('button');
    this.insertButton.type = 'button';
    this.insertButton.className = 'image-button insert-button';
    this.insertButton.textContent = 'Insert Image';
    this.insertButton.disabled = true;
    this.insertButton.addEventListener('click', () => this.insertImage());
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(this.insertButton);
    content.appendChild(buttonContainer);
    
    this.popup.appendChild(content);
    document.body.appendChild(this.popup);
  }

  async handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const { default: Image } = await import('../formats/image.js');
      this.selectedImageSrc = await Image.handleFileUpload(file);
      this.urlInput.value = '';
      this.updateInsertButton();
    } catch (error) {
      alert(error.message);
    }
  }

  updateInsertButton() {
    const hasImage = this.selectedImageSrc || this.urlInput.value.trim();
    this.insertButton.disabled = !hasImage;
  }

  async insertImage() {
    let src = this.selectedImageSrc || this.urlInput.value.trim();
    const alt = this.altInput.value.trim();
    
    if (!src) return;
    
    if (!this.selectedImageSrc && this.urlInput.value.trim()) {
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
    }
    
    if (this.options.onImageInsert) {
      this.options.onImageInsert(src, alt);
    }
    
    this.hide();
    this.reset();
  }

  reset() {
    this.fileInput.value = '';
    this.urlInput.value = '';
    this.altInput.value = '';
    this.selectedImageSrc = null;
    this.updateInsertButton();
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

  removeClickOutside() {
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler);
      this.clickOutsideHandler = null;
    }
  }

  show(anchor) {
    if (!anchor) return;
    
    const anchorRect = anchor.getBoundingClientRect();
    const popupWidth = 350;
    const popupHeight = 280;
    
    let top = anchorRect.bottom + window.scrollY + 5;
    let left = anchorRect.left + window.scrollX;
    
    if (left + popupWidth > window.innerWidth) {
      left = window.innerWidth - popupWidth - 10;
    }
    
    if (top + popupHeight > window.innerHeight + window.scrollY) {
      top = anchorRect.top + window.scrollY - popupHeight - 5;
    }
    
    if (left < 0) left = 10;
    if (top < 0) top = 10;
    
    this.popup.style.top = `${top}px`;
    this.popup.style.left = `${left}px`;
    
    this.popup.classList.add('visible');
    this.isVisible = true;
    
    this.setupClickOutside();
  }

  hide() {
    this.popup.classList.remove('visible');
    this.isVisible = false;
    this.removeClickOutside();
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