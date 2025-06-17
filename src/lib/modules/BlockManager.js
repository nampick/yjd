// BlockManager.js - Quản lý block operations và indentation
export class BlockManager {
  constructor(editor, toolbarManager) {
    this.editor = editor;
    this.toolbarManager = toolbarManager;

    // Tạo tooltip nếu chưa tồn tại
    if (!this.editor.tooltip) {
      const tooltip = document.createElement('div');
      tooltip.className = 'custom-tooltip';
      document.body.appendChild(tooltip);
      this.editor.tooltip = tooltip;
    }
  }

  createBlockToolbar() {
    // Tạo block toolbar floating
    this.blockToolbar = document.createElement('div');
    this.blockToolbar.className = 'block-toolbar';
    this.blockToolbar.style.position = 'absolute';
    this.blockToolbar.style.display = 'none';
    this.blockToolbar.style.zIndex = 1001;
    this.blockToolbar.style.background = '#fff';
    this.blockToolbar.style.border = 'none';
    this.blockToolbar.style.borderRadius = '6.9px';
    this.blockToolbar.style.boxSizing = 'border-box';
    this.blockToolbar.style.boxShadow = '0 4px 24px rgba(0,0,0,0.13)';
    this.blockToolbar.style.padding = '12px';
    this.blockToolbar.style.gap = '28px';
    this.blockToolbar.style.display = 'flex';
    this.blockToolbar.style.alignItems = 'center';
    this.blockToolbar.style.opacity = '0';
    this.blockToolbar.style.pointerEvents = 'none';
    this.blockToolbar.style.minWidth = 'auto';
    this.blockToolbar.style.minHeight = 'auto';
    this.blockToolbar.style.width = 'auto';
    this.blockToolbar.style.height = 'auto';
    this.blockToolbar.style.flexWrap = 'nowrap';
    
    // Thêm mũi tên (mặc định hướng xuống)
    if (!this.blockToolbar.arrow) {
      const arrow = document.createElement('div');
      arrow.className = 'block-toolbar-arrow';
      arrow.style.position = 'absolute';
      arrow.style.left = '50%';
      arrow.style.bottom = '-8px';
      arrow.style.transform = 'translateX(-50%)';
      arrow.style.borderLeft = '6px solid transparent';
      arrow.style.borderRight = '6px solid transparent';
      arrow.style.borderTop = '8px solid #fff';
      arrow.style.setProperty('borderTop', '8px solid #fff', 'important');
      arrow.style.filter = 'drop-shadow(0px 1px 1px rgba(0,0,0,0.08))';
      this.blockToolbar.appendChild(arrow);
      this.blockToolbar.arrow = arrow;
    }
    
    // Xóa cũ nếu có
    if (this.blockToolbar.parentNode) this.blockToolbar.parentNode.removeChild(this.blockToolbar);
    document.body.appendChild(this.blockToolbar);
    
    this.createBlockToolbarButtons();
  }

