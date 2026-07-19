import Module from '../core/module.js';
import IconUtils from '../ui/icons.js';
import ColorPicker from '../ui/color-picker.js';

/**
 * Table Toolbar Module - Floating toolbar hiện lên khi click vào table
 */
class TableToolbar extends Module {
  static DEFAULTS = {
    fadeDelay: 3000, // Auto hide after 3 seconds of inactivity
    buttons: ['tableProfile', 'toggleHeaderRow', 'deleteTable', 'insertRowAbove', 'insertRowBelow', 'deleteRow', 'insertColRight', 'insertColLeft', 'deleteCol', 'cellAlignLeft', 'cellAlignCenter', 'cellAlignRight', 'cellBg', 'mergeCells', 'splitCell']
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
   * Tạo table toolbar element
   */
  async createTableToolbar() {
    this.tableToolbar = document.createElement('div');
    this.tableToolbar.className = 'table-toolbar';
    
    // Create toolbar container
    const toolbarContainer = document.createElement('div');
    toolbarContainer.className = 'table-toolbar-container';
    
    // Define button groups
    const buttonGroups = [
      {
        name: 'table-actions',
        buttons: [
          { cmd: 'tableProfile', icon: 'icon-table-profile', title: 'Table Profile' },
          { cmd: 'toggleHeaderRow', icon: 'icon-heading', title: 'Toggle Header Row' },
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
      },
      {
        name: 'cell-actions',
        buttons: [
          { cmd: 'cellAlignLeft', icon: 'icon-align-left', title: 'Align cell left' },
          { cmd: 'cellAlignCenter', icon: 'icon-align-center', title: 'Align cell center' },
          { cmd: 'cellAlignRight', icon: 'icon-align-right', title: 'Align cell right' },
          { cmd: 'cellBg', icon: 'icon-cell-bg', title: 'Cell background colour' },
          { cmd: 'mergeCells', icon: 'icon-cell-merge', title: 'Merge selected cells' },
          { cmd: 'splitCell', icon: 'icon-cell-split', title: 'Split cell' }
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
        // Keep these out of the tab order: otherwise pressing Tab inside a cell
        // moves focus onto a toolbar button (the next focusable element) and the
        // user's next keystrokes are lost instead of going to the next cell.
        button.setAttribute('tabindex', '-1');

      // Load and set SVG icon using IconUtils
      const svgContent = IconUtils.getIcon(icon.replace('icon-', ''));
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

      toolbarContainer.appendChild(groupDiv);
    }

    // Create arrow element
    const arrow = document.createElement('div');
    arrow.className = 'table-toolbar-arrow';
    
    // Add container and arrow to toolbar
    this.tableToolbar.appendChild(toolbarContainer);
    this.tableToolbar.appendChild(arrow);

    // Add to editor wrapper
    this.editor.wrapper.appendChild(this.tableToolbar);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Keep references so listeners can be removed in destroy().
    this._onEditorClick = (e) => {
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
      } else if (!clickedTable) {
        // Only hide when the click is fully outside any table. A cross-cell drag
        // fires a click whose target is the <tr> (clickedCell null but clickedTable
        // set) — hiding there would tear down the cell selection we just made.
        this.hide();
      }
    };

    this._onDocMousedown = (e) => {
      if (!e.target.closest('.table-toolbar') && !e.target.closest('table')) {
        this.hide();
      }
    };

    this._onWindowScroll = () => {
      if (this.isVisible && this.currentTable) {
        this.updateToolbarPosition();
      }
    };

    this._onEditorScroll = () => {
      if (this.isVisible && this.currentTable) {
        this.updateToolbarPosition();
      }
    };

    // Cell drag-selection: dragging across cells selects a rectangular block (for
    // merge/align/background); dragging within one cell keeps normal text select.
    this._onCellMousedown = (e) => {
      const cell = e.target.closest && e.target.closest('td, th');
      const table = cell && cell.closest('table');
      if (!cell || !table || !this.editor.editor.contains(table)) { this.clearCellSelection(); return; }
      this.clearCellSelection();
      this._dragAnchor = cell;
      this._dragTable = table;
      this._cellDragging = false;
    };
    this._onCellMousemove = (e) => {
      if (!this._dragAnchor || e.buttons !== 1) return;
      const cell = e.target.closest && e.target.closest('td, th');
      if (!cell || cell.closest('table') !== this._dragTable) return;
      if (cell === this._dragAnchor && !this._cellDragging) return; // still in anchor → text select
      this._cellDragging = true;
      e.preventDefault();
      const g = window.getSelection(); if (g) g.removeAllRanges();
      this._selectCellRect(this._dragAnchor, cell);
    };
    this._onCellMouseup = () => {
      const anchor = this._dragAnchor;
      this._dragAnchor = null; this._dragTable = null; this._cellDragging = false;
      if (this.selectedCells && this.selectedCells.size > 1) {
        // A drag doesn't fire 'click', so surface the toolbar here — otherwise
        // the merge/align/bg buttons would be unreachable after selecting cells.
        const first = anchor || this.selectedCells.values().next().value;
        const table = first && first.closest('table');
        if (table) { this.currentTable = table; this.currentCell = first; this.showAtTable(table); }
      } else if (this.selectedCells) {
        this.clearCellSelection();
      }
    };
    this.editor.editor.addEventListener('mousedown', this._onCellMousedown);
    this.editor.editor.addEventListener('mousemove', this._onCellMousemove);
    document.addEventListener('mouseup', this._onCellMouseup);

    // Listen for clicks on table cells
    this.editor.editor.addEventListener('click', this._onEditorClick);
    // Hide on outside click
    document.addEventListener('mousedown', this._onDocMousedown);
    // Track position on scroll instead of hiding
    window.addEventListener('scroll', this._onWindowScroll);
    this.editor.editor.addEventListener('scroll', this._onEditorScroll);

    // Update when selection changes within table
    this._onEditorKeyup = (e) => {
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
    };
    this.editor.editor.addEventListener('keyup', this._onEditorKeyup);

    // Tab / Shift+Tab move between table cells (instead of escaping the editor).
    this._onEditorKeydown = (e) => {
      if (e.key !== 'Tab') return;
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      let node = selection.getRangeAt(0).startContainer;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
      const cell = node && node.closest ? node.closest('td, th') : null;
      if (!cell) return;
      const table = cell.closest('table');
      if (!table) return;
      const inEditable = this.editor.isNodeInEditableArea
        ? this.editor.isNodeInEditableArea(table) : true;
      if (!inEditable) return;

      const cells = Array.from(table.querySelectorAll('td, th'));
      const idx = cells.indexOf(cell);
      const target = e.shiftKey ? cells[idx - 1] : cells[idx + 1];
      // Only intercept when there's a cell to move to; at the very first/last
      // cell, let Tab behave normally so focus can leave the table.
      if (target) {
        e.preventDefault();
        this._placeCaretInCell(target);
      }
    };
    this.editor.editor.addEventListener('keydown', this._onEditorKeydown);
  }

  /**
   * Move the caret into a table cell (selecting its contents) and refresh the
   * floating toolbar position. Used by Tab navigation.
   */
  _placeCaretInCell(cell) {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(cell);
    selection.removeAllRanges();
    selection.addRange(range);
    this.currentCell = cell;
    this.currentTable = cell.closest('table');
    if (this.isVisible) this.updateToolbarPosition();
  }

  /**
   * Update toolbar position based on current table
   */
  updateToolbarPosition() {
    if (!this.isVisible || !this.currentTable) return;

    // Check if table is still in DOM and in editable area
    if (!document.body.contains(this.currentTable)) {
      this.hide();
      return;
    }

    const isInEditableArea = this.editor.isNodeInEditableArea ? 
      this.editor.isNodeInEditableArea(this.currentTable) : true;
    
    if (!isInEditableArea) {
      this.hide();
      return;
    }

    // Update position based on current table position
    const rect = this.currentTable.getBoundingClientRect();
    const editorRect = this.editor.wrapper.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    this.updateToolbarAt(
      rect.left - editorRect.left + scrollLeft,
      rect.top - editorRect.top + scrollTop,
      rect.width,
      rect.height
    );
  }

  /**
   * Update toolbar position at specific coordinates
   */
  updateToolbarAt(x, y, width, height) {
    if (!this.tableToolbar) return;
    
    this.ensureToolbarInViewport(x, y, width, height);
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
      rect.top - editorRect.top + scrollTop,
      rect.width,
      rect.height
    );
  }

  /**
   * Show toolbar at specific position
   */
  showAt(x, y, width, height) {
    if (!this.tableToolbar) return;

    this.tableToolbar.classList.add('visible');
    this.isVisible = true;

    this.ensureToolbarInViewport(x, y, width, height);
    this.clearHideTimeout();
  }

  /**
   * Ensure toolbar stays within viewport and editor bounds
   */
  ensureToolbarInViewport(x, y, width, height) {
    if (!this.tableToolbar) return;
    
    // Lấy thông tin về editor-area
    const editorArea = this.editor.editor;
    const editorRect = editorArea.getBoundingClientRect();
    const toolbarRect = this.tableToolbar.getBoundingClientRect();
    const toolbarContainer = this.editor.wrapper.querySelector('.rich-editor-toolbar-container');
    const toolbarRect2 = toolbarContainer ? toolbarContainer.getBoundingClientRect() : null;
    // Right-align to the table's top-right corner. The block above a table
    // (a heading/paragraph) is almost always left-aligned, so a centred toolbar
    // floating above the table overlapped that text; hugging the right edge
    // keeps it clear of it.
    let left = x + width - this.tableToolbar.offsetWidth;
    if (left < x) left = x; // very narrow table: don't overflow the left edge
    let top = y - 60- document.documentElement.scrollTop;
    let arrowLeft = '90%';
    let arrowDirection = 'down'; // mũi tên hướng xuống
    
    // Trường hợp 1: Vượt quá lề trái của editor
    if (left < 0) {
      left = (x - (this.tableToolbar.offsetWidth * (10/100)));
      if(left < 0) left = 0;
      arrowLeft = '10%'; // Mũi tên ở 10%
    }
    
    // Trường hợp 2: Vượt quá lề phải của editor
    if (left + this.tableToolbar.offsetWidth > (this.editor.wrapper.offsetWidth - 2)) {
      left = x - this.tableToolbar.offsetWidth*0.9;
      arrowLeft = '90%'; // Mũi tên ở 90%
    }
    
    // Trường hợp 3: Vượt quá lề trên của editor
    if (top < (toolbarRect2 ? toolbarRect2.height : 48)) {
      top = y + height +10 - document.documentElement.scrollTop;
      arrowDirection = 'up'; // Mũi tên hướng lên
      if(top < (toolbarRect2 ? toolbarRect2.height : 48)){
        this.hide();
        return;
      }
    }
    if(top > editorRect.height){
      this.hide();
      return;
    }
    // Cập nhật vị trí mũi tên (nếu có)
    const arrow = this.tableToolbar.querySelector('.table-toolbar-arrow');
    if (arrow) {
      arrow.style.left = arrowLeft;
      
      if (arrowDirection === 'up') {
        // Mũi tên hướng lên
        arrow.style.bottom = 'auto';
        arrow.style.top = '-8px';
        arrow.style.borderTop = 'none';
        arrow.style.borderBottom = '8px solid #fff';
        arrow.style.borderLeft = '6px solid transparent';
        arrow.style.borderRight = '6px solid transparent';
      } else {
        // Mũi tên hướng xuống (mặc định)
        arrow.style.top = 'auto';
        arrow.style.bottom = '-8px';
        arrow.style.borderBottom = 'none';
        arrow.style.borderTop = '8px solid #fff';
        arrow.style.borderLeft = '6px solid transparent';
        arrow.style.borderRight = '6px solid transparent';
      }
    }
    // Áp dụng vị trí cuối cùng
    this.tableToolbar.style.left = left + 'px';
    this.tableToolbar.style.top = top + 'px';
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
      case 'toggleHeaderRow':
        this.toggleHeaderRow();
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
      case 'cellAlignLeft':
        this.setCellAlign('left');
        break;
      case 'cellAlignCenter':
        this.setCellAlign('center');
        break;
      case 'cellAlignRight':
        this.setCellAlign('right');
        break;
      case 'cellBg':
        this.setCellBackground(button);
        break;
      case 'mergeCells':
        this.mergeCells();
        break;
      case 'splitCell':
        this.splitCell();
        break;
    }

    this.editor.focus();
  }

  /** Cells currently targeted: the drag-selected set, or the last-clicked cell. */
  targetCells() {
    if (this.selectedCells && this.selectedCells.size) return Array.from(this.selectedCells);
    return this.currentCell ? [this.currentCell] : [];
  }

  _beforeEdit() {
    const h = this.editor.getModule('history');
    if (h && typeof h.saveBeforeFormat === 'function') h.saveBeforeFormat();
  }
  _afterEdit() {
    if (typeof this.editor.onContentChange === 'function') this.editor.onContentChange();
  }

  /** Set text alignment on the targeted cell(s). */
  setCellAlign(align) {
    const cells = this.targetCells();
    if (!cells.length) return;
    this._beforeEdit();
    cells.forEach((c) => { c.style.textAlign = align; });
    this._afterEdit();
  }

  /** Open the colour picker and apply the chosen colour as the cell background. */
  setCellBackground(button) {
    const cells = this.targetCells();
    if (!cells.length) return;
    this._bgCells = cells.slice(); // capture now — the picker may clear the selection
    if (!this.cellColorPicker) {
      this.cellColorPicker = new ColorPicker({
        editor: this.editor,
        onColorSelect: (color) => {
          if (!this._bgCells || !this._bgCells.length) return;
          this._beforeEdit();
          // The picker's "no colour" resolves to 'transparent' → clear instead.
          const bg = (color === 'transparent') ? '' : color;
          this._bgCells.forEach((c) => { c.style.backgroundColor = bg; });
          this._afterEdit();
        }
      });
      this.editor.setPopupInstance && this.editor.setPopupInstance('table-cell-bg', this.cellColorPicker);
    }
    this.cellColorPicker.show(button);
  }

  /**
   * Merge the drag-selected rectangular block of cells into its top-left cell
   * (colspan/rowspan), moving the others' content in and removing them.
   */
  mergeCells() {
    const cells = this.targetCells();
    if (cells.length < 2) return;
    const grid = this._buildGrid(this.currentTable);
    if (!grid) return;
    // Bounding rectangle of the selection in grid coordinates.
    let minR = Infinity, maxR = -1, minC = Infinity, maxC = -1;
    const set = new Set(cells);
    grid.cells.forEach(({ el, r, c, rs, cs }) => {
      if (set.has(el)) {
        minR = Math.min(minR, r); maxR = Math.max(maxR, r + rs - 1);
        minC = Math.min(minC, c); maxC = Math.max(maxC, c + cs - 1);
      }
    });
    if (maxR < 0) return;
    // Every grid slot in the rectangle must belong to a selected cell.
    const inRect = grid.cells.filter(({ r, c, rs, cs }) =>
      r >= minR && r + rs - 1 <= maxR && c >= minC && c + cs - 1 <= maxC);
    const anchor = grid.matrix[minR] && grid.matrix[minR][minC];
    if (!anchor) return;
    this._beforeEdit();
    const html = [];
    inRect.forEach(({ el }) => {
      if (el === anchor) return;
      if (el.innerHTML && el.innerHTML !== '<br>') html.push(el.innerHTML);
      el.remove();
    });
    if (html.length) anchor.innerHTML = (anchor.innerHTML === '<br>' ? '' : anchor.innerHTML) + html.join(' ');
    anchor.colSpan = maxC - minC + 1;
    anchor.rowSpan = maxR - minR + 1;
    this.clearCellSelection();
    this.currentCell = anchor;
    this._afterEdit();
  }

  /** Split a merged cell back into 1×1 cells (re-adds the removed cells empty). */
  splitCell() {
    const cell = this.currentCell;
    if (!cell) return;
    const cs = cell.colSpan || 1, rs = cell.rowSpan || 1;
    if (cs === 1 && rs === 1) return;
    const table = this.currentTable;
    const grid = this._buildGrid(table);
    const info = grid && grid.cells.find(({ el }) => el === cell);
    if (!info) return;
    this._beforeEdit();
    const tag = cell.tagName.toLowerCase();
    cell.colSpan = 1; cell.rowSpan = 1;
    // Re-insert empty cells for every slot the merge used to cover.
    for (let dr = 0; dr < rs; dr++) {
      const row = table.rows[info.r + dr];
      if (!row) continue;
      for (let dc = 0; dc < cs; dc++) {
        if (dr === 0 && dc === 0) continue; // the surviving anchor
        const nc = document.createElement(tag);
        nc.innerHTML = '<br>';
        // Best-effort placement: append (exact column re-insertion is
        // approximate for irregular tables, but keeps a valid grid).
        if (dr === 0) { cell.after(nc); }
        else { row.appendChild(nc); }
      }
    }
    this._afterEdit();
  }

  /**
   * Build a grid model resolving colspan/rowspan into (row,col) slots.
   * Returns { matrix[r][c] = cellEl, cells: [{el,r,c,rs,cs}] }.
   */
  _buildGrid(table) {
    if (!table) return null;
    const matrix = [];
    const cells = [];
    const rows = Array.from(table.rows);
    for (let r = 0; r < rows.length; r++) {
      matrix[r] = matrix[r] || [];
      let c = 0;
      for (const el of Array.from(rows[r].cells)) {
        while (matrix[r][c]) c++; // skip slots taken by an earlier rowspan
        const rs = el.rowSpan || 1, cs = el.colSpan || 1;
        cells.push({ el, r, c, rs, cs });
        for (let dr = 0; dr < rs; dr++) {
          matrix[r + dr] = matrix[r + dr] || [];
          for (let dc = 0; dc < cs; dc++) matrix[r + dr][c + dc] = el;
        }
        c += cs;
      }
    }
    return { matrix, cells };
  }

  clearCellSelection() {
    if (this.selectedCells) {
      this.selectedCells.forEach((c) => c.classList.remove('yjd-cell-selected'));
      this.selectedCells.clear();
    }
  }

  /** Highlight every cell overlapping the rectangle spanned by anchor..focus. */
  _selectCellRect(anchor, focus) {
    const grid = this._buildGrid(this._dragTable);
    if (!grid) return;
    const a = grid.cells.find((c) => c.el === anchor);
    const f = grid.cells.find((c) => c.el === focus);
    if (!a || !f) return;
    const minR = Math.min(a.r, f.r), maxR = Math.max(a.r + a.rs - 1, f.r + f.rs - 1);
    const minC = Math.min(a.c, f.c), maxC = Math.max(a.c + a.cs - 1, f.c + f.cs - 1);
    this.clearCellSelection();
    if (!this.selectedCells) this.selectedCells = new Set();
    grid.cells.forEach(({ el, r, c, rs, cs }) => {
      const overlaps = r <= maxR && r + rs - 1 >= minR && c <= maxC && c + cs - 1 >= minC;
      if (overlaps) { el.classList.add('yjd-cell-selected'); this.selectedCells.add(el); }
    });
  }

  /**
   * Toggle the table's first row between header cells (<th>) and normal (<td>).
   */
  toggleHeaderRow() {
    const table = this.currentTable;
    if (!table) return;
    const firstRow = table.rows && table.rows[0];
    if (!firstRow) return;
    const h = this.editor.getModule('history');
    if (h && typeof h.saveBeforeFormat === 'function') h.saveBeforeFormat();

    const makeHeader = firstRow.cells[0] && firstRow.cells[0].tagName !== 'TH';
    const toTag = makeHeader ? 'th' : 'td';
    Array.from(firstRow.cells).forEach((cell) => {
      const nc = document.createElement(toTag);
      nc.innerHTML = cell.innerHTML;
      // Preserve inline styling (width/align set by resize etc.).
      if (cell.getAttribute('style')) nc.setAttribute('style', cell.getAttribute('style'));
      cell.replaceWith(nc);
    });
    if (typeof this.editor.onContentChange === 'function') this.editor.onContentChange();
  }

  /**
   * Insert row above current cell
   */
  insertRowAbove() {
    const currentRow = this.currentCell.parentElement;
    const newRow = this.createNewRow(currentRow.cells.length);
    currentRow.parentElement.insertBefore(newRow, currentRow);
    
    // Update resize handles if they exist
    if (this.editor.resizeHandles) {
      this.editor.resizeHandles.checkAndUpdateHandles();
    }
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
    
    // Update resize handles if they exist
    if (this.editor.resizeHandles) {
      this.editor.resizeHandles.checkAndUpdateHandles();
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
    
    // Update resize handles if they exist
    if (this.editor.resizeHandles) {
      this.editor.resizeHandles.checkAndUpdateHandles();
    }
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
    
    // Update resize handles if they exist
    if (this.editor.resizeHandles) {
      this.editor.resizeHandles.checkAndUpdateHandles();
    }
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
    
    // Update resize handles if they exist
    if (this.editor.resizeHandles) {
      this.editor.resizeHandles.checkAndUpdateHandles();
    }
    
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
    
    // Update resize handles if they exist
    if (this.editor.resizeHandles) {
      this.editor.resizeHandles.checkAndUpdateHandles();
    }
    
    this.hide();
  }

  /**
   * Show table profile/properties
   */
  showTableProfile() {
    const t = this.currentTable;
    if (!t) return;
    const rows = t.rows.length;
    const cols = t.rows[0] ? Array.from(t.rows[0].cells).reduce((n, c) => n + (c.colSpan || 1), 0) : 0;
    const cells = t.querySelectorAll('td, th').length;
    const items = [
      ['Rows', rows], ['Columns', cols], ['Cells', cells],
      ['Width', Math.round(t.offsetWidth) + 'px'], ['Height', Math.round(t.offsetHeight) + 'px']
    ];

    if (!this._profilePopup) {
      const el = document.createElement('div');
      el.className = 'yjd-table-profile';
      el.style.display = 'none';
      document.body.appendChild(el);
      this._profilePopup = el;
      this._onProfileDismiss = (e) => {
        if (e.type === 'keydown' && e.key !== 'Escape') return;
        if (e.type === 'mousedown' && (el.contains(e.target) || (e.target.closest && e.target.closest('.table-toolbar')))) return;
        this.hideTableProfile();
      };
    }
    const el = this._profilePopup;
    el.innerHTML = '<div class="yjd-table-profile-title">Table</div>' +
      items.map(([k, v]) => `<div class="yjd-table-profile-row"><span>${k}</span><b>${v}</b></div>`).join('');
    const r = t.getBoundingClientRect();
    el.style.position = 'fixed';
    el.style.display = 'block';
    el.style.top = Math.max(8, Math.min(window.innerHeight - el.offsetHeight - 8, r.top)) + 'px';
    el.style.left = Math.min(window.innerWidth - el.offsetWidth - 8, r.right + 8) + 'px';
    setTimeout(() => {
      document.addEventListener('mousedown', this._onProfileDismiss);
      document.addEventListener('keydown', this._onProfileDismiss);
    }, 0);
  }

  hideTableProfile() {
    if (this._profilePopup) this._profilePopup.style.display = 'none';
    if (this._onProfileDismiss) {
      document.removeEventListener('mousedown', this._onProfileDismiss);
      document.removeEventListener('keydown', this._onProfileDismiss);
    }
  }

  /**
   * Delete entire table
   */
  deleteTable() {
    // Hide resize handles before removing table
    if (this.editor.resizeHandles) {
      this.editor.resizeHandles.hideHandles();
    }
    
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
    // No per-cell contentEditable: cells inherit it from the editor root, and
    // setting it here would leak contenteditable="true" into exported HTML.
    return cell;
  }

  /**
   * Destroy module
   */
  destroy() {
    // Remove event listeners (document/window ones would otherwise leak)
    if (this._onDocMousedown) {
      document.removeEventListener('mousedown', this._onDocMousedown);
      window.removeEventListener('scroll', this._onWindowScroll);
      this.editor.editor.removeEventListener('click', this._onEditorClick);
      this.editor.editor.removeEventListener('scroll', this._onEditorScroll);
      this.editor.editor.removeEventListener('keyup', this._onEditorKeyup);
      if (this._onEditorKeydown) {
        this.editor.editor.removeEventListener('keydown', this._onEditorKeydown);
      }
      if (this._onCellMousedown) {
        this.editor.editor.removeEventListener('mousedown', this._onCellMousedown);
        this.editor.editor.removeEventListener('mousemove', this._onCellMousemove);
        document.removeEventListener('mouseup', this._onCellMouseup);
        this._onCellMousedown = this._onCellMousemove = this._onCellMouseup = null;
      }
      this._onDocMousedown = this._onWindowScroll = this._onEditorClick = null;
      this._onEditorScroll = this._onEditorKeyup = this._onEditorKeydown = null;
    }

    // Table Profile popup + cell colour picker cleanup.
    this.hideTableProfile();
    if (this._profilePopup && this._profilePopup.parentNode) {
      this._profilePopup.parentNode.removeChild(this._profilePopup);
      this._profilePopup = null;
    }
    if (this.cellColorPicker && typeof this.cellColorPicker.destroy === 'function') {
      this.cellColorPicker.destroy();
      this.cellColorPicker = null;
    }

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