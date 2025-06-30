import Module from '../core/module.js';
import ColorPicker from '../ui/color-picker.js';

/**
 * Toolbar Module - Pure UI component with dual toolbar support
 * Only handles toolbar creation and event emission
 * No business logic or state management
 */
class Toolbar extends Module {
  static DEFAULTS = {
    container: null,
    toolbar1: ['bold', 'italic', 'underline', 'strike', 'subscript', 'superscript', 'color', 'undo', 'redo', 'more'],
    toolbar2: ['undo', 'redo' ]
  };

  constructor(editor, options = {}) {
    super(editor, options);
    this.buttons = new Map();
    this.toolbar2Visible = false;
    this.colorPickers = new Map();
    
    this.init();
  }

  init() {
    this.container = this.createToolbarContainer();
  }

  /**
   * Create main toolbar container with both toolbars
   */
  createToolbarContainer() {
    const container = document.createElement('div');
    container.className = 'rich-editor-toolbar-container';

    // Create toolbar 1
    this.toolbar1 = this.createToolbar('rich-editor-toolbar-1', this.options.toolbar1);
    container.appendChild(this.toolbar1);

    // Create toolbar 2 (initially hidden)
    this.toolbar2 = this.createToolbar('rich-editor-toolbar-2', this.options.toolbar2);
    this.toolbar2.style.display = 'none';
    container.appendChild(this.toolbar2);

    return container;
  }

  /**
   * Create toolbar element
   */
  createToolbar(className, toolbarItems) {
    const toolbar = document.createElement('div');
    toolbar.className = className;

    // Create buttons based on toolbar config
    if (Array.isArray(toolbarItems)) {
      toolbarItems.forEach(item => {
        if (typeof item === 'string') {
          this.addButton(toolbar, item);
        }
      });
    }

    return toolbar;
  }

  /**
   * Add button to toolbar
   */
  addButton(container, format) {
    // Special handling for more button
    if (format === 'more') {
      return this.addMoreButton(container);
    }

    // Special handling for color button
    if (format === 'color') {
      return this.addColorButton(container);
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rich-editor-toolbar-btn';
    button.dataset.command = format;
    
    // Add icon based on format
    const icons = {
      'bold': '𝐁',
      'italic': '𝐼',
      'underline': '𝐔',
      'strike': '𝐒',
      'subscript': 'X₂',
      'superscript': 'X²',
      'color': '🎨',
      'undo': '↶',
      'redo': '↷',
      'more': '⋯'
    };
    
    button.innerHTML = icons[format] || format;
    
    // Add special classes and titles



    if (format === 'subscript') {
      button.classList.add('subscript-btn');
      button.title = 'Subscript';
    } else if (format === 'superscript') {
      button.classList.add('superscript-btn');
      button.title = 'Superscript';
    } else if (format === 'undo') {
      button.classList.add('undo-btn');
      button.title = 'Undo (Ctrl+Z)';
    } else if (format === 'redo') {
      button.classList.add('redo-btn');
      button.title = 'Redo (Ctrl+Y)';
    } else if (format === 'more') {
      button.classList.add('more-btn');
      button.title = 'More Options';
    }
    
    // Only emit event - no logic handling
    button.addEventListener('click', (e) => {
      e.preventDefault();
      this.emit('toolbar-click', { command: format, button });
    });

    // Store button reference
    this.buttons.set(format, button);
    container.appendChild(button);
    return button;
  }

  /**
   * Add color button with color picker
   */
  addColorButton(container) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rich-editor-toolbar-btn color-btn';
    button.dataset.command = 'color';
    button.innerHTML = '🎨';
    button.title = 'Text Color';
    
    // Create color picker
    const colorPicker = new ColorPicker({
      onColorSelect: (color) => {
        this.emit('toolbar-click', { command: 'color', button, value: color });
      }
    });
    
    // Toggle color picker on click
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      colorPicker.toggle(button);
    });

    // Store button and color picker references
    this.buttons.set('color', button);
    this.colorPickers.set('color', colorPicker);
    container.appendChild(button);
    return button;
  }

  /**
   * Add more button to toggle toolbar 2
   */
  addMoreButton(container) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rich-editor-toolbar-btn more-btn';
    button.dataset.command = 'more';
    button.innerHTML = '⋯';
    button.title = 'More Options';
    
    // Toggle toolbar 2 visibility
    button.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleToolbar2();
    });

    // Store button reference
    this.buttons.set('more', button);
    container.appendChild(button);
    return button;
  }

  /**
   * Toggle toolbar 2 visibility
   */
  toggleToolbar2() {
    this.toolbar2Visible = !this.toolbar2Visible;
    
    if (this.toolbar2Visible) {
      this.toolbar2.style.display = 'flex';
      this.toolbar2.style.borderTop = '1px solid #d1d5db';
    } else {
      this.toolbar2.style.display = 'none';
    }

    // Update more button appearance
    const moreButton = this.buttons.get('more');
    if (moreButton) {
      if (this.toolbar2Visible) {
        moreButton.classList.add('active');
        moreButton.title = 'Hide More Options';
      } else {
        moreButton.classList.remove('active');
        moreButton.title = 'More Options';
      }
    }
  }
  /**
   * Get toolbar container element
   */
  getContainer() {
    return this.container;
  }

  /**
   * Get button by command
   */
  getButton(command) {
    return this.buttons.get(command);
  }

  /**
   * Set button active state (called by external modules)
   */
  setButtonActive(command, isActive) {
    const button = this.buttons.get(command);
    if (button && button.classList) {
      if (isActive) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    }
  }

  /**
   * Set button disabled state (called by external modules)
   */
  setButtonDisabled(command, isDisabled) {
    const button = this.buttons.get(command);
    if (button) {
      button.disabled = isDisabled;
      button.style.opacity = isDisabled ? '0.5' : '1';
      button.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
    }
  }

  /**
   * Update button title (called by external modules)
   */
  setButtonTitle(command, title) {
    const button = this.buttons.get(command);
    if (button) {
      button.title = title;
    }
  }

  /**
   * Check if toolbar 2 is visible
   */
  isToolbar2Visible() {
    return this.toolbar2Visible;
  }

  /**
   * Show toolbar 2
   */
  showToolbar2() {
    if (!this.toolbar2Visible) {
      this.toggleToolbar2();
    }
  }

  /**
   * Hide toolbar 2
   */
  hideToolbar2() {
    if (this.toolbar2Visible) {
      this.toggleToolbar2();
    }
  }

  /**
   * Destroy toolbar
   */
  destroy() {
    // Destroy color pickers
    this.colorPickers.forEach(colorPicker => {
      colorPicker.destroy();
    });
    this.colorPickers.clear();
    
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.buttons.clear();
  }
}

export default Toolbar; 