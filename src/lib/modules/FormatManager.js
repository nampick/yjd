// FormatManager.js - Quản lý formatting và styling
import { BlockManager } from './BlockManager.js';
export class FormatManager {
    constructor(editor,toolbarManager) {
    this.editor = editor;
    this.toolbarManager = toolbarManager;
    this.blockManager = new BlockManager(editor,toolbarManager);
  }

  // Helper method để lấy màu text hiện tại
  getCurrentTextColor(node) {
    if (!node) return '#000000';
    
    // Kiểm tra style inline trước
    if (node.style && node.style.color) {
      return this.normalizeColor(node.style.color);
    }
    
    // Kiểm tra computed style
    const computedStyle = window.getComputedStyle(node);
    if (computedStyle.color) {
      return this.normalizeColor(computedStyle.color);
    }
    
    // Traverse lên parent để tìm màu
    let parent = node.parentNode;
    while (parent && parent !== this.editor) {
      if (parent.style && parent.style.color) {
        return this.normalizeColor(parent.style.color);
      }
      const parentComputed = window.getComputedStyle(parent);
      if (parentComputed.color && parentComputed.color !== 'rgb(0, 0, 0)') {
        return this.normalizeColor(parentComputed.color);
      }
      parent = parent.parentNode;
    }
    
    return '#000000'; // Default
  }

  // Helper method để lấy màu background hiện tại
  getCurrentBackgroundColor(node) {
    if (!node) return 'transparent';
    
    // Kiểm tra style inline trước
    if (node.style && node.style.backgroundColor) {
      return this.normalizeColor(node.style.backgroundColor);
    }
    
    // Kiểm tra computed style
    const computedStyle = window.getComputedStyle(node);
    if (computedStyle.backgroundColor && 
        computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
        computedStyle.backgroundColor !== 'transparent') {
      return this.normalizeColor(computedStyle.backgroundColor);
    }
    
    // Traverse lên parent để tìm background color
    let parent = node.parentNode;
    while (parent && parent !== this.editor) {
      if (parent.style && parent.style.backgroundColor) {
        const bgColor = this.normalizeColor(parent.style.backgroundColor);
        if (bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
          return bgColor;
        }
      }
      const parentComputed = window.getComputedStyle(parent);
      if (parentComputed.backgroundColor && 
          parentComputed.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
          parentComputed.backgroundColor !== 'transparent') {
        return this.normalizeColor(parentComputed.backgroundColor);
      }
      parent = parent.parentNode;
    }
    
    return 'transparent';
  }

  // Helper method để normalize màu về hex format
  normalizeColor(color) {
    if (!color) return '#000000';
    
    // Nếu đã là hex thì return luôn
    if (color.startsWith('#')) return color;
    
    // Convert rgb/rgba to hex
    if (color.startsWith('rgb')) {
      const matches = color.match(/\d+/g);
      if (matches && matches.length >= 3) {
        const r = parseInt(matches[0]);
        const g = parseInt(matches[1]);
        const b = parseInt(matches[2]);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      }
    }
    
    return color;
  }

  // Method để apply background color sử dụng style thay vì execCommand
  applyBackgroundColor(color) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    
    // Nếu không có text được chọn
    if (range.collapsed) {
      // Tạo span để wrap text sẽ được nhập
      const span = document.createElement('span');
      span.style.backgroundColor = color === 'transparent' ? '' : color;
      span.textContent = '\u200B'; // Zero-width space
      range.insertNode(span);
      
      // Di chuyển cursor vào trong span
      range.setStart(span, 1);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // Nếu có text được chọn
      const contents = range.extractContents();
      const span = document.createElement('span');
      span.style.backgroundColor = color === 'transparent' ? '' : color;
      span.appendChild(contents);
      range.insertNode(span);
    }
    
