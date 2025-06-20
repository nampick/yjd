import Module from '../core/module.js';

/**
 * Media Module - Handles media insertion and management
 * Extracted from MediaManager.js logic
 */
class Media extends Module {
  static DEFAULTS = {
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    enableDragDrop: true,
    enablePaste: true,
    uploadHandler: null // Custom upload handler
  };

  constructor(editor, options = {}) {
    super(editor, options);
    this.dragCounter = 0;
    this.uploadInProgress = false;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.createMediaDropzone();
  }

  /**
   * Setup event listeners for media handling
   */
  setupEventListeners() {
    if (this.options.enableDragDrop) {
      this.setupDragDropListeners();
    }
    
    if (this.options.enablePaste) {
      this.setupPasteListeners();
    }
  }

  /**
   * Setup drag and drop listeners - extracted from MediaManager
   */
  setupDragDropListeners() {
    const editor = this.editor.editor;

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      editor.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    // Highlight drop zone
    editor.addEventListener('dragenter', (e) => {
      this.dragCounter++;
      if (this.isValidDragEvent(e)) {
        this.showDropZone();
      }
    });

    editor.addEventListener('dragleave', (e) => {
      this.dragCounter--;
      if (this.dragCounter === 0) {
        this.hideDropZone();
      }
    });

    // Handle file drop
    editor.addEventListener('drop', (e) => {
      this.dragCounter = 0;
      this.hideDropZone();
      
      if (this.isValidDragEvent(e)) {
        this.handleFileDrop(e);
      }
    });
  }

  /**
   * Setup paste listeners for images
   */
  setupPasteListeners() {
    this.editor.editor.addEventListener('paste', (e) => {
      this.handlePaste(e);
    });
  }

  /**
   * Check if drag event contains files
   */
  isValidDragEvent(e) {
    return e.dataTransfer && e.dataTransfer.types.includes('Files');
  }

  /**
   * Create media drop zone overlay
   */
  createMediaDropzone() {
    this.dropZone = document.createElement('div');
    this.dropZone.className = 'rich-editor-dropzone';
    
    // Create text element  
    const dropText = document.createElement('div');
    dropText.className = 'rich-editor-dropzone-text';
    dropText.textContent = 'Drop files here to upload';
    
    const dropHint = document.createElement('div');
    dropHint.className = 'rich-editor-dropzone-hint';
    dropHint.textContent = 'Images and videos supported';
    
    this.dropZone.appendChild(dropText);
    this.dropZone.appendChild(dropHint);

    // Add to editor wrapper (ensure relative positioning for CSS)
    const wrapper = this.editor.wrapper;
    wrapper.appendChild(this.dropZone);
  }

  /**
   * Show drop zone
   */
  showDropZone() {
    if (this.dropZone) {
      this.dropZone.classList.add('active');
    }
  }

  /**
   * Hide drop zone
   */
  hideDropZone() {
    if (this.dropZone) {
      this.dropZone.classList.remove('active');
    }
  }

  /**
   * Handle file drop - extracted from handleFileDrop()
   */
  async handleFileDrop(e) {
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => this.isValidFile(file));

    if (validFiles.length === 0) {
      this.showError('No valid media files found');
      return;
    }

    // Get drop position
    const range = this.getDropRange(e);
    
