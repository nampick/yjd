import Module from '../core/module.js';

/**
 * Table Toolbar Module - Floating toolbar hiện lên khi click vào table
 */
class TableToolbar extends Module {
  static DEFAULTS = {
    fadeDelay: 3000, // Auto hide after 3 seconds of inactivity
    buttons: ['tableProfile', 'deleteTable', 'insertRowAbove', 'insertRowBelow', 'deleteRow', 'insertColRight', 'insertColLeft', 'deleteCol']
  };

  constructor(editor, options = {}) {
    super(editor, options);
    this.tableToolbar = null;
    this.currentTable = null;
    this.currentCell = null;
    this.hideTimeout = null;
    this.isVisible = false;
    
    this.init();
  }

  async init() {
    await this.createTableToolbar();
    this.setupEventListeners();
  }

  /**
   * Load SVG icon content
   */
  async loadSVGIcon(iconName) {
    try {
      const response = await fetch(`/src/assets/icon/${iconName}.svg`);
      const svgContent = await response.text();
      return svgContent;
    } catch (error) {
      return '';
    }
  }

  /**
   * Tạo table toolbar element
   */
  async createTableToolbar() {
    this.tableToolbar = document.createElement('div');
    this.tableToolbar.className = 'table-toolbar';
    
    // Define button groups
    const buttonGroups = [
      {
        name: 'table-actions',
        buttons: [
          { cmd: 'tableProfile', icon: 'icon-table-profile', title: 'Table Profile' },
          { cmd: 'deleteTable', icon: 'icon-delete-table', title: 'Delete Table' }
        ]
      },
      {
        name: 'row-actions',
        buttons: [
          { cmd: 'insertRowAbove', icon: 'icon-add-row-above', title: 'Add Row Above' },
          { cmd: 'insertRowBelow', icon: 'icon-add-row-below', title: 'Add Row Below' },
          { cmd: 'deleteRow', icon: 'icon-delete-row', title: 'Delete Selected Row' }
        ]
      },
      {
        name: 'col-actions',
        buttons: [
          { cmd: 'insertColRight', icon: 'icon-add-col-right', title: 'Add Column Right' },
          { cmd: 'insertColLeft', icon: 'icon-add-col-left', title: 'Add Column Left' },
          { cmd: 'deleteCol', icon: 'icon-delete-col', title: 'Delete Selected Column' }
        ]
      }
    ];

    // Create groups
    for (const group of buttonGroups) {
      const groupDiv = document.createElement('div');
      groupDiv.className = `table-toolbar-group ${group.name}`;

      // Create buttons in this group
      for (const { cmd, icon, title } of group.buttons) {
        const button = document.createElement('button');
        button.className = 'table-toolbar-btn';
        button.title = title;
        button.dataset.command = cmd;

      // Load and set SVG icon
      const svgContent = await this.loadSVGIcon(icon);
      if (svgContent) {
        button.innerHTML = svgContent;
      }

        button.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.handleCommand(cmd, button);
        });

        groupDiv.appendChild(button);
      }

