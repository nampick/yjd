import { InlineFormat } from '../core/format.js';

/**
 * Color Format - Handles text color formatting
 */
class Color extends InlineFormat {
  static formatName = 'color';
  static tagName = 'SPAN';
  static attribute = 'color';

  /**
   * Apply color formatting with specified color value
   * @param {string} value - Color value (hex, rgb, etc.)
   */
  apply(value = '#000000') {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || selection.isCollapsed) return;

    try {
        // Bật chế độ ghi CSS thay vì thẻ <font>
        document.execCommand('styleWithCSS', false, true);

        // Áp dụng màu chữ
        document.execCommand('foreColor', false, value);
    } catch (error) {
        console.error('Error applying color format:', error);
    }
    }
  

  /**
   * Remove color formatting
   */
  remove() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || selection.isCollapsed) return;

    try {
        // Xóa định dạng văn bản khỏi vùng chọn
        document.execCommand('removeFormat');

        // Ngoài ra, nếu cần xóa cả màu chữ:
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('foreColor', false, '#000000'); // Hoặc màu mặc định khác
    } catch (error) {
        console.error('Error removing formatting:', error);
    }
    }

  /**
   * Toggle color formatting
   * @param {string} value - Color value
   */
  toggle(value = '#000000') {
    if (this.isActive()) {
      this.remove();
    } else {
      this.apply(value);
    }
  }

  /**
   * Check if color formatting is active in current selection
   */
  isActive() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return false;
    
    const range = selection.getRangeAt(0);
    
    try {
      // Check if selection contains colored text
      const container = range.commonAncestorContainer;
      
      // Check if current node or parent has color styling
      let currentNode = container;
      
      // Traverse up to find colored spans
      while (currentNode && currentNode !== document.body) {
        if (currentNode.nodeType === Node.ELEMENT_NODE) {
          const element = currentNode;
          if (element.tagName === 'SPAN' && element.style.color) {
            return true;
          }
        }
        currentNode = currentNode.parentNode;
      }
      
      // Check if selection contains any colored spans
      if (container.nodeType === Node.ELEMENT_NODE) {
        const spans = container.querySelectorAll('span[style*="color"]');
        for (let span of spans) {
          if (range.intersectsNode(span)) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking color format active state:', error);
      return false;
    }
  }
}

export default Color; 