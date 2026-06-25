/**
 * Video Popup Component - Popup for inserting videos
 */
import { appendPopup, calculatePopupPosition, setPopupPosition } from '../utils/popup-helper.js';

class VideoPopup {
  constructor(options = {}) {
    this.options = {
      onVideoInsert: null,
      editor: null,
      ...options
    };
    
    this.popup = null;
    this.isVisible = false;
    this.clickOutsideHandler = null;
    this.selectedVideoSrc = null;
    this.savedSelection = null; // Save editor selection
    
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
    title.textContent = 'Insert video';
    title.className = 'yjd-input-title';
    content.appendChild(title);
    
    // Container
    const uploadContainer = document.createElement('div');
    uploadContainer.className = 'video-input-container';

    const textLabel = document.createElement('p');
    textLabel.textContent = 'Your video url';
    textLabel.className = 'yjd-input-label';

    const inputgroup1 = document.createElement('div');
    inputgroup1.className = 'yjd-input-upload-group';
    this.inputGroup = inputgroup1; // Store reference

    // input url
    this.urlInput = document.createElement('input');
    this.urlInput.type = 'url';
    this.urlInput.className = 'yjd-input';
    this.urlInput.placeholder = 'Please enter your video URL';
    this.urlInput.addEventListener('input', () => {
      this.updateInsertButton();
      // Show preview if URL is valid
      const url = this.urlInput.value.trim();
      if (url && this.isValidVideoUrl(url)) {
        this.showPreview(url);
      } else {
        this.removePreview();
      }
      if(this.urlInput.value.trim()){
        this.customButton.style.display = 'none';
      }else{
        this.customButton.style.display = 'block';
      }
    });

    // Hidden file input
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = 'video/*';
    this.fileInput.className = 'image-input-hidden'; // ẩn bằng CSS
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

    // Custom button
    const customButton = document.createElement('button');
    customButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
                              <g clip-path="url(#clip0_243_650)">
                                <path d="M9.45721 4.06101V11.4287C9.45721 11.966 9.02311 12.4001 8.48578 12.4001C7.94846 12.4001 7.51436 11.966 7.51436 11.4287V4.06101L5.28614 6.28923C4.90668 6.66869 4.29043 6.66869 3.91096 6.28923C3.5315 5.90976 3.5315 5.29351 3.91096 4.91405L7.79668 1.02833C8.17614 0.64887 8.79239 0.64887 9.17186 1.02833L13.0576 4.91405C13.437 5.29351 13.437 5.90976 13.0576 6.28923C12.6781 6.66869 12.0619 6.66869 11.6824 6.28923L9.45721 4.06101ZM2.65721 11.4287H6.54293C6.54293 12.5003 7.41418 13.3715 8.48578 13.3715C9.55739 13.3715 10.4286 12.5003 10.4286 11.4287H14.3144C15.386 11.4287 16.2572 12.2999 16.2572 13.3715V14.343C16.2572 15.4146 15.386 16.2858 14.3144 16.2858H2.65721C1.58561 16.2858 0.714355 15.4146 0.714355 14.343V13.3715C0.714355 12.2999 1.58561 11.4287 2.65721 11.4287ZM13.8286 14.5858C14.0219 14.5858 14.2072 14.5091 14.3438 14.3724C14.4805 14.2358 14.5572 14.0505 14.5572 13.8573C14.5572 13.664 14.4805 13.4787 14.3438 13.3421C14.2072 13.2055 14.0219 13.1287 13.8286 13.1287C13.6354 13.1287 13.4501 13.2055 13.3135 13.3421C13.1768 13.4787 13.1001 13.664 13.1001 13.8573C13.1001 14.0505 13.1768 14.2358 13.3135 14.3724C13.4501 14.5091 13.6354 14.5858 13.8286 14.5858Z" fill="#252424"/>
                              </g>
                              <defs>
                                <clipPath id="clip0_243_650">
                                  <rect width="15.5429" height="15.5429" fill="white" transform="translate(0.714355 0.742859)"/>
                                </clipPath>
                              </defs>
                            </svg>`;
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
    this.insertButton.textContent = 'Add video';
    this.insertButton.disabled = true;
    this.insertButton.addEventListener('click', () => {
      this.insertVideo();
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
      const { default: Video } = await import('../formats/video.js');
      this.selectedVideoSrc = await Video.handleFileUpload(file);
      this.urlInput.value = '';
      this.showPreview(this.selectedVideoSrc);
      this.updateInsertButton();
    } catch (error) {
      alert(error.message);
    }
  }

  updateInsertButton() {
    const hasVideo = this.selectedVideoSrc || this.urlInput.value.trim();
    this.insertButton.disabled = !hasVideo;
    this.insertButton.classList.toggle('button-disable', !hasVideo);
  }

  /**
   * Show video preview
   */
  showPreview(videoSrc) {
    if (!videoSrc) return;
    
    this.videoPreview.src = videoSrc;
    this.previewContainer.style.display = 'block';
    this.selectedVideoSrc = videoSrc;
    
    // Hide input group
    this.toggleInputGroup(false);
    
    // Recalculate position after preview is shown to ensure buttons remain visible
    this.recalculatePosition();
  }

  /**
   * Remove video preview and show input again
   */
  removePreview() {
    this.selectedVideoSrc = null;
    this.previewContainer.style.display = 'none';
    this.videoPreview.src = '';
    
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
   * Create preview container with video and remove button
   */
  createPreviewContainer() {
    this.previewContainer = document.createElement('div');
    this.previewContainer.className = 'video-preview-container';
    this.previewContainer.style.cssText = 'display: none; position: relative;';
    
    // Video preview
    this.videoPreview = document.createElement('video');
    this.videoPreview.className = 'video-preview';
    this.videoPreview.style.cssText = 'max-width: 100%; max-height: 200px; border-radius: 8px; object-fit: contain;';
    this.videoPreview.controls = true;
    this.videoPreview.muted = true;
    
    // Remove button
    this.removeButton = document.createElement('button');
    this.removeButton.className = 'video-remove-button';
    this.removeButton.innerHTML = '×';
    this.removeButton.style.cssText = `
      position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7);
      color: white; border: none; border-radius: 50%; width: 24px; height: 24px;
      cursor: pointer; font-size: 16px; font-weight: bold;
    `;
    this.removeButton.addEventListener('click', () => this.removePreview());
    
    this.previewContainer.appendChild(this.videoPreview);
    this.previewContainer.appendChild(this.removeButton);
  }

  /**
   * Check if URL is a valid video URL
   */
  isValidVideoUrl(url) {
    try {
      const urlObj = new URL(url);
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
      const videoHosts = ['youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com'];
      
      const pathname = urlObj.pathname.toLowerCase();
      const hasVideoExtension = videoExtensions.some(ext => pathname.endsWith(ext));
      const isFromVideoHost = videoHosts.some(host => urlObj.hostname.includes(host));
      
      return hasVideoExtension || isFromVideoHost;
    } catch {
      return false;
    }
  }

  async insertVideo() {
    let src = this.selectedVideoSrc || this.urlInput.value.trim();
    
    if (!src) return;
    
    // Always validate URL (both file upload and URL input)
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
    
    // Restore editor selection before inserting
    this.restoreSelection();
    
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
    
    // Hide preview and show input
    this.previewContainer.style.display = 'none';
    this.videoPreview.src = '';
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

export default VideoPopup; 