      this.tableToolbar.appendChild(groupDiv);
    }

    // Add to editor wrapper
    this.editor.wrapper.appendChild(this.tableToolbar);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for clicks on table cells
    this.editor.editor.addEventListener('click', (e) => {
      const clickedCell = e.target.closest('td, th');
      const clickedTable = e.target.closest('table');
      
      if (clickedTable && clickedCell) {
        // Check if the clicked table is within the editable area
        const isInEditableArea = this.editor.isNodeInEditableArea ? 
          this.editor.isNodeInEditableArea(clickedTable) : true;
        
        if (!isInEditableArea) {
          this.hide();
          return;
        }
        
        this.currentTable = clickedTable;
        this.currentCell = clickedCell;
        this.showAtTable(clickedTable);
      } else {
        this.hide();
      }
    });

    // Hide on outside click
    document.addEventListener('mousedown', (e) => {
      if (!e.target.closest('.table-toolbar') && !e.target.closest('table')) {
        this.hide();
      }
    });

    // Hide on scroll
    window.addEventListener('scroll', () => {
      if (this.isVisible) {
        this.hide();
      }
    });

    // Update when selection changes within table
    this.editor.editor.addEventListener('keyup', () => {
      if (this.isVisible && this.currentTable) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const currentCell = selection.getRangeAt(0).startContainer;
          const tableCell = currentCell.nodeType === Node.TEXT_NODE 
            ? currentCell.parentElement.closest('td, th')
            : currentCell.closest('td, th');
          
          if (tableCell && tableCell !== this.currentCell) {
            // Verify the table cell is still in editable area
            const isInEditableArea = this.editor.isNodeInEditableArea ? 
              this.editor.isNodeInEditableArea(tableCell) : true;
            
            if (!isInEditableArea) {
              this.hide();
              return;
            }
            
            this.currentCell = tableCell;
          }
        }
      }
    });
  }

  /**
   * Show toolbar at table position
   */
  showAtTable(table) {
    if (!table || !this.tableToolbar) return;

    const rect = table.getBoundingClientRect();
    const editorRect = this.editor.wrapper.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    this.showAt(
      rect.left - editorRect.left + scrollLeft,
      rect.top - editorRect.top + scrollTop - 45
    );
  }

  /**
   * Show toolbar at specific position
   */
  showAt(x, y) {
    if (!this.tableToolbar) return;

    this.tableToolbar.classList.add('visible');
    this.isVisible = true;

    // Position the toolbar
    this.tableToolbar.style.left = Math.max(0, x) + 'px';
    this.tableToolbar.style.top = Math.max(0, y) + 'px';

    this.clearHideTimeout();
    
  }

  /**
   * Hide toolbar
   */
  hide() {
    if (!this.tableToolbar || !this.isVisible) return;

    this.tableToolbar.classList.remove('visible');
    this.isVisible = false;
    this.currentTable = null;
    this.currentCell = null;
    this.clearHideTimeout();
    
  }

  /**
   * Clear hide timeout
   */
  clearHideTimeout() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  /**
   * Handle command execution - only if table is in editable area
   */
  handleCommand(command, button) {

    if (!this.currentTable || !this.currentCell) {
      return;
    }

    // Double check that the table is still in editable area before executing command
    const isInEditableArea = this.editor.isNodeInEditableArea ? 
      this.editor.isNodeInEditableArea(this.currentTable) : true;
    
    if (!isInEditableArea) {
      this.hide();
      return;
    }

    switch (command) {
      case 'tableProfile':
        this.showTableProfile();
        break;
      case 'deleteTable':
        this.deleteTable();
        break;
      case 'insertRowAbove':
        this.insertRowAbove();
        break;
      case 'insertRowBelow':
        this.insertRowBelow();
        break;
      case 'deleteRow':
        this.deleteRow();
        break;
      case 'insertColRight':
        this.insertColumnRight();
        break;
      case 'insertColLeft':
        this.insertColumnLeft();
        break;
      case 'deleteCol':
        this.deleteColumn();
        break;
    }

    this.editor.focus();
  }

  /**
   * Insert row above current cell
   */
  insertRowAbove() {
    const currentRow = this.currentCell.parentElement;
    const newRow = this.createNewRow(currentRow.cells.length);
    currentRow.parentElement.insertBefore(newRow, currentRow);
  }

  /**
   * Insert row below current cell
   */
  insertRowBelow() {
    const currentRow = this.currentCell.parentElement;
    const newRow = this.createNewRow(currentRow.cells.length);
    
    if (currentRow.nextElementSibling) {
      currentRow.parentElement.insertBefore(newRow, currentRow.nextElementSibling);
    } else {
      currentRow.parentElement.appendChild(newRow);
    }
  }

  /**
   * Insert column left of current cell
   */
  insertColumnLeft() {
    const cellIndex = Array.from(this.currentCell.parentElement.children).indexOf(this.currentCell);
    const tbody = this.currentTable.querySelector('tbody') || this.currentTable;
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
      const newCell = this.createNewCell();
      const targetCell = row.children[cellIndex];
      if (targetCell) {
        row.insertBefore(newCell, targetCell);
      } else {
        row.appendChild(newCell);
      }
    });
  }

  /**
   * Insert column right of current cell
   */
  insertColumnRight() {
    const cellIndex = Array.from(this.currentCell.parentElement.children).indexOf(this.currentCell);
    const tbody = this.currentTable.querySelector('tbody') || this.currentTable;
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
      const newCell = this.createNewCell();
      const targetCell = row.children[cellIndex + 1];
      if (targetCell) {
        row.insertBefore(newCell, targetCell);
      } else {
        row.appendChild(newCell);
      }
    });
  }

  /**
   * Delete current row
   */
  deleteRow() {
    const currentRow = this.currentCell.parentElement;
    const tbody = currentRow.parentElement;
    
    // Don't delete if it's the only row
    if (tbody.children.length <= 1) {
      return;
    }
    
    currentRow.remove();
    this.hide();
  }

  /**
   * Delete current column
   */
  deleteColumn() {
    const cellIndex = Array.from(this.currentCell.parentElement.children).indexOf(this.currentCell);
    const tbody = this.currentTable.querySelector('tbody') || this.currentTable;
    const rows = tbody.querySelectorAll('tr');
    
    // Don't delete if it's the only column
    if (this.currentCell.parentElement.children.length <= 1) {
      console.warn('Cannot delete the only column in table');
      return;
    }
    
    rows.forEach(row => {
      if (row.children[cellIndex]) {
        row.children[cellIndex].remove();
      }
    });
    this.hide();
  }

  /**
   * Show table profile/properties
   */
  showTableProfile() {
    if (!this.currentTable) return;
    
    const rows = this.currentTable.querySelectorAll('tr').length;
    const cols = this.currentTable.querySelector('tr') ? 
                this.currentTable.querySelector('tr').querySelectorAll('td, th').length : 0;
    
    const tableInfo = {
      rows: rows,
      columns: cols,
      totalCells: rows * cols,
      tableWidth: this.currentTable.offsetWidth,
      tableHeight: this.currentTable.offsetHeight
    };
    
    // You can customize this to show a modal or popup with table information
    alert(`Table Profile:\n` +
          `Rows: ${tableInfo.rows}\n` +
          `Columns: ${tableInfo.columns}\n` +
          `Total Cells: ${tableInfo.totalCells}\n` +
          `Width: ${tableInfo.tableWidth}px\n` +
          `Height: ${tableInfo.tableHeight}px`);
    
  }

  /**
   * Delete entire table
   */
  deleteTable() {
    this.currentTable.remove();
    this.hide();
  }

  /**
   * Create new row with specified number of cells
   */
  createNewRow(cellCount) {
    const row = document.createElement('tr');
    for (let i = 0; i < cellCount; i++) {
      row.appendChild(this.createNewCell());
    }
    return row;
  }

  /**
   * Create new cell
   */
  createNewCell() {
    const cell = document.createElement('td');
    cell.innerHTML = '&nbsp;';
    cell.style.minWidth = '50px';
    cell.style.minHeight = '24px';
    cell.style.padding = '4px 8px';
    cell.style.border = '1px solid #ddd';
    cell.style.verticalAlign = 'top';
    cell.contentEditable = 'true';
    return cell;
  }

  /**
   * Destroy module
   */
  destroy() {
    if (this.tableToolbar && this.tableToolbar.parentNode) {
      this.tableToolbar.parentNode.removeChild(this.tableToolbar);
    }
    
    this.clearHideTimeout();
    this.tableToolbar = null;
    this.currentTable = null;
    this.currentCell = null;
    this.isVisible = false;
    
  }
}

export default TableToolbar; 