  createBlockToolbarButtons() {
    // Xóa tất cả nút cũ (trừ arrow)
    const arrow = this.blockToolbar.arrow;
    this.blockToolbar.innerHTML = '';
    if (arrow) {
      this.blockToolbar.appendChild(arrow);
    }
    
    const features = this.editor.options.blockToolbarFeatures;
    const icons = {
      bold: '<i class="fas fa-bold"></i>',
      italic: '<i class="fas fa-italic"></i>',
      underline: '<i class="fas fa-underline"></i>',
      strikeThrough: '<i class="fas fa-strikethrough"></i>',
      code: '<i class="fas fa-code"></i>',
      fontFamily: '<i class="fas fa-font"></i>'
    };
    
    features.forEach(f => {
      const btn = document.createElement('button');
      btn.innerHTML = icons[f] || f;
      this.attachCustomTooltip(btn, f.charAt(0).toUpperCase() + f.slice(1));
      btn.style.background = '#fff';
      btn.style.border = 'none';
      btn.style.borderRadius = '8px';
      btn.style.height = '14px';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.fontSize = '14px';
      btn.style.color = '#374151';
      btn.style.cursor = 'pointer';
      btn.onmouseover = () => {
        btn.style.background = '#f4f6fa';
        btn.style.color = '#1976d2';
      };
      btn.onmouseout = () => {
        btn.style.background = '#fff';
        btn.style.color = '#374151';
      };
      btn.onclick = e => {
        e.preventDefault();
        this.handleBlockToolbarAction(f);
        this.hideBlockToolbar();
      };
      this.blockToolbar.appendChild(btn);
    });
  }
  attachCustomTooltip(element, text) {
    const tooltip = this.editor.tooltip;
    let showTimer;

    element.addEventListener('mouseenter', () => {
      showTimer = setTimeout(() => {
        tooltip.innerText = text;
        tooltip.style.display = 'block';
        tooltip.style.opacity = '1';

        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left + window.scrollX + rect.width / 2 - tooltip.offsetWidth / 2}px`;
        tooltip.style.top = `${rect.bottom + window.scrollY + 8}px`; // 8px bên dưới phần tử
      }, 500); // Delay 0.5s
    });

    element.addEventListener('mousemove', () => {
      if (tooltip.style.display === 'block') {
        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left + window.scrollX + rect.width / 2 - tooltip.offsetWidth / 2}px`;
        tooltip.style.top = `${rect.bottom + window.scrollY + 8}px`;
      }
    });

    element.addEventListener('mouseleave', () => {
      clearTimeout(showTimer);
      tooltip.style.display = 'none';
      tooltip.style.opacity = '0';
    });
  }
  createSplitToolbar(features, splitIndex) {
    // Tạo toolbar cho phần đầu
    const firstPart = features.slice(0, splitIndex);
    const secondPart = features.slice(splitIndex);
    
    // Tạo toolbar trên
    this.blockToolbar.style.flexDirection = 'column';
    this.blockToolbar.style.gap = '8px';
    
    const topRow = document.createElement('div');
    topRow.style.display = 'flex';
    topRow.style.gap = '28px';
    topRow.style.alignItems = 'center';
    
    const bottomRow = document.createElement('div');
    bottomRow.style.display = 'flex';
    bottomRow.style.gap = '28px';
    bottomRow.style.alignItems = 'center';
    
    const icons = {
      bold: '<i class="fas fa-bold"></i>',
      italic: '<i class="fas fa-italic"></i>',
      underline: '<i class="fas fa-underline"></i>',
      strikeThrough: '<i class="fas fa-strikethrough"></i>',
      code: '<i class="fas fa-code"></i>',
      fontFamily: '<i class="fas fa-font"></i>'
    };
    
    // Tạo nút cho hàng trên
    firstPart.forEach(f => {
      const btn = this.createToolbarButton(f, icons[f] || f);
      topRow.appendChild(btn);
    });
    
    // Tạo nút cho hàng dưới
    secondPart.forEach(f => {
      const btn = this.createToolbarButton(f, icons[f] || f);
      bottomRow.appendChild(btn);
    });
    
    this.blockToolbar.appendChild(topRow);
    this.blockToolbar.appendChild(bottomRow);
  }

  createToolbarButton(feature, icon) {
    const btn = document.createElement('button');
    btn.innerHTML = icon;
    this.attachCustomTooltip(btn, f.charAt(0).toUpperCase() + f.slice(1));
    btn.style.background = '#fff';
    btn.style.border = 'none';
    btn.style.borderRadius = '8px';
    btn.style.height = '14px';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.fontSize = '14px';
    btn.style.color = '#374151';
    btn.style.cursor = 'pointer';
    btn.onmouseover = () => {
      btn.style.background = '#f4f6fa';
      btn.style.color = '#1976d2';
    };
    btn.onmouseout = () => {
      btn.style.background = '#fff';
      btn.style.color = '#374151';
    };
    btn.onclick = e => {
      e.preventDefault();
      this.handleBlockToolbarAction(feature);
      this.hideBlockToolbar();
    };
    return btn;
  }

