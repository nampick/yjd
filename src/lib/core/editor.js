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
    const defaultModules = ['toolbar', 'history', 'block-toolbar'];
    
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
        
        console.log(`✅ Module '${moduleName}' loaded successfully`);
      } else {
        console.warn(`❌ Module '${moduleName}' not found in registry`);
      }
    });
  }

  /**
   * Load and initialize formats
   */
  loadFormats() {
    // Load default formats
    const defaultFormats = [
      'bold', 'italic', 'underline', 'strike', 
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
    
    this.modules.forEach(module => {
      if (typeof module.onSelectionChange === 'function') {
        module.onSelectionChange(range);
      }
    });
    
    // Update toolbar button states
    this.updateToolbarButtonStates();
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
  }

  /**
   * Handle toolbar button clicks
   */
  handleToolbarClick(data) {
    const { command, button, value } = data;
    
    console.log(`Toolbar command: ${command}`, value ? `with value: ${value}` : '');
    
    // Handle different commands
    switch (command) {
      case 'bold':
      case 'italic':  
      case 'underline':
      case 'strike':
      case 'subscript':
      case 'superscript':
        this.toggleFormat(command);
        break;
      case 'color':
        this.applyColorFormat(value || '#000000');
        break;
      case 'undo':
        this.undo();
        break;
      case 'redo':
        this.redo();
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
      'superscript': 'superscript'
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
    
    const formats = ['bold', 'italic', 'underline', 'strike', 'subscript', 'superscript'];
    
    formats.forEach(formatName => {
      const FormatClass = this.registry.get(`formats/${formatName}`);
      if (FormatClass) {
        const formatInstance = new FormatClass();
        const isActive = formatInstance.isActive();
        toolbar.setButtonActive(formatName, isActive);
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
   * Apply color formatting to selected text
   * @param {string} color - Color value to apply
   */
  applyColorFormat(color) {
    const colorFormat = this.registry.get('formats/color');
    if (colorFormat) {
      const format = new colorFormat(this);
      format.apply(color);
    } else {
      console.warn('Color format not found in registry');
    }
  }
} 