import { InlineFormat } from '../core/format.js';

/**
 * Color Format - Handles text color formatting
 * Creates styled spans with color CSS property
 */
class Color extends InlineFormat {
  static formatName = 'color';
  static tagName = 'SPAN';

  static create(color = '#000000') {
    const span = document.createElement(this.tagName);
    span.style.color = color;
    span.setAttribute('data-color', color);
    return span;
  }

  static formats(domNode) {
    if (domNode.tagName === this.tagName && domNode.style.color) {
      return domNode.style.color;
    }
    return false;
  }

  /**
   * Apply color formatting
   * @param {string} color - Color value (hex, rgb, named)
   */
  apply(color) {
    if (!color) return;

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    
    if (range.collapsed) {
      // No selection - insert colored placeholder
      const span = this.constructor.create(color);
      span.textContent = 'Text';
      range.insertNode(span);
      
      // Select the inserted text for editing
      range.selectNodeContents(span);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // Has selection - wrap in colored span
      const contents = range.extractContents();
      const span = this.constructor.create(color);
      span.appendChild(contents);
      range.insertNode(span);
      
      // Move cursor after span
      range.setStartAfter(span);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  /**
   * Remove color formatting
   */
  remove() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    let element = range.startContainer;
    
    // Find parent colored span element
    while (element && element !== document.body) {
      if (element.tagName === 'SPAN' && element.style.color) {
        // Replace span with its content
        const parent = element.parentNode;
        while (element.firstChild) {
          parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);
        break;
      }
      element = element.parentNode;
    }
  }

  /**
   * Toggle color formatting
   * @param {string} color - Color to apply
   */
  toggle(color = '#000000') {
    if (this.isActive()) {
      this.remove();
    } else {
      this.apply(color);
    }
  }

  /**
   * Check if color formatting is active at current selection
   */
  isActive() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return false;

    const range = selection.getRangeAt(0);
    let element = range.startContainer;
    
    // Check if cursor is inside a colored span
    while (element && element !== document.body) {
      if (element.tagName === 'SPAN' && element.style.color) {
        return true;
      }
      element = element.parentNode;
    }
    
    return false;
  }

  /**
   * Get current text color
   */
  getCurrentColor() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;

    const range = selection.getRangeAt(0);
    let element = range.startContainer;
    
    while (element && element !== document.body) {
      if (element.tagName === 'SPAN' && element.style.color) {
        return element.style.color;
      }
      element = element.parentNode;
    }
    
    return null;
  }

  /**
   * Update existing color
   * @param {string} newColor - New color value
   */
  updateColor(newColor) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    let element = range.startContainer;
    
    while (element && element !== document.body) {
      if (element.tagName === 'SPAN' && element.style.color) {
        element.style.color = newColor;
        element.setAttribute('data-color', newColor);
        return true;
      }
      element = element.parentNode;
    }
    
    return false;
  }

  /**
   * Convert color formats (hex, rgb, etc.)
   * @param {string} color - Color in any format
   */
  static normalizeColor(color) {
    if (!color) return '#000000';
    
    // If already hex, return as is
    if (/^#[0-9A-F]{6}$/i.test(color)) {
      return color;
    }
    
    // Create temporary element to get computed color
    const div = document.createElement('div');
    div.style.color = color;
    document.body.appendChild(div);
    const computedColor = window.getComputedStyle(div).color;
    document.body.removeChild(div);
    
    // Convert rgb to hex
    if (computedColor.startsWith('rgb')) {
      const rgb = computedColor.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        const hex = '#' + rgb.slice(0, 3).map(x => {
          const hex = parseInt(x).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        }).join('');
        return hex;
      }
    }
    
    return color;
  }

  /**
   * Get predefined color palette
   */
  static getColorPalette() {
    return [
      '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
      '#FF0000', '#FF6600', '#FFCC00', '#FFFF00', '#CCFF00', '#66FF00',
      '#00FF00', '#00FF66', '#00FFCC', '#00FFFF', '#00CCFF', '#0066FF',
      '#0000FF', '#6600FF', '#CC00FF', '#FF00FF', '#FF00CC', '#FF0066',
      '#8B0000', '#FF4500', '#FFA500', '#FFD700', '#ADFF2F', '#32CD32',
      '#00CED1', '#1E90FF', '#4169E1', '#8A2BE2', '#9932CC', '#DC143C'
    ];
  }

  /**
   * Optimize DOM structure
   */
  optimize(context = {}) {
    if (this.domNode && this.domNode.tagName === 'SPAN') {
      // Remove empty colored spans
      if (!this.domNode.textContent.trim()) {
        if (this.domNode.parentNode) {
          this.domNode.parentNode.removeChild(this.domNode);
        }
      }
      // Ensure data-color attribute matches style
      else if (this.domNode.style.color) {
        this.domNode.setAttribute('data-color', this.domNode.style.color);
      }
    }
  }
}

export default Color; 