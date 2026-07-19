import { InlineFormat } from '../core/format.js';
import CustomSelect from '../ui/customselect.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import Editor from '../core/editor.js';

/**
 * Line Height Format - Handles line height formatting
 * Now supports multiple editor instances with separate popup instances
 */
class LineHeight extends InlineFormat {
  static formatName = 'lineHeight';
  static tagName = 'SPAN';
  
  constructor() {
    super();
    
    // Get current editor instance
    const currentEditor = Editor.getCurrentInstance();
    if (!currentEditor) {
      console.warn('No editor instance found for LineHeight format');
      return;
    }
    
    this.editorId = currentEditor.instanceId;
    
    // Check if this editor already has a line height select instance
    let customSelect = currentEditor.getPopupInstance('line-height');
    
    if (!customSelect) {
      // Create new custom select instance for this editor
      const heightMap = LineHeight.getHeightMap();
      const items = Object.values(heightMap).map(heightData => ({
        value: heightData.height,
        label: heightData.element,
        title: heightData.title
      }));

      customSelect = new CustomSelect({
        items: items,
        displayProperty: 'label',
        valueProperty: 'value',
        className: 'line-height-select',
        onItemSelect: (value, item) => {
          LineHeight.applyLineHeightToCurrentSelection(value, this.editorId);
        },
        editor: currentEditor,
        editorId: this.editorId
      });
      
      // Store popup instance in editor
      currentEditor.setPopupInstance('line-height', customSelect);
    }
    
    this.customSelect = customSelect;
    
    // Set up event listener for selection changes
    this.setupSelectionListener();
  }

