import '../style.css';

document.addEventListener('DOMContentLoaded', function() {
  const editor = document.getElementById('editor');

  function exec(cmd, value = null) {
    editor.focus();
    document.execCommand(cmd, false, value);
  }

  // Table create UX
  const tableBtn = document.getElementById('table-btn');
  const tablePopup = document.getElementById('table-popup');
  const tableGrid = document.getElementById('table-grid');
  const tableSizeLabel = document.getElementById('table-size-label');
  const maxRows = 8, maxCols = 8;
  // Tạo lưới 8x8
  for (let r = 0; r < maxRows; r++) {
    for (let c = 0; c < maxCols; c++) {
      const cell = document.createElement('div');
      cell.className = 'table-cell';
      cell.dataset.row = r + 1;
      cell.dataset.col = c + 1;
      tableGrid.appendChild(cell);
    }
  }
  let hoverRows = 0, hoverCols = 0;
  tableGrid.addEventListener('mousemove', e => {
    if (e.target.classList.contains('table-cell')) {
      hoverRows = Number(e.target.dataset.row);
      hoverCols = Number(e.target.dataset.col);
      tableGrid.querySelectorAll('.table-cell').forEach(cell => {
        const row = Number(cell.dataset.row), col = Number(cell.dataset.col);
        cell.classList.toggle('selected', row <= hoverRows && col <= hoverCols);
      });
      tableSizeLabel.textContent = `${hoverCols}x${hoverRows}`;
    }
  });
  tableGrid.addEventListener('mouseleave', () => {
    tableGrid.querySelectorAll('.table-cell').forEach(cell => cell.classList.remove('selected'));
    tableSizeLabel.textContent = `0x0`;
  });
  tableGrid.addEventListener('mousedown', e => {
    if (e.target.classList.contains('table-cell')) {
      const rows = Number(e.target.dataset.row);
      const cols = Number(e.target.dataset.col);
      insertTable(rows, cols);
      tablePopup.style.display = 'none';
    }
  });
  tableBtn.addEventListener('click', e => {
            e.preventDefault();
    tablePopup.style.display = tablePopup.style.display === 'block' ? 'none' : 'block';
  });
  document.addEventListener('mousedown', e => {
    if (!tablePopup.contains(e.target) && e.target !== tableBtn) {
      tablePopup.style.display = 'none';
    }
  });
  function insertTable(rows, cols) {
    let html = '<table style="border-collapse:collapse;width:100%;">';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        html += '<td style="border:1px solid #ccc;min-width:40px;height:28px;">&nbsp;</td>';
      }
      html += '</tr>';
    }
    html += '</table><br>';
    exec('insertHTML', html);
  }

  // Table editing toolbar logic
  let selectedTable = null, selectedCell = null;
  const tableToolbar = document.getElementById('table-toolbar');

  editor.addEventListener('mousedown', e => {
    // Chọn bảng khi click vào bảng hoặc ô trong bảng
    let table = e.target.closest('table');
    if (table && editor.contains(table)) {
      selectedTable = table;
      selectedCell = e.target.closest('td,th');
      // Highlight bảng
      document.querySelectorAll('.selected-table').forEach(t => t.classList.remove('selected-table'));
      table.classList.add('selected-table');
      // Hiển thị toolbar phía trên và căn giữa bảng
      const rect = table.getBoundingClientRect();
      tableToolbar.style.display = 'flex';
      tableToolbar.style.top = (window.scrollY + rect.top - tableToolbar.offsetHeight - 8) + 'px';
      tableToolbar.style.left = (window.scrollX + rect.left + rect.width/2 - tableToolbar.offsetWidth/2) + 'px';
      addTableResizeHandles(table);
      console.log('addTableResizeHandles called', table);
    } else {
      // Ẩn toolbar nếu click ra ngoài bảng
      document.querySelectorAll('.selected-table').forEach(t => t.classList.remove('selected-table'));
      tableToolbar.style.display = 'none';
      selectedTable = null;
      selectedCell = null;
      removeTableResizeHandles();
      console.log('removeTableResizeHandles called');
    }
  });

  // Xóa bảng
  document.getElementById('delete-table-btn').onclick = function() {
    if (selectedTable) {
      selectedTable.remove();
      tableToolbar.style.display = 'none';
      selectedTable = null;
    }
  };
  // Thêm dòng trên
  document.getElementById('add-row-above-btn').onclick = function() {
    if (selectedCell && selectedTable) {
      const row = selectedCell.parentElement;
      const newRow = row.cloneNode(true);
      newRow.querySelectorAll('td,th').forEach(cell => cell.innerHTML = '&nbsp;');
      row.parentElement.insertBefore(newRow, row);
    }
  };
  // Thêm dòng dưới
  document.getElementById('add-row-below-btn').onclick = function() {
    if (selectedCell && selectedTable) {
      const row = selectedCell.parentElement;
      const newRow = row.cloneNode(true);
      newRow.querySelectorAll('td,th').forEach(cell => cell.innerHTML = '&nbsp;');
      row.parentElement.insertBefore(newRow, row.nextSibling);
    }
  };
  // Xóa dòng
  document.getElementById('delete-row-btn').onclick = function() {
    if (selectedCell && selectedTable) {
      const row = selectedCell.parentElement;
      if (row.parentElement.rows.length > 1) row.remove();
    }
  };
  // Thêm cột trái
  document.getElementById('add-col-left-btn').onclick = function() {
    if (selectedCell && selectedTable) {
      const cellIndex = selectedCell.cellIndex;
      Array.from(selectedTable.rows).forEach(row => {
        const newCell = row.insertCell(cellIndex);
        newCell.innerHTML = '&nbsp;';
      });
    }
  };
  // Thêm cột phải
  document.getElementById('add-col-right-btn').onclick = function() {
    if (selectedCell && selectedTable) {
      const cellIndex = selectedCell.cellIndex;
      Array.from(selectedTable.rows).forEach(row => {
        const newCell = row.insertCell(cellIndex + 1);
        newCell.innerHTML = '&nbsp;';
      });
    }
  };
  // Xóa cột
  document.getElementById('delete-col-btn').onclick = function() {
    if (selectedCell && selectedTable) {
      const cellIndex = selectedCell.cellIndex;
      if (selectedTable.rows[0].cells.length > 1) {
        Array.from(selectedTable.rows).forEach(row => {
          row.deleteCell(cellIndex);
        });
      }
    }
  };
  // Ẩn toolbar khi scroll hoặc resize
  window.addEventListener('scroll', () => { tableToolbar.style.display = 'none'; });
  window.addEventListener('resize', () => { tableToolbar.style.display = 'none'; });

  // Font select
  const fontSelect = document.getElementById('font-select');
  fontSelect.addEventListener('change', function() {
    const font = fontSelect.value;
    if (font === 'default') {
      exec('removeFormat');
      return;
    }
    exec('fontName', font);
  });

  document.getElementById('bold-btn').addEventListener('mousedown', e => { e.preventDefault(); exec('bold'); });
  document.getElementById('italic-btn').addEventListener('mousedown', e => { e.preventDefault(); exec('italic'); });
  document.getElementById('underline-btn').addEventListener('mousedown', e => { e.preventDefault(); exec('underline'); });
  document.getElementById('strike-btn').addEventListener('mousedown', e => { e.preventDefault(); exec('strikeThrough'); });
  document.getElementById('sup-btn').addEventListener('mousedown', e => { e.preventDefault(); exec('superscript'); });
  document.getElementById('sub-btn').addEventListener('mousedown', e => { e.preventDefault(); exec('subscript'); });
  document.getElementById('h1-btn').addEventListener('mousedown', e => { e.preventDefault(); exec('formatBlock', 'H1'); });
  document.getElementById('h2-btn').addEventListener('mousedown', e => { e.preventDefault(); exec('formatBlock', 'H2'); });
  document.getElementById('quote-btn').addEventListener('mousedown', e => { e.preventDefault(); exec('formatBlock', 'BLOCKQUOTE'); });
  document.getElementById('code-btn').addEventListener('mousedown', e => { e.preventDefault(); exec('formatBlock', 'PRE'); });
  document.getElementById('left-btn').addEventListener('mousedown', e => { e.preventDefault(); exec('justifyLeft'); });
  document.getElementById('center-btn').addEventListener('mousedown', e => { e.preventDefault(); exec('justifyCenter'); });
  document.getElementById('right-btn').addEventListener('mousedown', e => { e.preventDefault(); exec('justifyRight'); });
  document.getElementById('ul-btn').addEventListener('mousedown', e => { e.preventDefault(); exec('insertUnorderedList'); });
  document.getElementById('ol-btn').addEventListener('mousedown', e => { e.preventDefault(); exec('insertOrderedList'); });
  document.getElementById('link-btn').addEventListener('mousedown', e => {
    e.preventDefault();
    const url = prompt('Enter URL:', 'https://');
    if (url) exec('createLink', url);
  });
  document.getElementById('img-btn').addEventListener('mousedown', e => {
    e.preventDefault();
    const url = prompt('Enter image URL:', 'https://');
    if (url) exec('insertImage', url);
  });

  // Text color palette
  const colorBtn = document.getElementById('color-btn');
  const colorPalette = document.getElementById('color-palette');
  colorBtn.addEventListener('click', e => {
    e.preventDefault();
    colorPalette.style.display = colorPalette.style.display === 'flex' ? 'none' : 'flex';
  });
  colorPalette.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('mousedown', e => {
      e.preventDefault();
      exec('foreColor', swatch.dataset.color);
      colorPalette.style.display = 'none';
    });
  });
  document.addEventListener('mousedown', e => {
    if (!colorPalette.contains(e.target) && e.target !== colorBtn) {
      colorPalette.style.display = 'none';
    }
  });

  // Highlight palette
  const highlightBtn = document.getElementById('highlight-btn');
  const highlightPalette = document.getElementById('highlight-palette');
  highlightBtn.addEventListener('click', e => {
    e.preventDefault();
    highlightPalette.style.display = highlightPalette.style.display === 'flex' ? 'none' : 'flex';
  });
  highlightPalette.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('mousedown', e => {
      e.preventDefault();
      exec('hiliteColor', swatch.dataset.color);
      highlightPalette.style.display = 'none';
    });
  });
  document.addEventListener('mousedown', e => {
    if (!highlightPalette.contains(e.target) && e.target !== highlightBtn) {
      highlightPalette.style.display = 'none';
    }
  });

  document.getElementById('undo-btn').addEventListener('mousedown', e => { e.preventDefault(); exec('undo'); });
  document.getElementById('redo-btn').addEventListener('mousedown', e => { e.preventDefault(); exec('redo'); });
  document.getElementById('remove-format-btn').addEventListener('mousedown', e => { e.preventDefault(); exec('removeFormat'); });
  document.getElementById('save-btn').addEventListener('mousedown', e => {
    e.preventDefault();
    alert('HTML content saved!\n' + editor.innerHTML);
  });
  document.getElementById('view-html-btn').addEventListener('click', function() {
    document.getElementById('html-content').textContent = editor.innerHTML;
  });

  // Block format select (heading, paragraph, pre)
  const blockFormatSelect = document.getElementById('block-format-select');
  blockFormatSelect.addEventListener('change', function() {
    const value = blockFormatSelect.value;
    exec('formatBlock', value);
  });
});

