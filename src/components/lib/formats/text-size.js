import { InlineFormat } from '../core/format.js';
import CustomSelect from '../ui/customselect.js';
import { saveBeforeFormat } from '../utils/history-helper.js';

/**
 * Text Size Format - Handles font size formatting with 7 levels via execCommand
 */
class TextSize extends InlineFormat {
  static formatName = 'textSize';
  static tagName = 'SPAN';

  constructor() {
    super();
    // Create custom select instance if not exists
    if (!TextSize.selectInstance) {
      const sizeMap = TextSize.getSizeMap();
      const items = Object.values(sizeMap).map(sizeData => ({
        value: sizeData.size,
        label: sizeData.element,
        title: sizeData.title
      }));

      TextSize.selectInstance = new CustomSelect({
        items: items,
        displayProperty: 'label',
        valueProperty: 'value',
        className: 'text-size-select',
        onItemSelect: (value) => {
          TextSize.applyTextSizeToCurrentSelection(value);
        }
      });
    }
    this.customSelect = TextSize.selectInstance;
  }

  /**
   * 7-level text size map aligned with execCommand('fontSize', 1..7)
   */
  static getSizeMap() {
    return {
      '1': { size: '1', element: '<span >XX-Small</span>', title: 'XX-Small' },
      '2': { size: '2', element: '<span >X-Small</span>', title: 'X-Small' },
      '3': { size: '3', element: '<span >Small</span>', title: 'Small' },
      '4': { size: '4', element: '<span >Medium</span>', title: 'Medium' },
      '5': { size: '5', element: '<span >Large</span>', title: 'Large' },
      '6': { size: '6', element: '<span >X-Large</span>', title: 'X-Large' },
      '7': { size: '7', element: '<span >XX-Large</span>', title: 'XX-Large' },
    };
  }

  static getSizeDisplayName(size) {
    const sizeMap = this.getSizeMap();
    return sizeMap[size]?.title || 'Medium';
  }

  updateButtonText() {
    const currentSize = this.getCurrentSize();
    const displayName = TextSize.getSizeDisplayName(currentSize || '4');

    const textSizeButton = document.querySelector('.rich-editor-toolbar-btn.text-size-btn');
    if (textSizeButton && textSizeButton.updateText) {
      textSizeButton.updateText(displayName);
    } else if (textSizeButton) {
      textSizeButton.textContent = displayName;
    }
  }

  static create(size = '4') {
    const node = document.createElement('span');
    // Fallback creation with an approximate CSS size
    node.style.fontSize = TextSize.sizeToCss(size);
    return node;
  }

  /**
   * Apply text size to current selection
   */
  static applyTextSizeToCurrentSelection(size) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    // Save state before applying format
    saveBeforeFormat();

