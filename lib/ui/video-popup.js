/**
 * Video Popup Component - Popup for inserting videos
 */
import { appendPopup, calculatePopupPosition, setPopupPosition } from '../utils/popup-helper.js';
import IconUtils from './icons.js';

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
        // fromUrl=true: keep the input visible (user may still be typing) and do
        // NOT adopt this partial URL as selectedVideoSrc — otherwise typing a
        // YouTube link hides the field mid-way and inserts a truncated URL.
        this.showPreview(url, true);
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
    customButton.innerHTML = IconUtils.getIcon('upload');
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
  showPreview(videoSrc, fromUrl = false) {
    if (!videoSrc) return;

    // A typed/pasted URL: leave the input in place so the user can finish
    // editing, and don't hijack selectedVideoSrc (insertVideo reads the input's
    // current value). Embed URLs (YouTube/Vimeo) can't render in a <video>
    // element anyway, so skip the media preview for URL input.
    if (fromUrl) {
      this.updateInsertButton();
      return;
    }

    this.videoPreview.src = videoSrc;
    this.previewContainer.style.display = 'block';
    this.selectedVideoSrc = videoSrc;

    // Hide input group (file-upload flow only)
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
    this.removeButton.innerHTML = IconUtils.getIcon('close') || '×';
    this.removeButton.style.cssText = `
      position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7);
      color: white; border: none; border-radius: 50%; width: 24px; height: 24px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
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
    // A file upload sets selectedVideoSrc (a data: URL of a file whose MIME type
    // was already checked to be video/*). A typed/pasted link comes from the URL
    // input instead.
    const fromUpload = !!this.selectedVideoSrc;
    const src = this.selectedVideoSrc || this.urlInput.value.trim();

    if (!src) return;

    // Only validate a typed/pasted URL. A file upload already produced a valid
    // video (its MIME type was verified) and yields a data: URL that the
    // URL-format check — extension match, then trying to play it in a <video>
    // element — would wrongly reject (data URLs carry no ".mp4" and formats like
    // .mov/.mkv don't play back in <video>), so it wrongly reported "invalid URL".
    if (!fromUpload) {
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