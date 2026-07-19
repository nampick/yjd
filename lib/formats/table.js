import { BlockFormat } from '../core/format.js';
import TablePopup from '../ui/table-popup.js';
import Editor from '../core/editor.js';
import { registerIcons, S } from '../ui/icons.js';

registerIcons({
  table: S('<path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>')
});

/**
 * Table Format - HTML table insertion
 * Now supports multiple editor instances with separate popup instances
 */
class Table extends BlockFormat {
  static formatName = 'table';
  static tagName = 'TABLE';
  static savedRanges = new Map(); // Map to store saved ranges for each editor

  constructor() {
    super();
    
    // Get current editor instance
    const currentEditor = Editor.getCurrentInstance();
    if (!currentEditor) {
      console.warn('No editor instance found for Table format');
      return;
    }
    
    this.editorId = currentEditor.instanceId;
    
    // Check if this editor already has a table popup instance
    let tablePopup = currentEditor.getPopupInstance('table');
    
    if (!tablePopup) {
      // Create new table popup instance for this editor
      tablePopup = new TablePopup({
        onTableSelect: (tableData) => {
          Table.insertTable(tableData, this.editorId);
        },
        editor: currentEditor,
        editorId: this.editorId
      });
      
      // Store popup instance in editor
      currentEditor.setPopupInstance('table', tablePopup);
    }
    
    this.tablePopup = tablePopup;
  }

  /**
   * Create a new Table format instance for a specific editor
   * @param {string} editorId - Editor instance ID
   * @returns {Table} Table format instance
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
    const format = new Table();
    
    // Restore original current instance
    Editor.currentInstance = originalCurrent;
    
    return format;
  }

  /**
   * Insert table at saved cursor position
   * @param {Object} tableData - Table data with rows and cols
   * @param {string} editorId - Editor instance ID
   */
  static insertTable(tableData, editorId = null) {
    // Get the correct editor instance
    let editor = null;
    if (editorId) {
      editor = Editor.getInstanceById(editorId);
    } else {
      editor = Editor.getCurrentInstance();
    }
    
    if (!editor) {
      console.warn('No editor instance found for table insertion');
      return;
    }
    
    // Get saved range for this editor
    const savedRange = Table.savedRanges.get(editorId);
    if (!savedRange) return;
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedRange);
    
    const range = selection.getRangeAt(0);

    // Create table HTML
    const tableElement = Table.createTableElement(tableData.rows, tableData.cols);

    // Clear any selected content
    if (!range.collapsed) {
      range.deleteContents();
    }

    // Insert the table as a top-level block (not nested inside a heading or
    // inline formatting tags, which would produce invalid HTML).
    if (typeof editor.insertBlock === 'function') {
      editor.insertBlock(tableElement);
    } else {
      range.insertNode(tableElement);
    }

    // Position cursor in first cell
    const firstCell = tableElement.querySelector('td');
    if (firstCell) {
      const newRange = document.createRange();
      newRange.setStart(firstCell, 0);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
    
    // Clear saved range for this editor
    Table.savedRanges.delete(editorId);
    
    // Trigger content change event
    if (editor && typeof editor.onContentChange === 'function') {
      editor.onContentChange();
    }
  }

  /**
   * Create table element
   */
  static createTableElement(rows, cols) {
    const table = document.createElement('table');
    table.className = 'rich-editor-table';
    table.cellSpacing = '0';
    table.cellPadding = '0';
    table.border = '1';
    
    const tbody = document.createElement('tbody');
    
    for (let r = 0; r < rows; r++) {
      const row = document.createElement('tr');
      
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement('td');
        cell.innerHTML = '<br>'; // empty placeholder (keeps height, not counted as content)
        cell.style.minWidth = '50px';
        cell.style.minHeight = '24px';
        cell.style.padding = '4px 8px';
        cell.style.border = '1px solid #ddd';
        cell.style.verticalAlign = 'top';
        // Cells are editable by inheritance from the editor's contentEditable
        // root; setting it per-cell would leak contenteditable="true" into the
        // exported HTML (and be inconsistent with cells loaded from markup).
        row.appendChild(cell);
      }
      
      tbody.appendChild(row);
    }
    
    table.appendChild(tbody);
    
    // Add table styles
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.margin = '10px 0';
    
    return table;
  }

  /**
   * Toggle table popup
   */
  toggle() {
    if (this.tablePopup.isVisible) {
      this.tablePopup.hide();
    } else {
      this.showPopup();
    }
  }

  /**
   * Show table popup
   */
  showPopup() {
    // Lưu vị trí con trỏ hiện tại cho editor này
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      Table.savedRanges.set(this.editorId, selection.getRangeAt(0).cloneRange());
    }
    
    // Find table button in the current editor's toolbar
    const editor = Editor.getInstanceById(this.editorId);
    if (!editor) return;
    
    const toolbar = editor.getModule('toolbar');
    let tableButton = null;
    
    if (toolbar) {
      tableButton = toolbar.getButton('table');
    }
    
    // Fallback: find button by class in the current editor's toolbar
    if (!tableButton) {
      const toolbarContainer = toolbar?.getContainer();
      if (toolbarContainer) {
        tableButton = toolbarContainer.querySelector('.rich-editor-toolbar-btn.table-btn');
      }
    }
    
    // Final fallback: find any table button in the current editor's wrapper
    if (!tableButton) {
      tableButton = editor.wrapper.querySelector('.rich-editor-toolbar-btn.table-btn');
    }
    
    if (!tableButton) {
      console.warn('Table button not found for editor:', this.editorId);
      return;
    }
    
    this.tablePopup.show(tableButton);
  }

  /**
   * Check if cursor is in a table
   */
  isActive() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return false;
    
    let node = selection.getRangeAt(0).startContainer;
    
    // Find parent table element
    while (node && node !== document.body) {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'TABLE') {
        return true;
      }
      node = node.parentNode;
    }
    
    return false;
  }

  /**
   * Get current table if cursor is in one
   */
  getCurrentTable() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;
    
    let node = selection.getRangeAt(0).startContainer;
    
    // Find parent table element
    while (node && node !== document.body) {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'TABLE') {
        return node;
      }
      node = node.parentNode;
    }
    
    return null;
  }

  /**
   * Apply table formatting (not applicable for this format)
   */
  apply() {
    this.showPopup();
  }

  /**
   * Remove table formatting
   */
  remove() {
    const table = this.getCurrentTable();
    if (table) {
      // Hide resize handles before removing table
      if (window.richEditor && window.richEditor.resizeHandles) {
        window.richEditor.resizeHandles.hideHandles();
      }
      table.parentNode.removeChild(table);
    }
  }
}

export default Table; 