import Module from '../core/module.js';

/**
 * Table Module - Handles table functionality
 * Extracted from TableManager.js logic
 */
class Table extends Module {
  static DEFAULTS = {
    defaultRows: 3,
    defaultCols: 3,
    maxRows: 20,
    maxCols: 10,
    showToolbar: true,
    resizable: true
  };

  constructor(editor, options = {}) {
    console.log('[DEBUG] Table module constructor called');
    super(editor, options);
    this.selectedTable = null;
    this.selectedCell = null;
    this.tableToolbar = null;
    this.resizeHandles = null;
    
    this.init();
    console.log('[DEBUG] Table module initialized successfully');
  }

  init() {
    this.createTableUI();
    this.setupEventListeners();
    
    // Debug: Test popup immediately
    setTimeout(() => {
      console.log('[DEBUG] Testing popup visibility...');
      this.testPopup();
    }, 2000);
  }

  /**
   * Debug method to test popup
   */
  testPopup() {
    if (this.tablePopup) {
      console.log('[DEBUG] Popup element exists, testing display...');
      this.tablePopup.style.display = 'block';
      this.tablePopup.style.left = '50px';
      this.tablePopup.style.top = '50px';
      this.tablePopup.style.backgroundColor = 'red'; // Temporary red bg for visibility
      
      setTimeout(() => {
        this.tablePopup.style.display = 'none';
        this.tablePopup.style.backgroundColor = 'white';
      }, 3000);
    } else {
      console.error('[ERROR] Popup element not found in testPopup');
    }
  }

  /**
   * Create table UI elements - extracted from createTableUI()
   */
  createTableUI() {
    console.log('[DEBUG] Creating table UI');
    
    // Create table popup for insertion
    this.tablePopup = document.createElement('div');
    this.tablePopup.id = 'table-popup';
    this.tablePopup.className = 'table-popup';
    this.tablePopup.style.display = 'none';
    this.tablePopup.style.position = 'absolute';
    this.tablePopup.style.background = 'white';
    this.tablePopup.style.border = '1px solid #ccc';
    this.tablePopup.style.borderRadius = '4px';
    this.tablePopup.style.padding = '10px';
    this.tablePopup.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    this.tablePopup.style.zIndex = '9999';
    this.tablePopup.style.minWidth = '200px';
    this.tablePopup.style.maxWidth = '300px';

    console.log('[DEBUG] Table popup created:', this.tablePopup);

    // Create table grid selector
    this.createTableGridSelector();

    // Create table toolbar
    if (this.options.showToolbar) {
      this.createTableToolbar();
    }

    // Add to editor wrapper
    console.log('[DEBUG] Editor wrapper:', this.editor.wrapper);
    this.editor.wrapper.appendChild(this.tablePopup);
    console.log('[DEBUG] Table popup added to editor wrapper');
  }

  /**
   * Create table grid selector - extracted from TableManager
   */
  createTableGridSelector() {
    console.log('[DEBUG] Creating table grid selector');
    
    const gridContainer = document.createElement('div');
    gridContainer.className = 'table-grid-selector';
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = `repeat(${this.options.maxCols}, 20px)`;
    gridContainer.style.gap = '2px';
    gridContainer.style.padding = '5px';

    console.log('[DEBUG] Grid container created with', this.options.maxRows, 'x', this.options.maxCols);

    for (let row = 0; row < this.options.maxRows; row++) {
      for (let col = 0; col < this.options.maxCols; col++) {
        const cell = document.createElement('div');
        cell.style.width = '20px';
        cell.style.height = '20px';
        cell.style.border = '1px solid #ddd';
        cell.style.cursor = 'pointer';
        cell.style.backgroundColor = '#f9f9f9'; // Make cells more visible
        cell.dataset.row = row + 1;
        cell.dataset.col = col + 1;

        cell.addEventListener('mouseenter', () => {
          this.highlightTableGrid(row + 1, col + 1);
        });

        cell.addEventListener('click', () => {
          console.log('[DEBUG] Grid cell clicked:', row + 1, 'x', col + 1);
          this.insertTable(row + 1, col + 1);
          this.hideTablePopup();
        });

        gridContainer.appendChild(cell);
      }
    }

    console.log('[DEBUG] Grid cells created:', this.options.maxRows * this.options.maxCols);

    // Add size indicator
    this.tableSizeIndicator = document.createElement('div');
    this.tableSizeIndicator.style.textAlign = 'center';
    this.tableSizeIndicator.style.fontSize = '12px';
    this.tableSizeIndicator.style.color = '#666';
    this.tableSizeIndicator.style.marginTop = '5px';
    this.tableSizeIndicator.textContent = '1 × 1';

    this.tablePopup.appendChild(gridContainer);
    this.tablePopup.appendChild(this.tableSizeIndicator);
    
    console.log('[DEBUG] Grid selector added to popup');
  }