  showBlockToolbar(rect) {
    if (!this.blockToolbar) {
      return;
    }
    
    // Clear timeout hiện tại nếu có
    if (this.blockToolbarTimeout) {
      clearTimeout(this.blockToolbarTimeout);
    }
    
    // Delay 0.5s trước khi hiện toolbar
    this.blockToolbarTimeout = setTimeout(() => {
      // Lấy thông tin về editor-area
      const editorArea = this.editor.editor;
      const editorRect = editorArea.getBoundingClientRect();
      
      // Reset toolbar style về mặc định
      this.blockToolbar.style.flexDirection = 'row';
      this.blockToolbar.style.gap = '28px';
      
      // Tạo lại nút toolbar bình thường
      this.createBlockToolbarButtons();
      
      // Tính toán kích thước toolbar
      this.blockToolbar.style.display = 'flex';
      this.blockToolbar.style.opacity = '0';
      this.blockToolbar.style.visibility = 'hidden';
      const toolbarRect = this.blockToolbar.getBoundingClientRect();
      const toolbarWidth = toolbarRect.width;
      const toolbarHeight = toolbarRect.height;
      this.blockToolbar.style.visibility = 'visible';
      
      // Tính toán vị trí mặc định (phía trên)
      let left = rect.left - 160;
      let top = rect.top + window.scrollY - toolbarHeight - 10;
      let arrowLeft = '50%';
      let arrowDirection = 'down'; // mũi tên hướng xuống
      
      // Trường hợp 1: Vượt quá lề trái
      if (left < editorRect.left) {
        left =  rect.left -30; // Đặt toolbar bên trong editor-area
        arrowLeft = '10%'; // Mũi tên ở 10%
      }
      
      // Trường hợp 2: Vượt quá lề phải  
      if (left + toolbarWidth > editorRect.right) {
        left = editorRect.right + (rect.left - editorRect.right) - toolbarWidth + 30; // Đặt toolbar bên trong editor-area
        arrowLeft = '90%'; // Mũi tên ở 90%
      }
      
      // Trường hợp 3: Vượt quá lề trên
      if (top < editorRect.top + window.scrollY) {
        top = rect.top + window.scrollY+toolbarHeight + 10; // Hiển thị phía dưới
        arrowDirection = 'up'; // Mũi tên hướng lên
      }
      
      // Trường hợp 4: Toolbar quá rộng so với editor-area
      if (toolbarWidth > editorRect.width - 20) {
        // Chia làm 2 hàng
        const features = this.options.blockToolbarFeatures;
        const splitIndex = Math.ceil(features.length / 2);
        
        // Xóa nội dung cũ
        const arrow = this.blockToolbar.arrow;
        this.blockToolbar.innerHTML = '';
        if (arrow) {
          this.blockToolbar.appendChild(arrow);
        }
        
        this.createSplitToolbar(features, splitIndex);
        
        // Tính lại kích thước sau khi chia
        const newToolbarRect = this.blockToolbar.getBoundingClientRect();
        const newToolbarHeight = newToolbarRect.height;
        
        // Cập nhật vị trí với chiều cao mới
        if (arrowDirection === 'down') {
          top = rect.top + window.scrollY - newToolbarHeight - 10;
        } else {
          top = rect.bottom + window.scrollY + 10;
        }
        
        // Đảm bảo toolbar nằm trong editor-area
        left = Math.max(editorRect.left + 10, Math.min(left, editorRect.right - newToolbarRect.width - 10));
      }
      
      // Cập nhật vị trí mũi tên
      if (this.blockToolbar.arrow) {
        this.blockToolbar.arrow.style.left = arrowLeft;
        
        if (arrowDirection === 'up') {
          // Mũi tên hướng lên
          this.blockToolbar.arrow.style.bottom = 'auto';
          this.blockToolbar.arrow.style.top = '-8px';
          this.blockToolbar.arrow.style.borderTop = 'none';
          this.blockToolbar.arrow.style.borderBottom = '8px solid #fff';
          this.blockToolbar.arrow.style.borderLeft = '6px solid transparent';
          this.blockToolbar.arrow.style.borderRight = '6px solid transparent';
        } else {
          // Mũi tên hướng xuống (mặc định)
          this.blockToolbar.arrow.style.top = 'auto';
          this.blockToolbar.arrow.style.bottom = '-8px';
          this.blockToolbar.arrow.style.borderBottom = 'none';
          this.blockToolbar.arrow.style.borderTop = '8px solid #fff';
          this.blockToolbar.arrow.style.borderLeft = '6px solid transparent';
          this.blockToolbar.arrow.style.borderRight = '6px solid transparent';
        }
      }
      
      // Áp dụng vị trí cuối cùng
      this.blockToolbar.style.left = left + 'px';
      this.blockToolbar.style.top = top + 'px';
      
      setTimeout(() => {
        this.blockToolbar.style.opacity = '1';
        this.blockToolbar.style.pointerEvents = 'auto';
      }, 10);
    }, 0); // Delay 0.5s
  }

