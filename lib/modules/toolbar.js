import Module from '../core/module.js';
import ColorPicker from '../ui/color-picker.js';
import IconUtils from '../ui/icons.js';
import createCustomButton from '../ui/select-button.js';

/**
 * Toolbar Module - Pure UI component with dual toolbar support
 * Only handles toolbar creation and event emission
 * No business logic or state management
 */
class Toolbar extends Module {
  static DEFAULTS = {
    container: null,
    toolbar1: [
      { group: 'text-format', items: ['bold', 'italic', 'underline', 'strike'] },
      { group: 'script', items: ['subscript', 'superscript'] },
      { group: 'colors', items: ['color', 'background'] },
      { group: 'link', items: ['link'] },
      { group: 'structure', items: ['heading', 'text-size'] },
      { group: 'table', items: ['table'] },
      { group: 'alignment', items: ['text-align'] },
      { group: 'actions', items: ['undo', 'redo'] },
      { group: 'more', items: ['more'] }
    ],
    toolbar2: [
      { group: 'structure', items: ['list'] },
      { group: 'indent', items: ['indent-increase', 'indent-decrease'] },
      { group: 'font-family', items: ['font-family'] },
      { group: 'line-height', items: ['line-height'] },
      { group: 'capitalization', items: ['capitalization'] },
      { group: 'media', items: ['emoji', 'image', 'video'] },
      { group: 'content', items: ['tag'] },
      { group: 'view', items: ['code-view'] },

    ]
  };

  constructor(editor, options = {}) {
    super(editor, options);
    this.buttons = new Map();
    this.toolbar2Visible = false;
    this.events = new Map(); // Add event system
    
    
    // Handle toolbar configuration
    if (Array.isArray(options.toolbar)) {
      // If toolbar array is provided, use only those items - COMPLETELY OVERRIDE DEFAULTS
      this.options = {
        container: null,
        toolbar1: [
          { group: 'text-format', items: options.toolbar }
        ],
        toolbar2: []
      };
    } else if (options.toolbar1 || options.toolbar2) {
      // If specific toolbar1/toolbar2 config is provided, use it - COMPLETELY OVERRIDE DEFAULTS
      this.options = {
        container: null,
        toolbar1: options.toolbar1 || [],
        toolbar2: options.toolbar2 || []
      };
    } else {
      // Use full default configuration
      this.options = { ...Toolbar.DEFAULTS, ...options };
    }
    
    
    this.init();
    this.preloadIcons();
  }

  init() {
    this.container = this.createToolbarContainer();
  }

  /**
   * Preload icons for better performance
   */
  async preloadIcons() {
    // Icons are now inline, no need to preload
    // This method is kept for backward compatibility
  }

