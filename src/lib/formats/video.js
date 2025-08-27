import { InlineFormat } from '../core/format.js';
import VideoPopup from '../ui/video-popup.js';
import Editor from '../core/editor.js';

/**
 * Video Format - Handles video insertion
 * Now supports multiple editor instances with separate popup instances
 */
class Video extends InlineFormat {
  static formatName = 'video';
  static tagName = 'VIDEO';
  static className = 'inserted-video';

  constructor() {
    super();
    
    // Get current editor instance
    const currentEditor = Editor.getCurrentInstance();
    if (!currentEditor) {
      console.warn('No editor instance found for Video format');
      return;
    }
    
    this.editorId = currentEditor.instanceId;
    
    // Check if this editor already has a video popup instance
    let videoPopup = currentEditor.getPopupInstance('video');
    
    if (!videoPopup) {
      // Create new video popup instance for this editor
      videoPopup = new VideoPopup({
        onVideoInsert: (src) => {
          Video.insertVideoAtCurrentPosition(src, this.editorId);
        },
        editor: currentEditor,
        editorId: this.editorId
      });
      
      // Store popup instance in editor
      currentEditor.setPopupInstance('video', videoPopup);
    }
    
    this.videoPopup = videoPopup;
  }

  /**
   * Create a new Video format instance for a specific editor
   * @param {string} editorId - Editor instance ID
   * @returns {Video} Video format instance
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
    const format = new Video();
    
    // Restore original current instance
    Editor.currentInstance = originalCurrent;
    
    return format;
  }

  /**
   * Create video element
   * @param {string} src - Video source URL
   * @returns {HTMLElement}
   */
  static create(src) {
    // Check if it's a YouTube URL
    if (Video.isYouTubeUrl(src)) {
      return Video.createYouTubeEmbed(src);
    }
    
    // Create regular video element for direct video URLs
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
   * Create YouTube embedded iframe
   * @param {string} url - YouTube URL
   * @returns {HTMLElement}
   */
  static createYouTubeEmbed(url) {
    const videoId = Video.getYouTubeVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }
    
    const iframe = document.createElement('IFRAME');
    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    iframe.className = 'inserted-video youtube-video';
    iframe.width = '560';
    iframe.height = '315';
    iframe.style.maxWidth = '100%';
    iframe.style.width = '560px';  // Set explicit width
    iframe.style.height = '315px'; // Set explicit height
    iframe.style.position = 'relative'; // Add position relative
    iframe.style.display = 'block'; // Make it block level
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('contenteditable', 'false');
    
    return iframe;
  }

  /**
   * Insert video at current cursor position
   * @param {string} src - Video source URL
   * @param {string} editorId - Editor instance ID
   */
  static insertVideoAtCurrentPosition(src, editorId = null) {
    // Get the correct editor instance
    let editor = null;
    if (editorId) {
      editor = Editor.getInstanceById(editorId);
    } else {
      editor = Editor.getCurrentInstance();
    }
    
    if (!editor) {
      console.warn('No editor instance found for video insertion');
      return;
    }
    
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) {
      return;
    }

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
      
      // Trigger content change event
      if (editor && typeof editor.onContentChange === 'function') {
        editor.onContentChange();
      }
    } catch (error) {
      console.error('Error inserting video:', error);
    }
  }

  /**
   * Apply video formatting - shows video popup
   */
  apply(src) {
    if (src) {
      Video.insertVideoAtCurrentPosition(src, this.editorId);
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
    // Find video button in the current editor's toolbar
    const editor = Editor.getInstanceById(this.editorId);
    if (!editor) return;
    
    const toolbar = editor.getModule('toolbar');
    let videoButton = null;
    
    if (toolbar) {
      videoButton = toolbar.getButton('video');
    }
    
    // Fallback: find button by class in the current editor's toolbar
    if (!videoButton) {
      const toolbarContainer = toolbar?.getContainer();
      if (toolbarContainer) {
        videoButton = toolbarContainer.querySelector('.rich-editor-toolbar-btn.video-btn');
      }
    }
    
    // Final fallback: find any video button in the current editor's wrapper
    if (!videoButton) {
      videoButton = editor.wrapper.querySelector('.rich-editor-toolbar-btn.video-btn');
    }
    
    if (!videoButton) {
      console.warn('Video button not found for editor:', this.editorId);
      return;
    }
    
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
    
    // Check if current node is a video or iframe
    if ((node.tagName === 'VIDEO' || node.tagName === 'IFRAME') && 
        node.classList && node.classList.contains('inserted-video')) {
      return node;
    }
    
    // Check if selection contains a video or iframe
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
      // Check if it's a YouTube URL
      if (Video.isYouTubeUrl(url)) {
        resolve(true);
        return;
      }
      
      // Check if it's a valid video URL format
      const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
      const hasValidExtension = videoExtensions.some(ext => 
        url.toLowerCase().includes(`.${ext}`)
      );
      
      if (hasValidExtension) {
        resolve(true);
        return;
      }
      
      // Try to load as video element (for direct video URLs)
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        resolve(true);
      };
      video.onerror = () => {
        resolve(false);
      };
      
      // Set timeout to avoid hanging
      setTimeout(() => {
        resolve(false);
      }, 5000);
      
      video.src = url;
    });
  }

  /**
   * Check if URL is a YouTube URL
   * @param {string} url - URL to check
   * @returns {boolean} - Whether it's a YouTube URL
   */
  static isYouTubeUrl(url) {
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
    return youtubeRegex.test(url);
  }

  /**
   * Extract YouTube video ID from URL
   * @param {string} url - YouTube URL
   * @returns {string|null} - Video ID or null if not found
   */
  static getYouTubeVideoId(url) {
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);
    return match ? match[1] : null;
  }
}

export default Video; 