  /**
   * Create a new LineHeight format instance for a specific editor
   * @param {string} editorId - Editor instance ID
   * @returns {LineHeight} LineHeight format instance
   */
  static createForEditor(editorId) {
    const editor = Editor.getInstanceById(editorId);
    if (!editor) {
      console.warn('No editor instance found for ID:', editorId);
      return null;
    }
    
    // Temporarily set as current instance
    const originalCurrent = Editor.currentInstance;
    Editor.currentInstance = editor;
    
    // Create format instance
    const format = new LineHeight();
    
    // Restore original current instance
    Editor.currentInstance = originalCurrent;
    
    return format;
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
        // Only update if selection is in this editor
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const editor = Editor.getInstanceById(this.editorId);
          if (editor && (editor.editor.contains(range.startContainer) || editor.editor.isSameNode(range.startContainer))) {
            this.updateButtonText();
          }
        }
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
    if (heightMap[height]?.title) return heightMap[height].title;
    // Always show the applied value rather than a placeholder
    const num = parseFloat(height);
    if (!isNaN(num)) return String(num);
    return 'Normal';
  }

  /**
   * Update custom button text based on current line height
   */
  updateButtonText() {
    const currentHeight = this.getCurrentHeight();
    const displayName = LineHeight.getHeightDisplayName(currentHeight || '1.15');
    
    // Find line-height button in the specific editor's toolbar using editorId
    const editor = Editor.getInstanceById(this.editorId);
    if (!editor) return;
    
    const toolbar = editor.getModule('toolbar');
    let lineHeightButton = null;
    
    if (toolbar) {
      lineHeightButton = toolbar.getButton('line-height');
    }
    
    // Fallback: find button by class in the specific editor's toolbar
    if (!lineHeightButton) {
      const toolbarContainer = toolbar?.getContainer();
      if (toolbarContainer) {
        lineHeightButton = toolbarContainer.querySelector('.rich-editor-toolbar-btn.line-height-btn');
      }
    }
    
    // Final fallback: find any line-height button in the specific editor's wrapper
    if (!lineHeightButton) {
      lineHeightButton = editor.wrapper.querySelector('.rich-editor-toolbar-btn.line-height-btn');
    }
    
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
   * @param {string} height - Line height value
   * @param {string} editorId - Editor instance ID
   */
  static applyLineHeightToCurrentSelection(height, editorId = null) {
    // Get the correct editor instance
    let editor = null;
    if (editorId) {
      editor = Editor.getInstanceById(editorId);
    } else {
      editor = Editor.getCurrentInstance();
    }
    
    if (!editor) {
      console.warn('No editor instance found for line height application');
      return;
    }
    
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    // Save state before applying format
    saveBeforeFormat();

    const range = selection.getRangeAt(0);
    const lineHeightFormat = LineHeight.createForEditor(editorId);
    if (lineHeightFormat) {
      lineHeightFormat.apply(height);
      
      // Update button text after applying
      lineHeightFormat.updateButtonText();
    }
    
    // Trigger content change after applying format
    setTimeout(() => {
      if (editor && typeof editor.onContentChange === 'function') {
        editor.onContentChange();
      }
    }, 0);
  }

  /**
   * Apply line height format with specified height
   * @param {string} height - Line height value
   */
  apply(height = '1.15') {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    // Hàm đặt caret vào bên trong span mới
    function moveCaretInside(el) {
      const sel = window.getSelection();
      const range = document.createRange();
      const textNode = el.firstChild;
      range.setStart(textNode, textNode.length);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    // Save state before applying format
    saveBeforeFormat();

    const range = selection.getRangeAt(0);
    
    if (range.collapsed) {
      // No selection - set style for future typing
      let node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode;
      }

      // Tìm phần tử block cha gần nhất (div, p, li, ...)
      const blockParent = node.closest('div, p, li, section, article') || node;
      blockParent.style.lineHeight = height;
      moveCaretInside(blockParent);
    
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
    
    // Create a fragment of the selection
    const fragment = range.cloneContents();
    
    // Get all potential block elements in the fragment
    const walker = document.createTreeWalker(
      fragment,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          return blockTags.includes(node.tagName) ? 
            NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
      }
    );

    // Scope the lookup to an element: commonAncestorContainer may be a text node
    // (single-line selection), which has no querySelector.
    const ca = range.commonAncestorContainer;
    const scopeEl = ca.nodeType === Node.ELEMENT_NODE ? ca : ca.parentElement;

    // Get corresponding elements from the actual document
    let node = walker.nextNode();
    while (node) {
      // Find the actual element in the document that corresponds to this fragment node
      const actualNode = scopeEl && scopeEl.querySelector(
        `${node.tagName.toLowerCase()}:not([data-processed])`
      );
      if (actualNode && range.intersectsNode(actualNode)) {
        blockElements.push(actualNode);
        // Mark as processed to avoid duplicates
        actualNode.setAttribute('data-processed', 'true');
      }
      node = walker.nextNode();
    }

    // Clean up the temporary attribute
    blockElements.forEach(el => el.removeAttribute('data-processed'));

    // If no block elements found in selection, get the closest parent block element
    if (blockElements.length === 0) {
      let currentNode = range.startContainer;
      
      // If text node, get parent element
      if (currentNode.nodeType === Node.TEXT_NODE) {
        currentNode = currentNode.parentElement;
      }
      
      // Find parent block element
      while (currentNode && currentNode !== document.body) {
        if (currentNode.nodeType === Node.ELEMENT_NODE && 
            blockTags.includes(currentNode.tagName)) {
          blockElements.push(currentNode);
          break;
        }
        currentNode = currentNode.parentElement;
      }
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
    // Find line-height button in the current editor's toolbar
    const editor = Editor.getInstanceById(this.editorId);
    if (!editor) return;
    
    const toolbar = editor.getModule('toolbar');
    let lineHeightButton = null;
    
    if (toolbar) {
      lineHeightButton = toolbar.getButton('line-height');
    }
    
    // Fallback: find button by class in the current editor's toolbar
    if (!lineHeightButton) {
      const toolbarContainer = toolbar?.getContainer();
      if (toolbarContainer) {
        lineHeightButton = toolbarContainer.querySelector('.rich-editor-toolbar-btn.line-height-btn');
      }
    }
    
    // Final fallback: find any line-height button in the current editor's wrapper
    if (!lineHeightButton) {
      lineHeightButton = editor.wrapper.querySelector('.rich-editor-toolbar-btn.line-height-btn');
    }
    
    if (!lineHeightButton) {
      console.warn('Line-height button not found for editor:', this.editorId);
      return;
    }
    
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
    
    // Get the specific editor instance
    const editor = Editor.getInstanceById(this.editorId);
    if (!editor) return '1.15';
    
    // Check if the selection is within this editor
    if (!editor.editor.contains(currentNode) && !editor.editor.isSameNode(currentNode)) {
      // Selection is not in this editor, return default
      return '1.15';
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