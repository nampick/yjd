import registry from './registry.js';
import Module from './module.js';

/**
 * Main Editor class - Inspired by Quill's architecture
 * This replaces the monolithic EditorCore class
 */
export default class Editor {
  static DEFAULTS = {
    placeholder: 'Start typing...',
    theme: 'light',
    height: 400,
    width: 800,
    maxWidth: 1200,
    maxHeight: 800,
    content: null, // Default content for the editor
    features: {
      emoji: true,
      image: true,
      table: true,
      wordCount: true,
      breadcrumb: true
    }
  };

  // Static reference to current editor instance
  static currentInstance = null;
  // Static map to track all editor instances
  static instances = new Map();

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
    
    // Popup management - each editor has its own popup instances
    this.popupInstances = new Map();
    
    // Set as current instance
    Editor.currentInstance = this;
    
    // Register this instance
    const instanceId = this.generateInstanceId();
    this.instanceId = instanceId;
    Editor.instances.set(instanceId, this);
        
    this.init();
  }

  /**
   * Generate unique instance ID
   */
  generateInstanceId() {
    return 'editor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
    this.wrapper.className = 'yjd-rich-editor';
    
    // Apply dynamic sizing
    this.wrapper.style.width = this.options.width + 'px';
    this.wrapper.style.maxWidth = this.options.maxWidth + 'px';
    this.wrapper.style.minHeight = this.options.height + 'px';
    this.wrapper.style.maxHeight = this.options.maxHeight + 'px';
    
    // Set position relative for popup positioning
    this.wrapper.style.position = 'relative';

    // Create editor area
    this.editor = document.createElement('div');
    this.editor.className = 'rich-editor-area';
    this.editor.contentEditable = true;
    this.editor.setAttribute('data-placeholder', this.options.placeholder);
    
    // Force browser to create <p> tags instead of <div> when pressing Enter
    try {
      document.execCommand('defaultParagraphSeparator', false, 'p');
    } catch (e) {
      console.warn('Could not set defaultParagraphSeparator:', e);
    }
    
    // Add default content
    this.editor.innerHTML = this.getDefaultContent();
    
    this.wrapper.appendChild(this.editor);

    // Create popup container
    this.popupContainer = document.createElement('div');
    this.popupContainer.className = 'rich-editor-popup-container';
    this.popupContainer.style.position = 'absolute';
    this.popupContainer.style.top = '0';
    this.popupContainer.style.left = '0';
    this.popupContainer.style.width = '100%';
    this.popupContainer.style.height = '100%';
    this.popupContainer.style.pointerEvents = 'none';
    this.popupContainer.style.zIndex = '1000';
    this.wrapper.appendChild(this.popupContainer);

    // Create statusbar if needed
    if (this.options.features.wordCount || this.options.features.breadcrumb) {
      this.createStatusbar();
    }

    // Add wrapper to root
    this.root.appendChild(this.wrapper);
    
    // Initialize placeholder visibility
    this.updatePlaceholderVisibility();
  }

  /**
   * Check if content is HTML or plain text
   * @param {string} content - Content to check
   * @returns {boolean} True if content appears to be HTML
   */
  isHtmlContent(content) {
    if (!content || typeof content !== 'string') {
      return false;
    }
    
    // Trim whitespace for checking
    const trimmed = content.trim();
    
    // Check for common HTML patterns
    const htmlPatterns = [
      /<[^>]+>/, // Contains HTML tags
      /&[a-zA-Z]+;/, // Contains HTML entities
      /&#\d+;/, // Contains numeric HTML entities
    ];
    
    return htmlPatterns.some(pattern => pattern.test(trimmed));
  }

  /**
   * Wrap plain text content in a paragraph tag
   * @param {string} content - Content to wrap
   * @returns {string} Wrapped content
   */
  wrapTextInParagraph(content) {
    if (!content || typeof content !== 'string') {
      return '<p><br></p>';
    }
    
    const trimmed = content.trim();
    
    // If content is already HTML, return as is
    if (this.isHtmlContent(trimmed)) {
      return trimmed;
    }
    
    // If content is empty, return empty paragraph
    if (trimmed === '') {
      return '<p><br></p>';
    }
    
    // Wrap plain text in paragraph tag
    return `<p>${trimmed}</p>`;
  }

  /**
   * Get default content for editor
   */
  getDefaultContent() {
    // If custom content is provided in options, use it
    if (this.options.content) {
      return this.wrapTextInParagraph(this.options.content);
    }
    
    // Return completely empty content to show placeholder
    return '';
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
    // Determine which modules to load
    let modulesToLoad;
    
    // Check if user provided toolbar configuration
    const hasToolbarConfig = this.options.toolbar || this.options.toolbar1 || this.options.toolbar2;
    
    if (hasToolbarConfig) {
      // User wants custom toolbar - load only basic modules
      modulesToLoad = this.options.modules || ['toolbar', 'history'];
    } else {
      // No toolbar config - load full feature set
      modulesToLoad = this.options.modules || ['toolbar', 'history', 'block-toolbar', 'table-toolbar', 'code-view', 'theme-switcher', 'resize-handles'];
    }
    
    
    modulesToLoad.forEach(moduleName => {
      const ModuleClass = this.registry.get(`modules/${moduleName}`);
      if (ModuleClass) {
        // For toolbar module, pass all options so it can detect toolbar config
        const moduleOptions = moduleName === 'toolbar' ? this.options : (this.options[moduleName] || this.options);
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
    // Determine which formats to load
    let formatsToLoad;
    
    // Check if user provided toolbar configuration
    const hasToolbarConfig = this.options.toolbar || this.options.toolbar1 || this.options.toolbar2;
    
    if (hasToolbarConfig) {
      // User wants custom toolbar - load only basic formats
      formatsToLoad = this.options.formats || ['bold', 'italic', 'underline', 'strike'];
    } else {
      // No toolbar config - load full feature set
      formatsToLoad = this.options.formats || [
        'bold', 'italic', 'underline', 'strike', 'subscript', 'superscript',
        'color', 'background', 'text-align', 'text-size', 'link',
        'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
        'paragraph', 'pre'
      ];
    }
    
    
    formatsToLoad.forEach(formatName => {
      const FormatClass = this.registry.get(`formats/${formatName}`);
      if (FormatClass) {
        this.formats.set(formatName, FormatClass);
      } else {
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
      // Check if editor is empty and create a paragraph element if needed
      this.ensureEditorHasContent();
      
      // Update placeholder visibility
      this.updatePlaceholderVisibility();
      
      this.updateStatusbar();
      this.onContentChange();
    });

    // Selection change event
    document.addEventListener('selectionchange', () => {
      if (document.activeElement === this.editor || this.editor.contains(document.activeElement)) {
        this.onSelectionChange();
      }
    });

    // Mouse up event to update text-size button when clicking/moving cursor
    this.editor.addEventListener('mouseup', () => {
      // Small delay to ensure selection is updated
      setTimeout(() => {
        this.onSelectionChange();
      }, 10);
    });

    // Image click event for selection
    this.editor.addEventListener('click', (e) => {
      // Handle link clicks - open in new tab
      // if (e.target.tagName === 'A' && e.target.href) {
      //   e.preventDefault();
      //   window.open(e.target.href, '_blank', 'noopener,noreferrer');
      // }
      
      // Ensure there's always a paragraph element for editing when clicking
      setTimeout(() => {
        this.ensureEditorHasContent();
      }, 0);
    });

    // Image context menu (right-click)
    this.editor.addEventListener('contextmenu', (e) => {
      // Image context menu functionality removed - methods don't exist
    });

    // Handle keydown events to ensure content structure
    this.editor.addEventListener('keydown', (e) => {
      // Check for delete/backspace operations that might empty the editor
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Use setTimeout to check after the deletion occurs
        setTimeout(() => {
          this.ensureEditorHasContent();
          this.updatePlaceholderVisibility();
        }, 0);
      }
    });

    // Handle paste events
    this.editor.addEventListener('paste', () => {
      // Check content after paste operation
      setTimeout(() => {
        this.ensureEditorHasContent();
        this.updatePlaceholderVisibility();
      }, 0);
    });

    // Handle drop events (drag and drop)
    this.editor.addEventListener('drop', () => {
      // Check content after drop operation
      setTimeout(() => {
        this.ensureEditorHasContent();
        this.updatePlaceholderVisibility();
      }, 0);
    });

    // Handle cut events
    this.editor.addEventListener('cut', () => {
      // Check content after cut operation
      setTimeout(() => {
        this.ensureEditorHasContent();
        this.updatePlaceholderVisibility();
      }, 0);
    });

    // Focus editor on load
    setTimeout(() => {
      // Ensure editor has proper content structure on load
      this.ensureEditorHasContent();
      this.updatePlaceholderVisibility();
      this.focus();
    }, 100);

    // Handle focus events to ensure content structure
    this.editor.addEventListener('focus', () => {
      // Ensure there's always a paragraph element for editing when focusing
      setTimeout(() => {
        this.ensureEditorHasContent();
        this.updatePlaceholderVisibility();
      }, 0);
    });
  }

  /**
   * Handle content changes
   */
  onContentChange() {
    // Check if editor is empty and create a paragraph element if needed
    this.ensureEditorHasContent();
    
    this.modules.forEach(module => {
      if (typeof module.onContentChange === 'function') {
        module.onContentChange();
      }
    });
    
    // Get current content
    const content = this.getContent();
    
    // Call onChange callback if provided
    if (this.options.onChange && typeof this.options.onChange === 'function') {
      this.options.onChange(content);
    }
    
    // Emit text-change event
    this.emit('text-change', content);
  }

  /**
   * Ensure editor always has a paragraph element for editing
   * This prevents users from editing directly in the editor container
   */
  ensureEditorHasContent() {
    // Check if editor is empty or only contains whitespace/empty elements
    const isEmpty = this.isEditorEmpty();
    
    if (isEmpty) {
      // Create a new paragraph element
      const paragraph = document.createElement('p');
      paragraph.innerHTML = '<br>';
      
      // Clear editor and add the paragraph
      this.editor.innerHTML = '';
      this.editor.appendChild(paragraph);
      
      // Set cursor position to the paragraph
      this.setCursorToElement(paragraph);
      
      // Focus the editor
      this.editor.focus();
    } else {
      // Check if we need to ensure there's always a paragraph element for editing
      //this.ensureParagraphForEditing();
    }
  }

  /**
   * Ensure there's always a paragraph element available for editing
   * This prevents users from editing directly in the editor container
   */
  ensureParagraphForEditing() {
    const children = this.editor.children;
    
    // If editor has no children, create a paragraph
    if (children.length === 0) {
      const paragraph = document.createElement('p');
      paragraph.innerHTML = '<br>';
      this.editor.appendChild(paragraph);
      this.setCursorToElement(paragraph);
      return;
    }
    
    // Check if the last child is a block element that can contain text
    const lastChild = children[children.length - 1];
    const blockTags = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'ARTICLE', 'SECTION', 'MAIN', 'ASIDE'];
    
    // Only add paragraph if the last child is not a block element that can contain text
    if (!blockTags.includes(lastChild.tagName)) {
      // Add a paragraph element at the end for editing
      const paragraph = document.createElement('p');
      paragraph.innerHTML = '<br>';
      this.editor.appendChild(paragraph);
    }
  }

  /**
   * Check if editor is empty or contains only empty elements
   */
  isEditorEmpty() {
    const content = this.editor.innerHTML.trim();
    
    // Check for completely empty content
    if (content === '') return true;
    
    // Check for common empty states
    const emptyStates = [
      '<br>',
      '<div><br></div>',
      '<p><br></p>',
      '<p></p>',
      '<div></div>',
      '<p>&nbsp;</p>',
      '<div>&nbsp;</div>'
    ];
    
    if (emptyStates.includes(content)) return true;
    
    // Check if editor only contains empty block elements
    const children = this.editor.children;
    if (children.length === 0) return true;
    
    // Check if all children are empty
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childContent = child.innerHTML.trim();
      
      // If any child has content, editor is not empty
      if (childContent !== '' && 
          childContent !== '<br>' && 
          childContent !== '&nbsp;' &&
          childContent !== '<br>&nbsp;' &&
          childContent !== '&nbsp;<br>') {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Set cursor position to a specific element
   */
  setCursorToElement(element) {
    const range = document.createRange();
    const selection = window.getSelection();
    
    // Try to set cursor at the beginning of the element
    if (element.firstChild && element.firstChild.nodeType === Node.TEXT_NODE) {
      range.setStart(element.firstChild, 0);
    } else {
      range.setStart(element, 0);
    }
    
    range.collapse(true);
    
    selection.removeAllRanges();
    selection.addRange(range);
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
      'color', 'background', 'link', 'table', 'heading', 
      'font-family', 'line-height', 'capitalization', 'text-align', 'list',
      'indent-increase', 'indent-decrease', 'text-size'
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
    // Wrap plain text content in paragraph tag if needed
    const processedContent = this.wrapTextInParagraph(html);
    this.editor.innerHTML = processedContent;
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
   * Handle toolbar button clicks
   */
  handleToolbarClick(data) {
    const { command, button, value } = data;
    
    // Set this editor as current instance for the duration of this command
    const originalCurrent = Editor.currentInstance;
    Editor.currentInstance = this;
    
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
      case 'font-family':
      case 'line-height':
      case 'capitalization':
      case 'text-align':
      case 'text-size':
      case 'list':
      case 'indent-increase':
      case 'indent-decrease':
      case 'emoji':
      case 'image':
      case 'video':
      case 'tag':

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
    // Save state before applying format
    const historyModule = this.getModule('history');
    if (historyModule && typeof historyModule.saveBeforeFormat === 'function') {
      historyModule.saveBeforeFormat();
    }

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
      'font-family': 'font-family',
      'line-height': 'line-height',
      'capitalization': 'capitalization',
      'text-align': 'text-align',
      'text-size': 'text-size',
      'list': 'list',
      'indent-increase': 'indent-increase',
      'indent-decrease': 'indent-decrease',
      'emoji': 'emoji',
      'image': 'image',
      'video': 'video',
      'tag': 'tag',

      'import': 'import'
    };
    
    const registryKey = formatMap[formatName];
    if (!registryKey) {
      console.warn(`Unknown format: ${formatName}`);
      return;
    }
    
    const FormatClass = this.registry.get(`formats/${registryKey}`);
    if (!FormatClass) {
      return;
    }
    
    // Create format instance and toggle
    const formatInstance = new FormatClass();
    formatInstance.toggle();
    
    // Update button state
    this.updateToolbarButtonStates();
    
    // Trigger content change for formats that modify content immediately
    // (like bold, italic, underline, etc. that use execCommand)
    const immediateFormats = ['bold', 'italic', 'underline', 'strike', 'subscript', 'superscript'];
    if (immediateFormats.includes(formatName)) {
      // Use setTimeout to ensure DOM changes are complete
      setTimeout(() => {
        this.onContentChange();
      }, 0);
    }
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
    
    const formats = ['heading', 'font-family', 'line-height', 'capitalization', 'text-align', 'list', 'indent-increase', 'indent-decrease', 'bold', 'italic', 'underline', 'strike', 'subscript', 'superscript', 'color', 'background', 'link', 'table', 'text-size'];
    
    formats.forEach(formatName => {
      // Only check format state if selection is in editable area
      if (isInEditableArea) {
        const FormatClass = this.registry.get(`formats/${formatName}`);
        if (FormatClass) {
          // Create format instance for this specific editor
          let formatInstance;
          if (FormatClass.createForEditor) {
            formatInstance = FormatClass.createForEditor(this.instanceId);
          } else {
            // For formats that don't have createForEditor, temporarily set this as current instance
            const originalCurrent = Editor.currentInstance;
            Editor.currentInstance = this;
            formatInstance = new FormatClass();
            Editor.currentInstance = originalCurrent;
          }
          
          if (formatInstance) {
            const isActive = formatInstance.isActive();
            toolbar.setButtonActive(formatName, isActive);
            
            // Special handling for line-height: update button text
            if (formatName === 'line-height' && typeof formatInstance.updateButtonText === 'function') {
              formatInstance.updateButtonText();
            }
          }
        }
      } else {
        // Clear active state for buttons when outside editable area
        toolbar.setButtonActive(formatName, false);
      }
    });

    // Special handling for text-size: always update button text to show current size
    if (isInEditableArea) {
      const TextSizeClass = this.registry.get('formats/text-size');
      if (TextSizeClass && typeof TextSizeClass.updateButtonTextStatic === 'function') {
        TextSizeClass.updateButtonTextStatic(this.instanceId);
      }
    }
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

  /**
   * Prevent focus loss when clicking on UI elements
   * @param {HTMLElement} element - Element to attach listener to
   * @param {string} allowedSelector - CSS selector for elements that should allow normal click behavior
   */
  preventFocusLoss(element, allowedSelector = 'button, input, select, textarea, [contenteditable]') {
    if (!element) return;
    
    element.addEventListener('mousedown', (e) => {
      // Allow normal behavior for interactive elements
      if (e.target.closest(allowedSelector)) {
        return;
      }
      
      // Prevent default behavior for non-interactive areas
      e.preventDefault();
      
      // Restore focus to editor after event processing
      setTimeout(() => {
        this.focus();
      }, 0);
    });
  }

  /**
   * Get current editor instance
   * @returns {Editor|null} Current editor instance
   */
  static getCurrentInstance() {
    return Editor.currentInstance;
  }

  /**
   * Utility function to maintain editor focus after UI interactions
   * @param {Function} callback - Function to execute before maintaining focus
   * @param {Editor} editor - Editor instance to maintain focus on
   */
  static maintainFocus(callback, editor = null) {
    if (typeof callback === 'function') {
      callback();
    }
    const editorInstance = editor || Editor.getCurrentInstance();
    if (editorInstance) {
      setTimeout(() => editorInstance.focus(), 0);
    }
  }

  /**
   * Get popup container for this editor instance
   * @returns {HTMLElement} Popup container element
   */
  getPopupContainer() {
    return this.popupContainer;
  }

  /**
   * Get popup container from current editor instance
   * @returns {HTMLElement|null} Popup container element or null if no current instance
   */
  static getPopupContainer() {
    const currentInstance = Editor.getCurrentInstance();
    return currentInstance ? currentInstance.getPopupContainer() : null;
  }

  /**
   * Get popup instance for this editor
   * @param {string} popupType - Type of popup (e.g., 'link', 'image', 'table')
   * @returns {Object|null} Popup instance or null if not found
   */
  getPopupInstance(popupType) {
    return this.popupInstances.get(popupType);
  }

  /**
   * Set popup instance for this editor
   * @param {string} popupType - Type of popup
   * @param {Object} popupInstance - Popup instance
   */
  setPopupInstance(popupType, popupInstance) {
    this.popupInstances.set(popupType, popupInstance);
  }

  /**
   * Get popup instance by editor ID and popup type
   * @param {string} editorId - Editor instance ID
   * @param {string} popupType - Type of popup
   * @returns {Object|null} Popup instance or null if not found
   */
  static getPopupInstanceById(editorId, popupType) {
    const editor = Editor.instances.get(editorId);
    return editor ? editor.getPopupInstance(popupType) : null;
  }

  /**
   * Get editor instance by ID
   * @param {string} editorId - Editor instance ID
   * @returns {Editor|null} Editor instance or null if not found
   */
  static getInstanceById(editorId) {
    return Editor.instances.get(editorId);
  }

  /**
   * Get all editor instances
   * @returns {Map} Map of all editor instances
   */
  static getAllInstances() {
    return Editor.instances;
  }

  /**
   * Destroy popup instances for this editor
   */
  destroyPopupInstances() {
    this.popupInstances.forEach((popupInstance, popupType) => {
      if (popupInstance && typeof popupInstance.destroy === 'function') {
        popupInstance.destroy();
      }
    });
    this.popupInstances.clear();
  }

  /**
   * Update placeholder visibility based on editor content
   */
  updatePlaceholderVisibility() {
    const hasContent = this.editor.textContent.trim().length > 0;
    
    if (hasContent) {
      this.editor.classList.remove('placeholder-visible');
    } else {
      this.editor.classList.add('placeholder-visible');
    }
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

    // Destroy popup instances
    this.destroyPopupInstances();

    // Remove DOM elements
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }

    // Clear references
    this.modules.clear();
    this.formats.clear();
    this.events.clear(); // Clear events
    
    // Remove from instances map
    Editor.instances.delete(this.instanceId);
    
    // Clear current instance if this was the current one
    if (Editor.currentInstance === this) {
      Editor.currentInstance = null;
    }
  }
} 