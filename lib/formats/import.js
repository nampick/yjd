import { InlineFormat } from '../core/format.js';
import ImportPopup from '../ui/import-popup.js';
import Editor from '../core/editor.js';
import { sanitizeHtml } from '../utils/sanitize.js';
import { registerIcons, S } from '../ui/icons.js';

registerIcons({
  import: S('<path d="M12 3v12"/><path d="m8 11 4 4 4-4"/><path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4"/>')
});

/**
 * Import Format - Handles importing various file types
 * Now supports multiple editor instances with separate popup instances
 */
class Import extends InlineFormat {
  static formatName = 'import';
  static tagName = 'DIV';
  static className = 'imported-content';

  constructor() {
    super();
    
    // Get current editor instance
    const currentEditor = Editor.getCurrentInstance();
    if (!currentEditor) {
      console.warn('No editor instance found for Import format');
      return;
    }
    
    this.editorId = currentEditor.instanceId;
    
    // Check if this editor already has an import popup instance
    let importPopup = currentEditor.getPopupInstance('import');
    
    if (!importPopup) {
      // Create new import popup instance for this editor
      importPopup = new ImportPopup({
        onImport: (content, fileType) => {
          Import.insertImportedContent(content, fileType, this.editorId);
        },
        editor: currentEditor,
        editorId: this.editorId
      });
      
      // Store popup instance in editor
      currentEditor.setPopupInstance('import', importPopup);
    }
    
    this.importPopup = importPopup;
  }

  /**
   * Create a new Import format instance for a specific editor
   * @param {string} editorId - Editor instance ID
   * @returns {Import} Import format instance
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
    const format = new Import();
    
    // Restore original current instance
    Editor.currentInstance = originalCurrent;
    
    return format;
  }

  /**
   * Insert imported content at current cursor position
   * @param {string} content - Imported content
   * @param {string} fileType - Type of imported file
   * @param {string} editorId - Editor instance ID
   */
  static insertImportedContent(content, fileType, editorId = null) {
    // Get the correct editor instance
    let editor = null;
    if (editorId) {
      editor = Editor.getInstanceById(editorId);
    } else {
      editor = Editor.getCurrentInstance();
    }
    
    if (!editor) {
      console.warn('No editor instance found for content insertion');
      return;
    }
    
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
      
      // Trigger content change event
      if (editor && typeof editor.onContentChange === 'function') {
        editor.onContentChange();
      }
      
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

    // Sanitize untrusted HTML (DOMParser-based, inert) before inserting it.
    // sanitizeHtml strips scripts, event handlers and unsafe URLs.
    container.innerHTML = sanitizeHtml(htmlContent);

    // Additionally enforce the import tag/attribute whitelist.
    Import.cleanHtmlContent(container);

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
    // Find import button in the current editor's toolbar
    const editor = Editor.getInstanceById(this.editorId);
    if (!editor) return;
    
    const toolbar = editor.getModule('toolbar');
    let importButton = null;
    
    if (toolbar) {
      importButton = toolbar.getButton('import');
    }
    
    // Fallback: find button by class in the current editor's toolbar
    if (!importButton) {
      const toolbarContainer = toolbar?.getContainer();
      if (toolbarContainer) {
        importButton = toolbarContainer.querySelector('.rich-editor-toolbar-btn.import-btn');
      }
    }
    
    // Final fallback: find any import button in the current editor's wrapper
    if (!importButton) {
      importButton = editor.wrapper.querySelector('.rich-editor-toolbar-btn.import-btn');
    }
    
    if (!importButton) {
      console.warn('Import button not found for editor:', this.editorId);
      return;
    }
    
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