import { InlineFormat } from '../core/format.js';
import CustomSelect from '../ui/customselect.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import Editor from '../core/editor.js';
import { execFormat } from '../utils/exec-command.js';
import { registerIcons, S } from '../ui/icons.js';

registerIcons({
  'font-family': S('<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/>')
});

/**
 * Font Family Format - Handles font family formatting
 * Now supports multiple editor instances with separate popup instances
 */
class FontFamily extends InlineFormat {
  static formatName = 'fontFamily';
  static tagName = 'SPAN';
  
  constructor() {
    super();
    
    // Get current editor instance
    const currentEditor = Editor.getCurrentInstance();
    if (!currentEditor) {
      console.warn('No editor instance found for FontFamily format');
      return;
    }
    
    this.editorId = currentEditor.instanceId;
    
    // Check if this editor already has a font family select instance
    let customSelect = currentEditor.getPopupInstance('font-family');
    
    if (!customSelect) {
      // Create new custom select instance for this editor
      const fontMap = FontFamily.getFontMap();
      const items = Object.values(fontMap).map(fontData => ({
        value: fontData.font,
        label: fontData.element,
        title: fontData.title
      }));

      customSelect = new CustomSelect({
        items: items,
        displayProperty: 'label',
        valueProperty: 'value',
        className: 'font-family-select',
        onItemSelect: (value, item) => {
          FontFamily.applyFontFamilyToCurrentSelection(value, this.editorId);
        },
        editor: currentEditor,
        editorId: this.editorId
      });
      
      // Store popup instance in editor
      currentEditor.setPopupInstance('font-family', customSelect);
    }
    
    this.customSelect = customSelect;
    
    // Set up event listener for selection changes
    this.setupSelectionListener();
  }

  /**
   * Create a new FontFamily format instance for a specific editor
   * @param {string} editorId - Editor instance ID
   * @returns {FontFamily} FontFamily format instance
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
    const format = new FontFamily();
    
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
   * Get font map with different font families
   */
  static getFontMap() {
    return {
        'Arial': { 
        font: 'Arial, sans-serif', 
        element: '<span style="font-family: Arial, sans-serif">Arial</span>', 
        title: 'Arial' 
        },
        'Helvetica': { 
        font: 'Helvetica, Arial, sans-serif', 
        element: '<span style="font-family: Helvetica, Arial, sans-serif">Helvetica</span>', 
        title: 'Helvetica' 
        },
        'Times New Roman': { 
        font: '"Times New Roman", Times, serif', 
        element: '<span style="font-family: \'Times New Roman\', Times, serif">Times New Roman</span>', 
        title: 'Times New Roman' 
        },
        'Georgia': { 
        font: 'Georgia, serif', 
        element: '<span style="font-family: Georgia, serif">Georgia</span>', 
        title: 'Georgia' 
        },
        'Verdana': { 
        font: 'Verdana, Geneva, sans-serif', 
        element: '<span style="font-family: Verdana, Geneva, sans-serif">Verdana</span>', 
        title: 'Verdana' 
        },
        'Courier New': { 
        font: '"Courier New", Courier, monospace', 
        element: '<span style="font-family: \'Courier New\', Courier, monospace">Courier New</span>', 
        title: 'Courier New' 
        },
        'Trebuchet MS': { 
        font: '"Trebuchet MS", Helvetica, sans-serif', 
        element: '<span style="font-family: \'Trebuchet MS\', Helvetica, sans-serif">Trebuchet MS</span>', 
        title: 'Trebuchet MS' 
        },
        'Comic Sans MS': { 
        font: '"Comic Sans MS", cursive', 
        element: '<span style="font-family: \'Comic Sans MS\', cursive">Comic Sans MS</span>', 
        title: 'Comic Sans MS' 
        },
        'Impact': { 
        font: 'Impact, Charcoal, sans-serif', 
        element: '<span style="font-family: Impact, Charcoal, sans-serif">Impact</span>', 
        title: 'Impact' 
        },
        'Lucida Console': { 
        font: '"Lucida Console", Monaco, monospace', 
        element: '<span style="font-family: \'Lucida Console\', Monaco, monospace">Lucida Console</span>', 
        title: 'Lucida Console' 
        }
    };
    }


  /**
   * Get display name for font
   * @param {string} font - Font family value
   * @returns {string} Display name
   */
  static getFontDisplayName(font) {
    const fontMap = this.getFontMap();
    // Find by font value
    for (const [key, value] of Object.entries(fontMap)) {
      if (value.font === font || key === font) {
        return value.title;
      }
    }
    return 'Arial';
  }

