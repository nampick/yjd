import { BlockFormat } from '../core/format.js';
import TablePopup from '../ui/table-popup.js';

/**
 * Table Format - HTML table insertion
 */
class Table extends BlockFormat {
  static formatName = 'table';
  static tagName = 'TABLE';
  static savedRange = null; // Lưu vị trí con trỏ

  constructor() {
    super();
    // Create shared popup instance
    if (!Table.tablePopup) {
      Table.tablePopup = new TablePopup({
        onTableSelect: (tableData) => {
          Table.insertTable(tableData);
        }
      });
    }
    this.tablePopup = Table.tablePopup;
  }

  /**
   * Insert table at saved cursor position
   */
  static insertTable(tableData) {
    // Khôi phục vị trí con trỏ đã lưu
    if (!Table.savedRange) return;
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(Table.savedRange);
    
    const range = selection.getRangeAt(0);
    
    // Create table HTML
    const tableElement = Table.createTableElement(tableData.rows, tableData.cols);
    
    // Clear any selected content
    if (!range.collapsed) {
      range.deleteContents();
    }
    
    // Insert table
    range.insertNode(tableElement);
    
    // Position cursor in first cell
    const firstCell = tableElement.querySelector('td');
    if (firstCell) {
      const newRange = document.createRange();
      newRange.setStart(firstCell, 0);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
    
    // Clear saved range
    Table.savedRange = null;
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
        cell.innerHTML = '&nbsp;'; // Non-breaking space for empty cells
        cell.style.minWidth = '50px';
        cell.style.minHeight = '24px';
        cell.style.padding = '4px 8px';
        cell.style.border = '1px solid #ddd';
        cell.style.verticalAlign = 'top';
        
        // Make cells editable
        cell.contentEditable = 'true';
        
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
    // Lưu vị trí con trỏ hiện tại
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      Table.savedRange = selection.getRangeAt(0).cloneRange();
    }
    
    const tableButton = document.querySelector('.rich-editor-toolbar-btn.table-btn');
    if (!tableButton) return;
    
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
      table.parentNode.removeChild(table);
    }
  }
}

export default Table; 