/**
 * Video Popup Component - Popup for inserting videos
 */
class VideoPopup {
  constructor(options = {}) {
    this.options = {
      onVideoInsert: null,
      ...options
    };
    
    this.popup = null;
    this.isVisible = false;
    this.clickOutsideHandler = null;
    this.selectedVideoSrc = null;
    
    this.createVideoPopup();
  }

  /**
   * Create video popup
   */
  createVideoPopup() {
    this.popup = document.createElement('div');
    this.popup.className = 'video-popup';
    
    const content = document.createElement('div');
    content.className = 'video-popup-content';
    
    // Title
    const title = document.createElement('h3');
    title.textContent = 'Insert Video';
    title.className = 'video-popup-title';
    content.appendChild(title);
    
    // File input
    const uploadContainer = document.createElement('div');
    uploadContainer.className = 'video-input-container';
    
    const uploadLabel = document.createElement('label');
    uploadLabel.textContent = 'Upload Video:';
    uploadLabel.className = 'video-input-label';
    
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = 'video/*';
    this.fileInput.className = 'video-input';
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    
    uploadContainer.appendChild(uploadLabel);
    uploadContainer.appendChild(this.fileInput);
    content.appendChild(uploadContainer);
    
    // URL input
    const urlContainer = document.createElement('div');
    urlContainer.className = 'video-input-container';
    
    const urlLabel = document.createElement('label');
    urlLabel.textContent = 'Or Video URL:';
    urlLabel.className = 'video-input-label';
    
    this.urlInput = document.createElement('input');
    this.urlInput.type = 'url';
    this.urlInput.className = 'video-input';
    this.urlInput.placeholder = 'https://example.com/video.mp4';
    this.urlInput.addEventListener('input', () => this.updateInsertButton());
    
    urlContainer.appendChild(urlLabel);
    urlContainer.appendChild(this.urlInput);
    content.appendChild(urlContainer);
    
    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'video-button-container';
    
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'video-button cancel-button';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => this.hide());
    
    this.insertButton = document.createElement('button');
    this.insertButton.type = 'button';
    this.insertButton.className = 'video-button insert-button';
    this.insertButton.textContent = 'Insert Video';
    this.insertButton.disabled = true;
    this.insertButton.addEventListener('click', () => this.insertVideo());
    
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
      const { default: Video } = await import('../formats/video.js');
      this.selectedVideoSrc = await Video.handleFileUpload(file);
      this.urlInput.value = '';
      this.updateInsertButton();
    } catch (error) {
      alert(error.message);
    }
  }

  updateInsertButton() {
    const hasVideo = this.selectedVideoSrc || this.urlInput.value.trim();
    this.insertButton.disabled = !hasVideo;
  }

  async insertVideo() {
    let src = this.selectedVideoSrc || this.urlInput.value.trim();
    
    if (!src) return;
    
    if (!this.selectedVideoSrc && this.urlInput.value.trim()) {
      try {
        const { default: Video } = await import('../formats/video.js');
        const isValid = await Video.validateVideoUrl(src);
        if (!isValid) {
          alert('Invalid video URL. Please check the URL and try again.');
          return;
        }
      } catch (error) {
        alert('Error validating video URL.');
        return;
      }
    }
    
    if (this.options.onVideoInsert) {
      this.options.onVideoInsert(src);
    }
    
    this.hide();
    this.reset();
  }

  reset() {
    this.fileInput.value = '';
    this.urlInput.value = '';
    this.selectedVideoSrc = null;
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
    const popupHeight = 220;
    
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

export default VideoPopup; 