  hideBlockToolbar() {
    if (!this.blockToolbar) return;
    this.blockToolbar.style.opacity = '0';
    this.blockToolbar.style.pointerEvents = 'none';
    setTimeout(() => {
      this.blockToolbar.style.display = 'none';
    }, 0);
  }

  handleBlockToolbarAction(type) {
    // Thực hiện chức năng tương ứng
    if (type === 'bold') {
      document.execCommand('bold');
    } else if (type === 'italic') {
      document.execCommand('italic');
    } else if (type === 'underline') {
      document.execCommand('underline');
    } else if (type === 'strikethrough') {
      document.execCommand('strikeThrough');
    } else if (type === 'fontFamily') {
      document.execCommand('fontFamily');
    } 
  }

  // Thêm phương thức để xử lý indentation cho nhiều block đã được chọn
  applyIndentToSelection() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    const range = sel.getRangeAt(0);
    
    // Nếu không có selection (chỉ có caret), áp dụng indent cho block hiện tại
    if (range.collapsed) {
      this.toggleIndentForBlock(this.getBlockElementAtCaret());
      return;
    }
    
    // Nếu có selection, tìm tất cả các blocks trong vùng chọn
    const blocks = this.getBlocksInSelection();
    blocks.forEach(block => this.toggleIndentForBlock(block));
    
