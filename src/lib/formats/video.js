import { InlineFormat } from '../core/format.js';
import VideoPopup from '../ui/video-popup.js';

/**
 * Video Format - Handles video insertion
 */
class Video extends InlineFormat {
  static formatName = 'video';
  static tagName = 'VIDEO';
  static className = 'inserted-video';

  constructor() {
    super();
    // Create video popup instance if not exists
    if (!Video.videoPopupInstance) {
      Video.videoPopupInstance = new VideoPopup({
        onVideoInsert: (src) => {
          Video.insertVideoAtCurrentPosition(src);
        }
      });
    }
    this.videoPopup = Video.videoPopupInstance;
  }

  /**
   * Create video element
   * @param {string} src - Video source URL
   * @returns {HTMLElement}
   */
  static create(src) {
    const video = document.createElement('VIDEO');
    video.src = src;
    video.className = 'inserted-video';
    video.controls = true;
    video.style.maxWidth = '100%';
    video.style.height = 'auto';
    video.setAttribute('contenteditable', 'false');
    return video;
  }

  /**
   * Insert video at current cursor position
   * @param {string} src - Video source URL
   */
  static insertVideoAtCurrentPosition(src) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    try {
      const range = selection.getRangeAt(0);
      
      // Create video element
      const videoElement = Video.create(src);
      
      // Insert video at cursor position
      range.deleteContents();
      range.insertNode(videoElement);
      
      // Add a space after the video for easier editing
      const spaceNode = document.createTextNode(' ');
      range.setStartAfter(videoElement);
      range.insertNode(spaceNode);
      
      // Position cursor after the space
      range.setStartAfter(spaceNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
    } catch (error) {
      console.error('Error inserting video:', error);
    }
  }

  /**
   * Apply video formatting - shows video popup
   */
  apply(src) {
    if (src) {
      Video.insertVideoAtCurrentPosition(src);
    } else {
      this.showVideoPopup();
    }
  }

  /**
   * Remove video formatting
   */
  remove() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const videoElement = this.getVideoElement(range);
    
    if (videoElement) {
      videoElement.remove();
    }
  }

  /**
   * Toggle video formatting - shows video popup
   */
  toggle() {
    if (this.videoPopup.isVisible) {
      this.videoPopup.hide();
    } else {
      this.showVideoPopup();
    }
  }

  /**
   * Show video popup
   */
  showVideoPopup() {
    const videoButton = document.querySelector('.rich-editor-toolbar-btn.video-btn');
    if (!videoButton) return;
    
    this.videoPopup.show(videoButton);
  }

  /**
   * Check if video formatting is active
   */
  isActive() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return false;

    const range = selection.getRangeAt(0);
    const videoElement = this.getVideoElement(range);
    
    return videoElement !== null;
  }

  /**
   * Get video element from selection
   * @param {Range} range - Selection range
   * @returns {HTMLElement|null}
   */
  getVideoElement(range) {
    let node = range.commonAncestorContainer;
    
    // If it's a text node, get its parent
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }
    
    // Check if current node is a video
    if (node.tagName === 'VIDEO' && node.classList && node.classList.contains('inserted-video')) {
      return node;
    }
    
    // Check if selection contains a video
    const videoInSelection = range.cloneContents().querySelector('.inserted-video');
    if (videoInSelection) {
      return videoInSelection;
    }
    
    return null;
  }

  /**
   * Handle file upload
   * @param {File} file - Video file
   * @returns {Promise<string>} - Promise that resolves to video URL
   */
  static async handleFileUpload(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('video/')) {
        reject(new Error('Please select a valid video file'));
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
   * Validate video URL
   * @param {string} url - Video URL
   * @returns {Promise<boolean>} - Promise that resolves to validation result
   */
  static validateVideoUrl(url) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => resolve(true);
      video.onerror = () => resolve(false);
      video.src = url;
    });
  }
}

export default Video; 