    // Giữ selection
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Update button background color immediately
    if (this.toolbarBtns.bgColor) {
      if (color && color !== 'transparent') {
        this.toolbarBtns.bgColor.style.setProperty('background-color', color, 'important');
        this.toolbarBtns.bgColor._currentColor = color; // Store current color
      } else {
        this.toolbarBtns.bgColor.style.setProperty('background-color', 'transparent', 'important');
        this.toolbarBtns.bgColor._currentColor = 'transparent'; // Store current color
      }
    }
  }

  // Method để apply text color và update indicator
  applyTextColor(color) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    
    // Nếu không có text được chọn
    if (range.collapsed) {
      // Tạo span để wrap text sẽ được nhập
      const span = document.createElement('span');
      span.style.color = color;
      span.textContent = '\u200B'; // Zero-width space
      range.insertNode(span);
      
      // Di chuyển cursor vào trong span
      range.setStart(span, 1);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // Nếu có text được chọn
      const contents = range.extractContents();
      const span = document.createElement('span');
      span.style.color = color;
      span.appendChild(contents);
      range.insertNode(span);
      
      // Giữ selection
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    // Update button text color immediately
    if (this.toolbarBtns.textColor) {
      this.toolbarBtns.textColor.style.setProperty('color', color, 'important');
      this.toolbarBtns.textColor._currentColor = color; // Store current color
    }
  }

  // Thêm hàm mới để xử lý việc toggle định dạng
  toggleFormat(cmd) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    // Lưu selection hiện tại
    this.savedSelection = this.saveSelection();

    // Thực hiện command
    document.execCommand(cmd, false, null);

    // Cập nhật trạng thái active ngay lập tức
    const isActive = document.queryCommandState(cmd);
    const buttons = this.toolbar.querySelectorAll('button[data-command]');
    buttons.forEach(btn => {
      const btnCmd = btn.getAttribute('data-command');
      if (btnCmd === cmd) {
        btn._setActive(isActive);
      }
    });

    // Khôi phục selection
    this.restoreSelection(this.savedSelection);
    this.editor.editor.focus();
  }

  // Handle format commands with immediate button state updates
  handleFormatCommand(cmd, btn) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) {
      this.editor.editor.focus();
      return;
    }

    // Save current selection
    this.savedSelection = this.saveSelection();

    // Execute the command
    document.execCommand(cmd, false, null);

    // Immediately update button active state
    // For empty paragraphs like <p><br></p>, queryCommandState might not work correctly
    // So we'll check for actual formatting and update the button state
    setTimeout(() => {
      const isActive = document.queryCommandState(cmd);
      btn._setActive(isActive);
      
      // Also update all other buttons of the same command type if any
      const allButtons = this.editor.toolbar.querySelectorAll('button');
      allButtons.forEach(button => {
        const buttonTitle = button.title.toLowerCase();
        const cmdMap = {
          'bold': 'Bold',
          'italic': 'Italic', 
          'underline': 'Underline',
          'strikeThrough': 'Strike Through',
          'superscript': 'Superscript',
          'subscript': 'Subscript'
        };
        
        if (cmdMap[cmd] && buttonTitle.includes(cmdMap[cmd].toLowerCase())) {
          button._setActive(isActive);
        }
      });
    }, 10);

    // Focus back to editor
    this.editor.editor.focus();
  }

  // Thiết lập font size
  setFontSize(size) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    const range = sel.getRangeAt(0);
    
    if (range.collapsed) {
      // Nếu không có selection, áp dụng cho block hiện tại
      const block = this.blockManager.getBlockElementAtCaret();
      this.applyFontSizeToBlock(block, size);
    } else {
      // Nếu có selection, áp dụng cho vùng được chọn
      this.applyFontSizeToSelection(size);
    }
    
    this.editor.editor.focus();
        this.updateFontSizeDisplay();
  }

  // Thêm hàm mới để lưu selection
  saveSelection() {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      return sel.getRangeAt(0).cloneRange();
    }
    return null;
  }
  restoreSelection(range) {
    if (range) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  toggleSourceView() {
    const isSourceView = this.editor.editor.getAttribute('contenteditable') === 'false';
    
    if (isSourceView) {
      // Chuyển từ source view sang editor view
      this.editor.editor.innerHTML = this.sourceTextarea.value;
      this.editor.editor.setAttribute('contenteditable', 'true');
      this.sourceTextarea.remove();
      this.toolbarManager.toolbarBtns.viewSource.innerHTML = '<i class="fas fa-code"></i>';
      this.toolbarManager.toolbarBtns.viewSource.title = 'View Source';
    } else {
      // Chuyển từ editor view sang source view
      this.sourceTextarea = document.createElement('textarea');
      this.sourceTextarea.value = this.editor.editor.innerHTML;
      this.sourceTextarea.style.flex = '1';
      this.sourceTextarea.style.minHeight = '200px';
      this.sourceTextarea.style.height = '100%';
      this.sourceTextarea.style.width = '100%';
      this.sourceTextarea.style.padding = '12px';
      this.sourceTextarea.style.fontFamily = 'inherit';
      this.sourceTextarea.style.fontSize = '16px';
      this.sourceTextarea.style.lineHeight = '1.7';
      this.sourceTextarea.style.border = 'none';
      this.sourceTextarea.style.outline = 'none';
      this.sourceTextarea.style.background = '#fff';
      this.sourceTextarea.style.color = '#2c3e50';
      this.sourceTextarea.style.resize = 'none';
      this.sourceTextarea.style.overflow = 'auto';
      this.sourceTextarea.style.boxSizing = 'border-box';
      this.editor.editor.setAttribute('contenteditable', 'false');
      this.editor.editor.innerHTML = '';
      this.editor.editor.appendChild(this.sourceTextarea);
      this.toolbarManager.toolbarBtns.viewSource.innerHTML = `<i class="fas fa-edit"></i>`;
      this.toolbarManager.toolbarBtns.viewSource.title = 'Edit';
    }
  }

  adjustEditorZoom(factor) {
    // Get current zoom level or default to 1
    if (!this.currentZoom) {
      this.currentZoom = 1;
    }
    
    // Apply zoom factor
    this.currentZoom *= factor;
    
    // Limit zoom between 0.5x and 3x
    this.currentZoom = Math.max(0.5, Math.min(3, this.currentZoom));
    
    // Apply zoom to editor
    this.editor.style.zoom = this.currentZoom;
    
    // Update status if needed
    this.updateZoomStatus();
  }

  resetEditorZoom() {
    this.currentZoom = 1;
    this.editor.style.zoom = '1';
    this.updateZoomStatus();
  }

  updateZoomStatus() {
    // You can add zoom level display in status bar if needed
    const zoomPercentage = Math.round(this.currentZoom * 100);
  }

  destroy() {
    // Remove list menu from document.body if it exists
    if (this.listMenu && this.listMenu.parentNode) {
      this.listMenu.parentNode.removeChild(this.listMenu);
    }
    
    // Clean up other dropdowns if needed
    Object.values(this.dropdownMenus).forEach(({ menu }) => {
      if (menu && menu.parentNode === document.body) {
        document.body.removeChild(menu);
      }
    });

    // Close all dropdowns and clean up global handlers
    this.toolbarManager.closeAllDropdowns();
    
    // Remove content observer
    if (this.contentObserver) {
      this.contentObserver.disconnect();
    }
    
    // Remove main wrapper
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
  }

  // Áp dụng font size cho một block
  applyFontSizeToBlock(block, size) {
    if (!block) return;
    
    const currentStyle = block.getAttribute('style') || '';
    
    // Remove existing font-size
    const newStyle = currentStyle.replace(/font-size:\s*\d+px;?\s*/i, '');
    
    // Add new font-size
    const finalStyle = `${newStyle}${newStyle ? '; ' : ''}font-size: ${size}px;`;
    block.setAttribute('style', finalStyle.trim());
  }

  // Áp dụng font size cho selection
  applyFontSizeToSelection(size) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    const range = sel.getRangeAt(0);
    
    // Tạo span với font-size
    const span = document.createElement('span');
    span.style.fontSize = size + 'px';
    
    try {
      // Bọc nội dung được chọn trong span
      range.surroundContents(span);
    } catch (e) {
      // Nếu không thể surroundContents, sử dụng cách khác
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    }
    
    // Đặt lại selection
    range.selectNodeContents(span);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // Cập nhật hiển thị font size
  updateFontSizeDisplay() {
    if (!this.fontSizeSelector) return;
    
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    let fontSize = 16; // default
    
    // Lấy font size từ element hiện tại
    const node = sel.anchorNode;
    let element = node.nodeType === 3 ? node.parentElement : node;
    
    while (element && element !== this.editor) {
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.fontSize) {
        fontSize = parseInt(computedStyle.fontSize);
        break;
      }
      element = element.parentElement;
    }
    
    // Tìm giá trị gần nhất trong danh sách
    const availableSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 44, 48, 54, 60, 66, 72];
    const closestSize = availableSizes.reduce((prev, curr) => 
      Math.abs(curr - fontSize) < Math.abs(prev - fontSize) ? curr : prev
    );
    
    // Kiểm tra nếu con trỏ không nằm trong editor-area thì không thay đổi gì cả
    const editorArea = document.querySelector('.editor-area'); // Hoặc this.editorArea nếu bạn đã lưu nó trong class

    const selection = window.getSelection();
    if (!selection.rangeCount || !editorArea.contains(selection.getRangeAt(0).startContainer)) {
      return;
    }

    // ✅ Tiếp tục cập nhật nút font size
    const textNode = this.fontSizeSelector.firstChild;
    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
      textNode.textContent = closestSize + 'px';
    } else {
      // Lưu lại dropdown icon (nếu có) trước khi ghi đè nội dung
      const dropdownIcon = this.fontSizeSelector.querySelector('svg');
      this.fontSizeSelector.innerHTML = closestSize + 'px';
      if (dropdownIcon) {
        this.fontSizeSelector.appendChild(dropdownIcon);
      }
    }

  }

  // Xóa line height
  removeLineHeight() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    const range = sel.getRangeAt(0);
    
    if (range.collapsed) {
      // Nếu không có selection, xóa line-height từ block hiện tại
      const block = this.getBlockElementAtCaret();
      this.removeLineHeightFromBlock(block);
    } else {
      // Nếu có selection, tìm tất cả các blocks trong vùng chọn
      const blocks = this.getBlocksInSelection();
      if (blocks.length > 0) {
        // Nếu có blocks được chọn, xóa line-height từ blocks
        blocks.forEach(block => this.removeLineHeightFromBlock(block));
      } else {
        // Nếu chỉ có text được chọn, xóa line-height từ các spans
        this.removeLineHeightFromSelection();
      }
    }
    
    this.editor.editor.focus();
    this.updateLineHeightDisplay();
  }

  applyLineHeight(lineHeight) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  
  const range = sel.getRangeAt(0);
  
  if (range.collapsed) {
    const block = this.blockManager.getBlockElementAtCaret();
    this.applyLineHeightToBlock(block, lineHeight);
  } else {
    const blocks = this.blockManager.getBlocksInSelection();
    if (blocks.length > 0) {
      blocks.forEach(block => this.applyLineHeightToBlock(block, lineHeight));
    } else {
      this.applyLineHeightToSelection(lineHeight);
    }
  }

  this.editor.editor.focus();
  this.updateLineHeightDisplay();
}

  // Áp dụng line height cho một block
  applyLineHeightToBlock(block, lineHeight) {
    if (!block) return;
    
    const currentStyle = block.getAttribute('style') || '';
    
    // Remove existing line-height
    const newStyle = currentStyle.replace(/line-height:\s*[^;]+;?\s*/i, '');
    
    // Add new line-height
    const finalStyle = `${newStyle}${newStyle ? '; ' : ''}line-height: ${lineHeight};`;
    block.setAttribute('style', finalStyle.trim());
  }

  // Áp dụng line height cho selection text
  applyLineHeightToSelection(lineHeight) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    const range = sel.getRangeAt(0);
    
    // Tạo span với line-height
    const span = document.createElement('span');
    span.style.lineHeight = lineHeight;
    
    try {
      // Bọc nội dung được chọn trong span
      range.surroundContents(span);
    } catch (e) {
      // Nếu không thể surroundContents, sử dụng cách khác
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    }
    
    // Đặt lại selection
    range.selectNodeContents(span);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // Xóa line height từ một block
  removeLineHeightFromBlock(block) {
    if (!block) return;
    
    const currentStyle = block.getAttribute('style') || '';
    const newStyle = currentStyle.replace(/line-height:\s*[^;]+;?\s*/i, '');
    
    if (newStyle.trim()) {
      block.setAttribute('style', newStyle.trim());
    } else {
      block.removeAttribute('style');
    }
  }

  // Xóa line height từ selection
  removeLineHeightFromSelection() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    
    // Tìm tất cả các spans có line-height trong vùng chọn
    const spans = container.querySelectorAll ? container.querySelectorAll('span[style*="line-height"]') : [];
    spans.forEach(span => {
      const style = span.getAttribute('style') || '';
      const newStyle = style.replace(/line-height:\s*[^;]+;?\s*/i, '');
      
      if (newStyle.trim()) {
        span.setAttribute('style', newStyle.trim());
      } else {
        // Nếu không còn style nào khác, unwrap span
        const parent = span.parentNode;
        while (span.firstChild) {
          parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
      }
    });
  }

  // Cập nhật hiển thị line height
  updateLineHeightDisplay() {
    if (!this.lineHeightSelector) return;
    
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    let lineHeight = 'default';
    
    // Lấy line height từ element hiện tại
    const node = sel.anchorNode;
    let element = node.nodeType === 3 ? node.parentElement : node;
    
    while (element && element !== this.editor) {
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.lineHeight && computedStyle.lineHeight !== 'normal') {
        // Chuyển đổi từ px sang number nếu cần
        const lineHeightValue = computedStyle.lineHeight;
        if (lineHeightValue.includes('px')) {
          const fontSize = parseInt(computedStyle.fontSize);
          const lineHeightPx = parseInt(lineHeightValue);
          lineHeight = (lineHeightPx / fontSize).toFixed(1);
        } else {
          lineHeight = lineHeightValue;
        }
        break;
      }
      element = element.parentElement;
    }
    
    // Tìm giá trị gần nhất trong danh sách
    const availableLineHeights = ['1', '1.2', '1.4', '1.5', '1.6', '1.8', '2', '2.5', '3'];
    const closestLineHeight = availableLineHeights.find(lh => lh === lineHeight) || 'default';
    
    // Kiểm tra nếu con trỏ không nằm trong editor-area thì không làm gì
    const editorArea = document.querySelector('.editor-area'); // sửa theo context của bạn
    const selection = window.getSelection();
    if (!selection.rangeCount || !editorArea.contains(selection.getRangeAt(0).startContainer)) {
      return;
    }

    // ✅ Tiếp tục cập nhật nội dung nút line height
    const displayText = closestLineHeight === 'default' ? 'Line Height' : closestLineHeight;
    const textNode = this.lineHeightSelector.firstChild;
    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
      textNode.textContent = displayText;
    } else {
      // Lưu icon trước khi ghi đè
      const dropdownIcon = this.lineHeightSelector.querySelector('svg');
      this.lineHeightSelector.innerHTML = displayText;
      if (dropdownIcon) {
        this.lineHeightSelector.appendChild(dropdownIcon);
      }
    }
  }

  // Áp dụng capitalization cho text được chọn
  applyCapitalization(type) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    const range = sel.getRangeAt(0);
    
    if (range.collapsed) {
      // Nếu không có selection, áp dụng cho toàn bộ block hiện tại
      const block = this.blockManager.getBlockElementAtCaret();
      this.applyCapitalizationToBlock(block, type);
    } else {
      // Nếu có selection, áp dụng cho text được chọn
      this.applyCapitalizationToSelection(type);
    }
    
    this.editor.editor.focus();
  }

  // Áp dụng capitalization cho một block
  applyCapitalizationToBlock(block, type) {
    if (!block) return;
    
    const textContent = block.textContent;
    const transformedText = this.transformText(textContent, type);
    
    // Giữ nguyên cấu trúc HTML nhưng thay đổi text content
    this.replaceTextInElement(block, textContent, transformedText);
  }

  applyCapitalizationToSelection(type) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;

    const range = sel.getRangeAt(0);

    const treeWalker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Lọc text nodes nằm trong selection
          const nodeRange = document.createRange();
          nodeRange.selectNodeContents(node);
          return range.intersectsNode(node)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        }
      }
    );

    const textNodes = [];
    while (treeWalker.nextNode()) {
      textNodes.push(treeWalker.currentNode);
    }

    textNodes.forEach(node => {
      node.textContent = this.transformText(node.textContent, type);
    });

    // Giữ nguyên selection ban đầu (hoặc cập nhật lại nếu muốn)
    sel.removeAllRanges();
    sel.addRange(range);
  }


  // Transform text dựa trên loại capitalization
  transformText(text, type) {
    switch (type) {
      case 'lowercase':
        return text.toLowerCase();
      case 'uppercase':
        return text.toUpperCase();
      case 'titlecase':
        return this.toTitleCase(text);
      case 'capitalize':
        return this.capitalizeFirst(text);
      default:
        return text;
    }
  }

  // Chuyển đổi sang Title Case
  toTitleCase(text) {
    // Danh sách các từ không viết hoa (articles, prepositions, conjunctions)
    const smallWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'of', 'on', 'or', 'the', 'to', 'up', 'via'];
    
    return text.toLowerCase().replace(/\b\w+/g, (word, index) => {
      // Luôn viết hoa từ đầu tiên và cuối cùng
      if (index === 0 || !smallWords.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    });
  }

  // Viết hoa chữ cái đầu tiên của văn bản
  capitalizeFirst(text) {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  // Thay thế text trong element while preserving HTML structure
  replaceTextInElement(element, oldText, newText) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    
    // Ghép tất cả text content
    let fullText = textNodes.map(n => n.textContent).join('');
    
    // Nếu text khớp với oldText, thay thế
    if (fullText === oldText) {
      // Phân bổ lại text đã transform
      let remainingText = newText;
      textNodes.forEach((textNode, index) => {
        const originalLength = textNode.textContent.length;
        const newContent = remainingText.substring(0, originalLength);
        textNode.textContent = newContent;
        remainingText = remainingText.substring(originalLength);
      });
    }
  }
} 