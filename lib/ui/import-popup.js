/**
 * Import Popup Component - Popup for importing various file types
 */
import { appendPopup, calculatePopupPosition, setPopupPosition } from '../utils/popup-helper.js';

class ImportPopup {
  constructor(options = {}) {
    this.options = {
      onImport: null,
      ...options
    };
    
    this.popup = null;
    this.isVisible = false;
    this.clickOutsideHandler = null;
    this.selectedFile = null;
    this.fileType = null;
    
    this.createImportPopup();
  }

  createImportPopup() {
    this.popup = document.createElement('div');
    this.popup.className = 'import-popup';
    
    const content = document.createElement('div');
    content.className = 'import-popup-content';
    
    // Title
    const title = document.createElement('h3');
    title.textContent = 'Import File';
    title.className = 'import-popup-title';
    content.appendChild(title);
    
    // File type selector
    const typeContainer = document.createElement('div');
    typeContainer.className = 'import-type-container';
    
    const typeLabel = document.createElement('label');
    typeLabel.textContent = 'File Type';
    typeLabel.className = 'import-input-label';
    
    this.typeSelect = document.createElement('select');
    this.typeSelect.className = 'import-type-select';
    this.typeSelect.innerHTML = `
      <option value="">Select file type...</option>
      <option value="html">HTML (.html, .htm)</option>
      <option value="excel">Excel/CSV (.csv, .xlsx, .xls)</option>
      <option value="pdf">PDF (.pdf)</option>
      <option value="word">Word (.doc, .docx)</option>
    `;
    this.typeSelect.addEventListener('change', () => this.updateFileInput());
    
    typeContainer.appendChild(typeLabel);
    typeContainer.appendChild(this.typeSelect);
    content.appendChild(typeContainer);

    // Hidden file input fronted by the drop/browse area below.
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.className = 'image-input-hidden';
    this.fileInput.disabled = true;
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    content.appendChild(this.fileInput);

    // Drop/browse area — inert until a type is chosen (the type drives accept).
    this.dropArea = document.createElement('div');
    this.dropArea.className = 'import-drop-area';
    this.dropArea.innerHTML =
      '<span class="import-drop-ic"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4"></path><path d="m7 9 5-5 5 5"></path><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"></path></svg></span>' +
      '<span class="import-drop-hint">Choose a type first, then drop a file here or browse.</span>';
    this.dropHint = this.dropArea.querySelector('.import-drop-hint');
    this.dropArea.addEventListener('click', () => {
      if (this.fileType) this.fileInput.click();
    });
    this.dropArea.addEventListener('dragover', (e) => {
      if (!this.fileType) return;
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
        e.preventDefault();
        this.dropArea.classList.add('drag');
      }
    });
    this.dropArea.addEventListener('dragleave', () => this.dropArea.classList.remove('drag'));
    this.dropArea.addEventListener('drop', (e) => {
      this.dropArea.classList.remove('drag');
      if (!this.fileType) return;
      const files = e.dataTransfer && e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
      if (!files.length) return;
      e.preventDefault();
      e.stopPropagation();
      this.setSelectedFile(files[0]);
    });
    content.appendChild(this.dropArea);

    // Selected-file row (.import-file-info): icon tile + name + size · MIME + X.
    this.fileInfo = document.createElement('div');
    this.fileInfo.className = 'import-file-info';
    this.fileInfo.style.display = 'none';
    content.appendChild(this.fileInfo);