    const sizeFormat = new TextSize();
    sizeFormat.apply(size);
    sizeFormat.updateButtonText();
  }

  /**
   * Map execCommand size (1..7) to CSS font-size for fallback/labels
   */
  static sizeToCss(size) {
    const map = {
      '1': '10px',
      '2': '12px',
      '3': '14px',
      '4': '16px',
      '5': '20px',
      '6': '28px',
      '7': '36px',
    };
    return map[String(size)] || '16px';
  }

  /**
   * Apply text size using execCommand; works with selection and collapsed caret
   */
  apply(size = '4') {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    saveBeforeFormat();

    const range = selection.getRangeAt(0);

    if (!range.collapsed) {
        // Bạn chưa nói đến xử lý khi bôi đen, nên mình bỏ qua
        document.execCommand('fontSize', false, String(size));

        // Lấy node bao quanh selection hiện tại
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            const container = sel.getRangeAt(0).commonAncestorContainer;
            // Nếu container là text node → normalize ở parent
            if (container.nodeType === Node.TEXT_NODE) {
                container.parentNode.normalize();
            } else {
                container.normalize();
            }
        }   
        
        return;
    }

    let node = range.startContainer;
    let offset = range.startOffset;

    // Nếu caret đang trong text node → lấy cha
    if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode;
    }

    // Kiểm tra nếu đang ở trong một <font>
    const currentFont = node.closest && node.closest('font');

    // ========================
    // Trường hợp 1: caret trong <font> rỗng (chỉ có \u200B)
    // ========================
    if (currentFont && currentFont.textContent === "\u200B") {
        currentFont.setAttribute('size', String(size));
        return;
    }

    // ========================
    // Trường hợp 2: caret trong <font> có ký tự thực
    // ========================
    if (currentFont && currentFont.firstChild && currentFont.firstChild.nodeType === Node.TEXT_NODE) {
        const textNode = currentFont.firstChild;
        const caretPos = range.startOffset; // vị trí caret trong text node

        // Loại bỏ ký tự ẩn trong tính toán
      
        const textBefore = textNode.data.slice(0, caretPos);
        const textAfter  = textNode.data.slice(caretPos);

        const parent = currentFont.parentNode;

        if (caretPos === 0) {
            // Đang ở ĐẦU thẻ font → chèn font mới trước
            console.log('Đang ở ĐẦU thẻ font → chèn font mới trước');
            const newFont = document.createElement('font');
            newFont.setAttribute('size', String(size));
            newFont.appendChild(document.createTextNode("\u200B"));
            parent.insertBefore(newFont, currentFont);

            moveCaretInside(newFont);

        } else if (caretPos === textNode.data.length) {
            // Đang ở CUỐI thẻ font → chèn font mới sau
            console.log('Đang ở CUỐI thẻ font → chèn font mới sau');
            const newFont = document.createElement('font');
            newFont.setAttribute('size', String(size));
            newFont.appendChild(document.createTextNode("\u200B"));
            parent.insertBefore(newFont, currentFont.nextSibling);

            moveCaretInside(newFont);

        } else {
            console.log('Ở GIỮA → chia thành 3 thẻ font');

            
            const font1 = document.createElement('font');
            font1.setAttribute('size', currentFont.getAttribute('size'));
            font1.appendChild(document.createTextNode(textBefore));

            const font2 = document.createElement('font');
            font2.setAttribute('size', String(size));
            font2.appendChild(document.createTextNode("\u200B"));

            const font3 = document.createElement('font');
            font3.setAttribute('size', currentFont.getAttribute('size'));
            font3.appendChild(document.createTextNode(textAfter));

            parent.insertBefore(font1, currentFont);
            parent.insertBefore(font2, currentFont);
            parent.insertBefore(font3, currentFont);

            parent.removeChild(currentFont);

            moveCaretInside(font2);
        }
        return;
    }

    // ========================
    // Trường hợp 3: không ở trong <font> nào → tạo mới
    // ========================
    const newFont = document.createElement('font');
    newFont.setAttribute('size', String(size));
    const zwsp = document.createTextNode("\u200B");
    newFont.appendChild(zwsp);

    range.insertNode(newFont);
    moveCaretInside(newFont);

    // Hàm phụ để đưa caret vào sau ký tự ẩn
    function moveCaretInside(fontEl) {
        const sel = window.getSelection();
        const range = document.createRange();
        const textNode = fontEl.firstChild;
        range.setStart(textNode, textNode.length);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    }

   
  }

  async toggle() {
    if (this.customSelect.isVisible) {
      this.customSelect.hide();
    } else {
      await this.showSizePicker();
    }
  }

  async showSizePicker() {
    const textSizeButton = document.querySelector('.rich-editor-toolbar-btn.text-size-btn');
    if (!textSizeButton) return;

    const currentSize = this.getCurrentSize();
    if (currentSize) {
      this.customSelect.setCurrentValue(currentSize);
    }

    await this.customSelect.show(textSizeButton);
  }

  isActive(size = null) {
    this.updateButtonText();
    return false;
  }

  /**
   * Get current text size near caret/selection, return one of '1'..'7'
   */
  getCurrentSize() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return '4';

    try {
      // Try to use queryCommandValue when available (returns 1..7 in many browsers)
      const val = document.queryCommandValue('fontSize');
      const num = parseInt(val, 10);
      if (!isNaN(num) && num >= 1 && num <= 7) {
        return String(num);
      }
    } catch (_) {}

    const range = selection.getRangeAt(0);
    let currentNode = range.startContainer;
    if (currentNode.nodeType === Node.TEXT_NODE) {
      currentNode = currentNode.parentElement;
    }

    while (currentNode && currentNode !== document.body) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const element = currentNode;
        const inline = element.style?.fontSize;
        if (inline) return this.normalizeCssSizeToExecSize(inline);

        const computed = window.getComputedStyle(element).fontSize;
        if (computed) return this.normalizeCssSizeToExecSize(computed);
      }
      currentNode = currentNode.parentElement;
    }

    return '4';
  }

  /**
   * Normalize CSS px value to closest execCommand size 1..7
   */
  normalizeCssSizeToExecSize(cssSize) {
    const px = parseFloat(cssSize);
    if (isNaN(px)) return '4';
    const steps = [10, 12, 14, 16, 20, 28, 36];
    let closestIndex = 3; // default to '4' (16px)
    let minDiff = Infinity;
    for (let i = 0; i < steps.length; i++) {
      const diff = Math.abs(px - steps[i]);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }
    return String(closestIndex + 1);
  }
}

export default TextSize;