  /**
   * Create main toolbar container with both toolbars
   */
  createToolbarContainer() {
    const container = document.createElement('div');
    container.className = 'rich-editor-toolbar-container';

    // Prevent toolbar from taking focus away from editor
    this.editor.preventFocusLoss(container);

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

    // Create button groups based on toolbar config
    if (Array.isArray(toolbarItems)) {
      toolbarItems.forEach(group => {
        if (group && group.group && Array.isArray(group.items)) {
          // Create group container
          const groupContainer = document.createElement('div');
          groupContainer.className = `toolbar-group toolbar-group-${group.group}`;
          
          // Add buttons to group
          group.items.forEach(item => {
            if (typeof item === 'string') {
              this.addButton(groupContainer, item);
            }
          });
          
          toolbar.appendChild(groupContainer);
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

    // Custom buttons with dropdowns
    const customButtons = {
      'heading': { text: 'Paragraph', width: '110px', title: 'Format (Headings & Paragraphs)' },
      'font-family': { text: 'Arial', width: '150px', title: 'Font Family' },
      'line-height': { text: '1.15', width: '100px', title: 'Line Height' },
      'capitalization': { text: 'Aa', width: '130px', title: 'Text Capitalization' },
      'text-size': { text: '14px', width: '100px', title: 'Text Size' }
    };

    if (customButtons[format]) {
      const config = customButtons[format];
      const customButton = createCustomButton(config.text, { width: config.width });
      customButton.dataset.command = format;
      customButton.classList.add('rich-editor-toolbar-btn', `${format}-btn`);
      customButton.title = config.title;
      
      customButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.emit('toolbar-click', { command: format, button: customButton });
        // Maintain editor focus after button click
        setTimeout(() => {
          this.editor.focus();
        }, 0);
      });

      this.buttons.set(format, customButton);
      container.appendChild(customButton);
      return customButton;
    }

    // Icon buttons with popups
    const iconButtons = {
      'text-align': { icon: 'align-left', title: 'Align Left' },
      'list': { icon: 'list', title: 'List' }
    };

    if (iconButtons[format]) {
      const config = iconButtons[format];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `rich-editor-toolbar-btn ${format}-btn`;
      button.dataset.command = format;
      button.title = config.title;
      
      const svgContent = IconUtils.getIcon(config.icon);
      if (svgContent) {
        button.innerHTML = `<span class="icon">${svgContent}</span>`;
      } else {
        button.textContent = format === 'text-align' ? '≡' : '•';
      }
      
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.emit('toolbar-click', { command: format, button: button });
        // Maintain editor focus after button click
        setTimeout(() => {
          this.editor.focus();
        }, 0);
      });

      this.buttons.set(format, button);
      container.appendChild(button);
      return button;
    }

    // Regular icon buttons
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `rich-editor-toolbar-btn ${format}-btn`;
    button.dataset.command = format;
    
    // Add icon
    const iconElement = IconUtils.createIconElement(format, {
      width: '16px',
      height: '16px'
    });
    button.appendChild(iconElement);
    
    // Set title based on format
    const titles = {
      'bold': 'Bold (Ctrl+B)',
      'italic': 'Italic (Ctrl+I)',
      'underline': 'Underline (Ctrl+U)',
      'strike': 'Strikethrough',
      'subscript': 'Subscript',
      'superscript': 'Superscript',
      'color': 'Text Color',
      'background': 'Background Color',
      'link': 'Insert/Edit Link',
      'table': 'Insert Table',
      'undo': 'Undo (Ctrl+Z)',
      'redo': 'Redo (Ctrl+Y)',
      'indent-increase': 'Increase Indent',
      'indent-decrease': 'Decrease Indent',
      'emoji': 'Insert Emoji',
      'image': 'Insert Image',
      'video': 'Insert Video',
      'tag': 'Insert Tag',

      'import': 'Import Files',
      'code-view': 'View HTML Source',

    };
    
    button.title = titles[format] || format;
    
    // Add fallback for code-view
    if (format === 'code-view') {
      setTimeout(() => {
        if (!iconElement.innerHTML.trim()) {
          iconElement.innerHTML = '&lt;/&gt;';
          iconElement.style.fontSize = '12px';
          iconElement.style.fontWeight = 'bold';
        }
      }, 1000);
    }
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      this.emit('toolbar-click', { command: format, button });
      // Maintain editor focus after button click
      setTimeout(() => {
        this.editor.focus();
      }, 0);
    });

    this.buttons.set(format, button);
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
    
    const iconElement = IconUtils.createIconElement('more', {
      width: '16px',
      height: '16px'
    });
    button.appendChild(iconElement);
    button.title = 'More Options';
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleToolbar2();
      // Maintain editor focus after button click
      setTimeout(() => {
        this.editor.focus();
      }, 0);
    });

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
   * Set button active state
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
   * Set button disabled state
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
   * Set button title
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
   * Event system methods
   */
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
  }

  emit(event, data) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in toolbar event ${event}:`, error);
        }
      });
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
    this.events.clear();
  }
}

export default Toolbar; 