  /**
   * Update custom button text based on current font
   */
  updateButtonText() {
    const currentFont = this.getCurrentFont();
    const displayName = FontFamily.getFontDisplayName(currentFont || 'Arial, sans-serif');
    
    // Find font-family button in the specific editor's toolbar using editorId
    const editor = Editor.getInstanceById(this.editorId);
    if (!editor) return;
    
    const toolbar = editor.getModule('toolbar');
    let fontFamilyButton = null;
    
    if (toolbar) {
      fontFamilyButton = toolbar.getButton('font-family');
    }
    
    // Fallback: find button by class in the specific editor's toolbar
    if (!fontFamilyButton) {
      const toolbarContainer = toolbar?.getContainer();
      if (toolbarContainer) {
        fontFamilyButton = toolbarContainer.querySelector('.rich-editor-toolbar-btn.font-family-btn');
      }
    }
    
    // Final fallback: find any font-family button in the specific editor's wrapper
    if (!fontFamilyButton) {
      fontFamilyButton = editor.wrapper.querySelector('.rich-editor-toolbar-btn.font-family-btn');
    }
    
    if (fontFamilyButton && fontFamilyButton.updateText) {
      fontFamilyButton.updateText(displayName);
    } else if (fontFamilyButton) {
      fontFamilyButton.textContent = displayName;
    }
  }

  /**
   * Create element with specific font family
   * @param {string} font - Font family value
   * @returns {HTMLElement}
   */
  static create(font = 'Arial, sans-serif') {
    const node = document.createElement('span');
    node.style.fontFamily = font;
    return node;
  }

  /**
   * Static method to apply font family to current selection
   * @param {string} font - Font family value
   * @param {string} editorId - Editor instance ID
   */
  static applyFontFamilyToCurrentSelection(font, editorId = null) {
    // Get the correct editor instance
    let editor = null;
    if (editorId) {
      editor = Editor.getInstanceById(editorId);
    } else {
      editor = Editor.getCurrentInstance();
    }
    
    if (!editor) {
      console.warn('No editor instance found for font family application');
      return;
    }
    
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    // Save state before applying format
    saveBeforeFormat();

    const range = selection.getRangeAt(0);
    const fontFamilyFormat = FontFamily.createForEditor(editorId);
    if (fontFamilyFormat) {
      fontFamilyFormat.apply(font);
      
      // Update button text after applying
      fontFamilyFormat.updateButtonText();
    }
    
    // Trigger content change after applying format
    setTimeout(() => {
      if (editor && typeof editor.onContentChange === 'function') {
        editor.onContentChange();
      }
    }, 0);
  }

