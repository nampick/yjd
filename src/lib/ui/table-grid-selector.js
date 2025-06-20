/**
 * Table Grid Selector UI Component
 * Provides table size selection interface
 */
class TableGridSelector {
  constructor(options = {}) {
    this.options = {
      maxRows: 10,
      maxCols: 8,
      cellSize: 20,
      ...options
    };
    
    this.selector = null;
    this.gridContainer = null;
    this.sizeIndicator = null;
    this.isOpen = false;
    this.onSelect = null;
    this.currentHighlight = { rows: 1, cols: 1 };
    
    this.init();
  }

  /**
   * Initialize grid selector
   */
  init() {
    this.createSelector();
    this.setupEventListeners();
  }

  /**
   * Create grid selector element
   */
  createSelector() {
    this.selector = document.createElement('div');
    this.selector.className = 'table-grid-selector';

    // Create grid container
    this.createGridContainer();
    
    // Create size indicator
    this.createSizeIndicator();
    
    // Append to body
    document.body.appendChild(this.selector);
  }

  /**
   * Create grid container with cells
   */
  createGridContainer() {
    this.gridContainer = document.createElement('div');
    this.gridContainer.className = 'table-grid-container';
    this.gridContainer.style.gridTemplateColumns = `repeat(${this.options.maxCols}, ${this.options.cellSize}px)`;

    // Create grid cells
    for (let row = 0; row < this.options.maxRows; row++) {
      for (let col = 0; col < this.options.maxCols; col++) {
        const cell = this.createGridCell(row + 1, col + 1);
        this.gridContainer.appendChild(cell);
      }
    }

    this.selector.appendChild(this.gridContainer);
  }

  /**
   * Create individual grid cell
   */
  createGridCell(row, col) {
    const cell = document.createElement('div');
    cell.className = 'table-grid-cell';
    cell.style.width = this.options.cellSize + 'px';
    cell.style.height = this.options.cellSize + 'px';
    
    cell.dataset.row = row;
    cell.dataset.col = col;

    // Hover effects
    cell.addEventListener('mouseenter', () => {
      this.highlightGrid(row, col);
    });

    cell.addEventListener('mouseleave', () => {
      // Handled by CSS
    });

    // Click handler
    cell.addEventListener('click', () => {
      this.selectSize(row, col);
    });

    return cell;
  }

  /**
   * Create size indicator
   */
  createSizeIndicator() {
    this.sizeIndicator = document.createElement('div');
    this.sizeIndicator.className = 'table-size-indicator';
    this.sizeIndicator.textContent = '1 × 1 Table';

    this.selector.appendChild(this.sizeIndicator);
  }

  /**
   * Highlight grid area
   */
  highlightGrid(rows, cols) {
    this.currentHighlight = { rows, cols };
    
    const cells = this.gridContainer.querySelectorAll('.table-grid-cell');
    cells.forEach(cell => {
      const cellRow = parseInt(cell.dataset.row);
      const cellCol = parseInt(cell.dataset.col);
      
      if (cellRow <= rows && cellCol <= cols) {
        cell.classList.add('highlighted');
      } else {
        cell.classList.remove('highlighted');
      }
    });

    // Update size indicator
    this.sizeIndicator.textContent = `${rows} × ${cols} Table`;
  }

  /**
   * Handle size selection
   */
  selectSize(rows, cols) {
    console.log(`📐 Table size selected: ${rows}x${cols}`);
    
    if (this.onSelect) {
      this.onSelect(rows, cols);
    }
    
    this.close();
  }

  /**
   * Show grid selector at position
   */
  show(x, y, callback) {
    this.onSelect = callback;
    
    // Position selector
    this.selector.style.left = x + 'px';
    this.selector.style.top = y + 'px';
    this.selector.classList.add('visible');
    
    this.isOpen = true;
    
    // Reset to default highlight
    this.highlightGrid(1, 1);
    
    // Adjust position if needed
    this.adjustPosition();
    
    console.log('📋 Table grid selector opened');
  }

  /**
   * Show grid selector relative to element
   */
  showAt(element, callback) {
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const x = rect.left;
    const y = rect.bottom + 5;
    
    this.show(x, y, callback);
  }

  /**
   * Adjust position to stay within viewport
   */
  adjustPosition() {
    const rect = this.selector.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = parseFloat(this.selector.style.left);
    let top = parseFloat(this.selector.style.top);
    
    // Adjust horizontal position
    if (rect.right > viewportWidth) {
      left = viewportWidth - rect.width - 10;
      this.selector.style.left = left + 'px';
    }
    
    // Adjust vertical position
    if (rect.bottom > viewportHeight) {
      top = top - rect.height - 40; // Move above the trigger
      this.selector.style.top = top + 'px';
    }
    
    // Ensure minimum position
    if (left < 10) {
      this.selector.style.left = '10px';
    }
    if (top < 10) {
      this.selector.style.top = '10px';
    }
  }

  /**
   * Close grid selector
   */
  close() {
    this.selector.classList.remove('visible');
    this.isOpen = false;
    this.onSelect = null;
    
    console.log('📋 Table grid selector closed');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Close on click outside
    document.addEventListener('click', (e) => {
      if (this.isOpen && 
          !this.selector.contains(e.target) && 
          !e.target.classList.contains('table-btn')) {
        this.close();
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Grid container mouse leave
    this.gridContainer.addEventListener('mouseleave', () => {
      // Reset to 1x1 when mouse leaves grid
      this.highlightGrid(1, 1);
    });
  }

  /**
   * Update configuration
   */
  updateOptions(options) {
    this.options = { ...this.options, ...options };
    
    // Recreate grid if size changed
    if (options.maxRows || options.maxCols || options.cellSize) {
      this.gridContainer.remove();
      this.createGridContainer();
      this.selector.insertBefore(this.gridContainer, this.sizeIndicator);
    }
  }

  /**
   * Get current highlight state
   */
  getCurrentHighlight() {
    return { ...this.currentHighlight };
  }

  /**
   * Destroy selector
   */
  destroy() {
    if (this.selector && this.selector.parentNode) {
      this.selector.parentNode.removeChild(this.selector);
    }
  }

  /**
   * Static factory method to create trigger button
   */
  static createTrigger(options = {}) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'toolbar-btn table-btn';
    button.innerHTML = options.icon || '⊞';
    button.title = options.title || 'Insert Table';
    
    // Hover effects handled by CSS

    return button;
  }
}

export default TableGridSelector; 