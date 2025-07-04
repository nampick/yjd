import Module from '../core/module.js';
import IconLoader from '../ui/icon-loader.js';

/**
 * Block Toolbar Module - Floating toolbar hiện lên khi select text hoặc ấn Enter
 */
class BlockToolbar extends Module {
  static DEFAULTS = {
    showOnSelection: true,
    showOnEnter: true,
    fadeDelay: 3000, // Auto hide after 3 seconds of inactivity
    buttons: ['bold', 'italic', 'underline', 'strike', 'code'] // Default buttons
  };

  constructor(editor, options = {}) {
    super(editor, options);
    this.blockToolbar = null;
    this.currentSelection = null;
    this.hideTimeout = null;
    this.isVisible = false;
    
    this.init();
  }

  init() {
    this.preloadIcons();
    this.createBlockToolbar();
    this.setupEventListeners();
  }

  /**
   * Preload icons for better performance
   */
  async preloadIcons() {
    const iconNames = ['bold', 'italic', 'underline', 'strike', 'code', 'heading'];
    await IconLoader.preloadIcons(iconNames);
  }

  /**
   * Tạo block toolbar element
   */
  createBlockToolbar() {
    this.blockToolbar = document.createElement('div');
    this.blockToolbar.className = 'block-toolbar';
    
    // Create toolbar buttons with SVG icons
    const buttons = [
      { cmd: 'bold', icon: 'bold', title: 'Bold (Ctrl+B)' },
      { cmd: 'italic', icon: 'italic', title: 'Italic (Ctrl+I)' },
      { cmd: 'underline', icon: 'underline', title: 'Underline (Ctrl+U)' },
      { cmd: 'strike', icon: 'strike', title: 'Strikethrough' },
      { cmd: 'code', icon: 'code', title: 'Code' },
      { cmd: 'font', icon: 'heading', title: 'Font Family' }
    ];

    buttons.forEach(({ cmd, icon, title }) => {
      const button = document.createElement('button');
      button.className = 'block-toolbar-btn';
      button.title = title;
      button.dataset.command = cmd;

      // Create icon element using IconLoader
      const iconElement = IconLoader.createIconElement(icon, { 
        width: '16px', 
        height: '16px' 
      });
      button.appendChild(iconElement);

      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleCommand(cmd, button);
      });

      this.blockToolbar.appendChild(button);
    });

    // Add to editor wrapper
    this.editor.wrapper.appendChild(this.blockToolbar);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for mouseup to show toolbar after selection is complete
    if (this.options.showOnSelection) {
      this.editor.editor.addEventListener('mouseup', () => {
        setTimeout(() => {
          this.handleSelectionChange();
        }, 0);
      });
    }

    // Listen for Enter key
    if (this.options.showOnEnter) {
      this.editor.editor.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          // Show toolbar after Enter with delay
          this.showAtCursor();
          
        }
      });
    }

    // Hide on outside click
    document.addEventListener('mousedown', (e) => {
      if (!e.target.closest('.block-toolbar') && !e.target.closest('.rich-editor-area')) {
        this.hide();
      }
    });

    // Hide on scroll
    window.addEventListener('scroll', () => {
      if (this.isVisible) {
        this.hide();
      }
    });

    // Update button states on keyup (for keyboard selection)
    this.editor.editor.addEventListener('keyup', () => {
      if (this.isVisible) {
        
        this.updateButtonStates();
       
      } else {
        // Check if there's selection after keyup (like Shift+Arrow keys)
       
        this.handleSelectionChange();
   
      }
    });
  }

  /**
   * Handle selection change
   */
  handleSelectionChange() {
    const selection = window.getSelection();
    
    if (!selection || selection.rangeCount === 0) {
      this.hide();
      return;
    }

    const range = selection.getRangeAt(0);
    
    // Check if selection is within editor (use editor's method if available)
    const isInEditableArea = this.editor.isSelectionInEditableArea ? 
      this.editor.isSelectionInEditableArea(selection) : 
      this.editor.editor.contains(range.commonAncestorContainer);
    
    if (!isInEditableArea) {
      this.hide();
      return;
    }

    // Only show if there's actual text selected and it's within the editable area
    if (!range.collapsed && selection.toString().trim().length > 0) {
      this.showAtSelection(selection);
    } else {
      this.hide();
    }
  }

  /**
   * Show toolbar at current selection
   */
  showAtSelection(selection) {
    if (!selection || selection.rangeCount === 0) return;

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

  /**
   * Show toolbar at cursor position
   */
  showAtCursor() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    
    // Check if cursor is within editor using editor's method
    const isInEditableArea = this.editor.isSelectionInEditableArea ? 
      this.editor.isSelectionInEditableArea(selection) : 
      this.editor.editor.contains(range.commonAncestorContainer);
    
    if (!isInEditableArea) {
      return;
    }

    // Get cursor position more accurately
    let rect;
    
    if (range.collapsed) {
      // For collapsed range (cursor), create a temporary span to get position
      const span = document.createElement('span');
      span.innerHTML = '&#8203;'; // Zero-width space
      range.insertNode(span);
      rect = span.getBoundingClientRect();
      span.remove();
    } else {
      // For selection, use range bounds
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

  /**
   * Show toolbar at specific position
   */
  showAt(x, y) {
    if (!this.blockToolbar) return;

    this.blockToolbar.classList.add('visible');
    this.isVisible = true;

    // Position the toolbar
    this.blockToolbar.style.left = Math.max(0, x - this.blockToolbar.offsetWidth / 2) + 'px';
    this.blockToolbar.style.top = Math.max(0, y - this.blockToolbar.offsetHeight) + 'px';

    this.updateButtonStates();
    this.clearHideTimeout();
    
  }

  /**
   * Hide toolbar
   */
  hide() {
    if (!this.blockToolbar || !this.isVisible) return;

    this.blockToolbar.classList.remove('visible');
    this.isVisible = false;
    this.clearHideTimeout();
    
  }

  /**
   * Clear hide timeout
   */
  clearHideTimeout() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  /**
   * Handle command execution - only if selection is in editable area
   */
  handleCommand(command, button) {

    // Double check that we're still in editable area before executing command
    const selection = window.getSelection();
    const isInEditableArea = this.editor.isSelectionInEditableArea ? 
      this.editor.isSelectionInEditableArea(selection) : true;
    
    if (!isInEditableArea) {
      console.warn('Command blocked: Selection outside editable area');
      this.hide();
      return;
    }

    // Special handling for font command
    if (command === 'font') {
      this.handleFontCommand();
      return;
    }

    // Get format from registry
    const formatClass = this.editor.registry.get(`formats/${command}`);
    if (formatClass) {
      const format = new formatClass();
      if (typeof format.toggle === 'function') {
        format.toggle();
      } else if (typeof format.apply === 'function') {
        format.apply();
      }
    } else {
      // Fallback to execCommand
      document.execCommand(command, false, null);
    }

    // Update button state
    this.updateButtonState(command, button);
    this.editor.focus();
  }

  /**
   * Update button states based on current selection
   */
  updateButtonStates() {
    if (!this.blockToolbar) return;

    const buttons = this.blockToolbar.querySelectorAll('.block-toolbar-btn');
    buttons.forEach(button => {
      const command = button.dataset.command;
      this.updateButtonState(command, button);
    });
  }

  /**
   * Update single button state
   */
  updateButtonState(command, button) {
    if (!button) return;

    let isActive = false;

    // Check if format is active
    if (command === 'font') {
      // Font is always available, no active state
      isActive = false;
    } else if (command === 'code') {
      // Check code format using registry
      const formatClass = this.editor.registry.get('formats/code');
      if (formatClass) {
        const format = new formatClass();
        isActive = format.isActive();
      }
    } else {
      // Check via queryCommandState
      try {
        isActive = document.queryCommandState(command);
      } catch (e) {
        // Some commands might not be supported
        isActive = false;
      }
    }

    // Update button appearance
    if (isActive) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  }

  /**
   * Destroy module
   */
  destroy() {
    if (this.blockToolbar && this.blockToolbar.parentNode) {
      this.blockToolbar.parentNode.removeChild(this.blockToolbar);
    }
    
    this.clearHideTimeout();
    this.blockToolbar = null;
    this.isVisible = false;
    
  }
}

export default BlockToolbar; 