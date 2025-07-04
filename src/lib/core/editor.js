import registry from './registry.js';
import Module from './module.js';

/**
 * Main Editor class - Inspired by Quill's architecture
 * This replaces the monolithic EditorCore class
 */
export default class Editor {
  static DEFAULTS = {
    toolbar: ['bold', 'italic', 'underline', 'strike'],
    placeholder: 'Type here...',
    theme: 'light',
    height: 400,
    width: 800,
    maxWidth: 1200,
    maxHeight: 800,
    features: {
      emoji: true,
      image: true,
      table: true,
      wordCount: true,
      breadcrumb: true
    }
  };

  constructor(selector, options = {}) {
    this.options = { ...Editor.DEFAULTS, ...options };
    this.root = typeof selector === 'string' ? document.querySelector(selector) : selector;
    this.modules = new Map();
    this.formats = new Map();
    this.registry = registry;
    this.events = new Map(); // Add event system
    
    // State management
    this.toolbarBtns = {};
    this.statusbarEls = {};
    this.dropdownMenus = {};
    
    this.init();
  }

  /**
   * Initialize editor
   */
  init() {
    this.createStructure();
    this.loadModules();
    this.loadFormats();
    this.setupEventListeners();
    this.updateStatusbar();
  }

  /**
   * Create basic DOM structure - extracted from EditorCore.init()
   * TODO: Copy implementation from EditorCore.init()
   */
  createStructure() {
    // Create wrapper
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'rich-editor-wrapper';
    
    // Apply dynamic sizing
    this.wrapper.style.width = this.options.width + 'px';
    this.wrapper.style.maxWidth = this.options.maxWidth + 'px';
    this.wrapper.style.minHeight = this.options.height + 'px';
    this.wrapper.style.maxHeight = this.options.maxHeight + 'px';

    // Create editor area
    this.editor = document.createElement('div');
    this.editor.className = 'rich-editor-area';
    this.editor.contentEditable = true;
    this.editor.setAttribute('placeholder', this.options.placeholder);
    
    // Force browser to create <p> tags instead of <div> when pressing Enter
    try {
      document.execCommand('defaultParagraphSeparator', false, 'p');
    } catch (e) {
      console.warn('Could not set defaultParagraphSeparator:', e);
    }
    
    // Add default content
    this.editor.innerHTML = this.getDefaultContent();
    
    this.wrapper.appendChild(this.editor);

    // Create statusbar if needed
    if (this.options.features.wordCount || this.options.features.breadcrumb) {
      this.createStatusbar();
    }

    // Add wrapper to root
    this.root.appendChild(this.wrapper);
  }

