/**
 * Import Popup Component - Popup for importing various file types
 */
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
    typeLabel.textContent = 'File Type:';
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
    
    // File input
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.className = 'import-file-input';
    this.fileInput.disabled = true;
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    
    content.appendChild(this.fileInput);
    
    // File info
    this.fileInfo = document.createElement('div');
    this.fileInfo.className = 'import-file-info';
    this.fileInfo.style.display = 'none';
    content.appendChild(this.fileInfo);
    
    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'import-button-container';
    
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'import-button cancel-button';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => this.hide());
    
    this.importButton = document.createElement('button');
    this.importButton.type = 'button';
    this.importButton.className = 'import-button import-button-main';
    this.importButton.textContent = 'Import';
    this.importButton.disabled = true;
    this.importButton.addEventListener('click', () => this.processImport());
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(this.importButton);
    content.appendChild(buttonContainer);
    
    this.popup.appendChild(content);
    document.body.appendChild(this.popup);
  }

  updateFileInput() {
    const selectedType = this.typeSelect.value;
    
    if (selectedType) {
      this.fileType = selectedType;
      this.fileInput.disabled = false;
      
      const acceptTypes = this.getAcceptTypes(selectedType);
      this.fileInput.accept = acceptTypes;
    } else {
      this.fileType = null;
      this.fileInput.disabled = true;
      this.fileInput.accept = '';
    }
    
    this.updateImportButton();
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
    
    this.fileInfo.style.display = 'block';
    this.fileInfo.innerHTML = `
      <div><strong>Name:</strong> ${file.name}</div>
      <div><strong>Size:</strong> ${this.formatFileSize(file.size)}</div>
      <div><strong>Type:</strong> ${file.type || 'Unknown'}</div>
    `;
    
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
    this.importButton.disabled = !this.selectedFile || !this.fileType;
  }

  async processImport() {
    if (!this.selectedFile || !this.fileType) return;
    
    try {
      let content;
      
      if (this.fileType === 'html') {
        content = await this.readAsText(this.selectedFile);
      } else if (this.fileType === 'excel') {
        if (this.selectedFile.name.toLowerCase().endsWith('.csv')) {
          const csvContent = await this.readAsText(this.selectedFile);
          content = this.parseCSV(csvContent);
        } else {
          alert('Excel files (.xlsx/.xls) require additional libraries. Please use CSV format.');
          return;
        }
      } else if (this.fileType === 'pdf') {
        alert('PDF import requires additional libraries. Feature coming soon.');
        return;
      } else if (this.fileType === 'word') {
        alert('Word document import requires additional libraries. Feature coming soon.');
        return;
      }
      
      if (this.options.onImport) {
        this.options.onImport(content, this.fileType);
      }
      
      this.hide();
      this.reset();
      
    } catch (error) {
      console.error('Import error:', error);
      alert('Error importing file: ' + error.message);
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
    this.updateImportButton();
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
    const popupWidth = 400;
    const popupHeight = 350;
    
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

export default ImportPopup; 