    // Giữ nguyên selection sau khi áp dụng indent
    this.editor.editor.focus();
  }

  // Lấy block hiện tại tại vị trí caret
  getBlockElementAtCaret() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return null;
    
    const node = sel.anchorNode;
    let block = node.nodeType === 3 ? node.parentNode : node;
    
    // Tìm thẻ block cha gần nhất
    while (block && block !== this.editor && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'PRE', 'DIV', 'BLOCKQUOTE', 'LI'].includes(block.nodeName)) {
      block = block.parentNode;
    }
    
    // Nếu block là chính editor hoặc không tìm thấy block hợp lệ
    if (block === this.editor || !block) {
      // Tạo một thẻ P mặc định nếu cần
      if (this.editor.innerHTML.trim() === '' || this.editor.innerHTML === '<br>') {
        const p = document.createElement('P');
        p.innerHTML = '<br>';
        this.editor.appendChild(p);
        
        // Đặt selection vào thẻ P mới tạo
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(p);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        return p;
      }
      
      // Nếu editor có nội dung nhưng không có block element, wrap trong P
      const firstChild = this.editor.firstChild;
      if (firstChild && firstChild.nodeType === 3) {
        const p = document.createElement('P');
        while (this.editor.firstChild) {
          p.appendChild(this.editor.firstChild);
        }
        this.editor.appendChild(p);
        return p;
      }
      
      return null;
    }
    
    return block;
  }

  // Lấy tất cả các blocks trong vùng selection
  getBlocksInSelection() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return [];
    
    const range = sel.getRangeAt(0);
    
    // Tạo vùng bao phủ toàn bộ selection
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;
    const startOffset = range.startOffset;
    const endOffset = range.endOffset;
    
    // Nếu cả hai container đều là text nodes và cùng thuộc một block, chỉ trả về block đó
    if (startContainer === endContainer && startContainer.nodeType === 3) {
      const block = this.getParentBlock(startContainer);
      return block ? [block] : [];
    }
    
    // Tìm tất cả các blocks con trong editor
    const allBlocks = Array.from(this.editor.editor.querySelectorAll('p, h1, h2, h3, h4, h5, h6, pre, div, blockquote, li'))
      .filter(block => this.editor.editor.contains(block)); // Đảm bảo block nằm trong editor
    
    // Lọc ra các blocks nằm trong range
    const blocksInRange = [];
    let inRange = false;
    
    // Duyệt qua tất cả các blocks
    for (const block of allBlocks) {
      // Nếu block chứa startContainer, đánh dấu bắt đầu vùng chọn
      if (!inRange && (block.contains(startContainer) || this.isAfterNode(block, startContainer))) {
        inRange = true;
      }
      
      // Nếu đang trong vùng chọn, thêm block vào kết quả
      if (inRange) {
        blocksInRange.push(block);
      }
      
      // Nếu block chứa endContainer, đánh dấu kết thúc vùng chọn
      if (inRange && (block.contains(endContainer) || this.isBeforeNode(block, endContainer))) {
        inRange = false;
      }
    }
    
    return blocksInRange;
  }

  // Kiểm tra nếu nodeA nằm sau nodeB trong DOM
  isAfterNode(nodeA, nodeB) {
    return (nodeA.compareDocumentPosition(nodeB) & Node.DOCUMENT_POSITION_PRECEDING) !== 0;
  }
  
  // Kiểm tra nếu nodeA nằm trước nodeB trong DOM
  isBeforeNode(nodeA, nodeB) {
    return (nodeA.compareDocumentPosition(nodeB) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
  }

  // Lấy block cha của một node
  getParentBlock(node) {
    let parent = node.parentNode;
    while (parent && parent !== this.editor && !['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE', 'DIV', 'BLOCKQUOTE', 'LI'].includes(parent.nodeName)) {
      parent = parent.parentNode;
    }
    return parent === this.editor ? null : parent;
  }

  // Toggle text-indent cho block
  toggleIndentForBlock(block) {
    if (!block) return;
    
    // Lấy style hiện tại
    const currentStyle = block.getAttribute('style') || '';
    const hasIndent = currentStyle.includes('text-indent');
    
    if (hasIndent) {
      // Nếu đã có text-indent, bỏ nó đi (dù là em hay px)
      const newStyle = currentStyle.replace(/text-indent:\s*\d+(em|px);?\s*/i, '');
      block.setAttribute('style', newStyle.trim());

      // Nếu style rỗng sau khi bỏ indent, xóa thuộc tính style
      if (block.getAttribute('style') === '') {
        block.removeAttribute('style');
      }
    } else {
      // Nếu chưa có text-indent, thêm mới với 32px
      block.setAttribute('style', `${currentStyle}${currentStyle ? '; ' : ''}text-indent: 32px;`);
    }
    
    // Cập nhật trạng thái nút indent
        this.updateIndentButtonState();
  }

  // Cập nhật trạng thái nút indent dựa trên block hiện tại
  updateIndentButtonState() {
    // Cập nhật trạng thái hiển thị của nút indentDecrease
    this.updateIndentDecreaseButtonVisibility();
    
    // Cập nhật trạng thái hiển thị của nút indentIncrease  
    this.updateIndentIncreaseButtonVisibility();
  }

  // Kiểm tra xem block có text-indent không
  blockHasTextIndent(block) {
    if (!block) return false;
    
    const currentStyle = block.getAttribute('style') || '';
    return currentStyle.includes('text-indent');
  }

  // Áp dụng padding-left indentation cho các block được chọn
  applyPaddingIndentToSelection(increase = true) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    const range = sel.getRangeAt(0);
    
    // Nếu không có selection (chỉ có caret), áp dụng indent cho block hiện tại
    if (range.collapsed) {
      this.applyPaddingIndentToBlock(this.getBlockElementAtCaret(), increase);
    } else {
      // Nếu có selection, tìm tất cả các blocks trong vùng chọn
      const blocks = this.getBlocksInSelection();
      blocks.forEach(block => this.applyPaddingIndentToBlock(block, increase));
    }
    
    // Giữ nguyên selection sau khi áp dụng indent
    this.editor.editor.focus();
    
    // Cập nhật trạng thái hiển thị của nút indentDecrease
    this.updateIndentDecreaseButtonVisibility();
  }

  // Áp dụng padding-left indent cho một block
  applyPaddingIndentToBlock(block, increase = true) {
    if (!block) return;
    
    // Lấy style hiện tại và tìm padding-left
    const currentStyle = block.getAttribute('style') || '';
    const hasPaddingLeft = currentStyle.includes('padding-left');
    
    if (hasPaddingLeft) {
      // Tìm giá trị padding-left hiện tại
      const paddingMatch = currentStyle.match(/padding-left:\s*(\d+)px/);
      if (paddingMatch && paddingMatch[1]) {
        let paddingValue = parseInt(paddingMatch[1]);
        
        // Tăng hoặc giảm padding-left tùy theo tham số
        if (increase) {
          // Không vượt quá 480px
          paddingValue = Math.min(480, paddingValue + 40);
        } else {
          paddingValue = Math.max(0, paddingValue - 40);
        }
        
        // Cập nhật style với giá trị padding-left mới
        const newStyle = currentStyle.replace(
          /padding-left:\s*\d+px/, 
          `padding-left: ${paddingValue}px`
        );
        block.setAttribute('style', newStyle);
      }
    } else if (increase) {
      // Nếu chưa có padding-left và đang tăng indent, thêm mới với 40px
      block.setAttribute('style', `${currentStyle}${currentStyle ? '; ' : ''}padding-left: 40px;`);
    }
  }

  // Cập nhật trạng thái hiển thị của nút indentDecrease
  updateIndentDecreaseButtonVisibility() {
    const decreaseButton = this.editor.toolbarManager.toolbarBtns.indentDecrease;
    if (!decreaseButton) return;
    
    let shouldShow = false;
    
    // Kiểm tra block hiện tại hoặc blocks được chọn
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      
      if (range.collapsed) {
        // Chỉ có caret
        const block = this.getBlockElementAtCaret();
        shouldShow = this.blockHasPositivePaddingLeft(block);
      } else {
        // Có selection
        const blocks = this.getBlocksInSelection();
        // Hiện nút nếu có ít nhất một block có padding-left > 0
        shouldShow = blocks.some(block => this.blockHasPositivePaddingLeft(block));
      }
    }
    
    // Cập nhật trạng thái hiển thị
    decreaseButton.style.cursor = shouldShow ? 'pointer' : 'not-allowed';
    decreaseButton.style.opacity = shouldShow ? '1' : '0.5';
    
    // Cập nhật cả nút increase
    this.updateIndentIncreaseButtonVisibility();
  }

  // Cập nhật trạng thái hiển thị của nút indentIncrease
  updateIndentIncreaseButtonVisibility() {
    const increaseButton = this.editor.toolbarManager.toolbarBtns.indentIncrease;
    if (!increaseButton) return;
    
    let shouldHide = false;
    
    // Kiểm tra block hiện tại hoặc blocks được chọn
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      
      if (range.collapsed) {
        // Chỉ có caret
        const block = this.getBlockElementAtCaret();
        shouldHide = this.blockHasMaxPaddingLeft(block);
      } else {
        // Có selection
        const blocks = this.getBlocksInSelection();
        // Ẩn nút nếu tất cả các block đã đạt max padding-left
        shouldHide = blocks.length > 0 && blocks.every(block => this.blockHasMaxPaddingLeft(block));
      }
    }
    
    // Cập nhật trạng thái hiển thị
    increaseButton.style.cursor = shouldHide ? 'not-allowed' : 'pointer';
    increaseButton.style.opacity = shouldHide ? '0.5' : '1';
  }

  // Kiểm tra xem một block có padding-left > 0 không
  blockHasPositivePaddingLeft(block) {
    if (!block) return false;
    
    const currentStyle = block.getAttribute('style') || '';
    if (!currentStyle.includes('padding-left')) return false;
    
    const paddingMatch = currentStyle.match(/padding-left:\s*(\d+)px/);
    return paddingMatch && parseInt(paddingMatch[1]) > 0;
  }

  // Kiểm tra xem một block có padding-left đạt max (480px) không
  blockHasMaxPaddingLeft(block) {
    if (!block) return false;
    
    const currentStyle = block.getAttribute('style') || '';
    if (!currentStyle.includes('padding-left')) return false;
    
    const paddingMatch = currentStyle.match(/padding-left:\s*(\d+)px/);
    return paddingMatch && parseInt(paddingMatch[1]) >= 480;
  }

  // Áp dụng heading cho selection
  applyHeadingToSelection(tagName) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    const range = sel.getRangeAt(0);
    
    // Nếu không có selection (chỉ có caret), áp dụng cho block hiện tại
    if (range.collapsed) {
      const block = this.getBlockElementAtCaret();
      this.changeBlockTag(block, tagName);
    } else {
      // Nếu có selection, tìm tất cả các blocks trong vùng chọn
      const blocks = this.getBlocksInSelection();
      blocks.forEach(block => this.changeBlockTag(block, tagName));
    }
    
    // Giữ nguyên selection sau khi áp dụng
    this.editor.editor.focus();
        this.updateHeadingSelector();
  }

  // Thay đổi tag của một block
  changeBlockTag(block, newTagName) {
    if (!block || block === this.editor) return;
    
    // Tạo element mới với tag mong muốn
    const newBlock = document.createElement(newTagName);
    
    // Sao chép tất cả thuộc tính từ block cũ
    Array.from(block.attributes).forEach(attr => {
      newBlock.setAttribute(attr.name, attr.value);
    });
    
    // Sao chép nội dung
    newBlock.innerHTML = block.innerHTML;
    
    // Thay thế block cũ bằng block mới
    block.parentNode.insertBefore(newBlock, block);
    block.remove();
    
    // Đặt lại selection vào block mới
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(newBlock);
    range.collapse(false); // Đặt con trỏ ở cuối
    selection.removeAllRanges();
    selection.addRange(range);
  }

  // Cập nhật trạng thái heading selector
  updateHeadingSelector() {
  
    if (!this.toolbarManager?.headingSelector) return;
    
    const block = this.getBlockElementAtCaret();
    if (!block) return;
    
    const tagName = block.tagName.toUpperCase();
    // Đổi text trên button theo block hiện tại
    let label = 'Paragraph';
    if (tagName === 'H1') label = 'Heading 1';
    else if (tagName === 'H2') label = 'Heading 2';
    else if (tagName === 'H3') label = 'Heading 3';
    else if (tagName === 'H4') label = 'Heading 4';
    else if (tagName === 'H5') label = 'Heading 5';
    else if (tagName === 'H6') label = 'Heading 6';
    else if (tagName === 'PRE') label = 'Code Block';
    else if (tagName === 'BLOCKQUOTE') label = 'Quote';
    
    // Kiểm tra nếu con trỏ không nằm trong editor-area thì không làm gì
    const editorArea = document.querySelector('.editor-area'); // hoặc this.editorArea nếu có
    const selection = window.getSelection();
    if (!selection.rangeCount || !editorArea.contains(selection.getRangeAt(0).startContainer)) {
      return;
    }

    // ✅ Cập nhật text mà vẫn giữ dropdown icon
    const textNode = this.toolbarManager.headingSelector.firstChild;
    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
      textNode.textContent = label;
    } else {
      // Tạo lại nội dung button với dropdown icon
      this.toolbarManager.headingSelector.innerHTML = label;

      const dropdownIcon = document.createElement('span');
      dropdownIcon.innerHTML = '▼';
      dropdownIcon.style.fontSize = '10px';
      dropdownIcon.style.opacity = '0.7';
      dropdownIcon.style.marginLeft = 'auto';

      this.toolbarManager.headingSelector.appendChild(dropdownIcon);
    }

  }
} 