import { InlineFormat } from '../core/format.js';
import ImportPopup from '../ui/import-popup.js';

/**
 * Import Format - Handles importing various file types
 */
class Import extends InlineFormat {
  static formatName = 'import';
  static tagName = 'DIV';
  static className = 'imported-content';

  constructor() {
    super();
    // Create import popup instance if not exists
    if (!Import.importPopupInstance) {
      Import.importPopupInstance = new ImportPopup({
        onImport: (content, fileType) => {
          Import.insertImportedContent(content, fileType);
        }
      });
    }
    this.importPopup = Import.importPopupInstance;
  }

  /**
   * Insert imported content at current cursor position
   * @param {string} content - Imported content
   * @param {string} fileType - Type of imported file
   */
  static insertImportedContent(content, fileType) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    try {
      const range = selection.getRangeAt(0);
      
      // Create content element based on file type
      let contentElement;
      
      if (fileType === 'html') {
        contentElement = Import.processHtmlContent(content);
      } else if (fileType === 'excel') {
        contentElement = Import.processExcelContent(content);
      } else if (fileType === 'pdf' || fileType === 'word') {
        contentElement = Import.processTextContent(content);
      } else {
        contentElement = Import.processTextContent(content);
      }
      
      // Insert content at cursor position
      range.deleteContents();
      range.insertNode(contentElement);
      
      // Position cursor after the content
      range.setStartAfter(contentElement);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
    } catch (error) {
      console.error('Error inserting imported content:', error);
    }
  }

  /**
   * Process HTML content
   * @param {string} htmlContent - HTML content to process
   * @returns {HTMLElement}
   */
  static processHtmlContent(htmlContent) {
    const container = document.createElement('div');
    container.className = 'imported-content html-content';
    
    // Create a temporary element to parse HTML safely
    const temp = document.createElement('div');
    temp.innerHTML = htmlContent;
    
    // Clean and transfer content
    Import.cleanHtmlContent(temp);
    container.appendChild(temp);
    
    return container;
  }

  /**
   * Process Excel content (CSV-like data)
   * @param {Array} data - Excel data as array of arrays
   * @returns {HTMLElement}
   */
  static processExcelContent(data) {
    const container = document.createElement('div');
    container.className = 'imported-content excel-content';
    
    if (!Array.isArray(data) || data.length === 0) {
      container.textContent = 'No data to import';
      return container;
    }
    
    // Create table
    const table = document.createElement('table');
    table.className = 'imported-table';
    
    // Add header row if available
    if (data.length > 0) {
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      
      data[0].forEach(cellData => {
        const th = document.createElement('th');
        th.textContent = cellData || '';
        headerRow.appendChild(th);
      });
      
      thead.appendChild(headerRow);
      table.appendChild(thead);
    }
    
    // Add data rows
    if (data.length > 1) {
      const tbody = document.createElement('tbody');
      
      for (let i = 1; i < data.length; i++) {
        const row = document.createElement('tr');
        
        data[i].forEach(cellData => {
          const td = document.createElement('td');
          td.textContent = cellData || '';
          row.appendChild(td);
        });
        
        tbody.appendChild(row);
      }
      
      table.appendChild(tbody);
    }
    
    container.appendChild(table);
    return container;
  }

  /**
   * Process plain text content (PDF, Word)
   * @param {string} textContent - Text content to process
   * @returns {HTMLElement}
   */
  static processTextContent(textContent) {
    const container = document.createElement('div');
    container.className = 'imported-content text-content';
    
    // Split into paragraphs and process
    const paragraphs = textContent.split(/\n\s*\n/);
    
    paragraphs.forEach(paragraph => {
      if (paragraph.trim()) {
        const p = document.createElement('p');
        p.textContent = paragraph.trim();
        container.appendChild(p);
      }
    });
    
    return container;
  }

  /**
   * Clean HTML content by removing dangerous elements and attributes
   * @param {HTMLElement} element - Element to clean
   */
  static cleanHtmlContent(element) {
    const allowedTags = ['p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                        'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'br', 
                        'table', 'thead', 'tbody', 'tr', 'th', 'td'];
    
    const allowedAttrs = ['class', 'style'];
    
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_ELEMENT,
      null,
      false
    );
    
    const elementsToRemove = [];
    
    while (walker.nextNode()) {
      const node = walker.currentNode;
      
      // Remove dangerous tags
      if (!allowedTags.includes(node.tagName.toLowerCase())) {
        elementsToRemove.push(node);
        continue;
      }
      
      // Clean attributes
      const attrs = Array.from(node.attributes);
      attrs.forEach(attr => {
        if (!allowedAttrs.includes(attr.name.toLowerCase())) {
          node.removeAttribute(attr.name);
        }
      });
    }
    
    // Remove dangerous elements
    elementsToRemove.forEach(el => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  }

  /**
   * Parse CSV content
   * @param {string} csvContent - CSV content
   * @returns {Array} - Array of arrays representing CSV data
   */
  static parseCSV(csvContent) {
    const lines = csvContent.split('\n');
    const result = [];
    
    lines.forEach(line => {
      if (line.trim()) {
        // Simple CSV parsing (doesn't handle quoted values with commas)
        const cells = line.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''));
        result.push(cells);
      }
    });
    
    return result;
  }

  /**
   * Apply import formatting - shows import popup
   */
  apply() {
    this.showImportPopup();
  }

  /**
   * Toggle import formatting - shows import popup
   */
  toggle() {
    if (this.importPopup.isVisible) {
      this.importPopup.hide();
    } else {
      this.showImportPopup();
    }
  }

  /**
   * Show import popup
   */
  showImportPopup() {
    const importButton = document.querySelector('.rich-editor-toolbar-btn.import-btn');
    if (!importButton) return;
    
    this.importPopup.show(importButton);
  }

  /**
   * Check if import formatting is active
   */
  isActive() {
    return false; // Import doesn't have an "active" state
  }

  /**
   * Get supported file types
   */
  static getSupportedTypes() {
    return {
      html: {
        extensions: ['.html', '.htm'],
        mimeTypes: ['text/html'],
        name: 'HTML Files'
      },
      excel: {
        extensions: ['.csv', '.xlsx', '.xls'],
        mimeTypes: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        name: 'Excel Files'
      },
      pdf: {
        extensions: ['.pdf'],
        mimeTypes: ['application/pdf'],
        name: 'PDF Files'
      },
      word: {
        extensions: ['.doc', '.docx'],
        mimeTypes: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        name: 'Word Documents'
      }
    };
  }
}

export default Import; 