  /**
   * Create table toolbar - extracted from createTableToolbarButtons()
   */
  createTableToolbar() {
    this.tableToolbar = document.createElement('div');
    this.tableToolbar.className = 'table-toolbar';
    this.tableToolbar.style.display = 'none';
    this.tableToolbar.style.position = 'absolute';
    this.tableToolbar.style.background = 'white';
    this.tableToolbar.style.border = '1px solid #ccc';
    this.tableToolbar.style.borderRadius = '4px';
    this.tableToolbar.style.padding = '5px';
    this.tableToolbar.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    this.tableToolbar.style.zIndex = '1001';

    // Create toolbar buttons
    const buttons = [
      { cmd: 'addRowBefore', icon: '⬆️', title: 'Insert row above' },
      { cmd: 'addRowAfter', icon: '⬇️', title: 'Insert row below' },
      { cmd: 'addColBefore', icon: '⬅️', title: 'Insert column left' },
      { cmd: 'addColAfter', icon: '➡️', title: 'Insert column right' },
      { cmd: 'deleteRow', icon: '🗑️', title: 'Delete row' },
      { cmd: 'deleteCol', icon: '🗑️', title: 'Delete column' },
      { cmd: 'deleteTable', icon: '❌', title: 'Delete table' }
    ];

    buttons.forEach(({ cmd, icon, title }) => {
      const button = document.createElement('button');
      button.textContent = icon;
      button.title = title;
      button.style.margin = '2px';
      button.style.padding = '4px 8px';
      button.style.border = '1px solid #ccc';
      button.style.borderRadius = '3px';
      button.style.background = 'white';
      button.style.cursor = 'pointer';

      button.addEventListener('click', () => {
        this.handleTableCommand(cmd);
      });

      this.tableToolbar.appendChild(button);
    });

    this.editor.wrapper.appendChild(this.tableToolbar);
  }

  /**
   * Highlight table grid cells
   */
  highlightTableGrid(rows, cols) {
    const cells = this.tablePopup.querySelectorAll('[data-row][data-col]');
    cells.forEach(cell => {
      const cellRow = parseInt(cell.dataset.row);
      const cellCol = parseInt(cell.dataset.col);
      
      if (cellRow <= rows && cellCol <= cols) {
        cell.style.background = '#e3f2fd';
      } else {
        cell.style.background = 'white';
      }
    });

    this.tableSizeIndicator.textContent = `${rows} × ${cols}`;
  }

  /**
   * Insert table - extracted from insertTable()
   */
  insertTable(rows, cols) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    
    // Create table
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.margin = '10px 0';
    table.style.border = '1px solid #ddd';

    // Create table body
    const tbody = document.createElement('tbody');
    
    for (let row = 0; row < rows; row++) {
      const tr = document.createElement('tr');
      
      for (let col = 0; col < cols; col++) {
        const td = document.createElement('td');
        td.style.border = '1px solid #ddd';
        td.style.padding = '8px';
        td.style.minWidth = '80px';
        td.innerHTML = '&nbsp;';
        tr.appendChild(td);
      }
      
      tbody.appendChild(tr);
    }
    
    table.appendChild(tbody);

    // Insert table
    range.deleteContents();
    range.insertNode(table);

    // Move cursor to first cell
    const firstCell = table.querySelector('td');
    if (firstCell) {
      range.selectNodeContents(firstCell);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    return table;
  }

  /**
   * Show table popup at position
   */
  showTablePopup(x, y) {
    console.log('[DEBUG] showTablePopup called with x:', x, 'y:', y);
    console.log('[DEBUG] tablePopup element:', this.tablePopup);
    
    if (!this.tablePopup) {
      console.error('[ERROR] Table popup element not found');
      return;
    }
    
    this.tablePopup.style.display = 'block';
    this.tablePopup.style.left = x + 'px';
    this.tablePopup.style.top = y + 'px';
    
    console.log('[DEBUG] Table popup styles after showing:', {
      display: this.tablePopup.style.display,
      left: this.tablePopup.style.left,
      top: this.tablePopup.style.top,
      visibility: getComputedStyle(this.tablePopup).visibility,
      position: getComputedStyle(this.tablePopup).position
    });
  }

  /**
   * Hide table popup
   */
  hideTablePopup() {
    this.tablePopup.style.display = 'none';
  }

  /**
   * Show table toolbar for selected table
   */
  showTableToolbar(table) {
    if (!this.tableToolbar || !table) return;

    this.selectedTable = table;
    const rect = table.getBoundingClientRect();
    const editorRect = this.editor.wrapper.getBoundingClientRect();

    this.tableToolbar.style.display = 'block';
    this.tableToolbar.style.left = (rect.left - editorRect.left) + 'px';
    this.tableToolbar.style.top = (rect.top - editorRect.top - 40) + 'px';
  }

  /**
   * Hide table toolbar
   */
  hideTableToolbar() {
    if (this.tableToolbar) {
      this.tableToolbar.style.display = 'none';
    }
    this.selectedTable = null;
    this.selectedCell = null;
  }

