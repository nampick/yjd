import { InlineFormat } from '../core/format.js';

/**
 * Background Format - Handles background color formatting
 * Creates styled spans with background-color CSS property
 */
class Background extends InlineFormat {
  static formatName = 'background';
  static tagName = 'SPAN';

  static create(color = '#FFFF00') {
    const span = document.createElement(this.tagName);
    span.style.backgroundColor = color;
    span.setAttribute('data-background', color);
    return span;
  }

  static formats(domNode) {
    if (domNode.tagName === this.tagName && domNode.style.backgroundColor) {
      return domNode.style.backgroundColor;
    }
    return false;
  }

  /**
   * Apply background color formatting
   * @param {string} color - Background color value (hex, rgb, named)
   */
  apply(color) {
    if (!color) return;

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    
    if (range.collapsed) {
      // No selection - insert highlighted placeholder
      const span = this.constructor.create(color);
      span.textContent = 'Text';
      range.insertNode(span);
      
      // Select the inserted text for editing
      range.selectNodeContents(span);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // Has selection - wrap in highlighted span
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
   * Remove background color formatting
   */
  remove() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    let element = range.startContainer;
    
    // Find parent highlighted span element
    while (element && element !== document.body) {
      if (element.tagName === 'SPAN' && element.style.backgroundColor) {
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
   * Toggle background color formatting
   * @param {string} color - Background color to apply
   */
  toggle(color = '#FFFF00') {
    if (this.isActive()) {
      this.remove();
    } else {
      this.apply(color);
    }
  }

  /**
   * Check if background color formatting is active at current selection
   */
  isActive() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return false;

    const range = selection.getRangeAt(0);
    let element = range.startContainer;
    
    // Check if cursor is inside a highlighted span
    while (element && element !== document.body) {
      if (element.tagName === 'SPAN' && element.style.backgroundColor) {
        return true;
      }
      element = element.parentNode;
    }
    
    return false;
  }

  /**
   * Get current background color
   */
  getCurrentColor() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;

    const range = selection.getRangeAt(0);
    let element = range.startContainer;
    
    while (element && element !== document.body) {
      if (element.tagName === 'SPAN' && element.style.backgroundColor) {
        return element.style.backgroundColor;
      }
      element = element.parentNode;
    }
    
    return null;
  }

  /**
   * Update existing background color
   * @param {string} newColor - New background color value
   */
  updateColor(newColor) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    let element = range.startContainer;
    
    while (element && element !== document.body) {
      if (element.tagName === 'SPAN' && element.style.backgroundColor) {
        element.style.backgroundColor = newColor;
        element.setAttribute('data-background', newColor);
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
    if (!color) return '#FFFF00';
    
    // If already hex, return as is
    if (/^#[0-9A-F]{6}$/i.test(color)) {
      return color;
    }
    
    // Create temporary element to get computed color
    const div = document.createElement('div');
    div.style.backgroundColor = color;
    document.body.appendChild(div);
    const computedColor = window.getComputedStyle(div).backgroundColor;
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
   * Get predefined highlight color palette
   */
  static getColorPalette() {
    return [
      '#FFFF00', '#FFE135', '#FFCC02', '#FF9500', '#FF6900', '#FF3838',
      '#FF007F', '#E100FF', '#9500FF', '#6A00FF', '#3838FF', '#0099FF',
      '#00BFFF', '#00FFFF', '#00FF9F', '#00FF00', '#9FFF00', '#CCFF00',
      '#FFF2CC', '#FCE5CD', '#F4CCCC', '#D9EAD3', '#D0E0E3', '#CFE2F3',
      '#D9D2E9', '#EAD1DC', '#FFEAA7', '#FDCB6E', '#E17055', '#00B894',
      '#00CEC9', '#6C5CE7', '#A29BFE', '#FD79A8', '#E84393', '#2D3436'
    ];
  }

  /**
   * Optimize DOM structure
   */
  optimize(context = {}) {
    if (this.domNode && this.domNode.tagName === 'SPAN') {
      // Remove empty highlighted spans
      if (!this.domNode.textContent.trim()) {
        if (this.domNode.parentNode) {
          this.domNode.parentNode.removeChild(this.domNode);
        }
      }
      // Ensure data-background attribute matches style
      else if (this.domNode.style.backgroundColor) {
        this.domNode.setAttribute('data-background', this.domNode.style.backgroundColor);
      }
    }
  }
}

export default Background; 