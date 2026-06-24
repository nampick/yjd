import registry from './registry.js';
import Module from './module.js';
import { execFormat, queryFormatState } from '../utils/exec-command.js';
import { sanitizeHtml } from '../utils/sanitize.js';

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

    // Accessibility: expose the editable region to assistive technology
    this.editor.setAttribute('role', 'textbox');
    this.editor.setAttribute('aria-multiline', 'true');
    this.editor.setAttribute('aria-label', this.options.ariaLabel || this.options.placeholder || 'Rich text editor');

    // Text direction (RTL support)
    if (this.options.direction) {
      this.editor.setAttribute('dir', this.options.direction === 'rtl' ? 'rtl' : 'ltr');
    }
    
    // Force browser to create <p> tags instead of <div> when pressing Enter
    execFormat('defaultParagraphSeparator', 'p');
    
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
    
    // Restore an autosaved draft if available
    const saved = this._getAutosaved();
    if (saved != null && saved !== '') {
      return saved;
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
      modulesToLoad = this.options.modules || ['toolbar', 'history', 'block-toolbar', 'table-toolbar', 'code-view', 'theme-switcher', 'resize-handles', 'find-replace'];
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
    // Track the active editor: whenever the user interacts with THIS editor
    // (pointer or focus anywhere inside its wrapper — editor area, toolbar,
    // popups), make it the current instance. This fixes multi-instance bugs
    // where helpers resolved to the last-CREATED editor instead of the
    // last-INTERACTED one.
    this._markActive = () => { Editor.currentInstance = this; };
    this.wrapper.addEventListener('pointerdown', this._markActive, true);
    this.wrapper.addEventListener('focusin', this._markActive, true);

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

    // Formatting keyboard shortcuts (Ctrl/Cmd + B/I/U, Ctrl/Cmd + K for link)
    this.editor.addEventListener('keydown', (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const shortcuts = { b: 'bold', i: 'italic', u: 'underline', k: 'link' };
      const command = shortcuts[e.key.toLowerCase()];
      if (!command) return;
      // Don't hijack shift-modified combos (e.g. Ctrl+Shift+...) except plain ones
      if (e.shiftKey) return;
      e.preventDefault();
      this.toggleFormat(command);
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

    // Handle paste events — sanitize pasted HTML (prevents XSS and strips
    // messy markup from Word/Google Docs). Set options.pasteAsPlainText to
    // always paste as plain text instead.
    this.editor.addEventListener('paste', (e) => {
      this.handlePaste(e);
    });

    // Allow dropping (needed for the drop event to fire with files)
    this.editor.addEventListener('dragover', (e) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
        e.preventDefault();
      }
    });

    // Handle drop events (drag and drop) — insert dropped image files
    this.editor.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt && dt.files ? Array.from(dt.files) : [];
      const imageFile = files.find(f => f.type && f.type.startsWith('image/'));
      if (imageFile) {
        e.preventDefault();
        this.placeCaretAtPoint(e.clientX, e.clientY);
        this.insertImageFile(imageFile);
        return;
      }
      // Check content after a normal drop operation
      setTimeout(() => {
        this.ensureEditorHasContent();
        this.updatePlaceholderVisibility();
      }, 0);
    });

    // Enforce character limit (maxLength) on insertion-type input
    if (this.options.maxLength) {
      this.editor.addEventListener('beforeinput', (e) => {
        if (!e.inputType || !e.inputType.startsWith('insert')) return;
        if (e.inputType === 'insertFromPaste') return; // handled in handlePaste
        const incoming = e.data ? e.data.length : 1;
        if (this._remainingChars() < incoming) {
          e.preventDefault();
        }
      });
    }

    // Markdown shortcuts (# heading, - bullet, 1. ordered, > quote) on space
    if (this.options.markdown !== false) {
      this.editor.addEventListener('keydown', (e) => {
        if (e.key === ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
          this.handleMarkdownShortcut(e);
        }
      });
    }

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
    this._emitChange();
  }

  /**
   * Notify listeners of a content change WITHOUT running the empty-content
   * reset (used when an intentionally-empty block — e.g. a fresh heading from
   * a markdown shortcut — must not be wiped by ensureEditorHasContent).
   */
  _emitChange() {
    this.modules.forEach(module => {
      if (typeof module.onContentChange === 'function') {
        module.onContentChange();
      }
    });

    // Keep the status bar (word/char count + breadcrumb) in sync after every
    // mutation, including programmatic ones (find/replace, undo/redo, toolbar).
    this.updateStatusbar();

    // Get current content
    const content = this.getContent();

    // Call onChange callback if provided
    if (this.options.onChange && typeof this.options.onChange === 'function') {
      this.options.onChange(content);
    }

    // Persist draft if autosave is enabled
    this._scheduleAutosave(content);

    // Emit text-change event
    this.emit('text-change', content);
  }

  /**
   * Ensure editor always has a paragraph element for editing
   * This prevents users from editing directly in the editor container
   */
  ensureEditorHasContent() {
    if (!this.isEditorEmpty()) return;

    // Only act when the caret/selection is actually inside this editor — avoids
    // clearing formats or stealing focus based on a selection elsewhere.
    const selInEditor = this.isSelectionInEditableArea(window.getSelection());

    // Rebuild to a clean paragraph when needed — this strips leftover empty
    // formatting tags (e.g. <b><i><u>) that survive a "delete all".
    if (this.editor.innerHTML !== '<p><br></p>') {
      const paragraph = document.createElement('p');
      paragraph.innerHTML = '<br>';
      this.editor.innerHTML = '';
      this.editor.appendChild(paragraph);
      this.setCursorToElement(paragraph);
      this.editor.focus();
    }

    // Clearing the DOM is not enough: browsers keep a "pending" inline-format
    // state for the next typed character. Toggle off any active inline format
    // so new text isn't unexpectedly bold/italic/underline/strikethrough.
    if (selInEditor || document.activeElement === this.editor) {
      this._clearStickyInlineFormats();
    }

    this.updateToolbarButtonStates();
    this.updateStatusbar();
  }

  /**
   * Turn off any active inline formatting command so the next typed character
   * starts unformatted. Only affects a collapsed caret (no DOM mutation).
   */
  _clearStickyInlineFormats() {
    ['bold', 'italic', 'underline', 'strikeThrough'].forEach((cmd) => {
      if (queryFormatState(cmd)) execFormat(cmd);
    });
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
    // Real text content → not empty (ignore zero-width spaces).
    const text = this.editor.textContent;
    if (text && text.replace(/\u200B/g, '').trim() !== '') return false;

    // Embedded/void media counts as content even with no text.
    if (this.editor.querySelector('img, table, hr, video, iframe, audio, figure')) {
      return false;
    }

    // Otherwise empty — including the case where only empty formatting tags
    // remain (e.g. <p><b><i><u><br></u></i></b></p> after deleting everything).
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

    // If the selection is inside this editor, it is the active instance.
    if (isInEditableArea) {
      Editor.currentInstance = this;
    }

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
      // While in HTML code-view, count the rendered text of the source being
      // edited (not the stale visual content that's hidden behind it).
      let text;
      const codeView = this.getModule('code-view');
      if (codeView && typeof codeView.isInCodeView === 'function' && codeView.isInCodeView()) {
        const tmp = document.createElement('div');
        tmp.innerHTML = codeView.getCurrentContent ? codeView.getCurrentContent() : '';
        text = tmp.textContent || '';
      } else {
        text = this.editor.textContent || '';
      }
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      const charsNoSpaces = text.replace(/\s/g, '').length;
      
      let label = `${words} words, ${chars} chars (${charsNoSpaces} no spaces)`;
      if (this.options.maxLength) {
        label += ` • ${Math.max(0, this.options.maxLength - chars)} left`;
      }
      this.statusbarEls.wordcount.textContent = label;
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
   * Get the plain text content of the editor (no markup).
   * @returns {string}
   */
  getText() {
    return this.editor.textContent || '';
  }

  /**
   * Whether the editor has no meaningful content.
   * @returns {boolean}
   */
  isEmpty() {
    return this.isEditorEmpty();
  }

  /**
   * Clear all content, leaving an empty paragraph.
   */
  clear() {
    this.editor.innerHTML = '<p><br></p>';
    this.onContentChange();
    this.updatePlaceholderVisibility();
  }

  /**
   * Insert plain text at the current caret position.
   * @param {string} text
   */
  insertText(text) {
    if (typeof text !== 'string') return;
    this.focus();
    execFormat('insertText', text);
    this.onContentChange();
  }

  /**
   * Insert HTML at the current caret position (sanitized to prevent XSS).
   * @param {string} html
   */
  insertHTML(html) {
    if (typeof html !== 'string') return;
    this.focus();
    execFormat('insertHTML', sanitizeHtml(html));
    this.onContentChange();
  }

  /**
   * Handle a paste event: sanitize pasted HTML, or paste as plain text.
   * @param {ClipboardEvent} e
   */
  handlePaste(e) {
    const clipboard = e.clipboardData || window.clipboardData;
    if (!clipboard) return; // let the browser handle it

    // Pasted image file (screenshot, copied image) → insert as image.
    const items = clipboard.items ? Array.from(clipboard.items) : [];
    const imageItem = items.find(it => it.kind === 'file' && it.type && it.type.startsWith('image/'));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        e.preventDefault();
        this.insertImageFile(file);
        return;
      }
    }

    let html = clipboard.getData('text/html');
    let text = clipboard.getData('text/plain');

    // Nothing useful to insert ourselves → fall back to default behavior
    if (!html && !text) return;

    e.preventDefault();

    // Enforce character limit on paste (force plain text trimmed to remaining)
    if (this.options.maxLength) {
      const remaining = this._remainingChars();
      if (remaining <= 0) return;
      const plain = (text || '').slice(0, remaining);
      execFormat('insertText', plain);
    } else if (!this.options.pasteAsPlainText && html) {
      execFormat('insertHTML', sanitizeHtml(html));
    } else if (text) {
      execFormat('insertText', text);
    }

    setTimeout(() => {
      this.ensureEditorHasContent();
      this.updatePlaceholderVisibility();
      this.onContentChange();
    }, 0);
  }

  /**
   * Number of characters that can still be added before hitting maxLength
   * (accounts for the current selection being replaced). Infinity if no limit.
   */
  _remainingChars() {
    if (!this.options.maxLength) return Infinity;
    const sel = window.getSelection();
    const selLen = sel && !sel.isCollapsed ? sel.toString().length : 0;
    return this.options.maxLength - (this.getText().length - selLen);
  }

  /**
   * Read an image File and insert it (as a base64 data URL) at the caret.
   * @param {File} file
   */
  insertImageFile(file) {
    if (!file || !file.type || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const ImageClass = this.registry.get('formats/image');
      let imgHtml;
      if (ImageClass && typeof ImageClass.create === 'function') {
        const img = ImageClass.create(dataUrl); // validates the data: URL
        if (!img) return;
        imgHtml = img.outerHTML;
      } else {
        imgHtml = `<img src="${dataUrl}" class="inserted-image" style="max-width:100%" contenteditable="false">`;
      }
      this.focus();
      execFormat('insertHTML', imgHtml);
      this.onContentChange();
    };
    reader.readAsDataURL(file);
  }

  /**
   * Place the caret at the given viewport coordinates (used for drag-drop).
   */
  placeCaretAtPoint(x, y) {
    let range = null;
    if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(x, y);
    } else if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(x, y);
      if (pos) {
        range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
      }
    }
    if (range) {
      range.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  /**
   * Transform a markdown marker at the start of the current block when space
   * is pressed: "# " → H1..H6, "- "/"* " → bullet list, "1. " → ordered list,
   * "> " → blockquote.
   * @param {KeyboardEvent} e
   */
  handleMarkdownShortcut(e) {
    const sel = window.getSelection();
    if (!sel || !sel.isCollapsed || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);

    // Find the nearest plain block (P/DIV) containing the caret.
    let block = range.startContainer;
    block = block.nodeType === Node.TEXT_NODE ? block.parentElement : block;
    while (block && block !== this.editor && block.tagName !== 'P' && block.tagName !== 'DIV') {
      block = block.parentElement;
    }
    if (!block || block === this.editor) return;

    // Text from block start to the caret = the marker the user typed.
    const pre = document.createRange();
    pre.selectNodeContents(block);
    pre.setEnd(range.startContainer, range.startOffset);
    const marker = pre.toString();

    const blockMap = { '#': 'h1', '##': 'h2', '###': 'h3', '####': 'h4', '#####': 'h5', '######': 'h6', '>': 'blockquote' };
    const blockTag = blockMap[marker];
    const listType = (marker === '-' || marker === '*') ? 'ul'
      : /^\d+\.$/.test(marker) ? 'ol' : null;
    if (!blockTag && !listType) return;

    e.preventDefault();

    const history = this.getModule('history');
    if (history && typeof history.saveBeforeFormat === 'function') history.saveBeforeFormat();

    // Remove the marker text the user typed.
    pre.deleteContents();

    if (blockTag) {
      // Replace the block element directly (execCommand formatBlock is
      // unreliable on a now-empty block).
      const el = document.createElement(blockTag);
      while (block.firstChild) el.appendChild(block.firstChild);
      // Ensure a <br> placeholder so the empty block stays focusable/visible
      if (el.textContent === '' && !el.querySelector('*')) {
        el.innerHTML = '<br>';
      }
      block.replaceWith(el);
      const caret = document.createRange();
      caret.selectNodeContents(el);
      caret.collapse(true);
      sel.removeAllRanges();
      sel.addRange(caret);
    } else {
      const caret = document.createRange();
      caret.selectNodeContents(block);
      caret.collapse(true);
      sel.removeAllRanges();
      sel.addRange(caret);
      execFormat(listType === 'ul' ? 'insertUnorderedList' : 'insertOrderedList');
    }
    // Use _emitChange (not onContentChange) so a fresh empty heading/quote
    // isn't wiped by the empty-content reset.
    this._emitChange();
    this.updatePlaceholderVisibility();
  }

  /**
   * Set text direction ('ltr' | 'rtl').
   */
  setDirection(dir) {
    const d = dir === 'rtl' ? 'rtl' : 'ltr';
    this.editor.setAttribute('dir', d);
    const toolbar = this.getModule('toolbar');
    if (toolbar) toolbar.setButtonActive('text-direction', d === 'rtl');
  }

  /**
   * @returns {'ltr'|'rtl'} Current text direction.
   */
  getDirection() {
    return this.editor.getAttribute('dir') === 'rtl' ? 'rtl' : 'ltr';
  }

  /**
   * Toggle between LTR and RTL.
   */
  toggleDirection() {
    this.setDirection(this.getDirection() === 'rtl' ? 'ltr' : 'rtl');
  }

  /**
   * Normalized autosave config ({ key, debounce }) or null when disabled.
   */
  _autosaveCfg() {
    if (this._autosaveMemo !== undefined) return this._autosaveMemo;
    const a = this.options.autosave;
    if (!a) { this._autosaveMemo = null; return null; }
    this._autosaveMemo = {
      key: (typeof a === 'object' && a.key) ? a.key : 'yjd-autosave',
      debounce: (typeof a === 'object' && a.debounce) ? a.debounce : 1000
    };
    return this._autosaveMemo;
  }

  /** Read previously autosaved content (or null). */
  _getAutosaved() {
    const cfg = this._autosaveCfg();
    if (!cfg) return null;
    try { return localStorage.getItem(cfg.key); } catch (e) { return null; }
  }

  /** Debounced write of content to localStorage. */
  _scheduleAutosave(content) {
    const cfg = this._autosaveCfg();
    if (!cfg) return;
    clearTimeout(this._autosaveTimer);
    this._autosaveTimer = setTimeout(() => {
      try { localStorage.setItem(cfg.key, content); } catch (e) { /* storage unavailable */ }
    }, cfg.debounce);
  }

  /** Remove the autosaved draft from storage. */
  clearAutosave() {
    const cfg = this._autosaveCfg();
    if (!cfg) return;
    try { localStorage.removeItem(cfg.key); } catch (e) { /* ignore */ }
  }

  /**
   * Remove inline formatting (and links) from the current selection.
   */
  clearFormatting() {
    const historyModule = this.getModule('history');
    if (historyModule && typeof historyModule.saveBeforeFormat === 'function') {
      historyModule.saveBeforeFormat();
    }
    this.focus();
    execFormat('removeFormat');
    execFormat('unlink');
    this.onContentChange();
    this.updateToolbarButtonStates();
  }

  /**
   * Insert a horizontal rule at the current caret position.
   */
  insertHorizontalRule() {
    const historyModule = this.getModule('history');
    if (historyModule && typeof historyModule.saveBeforeFormat === 'function') {
      historyModule.saveBeforeFormat();
    }
    this.focus();
    execFormat('insertHorizontalRule');
    this.onContentChange();
  }

  /**
   * Whether a block element has no real (text/media) content.
   */
  _isBlockEmpty(el) {
    if (!el) return true;
    if (el.querySelector && el.querySelector('img, table, hr, video, iframe, audio, figure')) {
      return false;
    }
    return (el.textContent || '').replace(/\u200B/g, '').trim() === '';
  }

  /**
   * Insert a block-level element at the editor's top level, next to the block
   * containing the caret — never nested inside a heading or inline formatting
   * tag (which would be invalid HTML). Removes the source block if it became
   * empty, and guarantees an editable paragraph after the inserted block.
   * @param {HTMLElement} blockEl
   */
  insertBlock(blockEl) {
    const sel = window.getSelection();
    let topBlock = null;
    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      if (!range.collapsed) range.deleteContents();
      let node = range.startContainer;
      node = node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
      while (node && node !== this.editor && node.parentNode !== this.editor) {
        node = node.parentNode;
      }
      if (node && node.parentNode === this.editor) topBlock = node;
    }

    if (topBlock) {
      const wasEmpty = this._isBlockEmpty(topBlock);
      if (topBlock.nextSibling) {
        this.editor.insertBefore(blockEl, topBlock.nextSibling);
      } else {
        this.editor.appendChild(blockEl);
      }
      // Remove the originating block if it held only the caret / empty format tags
      if (wasEmpty) topBlock.remove();
    } else {
      this.editor.appendChild(blockEl);
    }

    // Guarantee an editable paragraph after the inserted block
    if (!blockEl.nextSibling) {
      const p = document.createElement('p');
      p.innerHTML = '<br>';
      this.editor.appendChild(p);
    }
  }

  /**
   * Enable/disable read-only mode.
   * @param {boolean} readOnly
   */
  setReadOnly(readOnly) {
    this._readOnly = !!readOnly;
    this.editor.contentEditable = this._readOnly ? 'false' : 'true';
    this.editor.setAttribute('aria-readonly', this._readOnly ? 'true' : 'false');
    this.wrapper.classList.toggle('read-only', this._readOnly);

    // Disable/enable toolbar interaction
    const toolbar = this.getModule('toolbar');
    if (toolbar && toolbar.buttons) {
      toolbar.buttons.forEach((_, command) => {
        toolbar.setButtonDisabled(command, this._readOnly);
      });
    }
  }

  /**
   * @returns {boolean} Whether the editor is in read-only mode.
   */
  isReadOnly() {
    return !!this._readOnly;
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
    const alwaysAllowedCommands = ['more', 'undo', 'redo', 'code-view', 'theme', 'text-direction', 'find'];

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
        case 'text-direction':
          this.toggleDirection();
          return;
        case 'find':
          // Find/replace module listens to 'toolbar-click' and opens its panel
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
      case 'clear-format':
        this.clearFormatting();
        break;
      case 'horizontal-rule':
        this.insertHorizontalRule();
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
      execFormat('undo');
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
      execFormat('redo');
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
    // Remove active-tracking listeners
    if (this._markActive) {
      this.wrapper.removeEventListener('pointerdown', this._markActive, true);
      this.wrapper.removeEventListener('focusin', this._markActive, true);
      this._markActive = null;
    }

    // Cancel any pending autosave write
    clearTimeout(this._autosaveTimer);

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