  /**
   * Get default content - extracted from EditorCore
   * TODO: Copy from EditorCore.defaultContent
   */
  getDefaultContent() {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2c3e50; margin-bottom: 20px;">Welcome to Rich Editor</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #34495e;">
          Start typing to create your content...
        </p>
        <b>Bold</b>
        <i>Italic</i>
        <u>Underline</u>
        <s>Strike</s>
        <u>Underline</u>
      </div>
    `;
  }

  /**
   * Create statusbar - extracted from EditorCore
   * TODO: Copy implementation from EditorCore.init()
   */
  createStatusbar() {
    this.statusbar = document.createElement('div');
    this.statusbar.className = 'rich-editor-statusbar';

    // Create breadcrumb and word count elements
    this.statusbarEls.breadcrumb = document.createElement('span');
    this.statusbarEls.breadcrumb.className = 'rich-editor-breadcrumb';

    this.statusbarEls.wordcount = document.createElement('span');
    this.statusbarEls.wordcount.className = 'wordcount';

    this.statusbar.appendChild(this.statusbarEls.breadcrumb);
    this.statusbar.appendChild(this.statusbarEls.wordcount);
    this.wrapper.appendChild(this.statusbar);
  }

  /**
   * Load and initialize modules
   */
  loadModules() {
    // Load default modules
    const defaultModules = ['toolbar', 'history', 'block-toolbar', 'table-toolbar', 'code-view', 'theme-switcher', 'resize-handles'];
    
    defaultModules.forEach(moduleName => {
      const ModuleClass = this.registry.get(`modules/${moduleName}`);
      if (ModuleClass) {
        const moduleOptions = this.options[moduleName] || this.options;
        const moduleInstance = new ModuleClass(this, moduleOptions);
        this.modules.set(moduleName, moduleInstance);
        
        // Insert toolbar before editor
        if (moduleName === 'toolbar' && moduleInstance.getContainer) {
          const toolbarContainer = moduleInstance.getContainer();
          this.wrapper.insertBefore(toolbarContainer, this.editor);
          
          // Listen for toolbar events
          moduleInstance.on('toolbar-click', (data) => {
            this.handleToolbarClick(data);
          });
        }
        
      } else {
      }
    });
  }

  /**
   * Load and initialize formats
   */
  loadFormats() {
    // Load default formats
    const defaultFormats = [
      'bold', 'italic', 'underline', 'strike', 'subscript', 'superscript',
      'color', 'background', 'text-align', 'link',
      'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
      'paragraph', 'pre'
    ];
    
    defaultFormats.forEach(formatName => {
      const FormatClass = this.registry.get(`formats/${formatName}`);
      if (FormatClass) {
        this.formats.set(formatName, FormatClass);
      }
    });
  }

  /**
   * Setup event listeners - extracted from EditorCore
   * TODO: Copy implementation from EditorCore.bindEvents()
   */
  setupEventListeners() {
    // Basic input event
    this.editor.addEventListener('input', () => {
      this.updateStatusbar();
      this.onContentChange();
    });

    // Selection change event
    document.addEventListener('selectionchange', () => {
      if (document.activeElement === this.editor || this.editor.contains(document.activeElement)) {
        this.onSelectionChange();
      }
    });

    // Image click event for selection
    this.editor.addEventListener('click', (e) => {
      if (e.target.tagName === 'IMG') {
        const ImageFormat = this.registry.get('formats/image');
        if (ImageFormat) {
          ImageFormat.selectImage(e.target);
        }
      }
    });

    // Image context menu (right-click)
    this.editor.addEventListener('contextmenu', (e) => {
      if (e.target.tagName === 'IMG') {
        const ImageFormat = this.registry.get('formats/image');
        if (ImageFormat) {
          ImageFormat.showImageMenu(e.target, e);
        }
      }
    });

    // Focus editor on load
    setTimeout(() => {
      this.focus();
    }, 100);
  }

  /**
   * Handle content changes
   */
  onContentChange() {
    this.modules.forEach(module => {
      if (typeof module.onContentChange === 'function') {
        module.onContentChange();
      }
    });
  }

  /**
   * Handle selection changes
   */
  onSelectionChange() {
    const selection = window.getSelection();
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    
    // Check if selection is within rich-editor-area
    const isInEditableArea = this.isSelectionInEditableArea(selection);
    
    // Update all modules with selection info
    this.modules.forEach(module => {
      if (typeof module.onSelectionChange === 'function') {
        module.onSelectionChange(range, isInEditableArea);
      }
    });
    
    // Update toolbar button states
    this.updateToolbarButtonStates();
    
    // Update toolbar buttons accessibility
    this.updateToolbarAccessibility(isInEditableArea);
    
    // Update statusbar when selection changes
    this.updateStatusbar();
  }

  /**
   * Check if current selection is within the rich-editor-area
   */
  isSelectionInEditableArea(selection) {
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;
    
    // Check if both start and end containers are within rich-editor-area
    const startInEditor = this.isNodeInEditableArea(startContainer);
    const endInEditor = this.isNodeInEditableArea(endContainer);
    
    return startInEditor && endInEditor;
  }

  /**
   * Check if a node is within the rich-editor-area
   */
  isNodeInEditableArea(node) {
    if (!node) return false;
    
    // Traverse up the DOM tree to find rich-editor-area
    let currentNode = node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
    
    while (currentNode && currentNode !== document.body) {
      if (currentNode === this.editor || 
          (currentNode.classList && currentNode.classList.contains('rich-editor-area'))) {
        return true;
      }
      currentNode = currentNode.parentNode;
    }
    
    return false;
  }

  /**
   * Update toolbar accessibility based on selection location
   */
  updateToolbarAccessibility(isInEditableArea) {
    const toolbar = this.getModule('toolbar');
    if (!toolbar) return;
    
    // List of commands that should be disabled when outside editable area
    // Note: undo/redo are NOT in this list - they should always work
    const editingCommands = [
      'bold', 'italic', 'underline', 'strike', 'subscript', 'superscript',
      'color', 'background', 'link', 'table', 'heading', 'text-size', 
      'font-family', 'line-height', 'capitalization', 'text-align', 'list',
      'indent-increase', 'indent-decrease'
    ];
    
    editingCommands.forEach(command => {
      toolbar.setButtonDisabled(command, !isInEditableArea);
    });
    
    // These commands should always be enabled regardless of selection location
    const alwaysEnabledCommands = ['more', 'undo', 'redo', 'code-view', 'theme'];
    alwaysEnabledCommands.forEach(command => {
      toolbar.setButtonDisabled(command, false);
    });
  }

  /**
   * Update statusbar - extracted from EditorCore
   * TODO: Copy implementation from EditorCore.updateStatusbar()
   */
  updateStatusbar() {
    if (!this.statusbar) return;

    const sel = window.getSelection();
    if (!sel) return;

    // Update breadcrumb
    if (this.statusbarEls.breadcrumb && this.options.features.breadcrumb) {
      const currentNode = sel.anchorNode;
      const path = [];
      let element = currentNode?.nodeType === 3 ? currentNode.parentElement : currentNode;
      
      while (element && element !== this.editor && element !== document.body) {
        if (element.tagName) {
          let tagInfo = element.tagName.toLowerCase();
          if (element.className && typeof element.className === 'string') {
            const classes = element.className.trim();
            if (classes) {
              tagInfo += '.' + classes.split(' ').join('.');
            }
          }
          if (element.id) {
            tagInfo += '#' + element.id;
          }
          path.unshift(tagInfo);
        }
        element = element.parentElement;
      }
      
      this.statusbarEls.breadcrumb.textContent = path.length > 0 ? path.join(' > ') : 'editor';
    }

    // Update word count
    if (this.statusbarEls.wordcount && this.options.features.wordCount) {
      const text = this.editor.textContent || '';
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      const charsNoSpaces = text.replace(/\s/g, '').length;
      
      this.statusbarEls.wordcount.textContent = `${words} words, ${chars} chars (${charsNoSpaces} no spaces)`;
    }
  }

  /**
   * Focus editor
   */
  focus() {
    if (this.editor) {
      this.editor.focus();
    }
  }

  /**
   * Get editor content
   */
  getContent() {
    return this.editor.innerHTML;
  }

  /**
   * Set editor content
   */
  setContent(html) {
    this.editor.innerHTML = html;
    this.onContentChange();
  }

  /**
   * Get module instance
   */
  getModule(name) {
    return this.modules.get(name);
  }

  /**
   * Get format class
   */
  getFormat(name) {
    return this.formats.get(name);
  }

  /**
   * Register new items
   */
  register(path, definition, suppressWarning = false) {
    this.registry.register(path, definition, suppressWarning);
  }

  /**
   * Destroy editor
   */
  destroy() {
    // Destroy all modules
    this.modules.forEach(module => {
      if (typeof module.destroy === 'function') {
        module.destroy();
      }
    });

    // Remove DOM elements
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }

    // Clear references
    this.modules.clear();
    this.formats.clear();
    this.events.clear(); // Clear events
  }

  /**
   * Handle toolbar button clicks
   */
  handleToolbarClick(data) {
    const { command, button, value } = data;
    
    
    // Emit toolbar-click event for modules to listen
    this.emit('toolbar-click', data);
    
    // Commands that should always work regardless of selection location
    const alwaysAllowedCommands = ['more', 'undo', 'redo', 'code-view', 'theme'];
    
    if (alwaysAllowedCommands.includes(command)) {
      // These commands can execute regardless of selection location
      switch (command) {
        case 'more':
          // More command is handled by toolbar module itself
          return;
        case 'undo':
          this.undo();
          return;
        case 'redo':
          this.redo();
          return;
        case 'code-view':
          // Code view command is handled by CodeView module itself
          // The module listens to 'toolbar-click' events and handles it internally
          return;
        case 'theme':
          // Theme command is handled by ThemeSwitcher module itself
          // The module listens to 'toolbar-click' events and handles it internally
          return;
      }
    }
    
    // For all other commands, check if current selection is in editable area
    const selection = window.getSelection();
    const isInEditableArea = this.isSelectionInEditableArea(selection);
    
    if (!isInEditableArea) {
      console.warn(`Command '${command}' blocked: Selection outside editable area`);
      return;
    }
    
    // Handle formatting commands (only when selection is in editable area)
    switch (command) {
      case 'bold':
      case 'italic':  
      case 'underline':
      case 'strike':
      case 'subscript':
      case 'superscript':
      case 'color':
      case 'background':
      case 'link':
      case 'table':
      case 'heading':
      case 'text-size':
      case 'font-family':
      case 'line-height':
      case 'capitalization':
      case 'text-align':
      case 'list':
      case 'indent-increase':
      case 'indent-decrease':
      case 'emoji':
      case 'image':
      case 'video':
      case 'tag':
      case 'template':
      case 'import':
        this.toggleFormat(command);
        break;
      default:
        console.warn(`Unknown command: ${command}`);
    }
  }

  /**
   * Toggle format on current selection
   */
  toggleFormat(formatName) {
    // Map format names to registry keys
    const formatMap = {
      'bold': 'bold',
      'italic': 'italic', 
      'underline': 'underline',
      'strike': 'strike',
      'subscript': 'subscript',
      'superscript': 'superscript',
      'color': 'color',
      'background': 'background',
      'link': 'link',
      'table': 'table',
      'heading': 'heading',
      'text-size': 'text-size',
      'font-family': 'font-family',
      'line-height': 'line-height',
      'capitalization': 'capitalization',
      'text-align': 'text-align',
      'list': 'list',
      'indent-increase': 'indent-increase',
      'indent-decrease': 'indent-decrease',
      'emoji': 'emoji',
      'image': 'image',
      'video': 'video',
      'tag': 'tag',
      'template': 'template',
      'import': 'import'
    };
    
    const registryKey = formatMap[formatName];
    if (!registryKey) {
      console.warn(`Unknown format: ${formatName}`);
      return;
    }
    
    const FormatClass = this.registry.get(`formats/${registryKey}`);
    if (!FormatClass) {
      console.warn(`Format class not found: formats/${registryKey}`);
      return;
    }
    
    // Create format instance and toggle
    const formatInstance = new FormatClass();
    formatInstance.toggle();
    
    // Update button state
    this.updateToolbarButtonStates();
  }

  /**
   * Update toolbar button states based on current selection
   */
  updateToolbarButtonStates() {
    const toolbar = this.getModule('toolbar');
    if (!toolbar) return;
    
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    
    // Check if selection is in editable area
    const isInEditableArea = this.isSelectionInEditableArea(selection);
    
    const formats = ['heading', 'text-size', 'font-family', 'line-height', 'capitalization', 'text-align', 'list', 'indent-increase', 'indent-decrease', 'bold', 'italic', 'underline', 'strike', 'subscript', 'superscript', 'color', 'background', 'link', 'table'];
    
    formats.forEach(formatName => {
      // Only check format state if selection is in editable area
      if (isInEditableArea) {
        const FormatClass = this.registry.get(`formats/${formatName}`);
        if (FormatClass) {
          const formatInstance = new FormatClass();
          const isActive = formatInstance.isActive();
          toolbar.setButtonActive(formatName, isActive);
          
          // Special handling for line-height: update button text
          if (formatName === 'line-height' && typeof formatInstance.updateButtonText === 'function') {
            formatInstance.updateButtonText();
          }
        }
      } else {
        // Clear active state for buttons when outside editable area
        toolbar.setButtonActive(formatName, false);
      }
    });
  }

  /**
   * Undo last action
   */
  undo() {
    const history = this.getModule('history');
    if (history && typeof history.undo === 'function') {
      history.undo();
    } else {
      document.execCommand('undo');
    }
  }

  /**
   * Redo last undone action
   */
  redo() {
    const history = this.getModule('history');
    if (history && typeof history.redo === 'function') {
      history.redo();
    } else {
      document.execCommand('redo');
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {function} handler - Event handler
   */
  on(event, handler) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(handler);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {function} handler - Event handler
   */
  off(event, handler) {
    if (this.events.has(event)) {
      const handlers = this.events.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.events.has(event)) {
      this.events.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }
} 