// Table resize handle logic
function addTableResizeHandles(table) {
  removeTableResizeHandles();
  console.log('addTableResizeHandles: creating handles for', table);
  const rect = table.getBoundingClientRect();
  const handles = ['tl', 'tr', 'bl', 'br'].map(pos => {
    const div = document.createElement('div');
    div.className = 'table-resize-handle ' + pos;
    document.body.appendChild(div);
    return div;
  });
  positionHandles();

  function positionHandles() {
    const rect = table.getBoundingClientRect();
    const scrollY = window.scrollY, scrollX = window.scrollX;
    handles[0].style.top = (rect.top + scrollY - 7) + 'px'; // tl
    handles[0].style.left = (rect.left + scrollX - 7) + 'px';
    handles[1].style.top = (rect.top + scrollY - 7) + 'px'; // tr
    handles[1].style.left = (rect.right + scrollX - 7) + 'px';
    handles[2].style.top = (rect.bottom + scrollY - 7) + 'px'; // bl
    handles[2].style.left = (rect.left + scrollX - 7) + 'px';
    handles[3].style.top = (rect.bottom + scrollY - 7) + 'px'; // br
    handles[3].style.left = (rect.right + scrollX - 7) + 'px';
  }

  window.addEventListener('scroll', positionHandles);
  window.addEventListener('resize', positionHandles);

  // Resize logic
  let resizing = false, startX, startY, startW, startH, which;
  handles.forEach((handle, idx) => {
    handle.addEventListener('mousedown', e => {
      e.preventDefault();
      resizing = true;
      which = idx;
      startX = e.clientX;
      startY = e.clientY;
      startW = table.offsetWidth;
      startH = table.offsetHeight;
      document.body.style.userSelect = 'none';
    });
  });
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);

  function onMove(e) {
    if (!resizing) return;
    let dx = e.clientX - startX;
    let dy = e.clientY - startY;
    let newW = startW, newH = startH;
    if (which === 3) { // br
      newW = startW + dx;
      newH = startH + dy;
    } else if (which === 2) { // bl
      newW = startW - dx;
      newH = startH + dy;
    } else if (which === 1) { // tr
      newW = startW + dx;
      newH = startH - dy;
    } else if (which === 0) { // tl
      newW = startW - dx;
      newH = startH - dy;
    }
    if (newW > 60) table.style.width = newW + 'px';
    if (newH > 40) table.style.height = newH + 'px';
    positionHandles();
  }
  function onUp() {
    if (resizing) {
      resizing = false;
      document.body.style.userSelect = '';
    }
  }

  // Lưu lại để xóa khi cần
  table._resizeHandles = handles;
  table._resizePositionHandles = positionHandles;
}
function removeTableResizeHandles() {
  document.querySelectorAll('.table-resize-handle').forEach(h => h.remove());
  console.log('removeTableResizeHandles: removed all handles');
}
