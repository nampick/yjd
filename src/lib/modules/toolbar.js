import Module from '../core/module.js';

/**
 * Toolbar Module - Pure UI component
 * Only handles toolbar creation and event emission
 * No business logic or state management
 */
class Toolbar extends Module {
  static DEFAULTS = {
    container: null,
    toolbar: ['heading', 'bold', 'italic', 'underline', 'strike', 'subscript', 'superscript', 'color', 'background', 'link', 'image', 'font-size', 'align', 'table', 'undo', 'redo']
  };

  constructor(editor, options = {}) {
    super(editor, options);
    this.buttons = new Map();
    
    this.init();
  }

  init() {
    this.container = this.createToolbar();
  }

  /**
   * Create toolbar element
   */
  createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'rich-editor-toolbar';

    // Create buttons based on toolbar config
    if (Array.isArray(this.options.toolbar)) {
      this.options.toolbar.forEach(item => {
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
    // Special handling for UI selectors
    if (format === 'align') {
      return this.addAlignSelector(container);
    }
    
    if (format === 'heading') {
      return this.addHeadingSelector(container);
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
      'background': '🖍️',
      'link': '🔗',
      'image': '🖼️',
      'table': '⊞',
      'undo': '↶',
      'redo': '↷'
    };
    
    button.innerHTML = icons[format] || format;
    
    // Add special classes and titles
    if (format === 'table') {
      button.classList.add('table-btn');
    } else if (format === 'link') {
      button.classList.add('link-btn');
      button.title = 'Add/Edit Link';
    } else if (format === 'image') {
      button.classList.add('image-btn');
      button.title = 'Insert Image';
    } else if (format === 'subscript') {
      button.classList.add('subscript-btn');
      button.title = 'Subscript';
    } else if (format === 'superscript') {
      button.classList.add('superscript-btn');
      button.title = 'Superscript';
    } else if (format === 'color') {
      button.classList.add('color-btn');
      button.title = 'Text Color';
    } else if (format === 'background') {
      button.classList.add('background-btn');
      button.title = 'Background Color';
    } else if (format === 'undo') {
      button.classList.add('undo-btn');
      button.title = 'Undo (Ctrl+Z)';
    } else if (format === 'redo') {
      button.classList.add('redo-btn');
      button.title = 'Redo (Ctrl+Y)';
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
   * Add alignment selector to toolbar
   */
  addAlignSelector(container) {
    const AlignSelectorClass = this.editor.registry.get('ui/align-selector');
    
    if (AlignSelectorClass) {
      try {
        const alignSelector = new AlignSelectorClass(this.editor);
        const triggerButton = alignSelector.getTriggerButton();
        
        // Store reference
        this.buttons.set('align', triggerButton);
        container.appendChild(triggerButton);
        return triggerButton;
      } catch (error) {
        console.error('Error creating AlignSelector:', error);
        return null;
      }
    } else {
      console.warn('AlignSelector class not found in registry');
      return null;
    }
  }

  /**
   * Add heading selector to toolbar
   */
  addHeadingSelector(container) {
    const HeadingSelectorClass = this.editor.registry.get('ui/heading-selector');
    
    if (HeadingSelectorClass) {
      try {
        const headingSelector = new HeadingSelectorClass(this.editor);
        const triggerButton = headingSelector.getTriggerButton();
        
        // Store reference
        this.buttons.set('heading', triggerButton);
        container.appendChild(triggerButton);
        return triggerButton;
      } catch (error) {
        console.error('Error creating HeadingSelector:', error);
        return null;
      }
    } else {
      console.warn('HeadingSelector class not found in registry');
      return null;
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
   * Destroy toolbar
   */
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.buttons.clear();
  }
}

export default Toolbar; 