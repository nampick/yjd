/**
 * Base Format class - Inspired by Quill's architecture
 * All text formats should extend this class
 */
export class Format {
  static formatName = '';
  static tagName = '';
  static className = '';

  constructor(domNode) {
    this.domNode = domNode;
  }

  /**
   * Create a new format node
   * @param {*} value - Format value
   * @returns {HTMLElement}
   */
  static create(value) {
    const node = document.createElement(this.tagName);
    if (this.className) {
      node.className = this.className;
    }
    return node;
  }

  /**
   * Get format value from DOM node
   * @param {HTMLElement} domNode 
   * @returns {*}
   */
  static formats(domNode) {
    return true;
  }

  /**
   * Apply format to current selection
   */
  apply() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    
    if (range.collapsed) {
      console.log('lay 1');
      const result = document.execCommand(this.constructor.formatName);
      console.log('result', result);
      const formatNode = this.constructor.create();
      formatNode.appendChild(document.createTextNode('\u200B')); // Zero-width space để giữ vị trí
      range.insertNode(formatNode);
      range.setStart(formatNode.firstChild, 1);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
    } else {
      console.log('lay het');
      // Has selection - wrap selected content
      document.execCommand(this.constructor.formatName);
    }
  }

  /**
   * Remove format from current selection
   */
  remove() {
    
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    if (!range.collapsed) {
      document.execCommand(this.constructor.formatName);
      return;
    }else{
      // Không có vùng chọn (collapsed) - xử lý như cũ
      const container = range.startContainer;
      const offset = range.startOffset;

      // Tìm thẻ định dạng cha (ví dụ: <strong>)
      const formatNode = this.getFormatNode(container);
      if (!formatNode || !formatNode.parentNode) return;

      const text = formatNode.textContent;
      const absoluteOffset = this.getOffsetWithin(formatNode, range);

      // Tạo các phần: trước, ký tự \u200B, sau
      const beforeText = text.slice(0, absoluteOffset);
      const afterText = text.slice(absoluteOffset);

      const beforeNode = formatNode.cloneNode(false);
      beforeNode.textContent = beforeText;

      const afterNode = formatNode.cloneNode(false);
      afterNode.textContent = afterText;

      const zwspNode = document.createTextNode('\u200B');

      // Thay thế formatNode bằng: beforeNode, zwsp, afterNode
      const fragment = document.createDocumentFragment();
      if (beforeText) fragment.appendChild(beforeNode);
      fragment.appendChild(zwspNode);
      if (afterText) fragment.appendChild(afterNode);

      formatNode.replaceWith(fragment);

      // Đặt lại con trỏ ngay sau zwsp
      const newRange = document.createRange();
      newRange.setStartAfter(zwspNode);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  }
  getFormatNode(node) {
    while (node && node !== document.body) {
      if (node.nodeType === 1 && (node.tagName === 'STRONG' || node.tagName === 'B' || node.tagName === 'I' || node.tagName === 'EM' || node.tagName === 'U' || node.tagName === 'INS' || node.tagName === 'DEL' || node.tagName === 'S' || node.tagName === 'STRIKE' || node.tagName === 'DEL')) {
        return node;
      }
      node = node.parentNode;
    }
    return null;
  }
  getOffsetWithin(container, range) {
    let offset = 0;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    let currentNode;

    while ((currentNode = walker.nextNode())) {
      if (currentNode === range.startContainer) {
        return offset + range.startOffset;
      }
      offset += currentNode.textContent.length;
    }

    return offset;
  }

  /**
   * Check if format is active at current selection
   * @returns {boolean}
   */
} 

/**
 * Inline Format - for formats like bold, italic, underline
 */
export class InlineFormat extends Format {
  static create(value) {
    const node = super.create(value);
    return node;
  }
}

/**
 * Block Format - for formats like headers, paragraphs
 */
export class BlockFormat extends Format {
  static create(value) {
    const node = super.create(value);
    return node;
  }
} 