    // Inline "needs extra libraries" notice — replaces the post-pick alert().
    this.notice = document.createElement('div');
    this.notice.className = 'yjd-popup-notice';
    this.notice.style.display = 'none';
    content.appendChild(this.notice);
    
    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'yjd-button-container';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'yjd-button-cancel';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => this.hide());

    this.importButton = document.createElement('button');
    this.importButton.type = 'button';
    this.importButton.className = 'yjd-button-confirm button-disable';
    this.importButton.textContent = 'Import';
    this.importButton.disabled = true;
    this.importButton.addEventListener('click', () => this.processImport());
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(this.importButton);
    content.appendChild(buttonContainer);
    
    this.popup.appendChild(content);
    appendPopup(this.popup);
  }

  updateFileInput() {
    const selectedType = this.typeSelect.value;

    if (selectedType) {
      this.fileType = selectedType;
      this.fileInput.disabled = false;
      this.fileInput.accept = this.getAcceptTypes(selectedType);
      this.dropArea.classList.add('ready');
      this.dropHint.textContent = 'Drop a file here or browse.';
    } else {
      this.fileType = null;
      this.fileInput.disabled = true;
      this.fileInput.accept = '';
      this.dropArea.classList.remove('ready');
      this.dropHint.textContent = 'Choose a type first, then drop a file here or browse.';
    }

    this._syncNotice();
    this.updateImportButton();
  }

  /**
   * Unsupported combinations surface INSIDE the popup, with the confirm button
   * held disabled — not as an alert() after the user already picked a file.
   * Returns true when the current type/file needs libraries the core doesn't
   * bundle (PDF, Word, .xlsx/.xls).
   */
  _unsupportedReason() {
    if (this.fileType === 'pdf') {
      return 'PDF import needs libraries the core doesn’t bundle.';
    }
    if (this.fileType === 'word') {
      return 'Word import needs libraries the core doesn’t bundle.';
    }
    if (this.fileType === 'excel' && this.selectedFile &&
        !/\.csv$/i.test(this.selectedFile.name || '')) {
      return 'Excel files (.xlsx/.xls) need extra libraries — export as CSV instead.';
    }
    return null;
  }

  _syncNotice() {
    const reason = this._unsupportedReason();
    if (reason) {
      this.notice.style.display = 'flex';
      this.notice.innerHTML =
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>' +
        '<span></span>';
      this.notice.querySelector('span').textContent = reason;
    } else {
      this.notice.style.display = 'none';
    }
  }

  getAcceptTypes(fileType) {
    const types = {
      html: '.html,.htm,text/html',
      excel: '.csv,.xlsx,.xls,text/csv',
      pdf: '.pdf,application/pdf',
      word: '.doc,.docx'
    };
    
    return types[fileType] || '';
  }

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      this.setSelectedFile(file);
    }
  }

  setSelectedFile(file) {
    this.selectedFile = file;

    this.fileInfo.style.display = 'flex';
    this.fileInfo.innerHTML =
      '<span class="import-file-ic"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg></span>' +
      '<span class="import-file-meta"><span class="import-file-name"></span><span class="import-file-size"></span></span>' +
      '<button type="button" class="import-file-x" aria-label="Remove file"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button>';
    this.fileInfo.querySelector('.import-file-name').textContent = file.name || '';
    this.fileInfo.querySelector('.import-file-size').textContent =
      this.formatFileSize(file.size) + (file.type ? ` · ${file.type}` : '');
    this.fileInfo.querySelector('.import-file-x').addEventListener('click', () => this.clearSelectedFile());
    this.dropArea.style.display = 'none';

    this._syncNotice();
    this.updateImportButton();
  }

  clearSelectedFile() {
    this.selectedFile = null;
    this.fileInput.value = '';
    this.fileInfo.style.display = 'none';
    this.fileInfo.innerHTML = '';
    this.dropArea.style.display = 'flex';
    this._syncNotice();
    this.updateImportButton();
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  updateImportButton() {
    const blocked = !!this._unsupportedReason();
    const disabled = !this.selectedFile || !this.fileType || blocked;
    this.importButton.disabled = disabled;
    this.importButton.classList.toggle('button-disable', disabled);
  }

  async processImport() {
    if (!this.selectedFile || !this.fileType || this._unsupportedReason()) return;

    try {
      let content;

      if (this.fileType === 'html') {
        content = await this.readAsText(this.selectedFile);
      } else if (this.fileType === 'excel') {
        const csvContent = await this.readAsText(this.selectedFile);
        content = this.parseCSV(csvContent);
      }

      if (this.options.onImport) {
        this.options.onImport(content, this.fileType);
      }

      this.hide();
      this.reset();

    } catch (error) {
      console.error('Import error:', error);
      this.notice.style.display = 'flex';
      this.notice.innerHTML =
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>' +
        '<span></span>';
      this.notice.querySelector('span').textContent = 'Error importing file: ' + error.message;
    }
  }

  parseCSV(csvContent) {
    const lines = csvContent.split('\n');
    const result = [];
    
    lines.forEach(line => {
      if (line.trim()) {
        const cells = line.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''));
        result.push(cells);
      }
    });
    
    return result;
  }

  readAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  reset() {
    this.selectedFile = null;
    this.fileType = null;
    this.typeSelect.value = '';
    this.fileInput.value = '';
    this.fileInput.disabled = true;
    this.fileInfo.style.display = 'none';
    this.fileInfo.innerHTML = '';
    this.dropArea.style.display = 'flex';
    this.dropArea.classList.remove('ready', 'drag');
    this.dropHint.textContent = 'Choose a type first, then drop a file here or browse.';
    this.notice.style.display = 'none';
    this.updateImportButton();
  }

  setupClickOutside() {
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler);
    }
    
    this.clickOutsideHandler = (e) => {
      // A click on the file row's ✕ detaches the target before this handler
      // runs — a detached target is never "outside" the popup.
      if (e.target && !e.target.isConnected) return;
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

export default ImportPopup; 