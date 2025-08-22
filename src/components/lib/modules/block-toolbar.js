import Module from '../core/module.js';
import IconUtils from '../ui/icons.js';

/**
 * Block Toolbar Module - Floating toolbar hiện lên khi select text hoặc ấn Enter
 */
class BlockToolbar extends Module {
  static DEFAULTS = {
    showOnSelection: true,
    showOnEnter: true,
    buttons: ['bold', 'italic', 'underline', 'strike', 'code']
  };

  constructor(editor, options = {}) {
    super(editor, options);
    this.blockToolbar = null;
    this.isVisible = false;
    this.currentSelection = null; // Store current selection for scroll updates
    this.currentCursorPosition = null; // Store current cursor position for scroll updates
    this.originalTags = new Map(); // Store original tags before converting to code
    this.init();
  }

  init() {
    this.preloadIcons();
    this.createBlockToolbar();
    this.setupEventListeners();
  }

  async preloadIcons() {
    // Icons are now inline, no need to preload
    // This method is kept for backward compatibility
  }

  createBlockToolbar() {
    this.blockToolbar = document.createElement('div');
    this.blockToolbar.className = 'block-toolbar';
    
    // Create toolbar container
    const toolbarContainer = document.createElement('div');
    toolbarContainer.className = 'block-toolbar-container';
    
    const buttons = [
      { cmd: 'bold', icon: 'bold', title: 'Bold (Ctrl+B)' },
      { cmd: 'italic', icon: 'italic', title: 'Italic (Ctrl+I)' },
      { cmd: 'underline', icon: 'underline', title: 'Underline (Ctrl+U)' },
      { cmd: 'strike', icon: 'strike', title: 'Strikethrough' },
      { cmd: 'code', icon: 'code', title: 'Code' },
      { cmd: 'font-family', icon: 'heading', title: 'Font Family' }
    ];
    buttons.forEach(({ cmd, icon, title }) => {
      const button = document.createElement('button');
      button.className = 'block-toolbar-btn';
      button.title = title;
      button.dataset.command = cmd;
      const iconElement = IconUtils.createIconElement(icon, { width: '16px', height: '16px' });
      button.appendChild(iconElement);
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleCommand(cmd, button);
      });
      toolbarContainer.appendChild(button);
    });
    
    // Create arrow element
    const arrow = document.createElement('div');
    arrow.className = 'block-toolbar-arrow';
    
    // Add container and arrow to toolbar
    this.blockToolbar.appendChild(toolbarContainer);
    this.blockToolbar.appendChild(arrow);
    
    this.editor.wrapper.appendChild(this.blockToolbar);
  }

  setupEventListeners() {
    if (this.options.showOnSelection) {
      this.editor.editor.addEventListener('mouseup', () => {
        setTimeout(() => this.handleSelectionChange(), 0);
      });
    }
    if (this.options.showOnEnter) {
      this.editor.editor.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          requestAnimationFrame(() => {
            setTimeout(() => this.showAtCursorAfterEnter(), 10);
          });
        }
        else{
          this.hide();
        }
      });
    }

    document.addEventListener('mousedown', (e) => {
      // Don't hide if clicking on font-family popup or its items
      if (e.target.closest('.font-family-select-popup') || e.target.closest('.custom-select-popup')) {
        return;
      }
      
      if (!e.target.closest('.block-toolbar') && !e.target.closest('.rich-editor-area')) {
        this.hide();
      }
    });

    // Update scroll event listeners to track position instead of hiding
    window.addEventListener('scroll', () => {
      if (this.isVisible) {
        this.updateToolbarPosition();
      }
    });

    // Add editor scroll listener
    this.editor.editor.addEventListener('scroll', () => {
      if (this.isVisible) {
        this.updateToolbarPosition();
      }
    });

    this.editor.editor.addEventListener('keyup', (e) => {
      // Nếu là Shift + Enter thì ẩn toolbar
      if (e.key === 'Enter' && e.shiftKey) {
        this.hide();
        return;
      }
      
      if (this.isVisible) {
        this.updateButtonStates();
      } else {
        this.handleSelectionChange();
      }
    });
  }

  handleSelectionChange() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return this.hide();
    const range = selection.getRangeAt(0);
    const isInEditableArea = this.editor.isSelectionInEditableArea ?
      this.editor.isSelectionInEditableArea(selection) :
      this.editor.editor.contains(range.commonAncestorContainer);
    if (!isInEditableArea) return this.hide();
    if (!range.collapsed && selection.toString().trim().length > 0) {
      this.showAtSelection(selection);
    } else {
      this.hide();
    }
  }

  showAtSelection(selection) {
    if (!selection || selection.rangeCount === 0) return;
    
    // Store current selection for scroll updates
    this.currentSelection = selection;
    this.currentCursorPosition = null;
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const editorRect = this.editor.wrapper.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    this.showAt(
      rect.left + rect.width / 2 - editorRect.left + scrollLeft,
      rect.top - editorRect.top + scrollTop - 10
    );
  }

  showAtCursorAfterEnter() {
    this.editor.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const isInEditableArea = this.editor.isSelectionInEditableArea ?
      this.editor.isSelectionInEditableArea(selection) :
      this.editor.editor.contains(range.commonAncestorContainer);
    if (!isInEditableArea) return;
    
    this.ensureCursorAtEndOfLine(range);
    
    // Store current cursor position for scroll updates
    this.currentSelection = selection;
    this.currentCursorPosition = this.getCursorPositionAfterEnter();
    
    const rect = this.currentCursorPosition;
    if (!rect) return;
    const editorRect = this.editor.wrapper.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    this.showAt(
      rect.left - editorRect.left + scrollLeft,
      rect.top - editorRect.top + scrollTop - 10
    );
  }

  ensureCursorAtEndOfLine(range) {
    if (!range.collapsed) return;
    const selection = window.getSelection();
    const currentNode = range.startContainer;
    if (currentNode.nodeType === Node.TEXT_NODE) {
      const textLength = currentNode.textContent.length;
      if (range.startOffset < textLength) {
        range.setStart(currentNode, textLength);
        range.setEnd(currentNode, textLength);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
      const walker = document.createTreeWalker(currentNode, NodeFilter.SHOW_TEXT, null, false);
      let lastTextNode = null, node;
      while (node = walker.nextNode()) lastTextNode = node;
      if (lastTextNode) {
        const textLength = lastTextNode.textContent.length;
        range.setStart(lastTextNode, textLength);
        range.setEnd(lastTextNode, textLength);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }

  getCursorPositionAfterEnter() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    const marker = document.createElement('span');
    marker.innerHTML = '&#8203;';
    marker.style.position = 'absolute';
    marker.style.visibility = 'hidden';
    marker.style.pointerEvents = 'none';
    range.insertNode(marker);
    const rect = marker.getBoundingClientRect();
    if (marker.parentNode) marker.parentNode.removeChild(marker);
    const newRange = document.createRange();
    newRange.setStart(range.startContainer, range.startOffset);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    return rect;
  }

  showAtCursor() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const isInEditableArea = this.editor.isSelectionInEditableArea ?
      this.editor.isSelectionInEditableArea(selection) :
      this.editor.editor.contains(range.commonAncestorContainer);
    if (!isInEditableArea) return;
    let rect;
    if (range.collapsed) {
      const span = document.createElement('span');
      span.innerHTML = '&#8203;';
      span.style.position = 'absolute';
      span.style.visibility = 'hidden';
      span.style.pointerEvents = 'none';
      range.insertNode(span);
      rect = span.getBoundingClientRect();
      if (span.parentNode) span.parentNode.removeChild(span);
      const newRange = document.createRange();
      newRange.setStart(range.startContainer, range.startOffset);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      rect = range.getBoundingClientRect();
    }
    const editorRect = this.editor.wrapper.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    this.showAt(
      rect.left - editorRect.left + scrollLeft,
      rect.top - editorRect.top + scrollTop - 10
    );
  }

  showAt(x, y) {
    if (!this.blockToolbar) return;
    this.blockToolbar.classList.add('visible');
    this.isVisible = true;
    this.ensureToolbarInViewport(x,y);
    this.updateButtonStates();
  }

  ensureToolbarInViewport(x,y) {
    if (!this.blockToolbar) return;
    
    // Lấy thông tin về editor-area
    const editorArea = this.editor.editor;
    const editorRect = editorArea.getBoundingClientRect();
    const toolbarRect = this.blockToolbar.getBoundingClientRect();
    const toolbarContainer = this.editor.wrapper.querySelector('.rich-editor-toolbar-container');
    const toolbarRect2 = toolbarContainer ? toolbarContainer.getBoundingClientRect() : null;

    
    let left = x - this.blockToolbar.offsetWidth/2;
    let top = editorRect.y + y -(toolbarRect2.height) -60- editorArea.scrollTop;
    let arrowLeft = '50%';
    let arrowDirection = 'down'; // mũi tên hướng xuống
    
    // Trường hợp 1: Vượt quá lề trái của editor
    if (left < 0) {
      left =(x - (this.blockToolbar.offsetWidth * (10/100)));
      if(left < 0) left = 0;
      arrowLeft = '10%'; // Mũi tên ở 10%
    }
    // Trường hợp 2: Vượt quá lề phải của editor
    if (left + this.blockToolbar.offsetWidth > (this.editor.wrapper.offsetWidth - 2)) {
      left = x - this.blockToolbar.offsetWidth*0.9;
      arrowLeft = '90%'; // Mũi tên ở 90%
    }
    
    // Trường hợp 3: Vượt quá lề trên của editor
    if (top < toolbarRect2.height) {
      top = editorRect.y + y -(toolbarRect2.height) +60- editorArea.scrollTop;
      arrowDirection = 'up'; // Mũi tên hướng lên
      if(top < toolbarRect2.height ){
        this.hide();
        return;
      }
    }
    if(top > editorRect.height){
      this.hide();
      return;
    }
    // Cập nhật vị trí mũi tên
    const arrow = this.blockToolbar.querySelector('.block-toolbar-arrow');
    if (arrow) {
      arrow.style.left = arrowLeft;
      
      if (arrowDirection === 'up') {
        // Mũi tên hướng lên
        arrow.style.bottom = 'auto';
        arrow.style.top = '-8px';
        arrow.style.borderTop = 'none';
        arrow.style.borderBottom = '8px solid #fff';
        arrow.style.borderLeft = '6px solid transparent';
        arrow.style.borderRight = '6px solid transparent';
      } else {
        // Mũi tên hướng xuống (mặc định)
        arrow.style.top = 'auto';
        arrow.style.bottom = '-8px';
        arrow.style.borderBottom = 'none';
        arrow.style.borderTop = '8px solid #fff';
        arrow.style.borderLeft = '6px solid transparent';
        arrow.style.borderRight = '6px solid transparent';
      }
    }
    // Áp dụng vị trí cuối cùng
    this.blockToolbar.style.left = left + 'px';
    this.blockToolbar.style.top = top + 'px';
  }

  /**
   * Update toolbar position based on current selection or cursor position
   */
  updateToolbarPosition() {
    if (!this.isVisible) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      this.hide();
      return;
    }

    const range = selection.getRangeAt(0);
    const isInEditableArea = this.editor.isSelectionInEditableArea ?
      this.editor.isSelectionInEditableArea(selection) :
      this.editor.editor.contains(range.commonAncestorContainer);
    
    if (!isInEditableArea) {
      this.hide();
      return;
    }

    let rect;
    
    if (range.collapsed) {
      // For cursor position, get current cursor rect
      const span = document.createElement('span');
      span.innerHTML = '&#8203;';
      span.style.position = 'absolute';
      span.style.visibility = 'hidden';
      span.style.pointerEvents = 'none';
      
      try {
        range.insertNode(span);
        rect = span.getBoundingClientRect();
        if (span.parentNode) span.parentNode.removeChild(span);
        
        // Restore range
        const newRange = document.createRange();
        newRange.setStart(range.startContainer, range.startOffset);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } catch (e) {
        // If insertion fails, hide toolbar
        this.hide();
        return;
      }
    } else {
      // For selection, use selection rect
      rect = range.getBoundingClientRect();
    }

    const editorRect = this.editor.wrapper.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    let x, y;
    if (range.collapsed) {
      x = rect.left - editorRect.left + scrollLeft;
      y = rect.top - editorRect.top + scrollTop - 10;
    } else {
      x = rect.left + rect.width / 2 - editorRect.left + scrollLeft;
      y = rect.top - editorRect.top + scrollTop - 10;
    }
    
    this.updateToolbarAt(x, y);
    
    // Update font-family popup position if it's visible
    const fontFamilyFormat = this.editor.registry.get('formats/font-family');
    if (fontFamilyFormat && fontFamilyFormat.selectInstance && fontFamilyFormat.selectInstance.isVisible) {
      fontFamilyFormat.selectInstance.updatePosition();
    }
  }

  /**
   * Update toolbar position at specific coordinates
   */
  updateToolbarAt(x, y) {
    if (!this.blockToolbar) return;
    
    this.ensureToolbarInViewport(x, y);
    this.updateButtonStates();
  }

  hide() {
    if (!this.blockToolbar || !this.isVisible) return;
    this.blockToolbar.classList.remove('visible');
    this.isVisible = false;
    // Clear stored positions
    this.currentSelection = null;
    this.currentCursorPosition = null;
    
    // Hide any open font-family popup when block toolbar is hidden
    const fontFamilyFormat = this.editor.registry.get('formats/font-family');
    if (fontFamilyFormat && fontFamilyFormat.selectInstance) {
      fontFamilyFormat.selectInstance.hide();
    }
  }

  handleCommand(command, button) {
    const selection = window.getSelection();
    const isInEditableArea = this.editor.isSelectionInEditableArea ?
      this.editor.isSelectionInEditableArea(selection) : true;
    if (!isInEditableArea) {
      this.hide();
      return;
    }
    
    // Special handling for font-family command
    if (command === 'font-family') {
      const fontFamilyFormat = this.editor.registry.get('formats/font-family');
      if (fontFamilyFormat) {
        const format = new fontFamilyFormat();
        format.toggle(button); // Pass the button as anchor
        this.updateButtonState(command, button);
        this.editor.focus();
        return;
      }
    }
    
    // Special handling for code command to use PRE tag from heading format
    if (command === 'code') {
      const headingFormat = this.editor.registry.get('formats/heading');
      if (headingFormat) {
        const heading = new headingFormat();
        const currentTag = heading.getCurrentTag();
        
        // If current tag is PRE, convert back to original tag or P
        // If current tag is not PRE, convert to PRE (code format)
        if (currentTag === 'PRE') {
          // Get the selection to find the block element
          const selection = window.getSelection();
          if (selection && selection.rangeCount) {
            const range = selection.getRangeAt(0);
            const block = this.getBlockElement(range.startContainer);
            
            if (block) {
              // Get original tag for this block, default to P
              const originalTag = this.originalTags.get(block) || 'P';
              heading.apply(originalTag);              
              this.originalTags.delete(block); // Clean up
            } else {
              heading.apply('P');
            }
          } else {
            heading.apply('P');
          }
        } else {
          // Store original tag before converting to PRE
          const selection = window.getSelection();
          if (selection && selection.rangeCount) {
            const range = selection.getRangeAt(0);
            const block = this.getBlockElement(range.startContainer);
            
            if (block) {
              this.originalTags.set(block, currentTag || 'P');
            }
          }
          
          heading.apply('PRE');
        }
        
        this.updateButtonState(command, button);
        this.editor.focus();
        return;
      }
    }

    const formatClass = this.editor.registry.get(`formats/${command}`);
    if (formatClass) {
      const format = new formatClass();
      if (typeof format.toggle === 'function') format.toggle();
      else if (typeof format.apply === 'function') format.apply();
    } else {
      document.execCommand(command, false, null);
    }
    this.updateButtonState(command, button);
    this.editor.focus();
  }

  updateButtonStates() {
    if (!this.blockToolbar) return;
    const buttons = this.blockToolbar.querySelectorAll('.block-toolbar-btn');
    buttons.forEach(button => {
      const command = button.dataset.command;
      this.updateButtonState(command, button);
    });
  }

  updateButtonState(command, button) {
    if (!button) return;
    let isActive = false;
    if (command === 'font-family') {
      const fontFamilyFormat = this.editor.registry.get('formats/font-family');
      if (fontFamilyFormat) {
        const format = new fontFamilyFormat();
        isActive = format.isActive();
      }
    } else if (command === 'code') {
      // Check if current block is PRE tag
      const headingFormat = this.editor.registry.get('formats/heading');
      if (headingFormat) {
        const heading = new headingFormat();
        const currentTag = heading.getCurrentTag();
        isActive = currentTag === 'PRE';
      }
    } else if (command === 'strike') {
      const formatClass = this.editor.registry.get(`formats/${command}`);
      if (formatClass) {
        const format = new formatClass();
        isActive = format.isActive();
      }
    } else {
      try {
        isActive = document.queryCommandState(command);
      } catch (e) {
        isActive = false;
      }
    }
    if (isActive) button.classList.add('active');
    else button.classList.remove('active');
  }

  /**
   * Get block element from a node
   * @param {Node} node - Node to find block element for
   * @returns {Element|null} Block element or null
   */
  getBlockElement(node) {
    if (!node) return null;
    
    // If node is an element and is a block, return it
    if (node.nodeType === Node.ELEMENT_NODE) {
      const blockTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'PRE', 'BLOCKQUOTE', 'DIV'];
      if (blockTags.includes(node.tagName)) {
        return node;
      }
    }
    
    // Walk up the DOM tree to find block element
    let current = node;
    while (current && current !== this.editor.editor) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const blockTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'PRE', 'BLOCKQUOTE', 'DIV'];
        if (blockTags.includes(current.tagName)) {
          return current;
        }
      }
      current = current.parentNode;
    }
    
    return null;
  }

  destroy() {
    if (this.blockToolbar && this.blockToolbar.parentNode) {
      this.blockToolbar.parentNode.removeChild(this.blockToolbar);
    }
    this.blockToolbar = null;
    this.isVisible = false;
    this.originalTags.clear(); // Clean up stored tags
  }
}

export default BlockToolbar; 