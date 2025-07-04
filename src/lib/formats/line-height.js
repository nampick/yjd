import { InlineFormat } from '../core/format.js';
import CustomSelect from '../ui/customselect.js';

/**
 * Line Height Format - Handles line height formatting
 */
class LineHeight extends InlineFormat {
  static formatName = 'lineHeight';
  static tagName = 'SPAN';
  
  constructor() {
    super();
    // Create custom select instance if not exists
    if (!LineHeight.selectInstance) {
      const heightMap = LineHeight.getHeightMap();
      const items = Object.values(heightMap).map(heightData => ({
        value: heightData.height,
        label: heightData.element,
        title: heightData.title
      }));

      LineHeight.selectInstance = new CustomSelect({
        items: items,
        displayProperty: 'label',
        valueProperty: 'value',
        className: 'line-height-select',
        onItemSelect: (value, item) => {
          LineHeight.applyLineHeightToCurrentSelection(value);
        }
      });
    }
    this.customSelect = LineHeight.selectInstance;
    
    // Set up event listener for selection changes
    this.setupSelectionListener();
  }

  /**
   * Set up event listener for selection changes to update button text
   */
  setupSelectionListener() {
    // Use a debounced function to avoid too many updates
    let updateTimeout;
    const debouncedUpdate = () => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        this.updateButtonText();
      }, 50); // 50ms delay
    };

    // Listen for selection changes
    document.addEventListener('selectionchange', debouncedUpdate);
    
    // Also listen for mouseup and keyup events for immediate feedback
    document.addEventListener('mouseup', debouncedUpdate);
    document.addEventListener('keyup', debouncedUpdate);
    
    // Store the listener for cleanup
    this.selectionListener = debouncedUpdate;
  }

  /**
   * Get height map with different line heights
   */
  static getHeightMap() {
    return {
      '1.0': { 
        height: '1', 
        element: '<span>1.0</span>', 
        title: '1.0' 
      },
      '1.2': { 
        height: '1.2', 
        element: '<span>1.2</span>', 
        title: '1.2' 
      },
      '1.5': { 
        height: '1.5', 
        element: '<span>1.5</span>', 
        title: '1.5' 
      },
      '1.8': { 
        height: '1.8', 
        element: '<span>1.8</span>', 
        title: '1.8' 
      },
      '2.0': { 
        height: '2', 
        element: '<span>2.0</span>', 
        title: '2.0' 
      },
      '2.5': { 
        height: '2.5', 
        element: '<span>2.5</span>', 
        title: '2.5' 
      },
      '3.0': { 
        height: '3', 
        element: '<span>3.0</span>', 
        title: '3.0' 
      }
    };
  }

  /**
   * Get display name for line height
   * @param {string} height - Line height value
   * @returns {string} Display name
   */
  static getHeightDisplayName(height) {
    const heightMap = this.getHeightMap();
    return heightMap[height]?.title || 'line height';
  }

  /**
   * Update custom button text based on current line height
   */
  updateButtonText() {
    const currentHeight = this.getCurrentHeight();
    const displayName = LineHeight.getHeightDisplayName(currentHeight || '1.15');
    
    const lineHeightButton = document.querySelector('.rich-editor-toolbar-btn.line-height-btn');
    if (lineHeightButton && lineHeightButton.updateText) {
      lineHeightButton.updateText(displayName);
    } else if (lineHeightButton) {
      lineHeightButton.textContent = displayName;
    }
  }

  /**
   * Create element with specific line height
   * @param {string} height - Line height value
   * @returns {HTMLElement}
   */
  static create(height = '1.15') {
    const node = document.createElement('span');
    node.style.lineHeight = height;
    return node;
  }

  /**
   * Static method to apply line height to current selection
   */
  static applyLineHeightToCurrentSelection(height) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const lineHeightFormat = new LineHeight();
    lineHeightFormat.apply(height);
    
    // Update button text after applying
    lineHeightFormat.updateButtonText();
  }

  /**
   * Apply line height format with specified height
   * @param {string} height - Line height value
   */
  apply(height = '1.15') {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    
    if (range.collapsed) {
      // No selection - set style for future typing
      this.setCurrentHeight(height);
      return;
    }

    // Apply to block elements if possible for better line height effect
    const blockElements = this.getBlockElementsInRange(range);
    
    if (blockElements.length > 0) {
      // Apply to block elements
      blockElements.forEach(block => {
        block.style.lineHeight = height;
      });
    } else {
      // Fallback: wrap in span with line-height
      const heightSpan = this.constructor.create(height);
      
      try {
        const contents = range.extractContents();
        heightSpan.appendChild(contents);
        range.insertNode(heightSpan);
        
        // Select the content in the span
        const newRange = document.createRange();
        newRange.selectNodeContents(heightSpan);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } catch (error) {
        console.warn('Failed to apply line height manually:', error);
      }
    }
  }

  /**
   * Get block elements within the range
   * @param {Range} range - Selection range
   * @returns {Array} Array of block elements
   */
  getBlockElementsInRange(range) {
    const blockElements = [];
    const blockTags = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'LI'];
    
    let currentNode = range.startContainer;
    
    // If text node, get parent element
    if (currentNode.nodeType === Node.TEXT_NODE) {
      currentNode = currentNode.parentElement;
    }
    
    // Find parent block elements
    while (currentNode && currentNode !== document.body) {
      if (currentNode.nodeType === Node.ELEMENT_NODE && 
          blockTags.includes(currentNode.tagName)) {
        blockElements.push(currentNode);
        break; // Usually we want the closest block element
      }
      currentNode = currentNode.parentElement;
    }
    
    return blockElements;
  }

  /**
   * Toggle line height format - shows/hides height picker
   */
  async toggle() {
    if (this.customSelect.isVisible) {
      this.customSelect.hide();
    } else {
      await this.showHeightPicker();
    }
  }

  /**
   * Show custom select positioned relative to line height button on toolbar
   */
  async showHeightPicker() {
    const lineHeightButton = document.querySelector('.rich-editor-toolbar-btn.line-height-btn');
    if (!lineHeightButton) return;
    
    // Update current selection before showing
    const currentHeight = this.getCurrentHeight();
    if (currentHeight) {
      this.customSelect.setCurrentValue(currentHeight);
    }
    
    await this.customSelect.show(lineHeightButton);
  }

  /**
   * Check if line height format is active - always return false (no active state)
   * Only update button text to show current height
   * @param {string} height - Optional specific height to check
   * @returns {boolean}
   */
  isActive(height = null) {
    // Always update button text to show current height
    this.updateButtonText();
    
    // Never show active state for line height button
    return false;
  }

  /**
   * Get current line height of the selection
   * @returns {string|null} Current line height or null
   */
  getCurrentHeight() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;

    const range = selection.getRangeAt(0);
    let currentNode = range.startContainer;
    
    // If text node, get parent element
    if (currentNode.nodeType === Node.TEXT_NODE) {
      currentNode = currentNode.parentElement;
    }
    
    // Find element with line-height style
    while (currentNode && currentNode !== document.body) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const element = currentNode;
        
        // Priority 1: Check if this element has explicit inline line-height
        if (element.style.lineHeight) {
          const height = element.style.lineHeight;
          return this.normalizeHeightValue(height);
        }
        
        // Priority 2: Check computed line-height
        const computedStyle = window.getComputedStyle(element);
        const lineHeight = computedStyle.lineHeight;
        
        if (lineHeight && lineHeight !== 'normal' && lineHeight !== 'initial' && lineHeight !== 'inherit') {
          // Convert pixel values to relative values if possible
          if (lineHeight.endsWith('px')) {
            const fontSize = parseFloat(computedStyle.fontSize);
            const lineHeightPx = parseFloat(lineHeight);
            if (fontSize > 0) {
              const relative = (lineHeightPx / fontSize).toFixed(2);
              return this.normalizeHeightValue(relative);
            }
          }
          return this.normalizeHeightValue(lineHeight);
        }
      }
      currentNode = currentNode.parentElement;
    }

    // Default fallback
    return '1.15';
  }

  /**
   * Normalize height value to match heightMap keys
   * @param {string} height - Raw height value
   * @returns {string} Normalized height value
   */
  normalizeHeightValue(height) {
    if (!height) return '1.15';
    
    // Convert to number and back to string to normalize
    const numValue = parseFloat(height);
    if (isNaN(numValue)) return '1.15';
    
    // Round to 1 decimal place and convert back to string
    const normalized = numValue.toFixed(1);
    
    // Check if this normalized value exists in our heightMap
    const heightMap = this.constructor.getHeightMap();
    if (heightMap[normalized]) {
      return normalized;
    }
    
    // If not in map, return the original value
    return height;
  }

  /**
   * Set current line height for future typing
   * @param {string} height - Line height value
   */
  setCurrentHeight(height) {
    // Store for future typing operations
    this.currentHeight = height;
  }

  /**
   * Clean up event listeners to prevent memory leaks
   */
  destroy() {
    if (this.selectionListener) {
      document.removeEventListener('selectionchange', this.selectionListener);
      document.removeEventListener('mouseup', this.selectionListener);
      document.removeEventListener('keyup', this.selectionListener);
      this.selectionListener = null;
    }
  }
}

export default LineHeight; 