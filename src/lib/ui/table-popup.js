/**
 * Table Popup Component - Interactive table size picker
 */
class TablePopup {
  constructor(options = {}) {
    this.options = {
      maxRows: 8,
      maxCols: 8,
      onTableSelect: null,
      ...options
    };
    
    this.popup = null;
    this.isVisible = false;
    this.selectedRows = 1;
    this.selectedCols = 1;
    this.grid = null;
    this.sizeDisplay = null;
    
    this.createPopup();
  }

  createPopup() {
    this.popup = document.createElement('div');
    this.popup.className = 'table-popup';
    
    const content = document.createElement('div');
    content.className = 'table-popup-content';
    
    // Create size display text
    this.createSizeDisplay();
    
    // Create grid selector
    this.createGridSelector();
    
    content.appendChild(this.grid);
    content.appendChild(this.sizeDisplay);
    this.popup.appendChild(content);
    document.body.appendChild(this.popup);
  }

  createSizeDisplay() {
    this.sizeDisplay = document.createElement('div');
    this.sizeDisplay.className = 'table-size-display';
    
  }
  createGridSelector() {
    this.grid = document.createElement('div');
    this.grid.className = 'table-grid-selector';
    
    // Create grid of cells
    for (let row = 1; row <= this.options.maxRows; row++) {
      for (let col = 1; col <= this.options.maxCols; col++) {
        const cell = document.createElement('div');
        cell.className = 'table-grid-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        
        // Mouse events
        cell.addEventListener('mouseenter', () => {
          this.highlightGrid(row, col);
        });
        
        cell.addEventListener('click', () => {
          this.selectSize(row, col);
          this.handleInsert();
        });
        
        this.grid.appendChild(cell);
      }
    }
    
    // Reset hover when leaving grid
    this.grid.addEventListener('mouseleave', () => {
      this.highlightGrid(1, 1);
    });
  }

  highlightGrid(rows, cols) {
    this.selectedRows = rows;
    this.selectedCols = cols;
    
    // Update size display text
    this.updateSizeDisplay(rows, cols);
    
    // Update grid visual
    const cells = this.grid.querySelectorAll('.table-grid-cell');
    cells.forEach(cell => {
      const cellRow = parseInt(cell.dataset.row);
      const cellCol = parseInt(cell.dataset.col);
      
      if (cellRow <= rows && cellCol <= cols) {
        cell.classList.add('highlighted');
      } else {
        cell.classList.remove('highlighted');
      }
    });
  }

  updateSizeDisplay(rows, cols) {
    if (this.sizeDisplay) {
      this.sizeDisplay.textContent = `${rows}x${cols}`;
    }
  }

  selectSize(rows, cols) {
    this.selectedRows = rows;
    this.selectedCols = cols;
    this.updateSizeDisplay(rows, cols);
  }

  handleInsert() {
    if (this.options.onTableSelect) {
      this.options.onTableSelect({
        rows: this.selectedRows,
        cols: this.selectedCols
      });
    }
    
    this.hide();
  }

  show(anchor) {
    if (!anchor) return;
    
    // Reset selection
    this.selectedRows = 1;
    this.selectedCols = 1;
    this.highlightGrid(1, 1);
    
    // Position popup
    const rect = anchor.getBoundingClientRect();
    this.popup.style.position = 'absolute';
    this.popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
    this.popup.style.left = `${rect.left + window.scrollX}px`;
    this.popup.style.zIndex = '1000';
    
    // Adjust position if popup would go off screen
    const popupRect = this.popup.getBoundingClientRect();
    if (rect.left + popupRect.width > window.innerWidth) {
      this.popup.style.left = `${window.innerWidth - popupRect.width - 10}px`;
    }
    
    // Show popup
    this.popup.classList.add('visible');
    this.isVisible = true;
    
    // Click outside to close
    setTimeout(() => {
      document.addEventListener('click', this.closeOnClickOutside);
    }, 100);
  }

  hide() {
    this.popup.classList.remove('visible');
    this.isVisible = false;
    document.removeEventListener('click', this.closeOnClickOutside);
  }

  closeOnClickOutside = (e) => {
    if (!this.popup.contains(e.target)) {
      this.hide();
    }
  }

  destroy() {
    document.removeEventListener('click', this.closeOnClickOutside);
    if (this.popup && this.popup.parentNode) {
      this.popup.parentNode.removeChild(this.popup);
    }
  }
}

export default TablePopup; 