  /**
   * Handle table commands - extracted from handleTableCommand()
   */
  handleTableCommand(cmd) {
    if (!this.selectedTable) return;

    switch (cmd) {
      case 'addRowBefore':
        this.addTableRow('before');
        break;
      case 'addRowAfter':
        this.addTableRow('after');
        break;
      case 'addColBefore':
        this.addTableColumn('before');
        break;
      case 'addColAfter':
        this.addTableColumn('after');
        break;
      case 'deleteRow':
        this.deleteTableRow();
        break;
      case 'deleteCol':
        this.deleteTableColumn();
        break;
      case 'deleteTable':
        this.deleteTable();
        break;
    }
  }

  /**
   * Add table row
   */
  addTableRow(position = 'after') {
    if (!this.selectedTable || !this.selectedCell) return;

    const currentRow = this.selectedCell.closest('tr');
    if (!currentRow) return;

    const newRow = currentRow.cloneNode(true);
    // Clear content of new row
    newRow.querySelectorAll('td').forEach(td => {
      td.innerHTML = '&nbsp;';
    });

    if (position === 'before') {
      currentRow.parentNode.insertBefore(newRow, currentRow);
    } else {
      currentRow.parentNode.insertBefore(newRow, currentRow.nextSibling);
    }
  }

  /**
   * Add table column
   */
  addTableColumn(position = 'after') {
    if (!this.selectedTable || !this.selectedCell) return;

    const currentCellIndex = Array.from(this.selectedCell.parentNode.children).indexOf(this.selectedCell);
    const rows = this.selectedTable.querySelectorAll('tr');
    
    rows.forEach(row => {
      const newCell = document.createElement('td');
      newCell.style.border = '1px solid #ddd';
      newCell.style.padding = '8px';
      newCell.innerHTML = '&nbsp;';

      const targetIndex = position === 'before' ? currentCellIndex : currentCellIndex + 1;
      const targetCell = row.children[targetIndex];
      
      if (targetCell) {
        row.insertBefore(newCell, targetCell);
      } else {
        row.appendChild(newCell);
      }
    });
  }

  /**
   * Delete table row
   */
  deleteTableRow() {
    if (!this.selectedCell) return;

    const currentRow = this.selectedCell.closest('tr');
    if (!currentRow) return;

    const table = currentRow.closest('table');
    if (table && table.querySelectorAll('tr').length > 1) {
      currentRow.remove();
    }
  }

  /**
   * Delete table column
   */
  deleteTableColumn() {
    if (!this.selectedTable || !this.selectedCell) return;

    const currentCellIndex = Array.from(this.selectedCell.parentNode.children).indexOf(this.selectedCell);
    const rows = this.selectedTable.querySelectorAll('tr');
    
    // Check if table has more than one column
    if (rows[0] && rows[0].children.length > 1) {
      rows.forEach(row => {
        if (row.children[currentCellIndex]) {
          row.children[currentCellIndex].remove();
        }
      });
    }
  }

  /**
   * Delete entire table
   */
  deleteTable() {
    if (this.selectedTable && this.selectedTable.parentNode) {
      this.selectedTable.parentNode.removeChild(this.selectedTable);
      this.hideTableToolbar();
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Handle table selection
    this.editor.editor.addEventListener('mousedown', (e) => {
      const table = e.target.closest('table');
      if (table && this.editor.editor.contains(table)) {
        this.selectedTable = table;
        this.selectedCell = e.target.closest('td, th');
        this.showTableToolbar(table);
      } else {
        this.hideTableToolbar();
      }
    });

    // Hide popups when clicking outside
    document.addEventListener('mousedown', (e) => {
      if (!e.target.closest('table') && 
          !e.target.closest('.table-toolbar') && 
          !e.target.closest('.table-popup')) {
        this.hideTableToolbar();
        this.hideTablePopup();
      }
    });

    // Hide toolbar on scroll
    window.addEventListener('scroll', () => {
      this.hideTableToolbar();
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideTablePopup();
        this.hideTableToolbar();
      }
    });
  }

  /**
   * Get selected table
   */
  getSelectedTable() {
    return this.selectedTable;
  }

  /**
   * Get selected cell
   */
  getSelectedCell() {
    return this.selectedCell;
  }

  /**
   * Check if cursor is inside a table
   */
  isInsideTable() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return false;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    
    let node = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;
    while (node && node !== this.editor.editor) {
      if (node.tagName === 'TABLE') {
        return true;
      }
      node = node.parentNode;
    }
    
    return false;
  }

  /**
   * Destroy module
   */
  destroy() {
    if (this.tablePopup && this.tablePopup.parentNode) {
      this.tablePopup.parentNode.removeChild(this.tablePopup);
    }
    if (this.tableToolbar && this.tableToolbar.parentNode) {
      this.tableToolbar.parentNode.removeChild(this.tableToolbar);
    }
    
    this.selectedTable = null;
    this.selectedCell = null;
    this.tablePopup = null;
    this.tableToolbar = null;
  }
}

export default Table; 