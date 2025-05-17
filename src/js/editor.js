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

  // Định dạng văn bản
  function addFormatBtnListener(id, cmd) {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('mousedown', e => {
        e.preventDefault();
        exec(cmd);
        updateToolbarActiveState();
      });
    }
  }
  addFormatBtnListener('bold-btn', 'bold');
  addFormatBtnListener('italic-btn', 'italic');
  addFormatBtnListener('underline-btn', 'underline');
  addFormatBtnListener('strike-btn', 'strikeThrough');
  addFormatBtnListener('sup-btn', 'superscript');
  addFormatBtnListener('sub-btn', 'subscript');

  // Đảm bảo cập nhật trạng thái khi editor được focus hoặc click
  editor.addEventListener('focus', updateToolbarActiveState);
  editor.addEventListener('mouseup', updateToolbarActiveState);
  editor.addEventListener('keyup', updateToolbarActiveState);

  document.addEventListener('selectionchange', updateToolbarActiveState);

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
    showTooltip({
      title: 'Chèn liên kết',
      placeholder: 'Nhập URL (https://...)',
      confirmText: 'Chèn',
      onSubmit: url => exec('createLink', url)
    });
  });
  let savedSelection = null;

  document.getElementById('img-btn').addEventListener('mousedown', e => {
    e.preventDefault();
    savedSelection = saveSelection();
    showTooltip({
      title: 'Chèn ảnh',
      placeholder: 'Dán URL ảnh hoặc chọn file...',
      confirmText: 'Chèn',
      file: true,
      onSubmit: url => insertImageWithStyle(url)
    });
  });

  function saveSelection() {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      return sel.getRangeAt(0).cloneRange();
    }
    return null;
  }
  function restoreSelection(range) {
    if (range) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  // Chèn ảnh với style hợp lý
  function insertImageWithStyle(url) {
    const img = document.createElement('img');
    img.src = url;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';
    img.setAttribute('data-resizable', 'true');
    img.width = 300;
    img.height = 200;

    // Khôi phục selection trước khi chèn
    restoreSelection(savedSelection);
    editor.focus();
    const sel = window.getSelection();
    if (sel.rangeCount && editor.contains(sel.anchorNode)) {
      sel.getRangeAt(0).insertNode(img);
    } else {
      editor.appendChild(img);
    }
    setTimeout(() => {
      img.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showImgResizeHandles(img);
    }, 10);
  }

  // Resize ảnh trong editor với 4 điểm như table
  let currentImg = null, imgHandles = [], imgResizing = false, imgStartX = 0, imgStartY = 0, imgStartW = 0, imgStartH = 0, imgWhich = 0, imgAspect = 1;

  function showImgResizeHandles(img) {
    removeImgResizeHandles();
    currentImg = img;
    imgAspect = img.naturalWidth / img.naturalHeight;
    // Tính vị trí ảnh trên trang
    const rect = img.getBoundingClientRect();
    const scrollY = window.scrollY, scrollX = window.scrollX;
    imgHandles = ['tl', 'tr', 'bl', 'br'].map(pos => {
      const div = document.createElement('div');
      div.className = 'img-resize-handle ' + pos;
      div.style.position = 'absolute';
      div.style.width = '14px';
      div.style.height = '14px';
      div.style.background = '#007bff';
      div.style.border = '2px solid #fff';
      div.style.borderRadius = '50%';
      div.style.zIndex = 20;
      div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
      div.style.cursor =
        pos === 'tl' ? 'nwse-resize' :
        pos === 'tr' ? 'nesw-resize' :
        pos === 'bl' ? 'nesw-resize' :
        'nwse-resize';
      document.body.appendChild(div);
      return div;
    });
    positionImgHandles();
    img.style.outline = '2px solid #007bff';
    window.addEventListener('scroll', positionImgHandles);
    window.addEventListener('resize', positionImgHandles);
    imgHandles.forEach((handle, idx) => {
      handle.addEventListener('mousedown', e => {
    e.preventDefault();
        e.stopPropagation();
        startResizeImgHandle(e, idx);
      });
    });
  }

  function positionImgHandles() {
    if (!currentImg || imgHandles.length !== 4) return;
    const rect = currentImg.getBoundingClientRect();
    const scrollY = window.scrollY, scrollX = window.scrollX;
    // tl
    imgHandles[0].style.top = (rect.top + scrollY - 7) + 'px';
    imgHandles[0].style.left = (rect.left + scrollX - 7) + 'px';
    // tr
    imgHandles[1].style.top = (rect.top + scrollY - 7) + 'px';
    imgHandles[1].style.left = (rect.right + scrollX - 7) + 'px';
    // bl
    imgHandles[2].style.top = (rect.bottom + scrollY - 7) + 'px';
    imgHandles[2].style.left = (rect.left + scrollX - 7) + 'px';
    // br
    imgHandles[3].style.top = (rect.bottom + scrollY - 7) + 'px';
    imgHandles[3].style.left = (rect.right + scrollX - 7) + 'px';
    // Debug vị trí handle
    console.log('Handle TL:', imgHandles[0].style.top, imgHandles[0].style.left);
    console.log('Handle TR:', imgHandles[1].style.top, imgHandles[1].style.left);
    console.log('Handle BL:', imgHandles[2].style.top, imgHandles[2].style.left);
    console.log('Handle BR:', imgHandles[3].style.top, imgHandles[3].style.left);
  }

  function removeImgResizeHandles() {
    if (currentImg) currentImg.style.outline = '';
    imgHandles.forEach(h => h.remove());
    imgHandles = [];
    window.removeEventListener('scroll', positionImgHandles);
    window.removeEventListener('resize', positionImgHandles);
    currentImg = null;
  }

  function startResizeImgHandle(e, which) {
    e.preventDefault();
    imgResizing = true;
    imgWhich = which;
    imgStartX = e.clientX;
    imgStartY = e.clientY;
    imgStartW = currentImg.width;
    imgStartH = currentImg.height || (currentImg.width / imgAspect);
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', resizingImgHandle);
    document.addEventListener('mouseup', stopResizeImgHandle);
  }

  function resizingImgHandle(e) {
    if (!imgResizing || !currentImg) return;
    let dx = e.clientX - imgStartX;
    let dy = e.clientY - imgStartY;
    let newW = imgStartW, newH = imgStartH;
    if (imgWhich === 3) { // br
      newW = imgStartW + dx;
      newH = imgStartH + dy;
    } else if (imgWhich === 2) { // bl
      newW = imgStartW - dx;
      newH = imgStartH + dy;
    } else if (imgWhich === 1) { // tr
      newW = imgStartW + dx;
      newH = imgStartH - dy;
    } else if (imgWhich === 0) { // tl
      newW = imgStartW - dx;
      newH = imgStartH - dy;
    }
    // Giữ tỷ lệ gốc khi kéo chéo
    if (e.shiftKey) {
      const ratio = imgAspect;
      if (Math.abs(dx) > Math.abs(dy)) {
        newH = newW / ratio;
      } else {
        newW = newH * ratio;
      }
    }
    if (newW > 40) currentImg.width = newW;
    if (newH > 40) currentImg.height = newH;
    positionImgHandles();
  }

  function stopResizeImgHandle() {
    imgResizing = false;
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', resizingImgHandle);
    document.removeEventListener('mouseup', stopResizeImgHandle);
  }

  // Lắng nghe click vào ảnh trong editor
  editor.addEventListener('mousedown', function(e) {
    if (e.target.tagName === 'IMG' && e.target.getAttribute('data-resizable') === 'true') {
      showImgResizeHandles(e.target);
    } else {
      removeImgResizeHandles();
    }
  });

  // Khi click ra ngoài editor và ngoài handle, ẩn handle
  document.addEventListener('mousedown', function(e) {
    if (!editor.contains(e.target) && !e.target.classList.contains('img-resize-handle')) {
      removeImgResizeHandles();
    }
  });

  // Cập nhật trạng thái active cho các nút định dạng
  function updateToolbarActiveState() {
    const selection = document.getSelection();
    console.log('updateToolbarActiveState', selection && selection.toString(), selection);
    const formatMap = [
      { cmd: 'bold', btn: 'bold-btn' },
      { cmd: 'italic', btn: 'italic-btn' },
      { cmd: 'underline', btn: 'underline-btn' },
      { cmd: 'strikeThrough', btn: 'strike-btn' },
      { cmd: 'superscript', btn: 'sup-btn' },
      { cmd: 'subscript', btn: 'sub-btn' }
    ];
    formatMap.forEach(item => {
      const btn = document.getElementById(item.btn);
      if (!btn) return;
      const state = document.queryCommandState(item.cmd);
      console.log(`Button ${item.btn} (${item.cmd}):`, state);
      if (state) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Tooltip tổng quát, tái sử dụng cho nhiều mục đích
  function showTooltip({ 
    title = '', 
    placeholder = '', 
    confirmText = 'OK', 
    file = false,
    emojis = false,
    onSubmit, 
    onClose 
  }) {
    // Xóa tooltip cũ nếu có
    const old = document.getElementById('custom-tooltip');
    if (old) old.remove();
    const oldOverlay = document.getElementById('custom-tooltip-overlay');
    if (oldOverlay) oldOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'custom-tooltip-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.08)';
    overlay.style.zIndex = 9998;
    overlay.onclick = () => { close(); };

    const tooltip = document.createElement('div');
    tooltip.id = 'custom-tooltip';
    tooltip.style.position = 'fixed';
    tooltip.style.top = '120px';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translateX(-50%)';
    tooltip.style.background = '#fff';
    tooltip.style.border = '1px solid #ccc';
    tooltip.style.borderRadius = '10px';
    tooltip.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
    tooltip.style.padding = '20px 24px 16px 24px';
    tooltip.style.zIndex = 9999;
    tooltip.style.display = 'flex';
    tooltip.style.flexDirection = 'column';
    tooltip.style.gap = '12px';
    tooltip.style.minWidth = '320px';
    tooltip.style.maxWidth = '90vw';

    if (title) {
      const h = document.createElement('div');
      h.textContent = title;
      h.style.fontWeight = 'bold';
      h.style.fontSize = '18px';
      h.style.marginBottom = '4px';
      tooltip.appendChild(h);
    }

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.style.padding = '10px';
    input.style.fontSize = '16px';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '5px';
    input.style.outline = 'none';
    tooltip.appendChild(input);

    let fileInput, fileLabel, filePreview;
    if (file) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.style.marginTop = '8px';
      fileLabel = document.createElement('label');
      fileLabel.textContent = 'Chọn file ảnh...';
      fileLabel.style.fontSize = '14px';
      fileLabel.style.marginTop = '4px';
      fileLabel.style.cursor = 'pointer';
      fileLabel.appendChild(fileInput);
      tooltip.appendChild(fileLabel);
      filePreview = document.createElement('img');
      filePreview.style.maxWidth = '100%';
      filePreview.style.maxHeight = '120px';
      filePreview.style.marginTop = '8px';
      filePreview.style.display = 'none';
      tooltip.appendChild(filePreview);
      fileInput.addEventListener('change', async () => {
        if (fileInput.files && fileInput.files[0]) {
          // Hiển thị preview
          const reader = new FileReader();
          reader.onload = e => {
            filePreview.src = e.target.result;
            filePreview.style.display = 'block';
          };
          reader.readAsDataURL(fileInput.files[0]);
          // Upload demo lên imgbb
          const formData = new FormData();
          formData.append('image', fileInput.files[0]);
          // Gợi ý: Nên dùng API key riêng của bạn ở đây
          const imgbbKey = 'YOUR_IMGBB_API_KEY'; // Đăng ký miễn phí tại https://api.imgbb.com/
          input.value = 'Đang upload...';
          input.disabled = true;
          try {
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
              method: 'POST',
              body: formData
            });
            const data = await res.json();
            if (data && data.data && data.data.url) {
              input.value = data.data.url;
            } else {
              input.value = '';
              alert('Upload ảnh thất bại!');
            }
          } catch (err) {
            input.value = '';
            alert('Upload ảnh thất bại!');
          }
          input.disabled = false;
        }
      });
    }

    if (emojis) {
      const emojiList = '😀 😃 😄 😁 😆 😅 😂 😊 😇 😉 😍 😘 😜 🤗 🤔 🤩 🤨 🥳 🥰 😎 😏 😤 😱 😭 😡 🤬 🥶 🥵 🤯 🥳 🥺 🙏 👍 👎 👏 🙌 💪 🤝 🧠 🦾 🦿 🦵 🦶 👀 👋'.split(' ');
      const emojiBox = document.createElement('div');
      emojiBox.style.display = 'flex';
      emojiBox.style.flexWrap = 'wrap';
      emojiBox.style.gap = '6px';
      emojiBox.style.margin = '8px 0';
      emojiList.forEach(emo => {
        const btn = document.createElement('button');
        btn.textContent = emo;
        btn.style.fontSize = '22px';
        btn.style.padding = '4px 8px';
        btn.style.border = 'none';
        btn.style.background = 'none';
        btn.style.cursor = 'pointer';
        btn.onclick = () => {
          // Khôi phục selection emoji và chèn emoji ngay lập tức
          restoreSelection(savedEmojiSelection);
          editor.focus();
          const sel = window.getSelection();
          if (sel.rangeCount && editor.contains(sel.anchorNode)) {
            sel.getRangeAt(0).insertNode(document.createTextNode(emo));
          } else {
            editor.appendChild(document.createTextNode(emo));
          }
          // Đóng tooltip
          overlay.remove();
          tooltip.remove();
        };
        emojiBox.appendChild(btn);
      });
      tooltip.insertBefore(emojiBox, input);
    }

    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '8px';
    btnRow.style.justifyContent = 'flex-end';

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = confirmText;
    confirmBtn.style.padding = '8px 18px';
    confirmBtn.style.background = '#007bff';
    confirmBtn.style.color = '#fff';
    confirmBtn.style.border = 'none';
    confirmBtn.style.borderRadius = '4px';
    confirmBtn.style.cursor = 'pointer';
    confirmBtn.style.fontWeight = 'bold';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Đóng';
    closeBtn.style.padding = '8px 18px';
    closeBtn.style.background = '#eee';
    closeBtn.style.color = '#333';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '4px';
    closeBtn.style.cursor = 'pointer';

    btnRow.appendChild(confirmBtn);
    btnRow.appendChild(closeBtn);
    tooltip.appendChild(btnRow);

    function close() {
      overlay.remove();
      tooltip.remove();
      if (onClose) onClose();
    }

    confirmBtn.onclick = () => {
      if (input.value.trim() && input.value !== 'Đang upload...') {
        onSubmit(input.value.trim());
        close();
      } else {
        input.focus();
      }
    };
    closeBtn.onclick = close;

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') confirmBtn.click();
      if (e.key === 'Escape') close();
    });

    setTimeout(() => input.focus(), 10);

    document.body.appendChild(overlay);
    document.body.appendChild(tooltip);
  }

  // Block format select (heading, paragraph, pre)
  const blockFormatSelect = document.getElementById('block-format-select');
  blockFormatSelect.addEventListener('change', function() {
    const value = blockFormatSelect.value;
    exec('formatBlock', value);
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

  // Nút emoji
  let savedEmojiSelection = null;
  document.getElementById('emoji-btn').addEventListener('mousedown', e => {
    e.preventDefault();
    savedEmojiSelection = saveSelection();
    showTooltip({
      title: 'Chèn Emoji',
      placeholder: 'Tìm hoặc chọn emoji...',
      confirmText: 'Chèn',
      emojis: true,
      onSubmit: emoji => {
        // Trường hợp bấm nút Chèn (ít dùng)
        restoreSelection(savedEmojiSelection);
        editor.focus();
        const sel = window.getSelection();
        if (sel.rangeCount && editor.contains(sel.anchorNode)) {
          sel.getRangeAt(0).insertNode(document.createTextNode(emoji));
        } else {
          editor.appendChild(document.createTextNode(emoji));
        }
      }
    });
  });

  // Cập nhật statusbar: breadcrumb và wordcount
  function updateStatusbar() {
    // Breadcrumb
    const breadcrumbEl = document.getElementById('breadcrumb');
    const sel = window.getSelection();
    let node = sel.anchorNode;
    if (node && node.nodeType === 3) node = node.parentNode;
    let path = [];
    while (node && node !== editor && node.nodeType === 1) {
      path.unshift(node.tagName.toLowerCase());
      node = node.parentNode;
    }
    breadcrumbEl.textContent = path.join(' › ');
    // Wordcount
    const wordcountEl = document.getElementById('wordcount');
    const text = editor.innerText || '';
    const words = text.trim().split(/\s+/).filter(Boolean);
    wordcountEl.textContent = words.length + ' words  |  ' + text.length + ' chars';
  }
  editor.addEventListener('keyup', updateStatusbar);
  editor.addEventListener('mouseup', updateStatusbar);
  editor.addEventListener('input', updateStatusbar);
  document.addEventListener('selectionchange', updateStatusbar);
  // Gọi lần đầu
  updateStatusbar();
});