  /**
   * Apply font family format with specified font
   * @param {string} font - Font family value
   */
  apply(font = 'Arial, sans-serif') {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;
  const range = selection.getRangeAt(0);

  function isCaretInsideFontSpan(selection, font) {
    if (!selection.rangeCount) return false;
    const range = selection.getRangeAt(0);
    let node = range.startContainer;

    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }

    const fontNormalized = font.split(',')[0].trim().toLowerCase();

    while (node && node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName === 'SPAN') {
        const styleFont = node.style.fontFamily;
        if (styleFont) {
          const styleFontNormalized = styleFont.split(',')[0].trim().toLowerCase();
          if (styleFontNormalized === fontNormalized) {
            if (
              node.childNodes.length === 1 &&
              node.firstChild.nodeType === Node.TEXT_NODE &&
              node.firstChild.textContent === '\u200B'
            ) {
              return true; // Đang trong span marker rồi
            }
            return true; // Đang trong span font-family đó
          }
        }
      }
      node = node.parentNode;
    }
    return false;
  }

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

  if (range.collapsed) {
    if (isCaretInsideFontSpan(selection, font)) {
      // Đã ở trong span font rồi, không cần làm gì thêm
      return;
    }

    let node = range.startContainer;
    let offset = range.startOffset;

    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }

    const currentSpan = node.closest && node.closest('span');

    // Trường hợp 1: caret trong span rỗng chứa \u200B
    if (currentSpan && currentSpan.textContent === "\u200B") {
      currentSpan.style.fontFamily = font;
      return;
    }

    // Trường hợp 2: caret trong span có text thật
    if (currentSpan && currentSpan.firstChild && currentSpan.firstChild.nodeType === Node.TEXT_NODE) {
      const textNode = currentSpan.firstChild;
      const caretPos = range.startOffset;

      const textBefore = textNode.data.slice(0, caretPos);
      const textAfter = textNode.data.slice(caretPos);

      const parent = currentSpan.parentNode;

      if (caretPos === 0) {
        // Chèn span mới trước currentSpan
        const newSpan = document.createElement('span');
        newSpan.style.fontFamily = font;
        newSpan.appendChild(document.createTextNode('\u200B'));
        parent.insertBefore(newSpan, currentSpan);
        moveCaretInside(newSpan);
      } else if (caretPos === textNode.data.length) {
        // Chèn span mới sau currentSpan
        const newSpan = document.createElement('span');
        newSpan.style.fontFamily = font;
        newSpan.appendChild(document.createTextNode('\u200B'));
        parent.insertBefore(newSpan, currentSpan.nextSibling);
        moveCaretInside(newSpan);
      } else {
        // Tách thành 3 span
        const span1 = document.createElement('span');
        span1.style.fontFamily = currentSpan.style.fontFamily;
        span1.appendChild(document.createTextNode(textBefore));

        const span2 = document.createElement('span');
        span2.style.fontFamily = font;
        span2.appendChild(document.createTextNode('\u200B'));

        const span3 = document.createElement('span');
        span3.style.fontFamily = currentSpan.style.fontFamily;
        span3.appendChild(document.createTextNode(textAfter));

        parent.insertBefore(span1, currentSpan);
        parent.insertBefore(span2, currentSpan);
        parent.insertBefore(span3, currentSpan);
        parent.removeChild(currentSpan);

        moveCaretInside(span2);
      }
      return;
    }

    // Trường hợp 3: không ở trong span nào → tạo mới
    const newSpan = document.createElement('span');
    newSpan.style.fontFamily = font;
    newSpan.appendChild(document.createTextNode('\u200B'));
    range.insertNode(newSpan);
    moveCaretInside(newSpan);

  } else {
    // Có selection → áp dụng fontName
    execFormat('fontName', font);
  }
}

  
  /**
   * Toggle font family format - shows/hides font picker
   */
  async toggle(anchorButton = null) {
    if (this.customSelect.isVisible) {
      this.customSelect.hide();
    } else {
      await this.showFontPicker(anchorButton);
    }
  }

  /**
   * Show custom select positioned relative to font family button on toolbar
   */
  async showFontPicker(anchorButton = null) {
    // Use provided anchor button or find the default toolbar button
    let fontFamilyButton = anchorButton;
    
    if (!fontFamilyButton) {
      // Find font-family button in the current editor's toolbar
      const editor = Editor.getInstanceById(this.editorId);
      if (!editor) return;
      
      const toolbar = editor.getModule('toolbar');
      
      if (toolbar) {
        fontFamilyButton = toolbar.getButton('font-family');
      }
      
      // Fallback: find button by class in the current editor's toolbar
      if (!fontFamilyButton) {
        const toolbarContainer = toolbar?.getContainer();
        if (toolbarContainer) {
          fontFamilyButton = toolbarContainer.querySelector('.rich-editor-toolbar-btn.font-family-btn');
        }
      }
      
      // Final fallback: find any font-family button in the current editor's wrapper
      if (!fontFamilyButton) {
        fontFamilyButton = editor.wrapper.querySelector('.rich-editor-toolbar-btn.font-family-btn');
      }
    }
    
    if (!fontFamilyButton) return;
    
    // Update current selection before showing
    const currentFont = this.getCurrentFont();
    if (currentFont) {
      this.customSelect.setCurrentValue(currentFont);
    }
    
    await this.customSelect.show(fontFamilyButton);
  }

  /**
   * Check if font family format is active - always return false (no active state)
   * Only update button text to show current font
   * @param {string} font - Optional specific font to check
   * @returns {boolean}
   */
  isActive(font = null) {
    // Always update button text to show current font
    this.updateButtonText();
    
    // Never show active state for font family button
    return false;
  }

  /**
   * Get current font family of the selection
   * @returns {string|null} Current font family or null
   */
  getCurrentFont() {
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
    if (!editor) return 'Arial, sans-serif';
    
    // Check if the selection is within this editor
    if (!editor.editor.contains(currentNode) && !editor.editor.isSameNode(currentNode)) {
      // Selection is not in this editor, return default
      return 'Arial, sans-serif';
    }
    
    // Find element with font-family style
    while (currentNode && currentNode !== document.body) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const element = currentNode;
        
        // Priority 1: Check if this element has explicit inline font-family
        if (element.style.fontFamily) {
          return element.style.fontFamily;
        }
        
        // Priority 2: Check computed font-family
        const computedStyle = window.getComputedStyle(element);
        const fontFamily = computedStyle.fontFamily;
        if (fontFamily && fontFamily !== 'initial' && fontFamily !== 'inherit') {
          return fontFamily;
        }
      }
      currentNode = currentNode.parentElement;
    }

    // Default fallback
    return 'Arial, sans-serif';
  }

  /**
   * Set current font for future typing
   * @param {string} font - Font family value
   */
  setCurrentFont(font) {
    // Store for future typing operations
    this.currentFont = font;
  }
}

export default FontFamily; 