    for (const file of validFiles) {
      await this.processFile(file, range);
    }
  }

  /**
   * Handle paste event - extracted from paste handling
   */
  async handlePaste(e) {
    const items = Array.from(e.clipboardData.items);
    const fileItems = items.filter(item => item.kind === 'file' && item.type.startsWith('image/'));

    if (fileItems.length === 0) return;

    e.preventDefault();

    for (const item of fileItems) {
      const file = item.getAsFile();
      if (file && this.isValidFile(file)) {
        await this.processFile(file);
      }
    }
  }

  /**
   * Get range at drop position
   */
  getDropRange(e) {
    let range;
    
    if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(e.clientX, e.clientY);
    } else if (document.caretPositionFromPoint) {
      const caret = document.caretPositionFromPoint(e.clientX, e.clientY);
      range = document.createRange();
      range.setStart(caret.offsetNode, caret.offset);
    }
    
    return range;
  }

  /**
   * Validate file type and size
   */
  isValidFile(file) {
    if (!this.options.allowedTypes.includes(file.type)) {
      this.showError(`File type ${file.type} not allowed`);
      return false;
    }
    
    if (file.size > this.options.maxFileSize) {
      this.showError(`File size exceeds ${this.options.maxFileSize / (1024 * 1024)}MB limit`);
      return false;
    }
    
    return true;
  }

  /**
   * Process uploaded file
   */
  async processFile(file, range = null) {
    try {
      this.uploadInProgress = true;
      this.showUploadProgress();

      let url;
      
      if (this.options.uploadHandler && typeof this.options.uploadHandler === 'function') {
        // Use custom upload handler
        url = await this.options.uploadHandler(file);
      } else {
        // Convert to base64
        url = await this.fileToBase64(file);
      }

      if (url) {
        this.insertMedia(file.type, url, range);
      }

    } catch (error) {
      console.error('Upload failed:', error);
      this.showError('Upload failed: ' + error.message);
    } finally {
      this.uploadInProgress = false;
      this.hideUploadProgress();
    }
  }

  /**
   * Convert file to base64
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Insert media into editor - extracted from insertImageWithStyle()
   */
  insertMedia(type, url, range = null) {
    const selection = window.getSelection();
    
    // Use provided range or current selection
    if (range) {
      selection.removeAllRanges();
      selection.addRange(range);
    } else if (!selection.rangeCount) {
      return;
    }

    const currentRange = selection.getRangeAt(0);
    
    if (type.startsWith('image/')) {
      this.insertImage(url, currentRange);
    } else if (type.startsWith('video/')) {
      this.insertVideo(url, currentRange);
    }
  }

  /**
   * Insert image with styling
   */
  insertImage(url, range) {
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Uploaded image';
    img.setAttribute('data-resizable', 'true');
    
    // Apply default styling - using CSS classes
    img.classList.add('align-center'); // Default to center alignment

    range.deleteContents();
    range.insertNode(img);
    
    // Move cursor after image
    range.setStartAfter(img);
    range.collapse(true);
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Insert video element
   */
  insertVideo(url, range) {
    const video = document.createElement('video');
    video.src = url;
    video.controls = true;
    // Styling handled by CSS (.rich-editor-area video)

    range.deleteContents();
    range.insertNode(video);
    
    // Move cursor after video
    range.setStartAfter(video);
    range.collapse(true);
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Show upload progress
   */
  showUploadProgress() {
    // Create or show progress indicator
    if (!this.progressIndicator) {
      this.progressIndicator = document.createElement('div');
      this.progressIndicator.className = 'rich-editor-progress';
      
      const progressText = document.createElement('div');
      progressText.className = 'rich-editor-progress-text';
      progressText.textContent = 'Uploading...';
      
      this.progressIndicator.appendChild(progressText);
      document.body.appendChild(this.progressIndicator);
    }
    
    this.progressIndicator.classList.add('visible');
  }

  /**
   * Hide upload progress
   */
  hideUploadProgress() {
    if (this.progressIndicator) {
      this.progressIndicator.classList.remove('visible');
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    // Create or show error message
    if (!this.errorIndicator) {
      this.errorIndicator = document.createElement('div');
      this.errorIndicator.className = 'rich-editor-error';
      
      const errorTitle = document.createElement('div');
      errorTitle.className = 'rich-editor-error-title';
      errorTitle.textContent = 'Upload Error';
      
      const errorMessage = document.createElement('div');
      errorMessage.className = 'rich-editor-error-message';
      
      this.errorIndicator.appendChild(errorTitle);
      this.errorIndicator.appendChild(errorMessage);
      document.body.appendChild(this.errorIndicator);
    }
    
    const errorMessage = this.errorIndicator.querySelector('.rich-editor-error-message');
    errorMessage.textContent = message;
    this.errorIndicator.classList.add('visible');
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      if (this.errorIndicator) {
        this.errorIndicator.classList.remove('visible');
      }
    }, 5000);
  }

  /**
   * Insert media with URL prompt
   */
  insertWithPrompt(type = 'image') {
    const url = prompt(`Enter ${type} URL:`, 'https://');
    if (url && url.trim()) {
      const mimeType = type === 'image' ? 'image/jpeg' : 'video/mp4';
      this.insertMedia(mimeType, url.trim());
    }
  }

  /**
   * Get all media elements in editor
   */
  getAllMedia() {
    const images = Array.from(this.editor.editor.querySelectorAll('img'));
    const videos = Array.from(this.editor.editor.querySelectorAll('video'));
    return [...images, ...videos];
  }

  /**
   * Remove media element
   */
  removeMedia(element) {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }

  /**
   * Destroy module
   */
  destroy() {
    this.dragCounter = 0;
    
    if (this.dropZone && this.dropZone.parentNode) {
      this.dropZone.parentNode.removeChild(this.dropZone);
    }
    
    if (this.progressIndicator && this.progressIndicator.parentNode) {
      this.progressIndicator.parentNode.removeChild(this.progressIndicator);
    }
    
    if (this.errorIndicator && this.errorIndicator.parentNode) {
      this.errorIndicator.parentNode.removeChild(this.errorIndicator);
    }
    
    this.dropZone = null;
    this.progressIndicator = null;
    this.errorIndicator = null;
  }
}

export default Media; 