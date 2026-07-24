import registry from './registry.js';
import Module from './module.js';
import { execFormat, queryFormatState } from '../utils/exec-command.js';
import { sanitizeHtml } from '../utils/sanitize.js';
import { registerIcons } from '../ui/icons.js';

/**
 * Main Editor class - Inspired by Quill's architecture
 * This replaces the monolithic EditorCore class
 */
export default class Editor {
  static DEFAULTS = {
    placeholder: 'Start typing...',
    // 'inherit' (default) follows the nearest ancestor [data-theme] (falling
    // back to the light :root tokens). 'light' | 'dark' force a theme; 'auto'
    // follows the OS via prefers-color-scheme.
    theme: 'inherit',
    height: 400,
    width: 800,
    maxWidth: 1200,
    maxHeight: 800,
    content: null, // Default content for the editor
    autoFocus: true, // focus the editor after mount; false = never steal focus
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
    this.options = {
      ...Editor.DEFAULTS,
      ...options,
      // Deep-merge `features` so a partial override (e.g. { wordCount: false }
      // to hide the bottom bar) keeps the other defaults instead of wiping them.
      features: { ...Editor.DEFAULTS.features, ...(options.features || {}) }
    };
    // A prompt/chat input grows with its content by default (like a message box)
    // rather than reserving the 400px editor height — unless the app sets one.
    if (this.options.layout === 'prompt' && options.height == null) {
      this.options.height = 'auto';
    }
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

    // User-supplied icon overrides. The icon registry is module-global (shared
    // by every editor on the page), so this replaces those glyphs everywhere —
    // register before init() so the toolbar/menus render with them. Pass a map
    // of { name: '<svg …>' }; use Editor.registerIcons() for the same effect
    // without constructing an editor.
    if (this.options.icons && typeof this.options.icons === 'object') {
      registerIcons(this.options.icons);
    }

    this.init();
  }

  /**
   * Register or override icons globally (shared by every editor on the page).
   * Pass a map of { name: '<svg …>' }. Names match the built-ins (e.g. 'bold',
   * 'video', 'upload', 'close') to replace them, or new names for custom glyphs.
   * @param {Object<string,string>} icons
   */
  static registerIcons(icons) {
    if (icons && typeof icons === 'object') registerIcons(icons);
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
    // Layout: 'prompt' turns the editor into a chat-style input — a rounded pill
    // with the toolbar moved below the text as a bottom action bar (all via the
    // [data-layout="prompt"] CSS; no extra JS/bundle when unused).
    if (this.options.layout === 'prompt') {
      this.wrapper.setAttribute('data-layout', 'prompt');
    }
    // Theme: 'inherit' (default — follow ancestor [data-theme]) | 'light' |
    // 'dark' | 'auto'. For 'inherit' we leave the attribute off so the editor
    // inherits the nearest ancestor theme; otherwise it forces that theme.
    this._applyThemeAttr(this.options.theme || 'inherit');

    // Apply dynamic sizing. A number is treated as pixels; a string (e.g.
    // '100%') is applied verbatim so the editor can size responsively to its
    // container instead of a fixed width.
    const cssSize = (v) => (typeof v === 'number' ? v + 'px' : v);
    this.wrapper.style.width = cssSize(this.options.width);
    this.wrapper.style.maxWidth = cssSize(this.options.maxWidth);

    // Height: height:'auto' grows with content (small min-height, NO max cap) —
    // good for a textarea-like box. `minHeight`/`maxHeight` override explicitly.
    const autoHeight = this.options.height === 'auto';
    const minH = this.options.minHeight != null ? this.options.minHeight
      : (autoHeight ? 80 : this.options.height);
    if (minH != null) this.wrapper.style.minHeight = cssSize(minH);

    // Display caps for inserted images (options.image.maxHeight/maxWidth) — keeps
    // large uploads from blowing out the frame. Consumed by the CSS image rules.
    const imgCfg = (this.options.image && typeof this.options.image === 'object') ? this.options.image : null;
    if (imgCfg && imgCfg.maxHeight != null) this.wrapper.style.setProperty('--rte-img-max-h', cssSize(imgCfg.maxHeight));
    if (imgCfg && imgCfg.maxWidth != null) this.wrapper.style.setProperty('--rte-img-max-w', cssSize(imgCfg.maxWidth));

    // One knob for every UI glyph (toolbar, menus, chips, popups). Number → px,
    // string passed verbatim. Falls back to the --rte-icon-size token (16px).
    if (this.options.iconSize != null) {
      this.wrapper.style.setProperty('--rte-icon-size', cssSize(this.options.iconSize));
    }

    // In auto mode ignore the default maxHeight so the editor can grow; a caller
    // can still cap it by passing maxHeight explicitly.
    if (autoHeight) {
      if (this.options.maxHeight != null && this.options.maxHeight !== Editor.DEFAULTS.maxHeight) {
        this.wrapper.style.maxHeight = cssSize(this.options.maxHeight);
      }
    } else if (this.options.maxHeight != null) {
      this.wrapper.style.maxHeight = cssSize(this.options.maxHeight);
    }
    
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
    // Above the toolbar/statusbar (both z-index 1000) so popovers that overflow
    // a short editor paint over the chrome instead of being hidden behind it.
    this.popupContainer.style.zIndex = '1100';
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
    // If custom content is provided in options, use it (sanitized — it lands in
    // innerHTML during init and may carry HTML).
    if (this.options.content) {
      return sanitizeHtml(this.wrapTextInParagraph(this.options.content));
    }

    // Restore an autosaved draft if available. localStorage is user-writable and
    // the draft may predate the current sanitization rules, so sanitize on load.
    const saved = this._getAutosaved();
    if (saved != null && saved !== '') {
      return sanitizeHtml(saved);
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
      modulesToLoad = this.options.modules || ['toolbar', 'history', 'block-toolbar', 'table-toolbar', 'code-view', 'resize-handles', 'find-replace', 'slash-menu', 'mention'];
    }

    // @mention is inert without a source, so load it whenever configured —
    // even alongside a custom toolbar that otherwise loads only basics.
    if (this.options.mention && !modulesToLoad.includes('mention')) {
      modulesToLoad.push('mention');
    }

    // The AI module is inert without an `ai.complete` hook, so it is never in
    // the default set — load it only when the app configures one.
    if (this.options.ai && !modulesToLoad.includes('ai')) {
      modulesToLoad.push('ai');
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
    // Content-mutation observer: fire onChange for ANY change to the editable
    // content — including programmatic ones (resize, table row/col ops, colour
    // arming, drag-drop) that don't dispatch an 'input' event. Without this a
    // live preview / autosave / word count only tracked keystrokes and went
    // stale after those operations. Debounced; _emitChange() does not mutate the
    // editor, so this can't loop.
    this._contentObserver = new MutationObserver(() => {
      clearTimeout(this._contentEmitTimer);
      this._contentEmitTimer = setTimeout(() => this._emitChange(), 40);
    });
    this._contentObserver.observe(this.editor, {
      childList: true, subtree: true, attributes: true, characterData: true
    });

    // Track the active editor: whenever the user interacts with THIS editor
    // (pointer or focus anywhere inside its wrapper — editor area, toolbar,
    // popups), make it the current instance. This fixes multi-instance bugs
    // where helpers resolved to the last-CREATED editor instead of the
    // last-INTERACTED one.
    this._markActive = () => { Editor.currentInstance = this; };
    this.wrapper.addEventListener('pointerdown', this._markActive, true);
    this.wrapper.addEventListener('focusin', this._markActive, true);

    // Basic input event. onContentChange() already runs ensureEditorHasContent()
    // and updateStatusbar() (via _emitChange), so we don't duplicate them here.
    this.editor.addEventListener('input', (e) => {
      // Typed text now carries the colour — drop the armed-colour fallback so the
      // swatch reflects the real DOM colour from here on.
      this._armedFore = null;
      this._armedBack = null;
      // A delete that emptied the editor: reset a leftover non-<p> block (a
      // heading/list the text was deleted from) to a paragraph RIGHT NOW —
      // synchronously, before the next keystroke — so typing immediately after
      // a select-all+delete doesn't inherit the old block. (The keydown handler
      // also schedules this, but that runs on a timeout and loses the race.)
      if (e && typeof e.inputType === 'string' && e.inputType.indexOf('delete') === 0 && this.isEditorEmpty()) {
        this.ensureEditorHasContent(true);
      } else if (!e || (typeof e.inputType === 'string' && e.inputType.indexOf('insert') === 0)) {
        // Strip the zero-width placeholder (​) left by font/size/line-height
        // once real text is typed into it, so saved content/Markdown stays clean.
        this._cleanupZeroWidth();
      }
      this.updatePlaceholderVisibility();
      this.onContentChange();
    });

    // Selection changes (caret move, selection) — coalesced to one run per
    // animation frame so rapid events don't each trigger a full toolbar pass.
    this._onDocSelectionChange = () => {
      if (document.activeElement === this.editor || this.editor.contains(document.activeElement)) {
        this._scheduleSelectionUpdate();
      }
    };
    document.addEventListener('selectionchange', this._onDocSelectionChange);

    // Mouse up: selectionchange already fires for this; just ensure a refresh
    // (still rAF-throttled, no setTimeout).
    this.editor.addEventListener('mouseup', () => this._scheduleSelectionUpdate());

    // Click inside the editor: keep a valid editable block.
    this.editor.addEventListener('click', () => {
      this.ensureEditorHasContent();
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
        // Use setTimeout to check after the deletion occurs. Pass clearSticky so
        // a delete-to-empty also drops any pending inline format.
        setTimeout(() => {
          this.ensureEditorHasContent(true);
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

    // Allow dropping (needed for the drop event to fire with files) and show a
    // drop-zone highlight while files are dragged over the editor.
    this.editor.addEventListener('dragover', (e) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
        e.preventDefault();
        this.editor.classList.add('yjd-drag-over');
      }
    });
    this.editor.addEventListener('dragleave', (e) => {
      // Only clear when the pointer actually leaves the editor (not child nodes).
      if (!e.relatedTarget || !this.editor.contains(e.relatedTarget)) {
        this.editor.classList.remove('yjd-drag-over');
      }
    });

    // Handle drop events (drag and drop) — insert dropped image files
    this.editor.addEventListener('drop', (e) => {
      this.editor.classList.remove('yjd-drag-over');
      const dt = e.dataTransfer;
      const files = dt && dt.files ? Array.from(dt.files) : [];
      const imageFile = files.find(f => f.type && f.type.startsWith('image/'));
      if (imageFile) {
        // insertImageFile is an optional (all-in-one) capability; a Minimal
        // build without it just swallows the drop instead of letting the
        // browser navigate to the file.
        e.preventDefault();
        if (this.insertImageFile) {
          this.placeCaretAtPoint(e.clientX, e.clientY);
          this.insertImageFile(imageFile);
        }
        return;
      }
      // Video files insert as an inline <video> player (parallel to images),
      // honouring options.video.upload. insertVideoFile is an optional
      // (all-in-one) capability; without it a video falls through to the
      // file-attachment branch below.
      const videoFile = files.find(f => f.type && f.type.startsWith('video/'));
      if (videoFile && this.insertVideoFile) {
        e.preventDefault();
        this.placeCaretAtPoint(e.clientX, e.clientY);
        this.insertVideoFile(videoFile);
        return;
      }
      // Non-image files become attachments when a file hook is configured.
      const attachment = files.find(f => f && f.name);
      if (attachment && this.options.file && this.insertFileAttachment) {
        e.preventDefault();
        this.placeCaretAtPoint(e.clientX, e.clientY);
        this.insertFileAttachment(attachment);
        return;
      }
      // Check content after a normal drop operation
      setTimeout(() => {
        this.ensureEditorHasContent();
        this.updatePlaceholderVisibility();
      }, 0);
    });

    // Checklist: toggle a task item's data-checked when its pseudo-checkbox
    // (the left gutter) is clicked. The checkbox is a CSS ::before, so the click
    // lands on the <li>; we only toggle within the gutter width so clicking the
    // text still places the caret normally.
    this.editor.addEventListener('click', (e) => {
      const li = e.target.closest && e.target.closest('ul.checklist > li');
      if (!li) return;
      const rect = li.getBoundingClientRect();
      if (e.clientX - rect.left <= 24) {
        e.preventDefault();
        li.setAttribute('data-checked', li.getAttribute('data-checked') === 'true' ? 'false' : 'true');
        this.onContentChange();
      }
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

    // Markdown shortcuts (# heading, - bullet, 1. ordered, > quote) on space.
    // handleMarkdownShortcut is an optional (all-in-one) capability.
    if (this.options.markdown !== false && this.handleMarkdownShortcut) {
      this.editor.addEventListener('keydown', (e) => {
        if (e.key === ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
          this.handleMarkdownShortcut(e);
        }
      });
    }

    // Auto-linkify: turn a bare URL into a clickable link once it is completed
    // with a space or Enter. Off via options.linkify === false.
    // linkifyBeforeCaret is an optional (all-in-one) capability.
    if (this.options.linkify !== false && this.linkifyBeforeCaret) {
      this.editor.addEventListener('keydown', (e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.ctrlKey && !e.metaKey && !e.altKey && !e.isComposing) {
          this.linkifyBeforeCaret();
        }
      });
    }

    // Enter-to-submit (e.g. a comment box / prompt input). Enter submits,
    // Shift+Enter inserts a newline — UNLESS an autocomplete popup is open, in
    // which case Enter is left for the popup to choose its item. Configured via
    // options.submit.onEnter or .onSubmit (the send button uses the same path).
    if (this.options.submit &&
        (typeof this.options.submit.onEnter === 'function' ||
         typeof this.options.submit.onSubmit === 'function')) {
      this.editor.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' || e.isComposing) return;
        if (e.shiftKey) return; // Shift+Enter → newline (browser default)
        if (this.isMenuOpen()) return; // let the popup handle Enter
        // When the caret sits inside a list item, blockquote or code block,
        // plain Enter must CONTINUE that block (new list item / new line) —
        // not submit. This mirrors chat inputs like Claude/ChatGPT: Enter
        // sends from a normal paragraph, but keeps building a structural block.
        if (this._caretInContinuableBlock()) return;
        // submit.enterToSend controls when Enter submits vs. inserts a newline:
        //   'never'  → Enter is always a newline; only the send button submits.
        //   'always' → Enter always submits (even on a mobile soft keyboard).
        //   'auto'   → (default) submit on Enter EXCEPT on a touch soft keyboard
        //              in the prompt layout, where the return key must insert a
        //              newline (multi-line messages, list items) and the send
        //              button submits — matching iMessage/Telegram.
        const enterToSend = (this.options.submit && this.options.submit.enterToSend) || 'auto';
        if (enterToSend === 'never') return;
        if (enterToSend === 'auto' &&
            this.options.layout === 'prompt' && typeof window !== 'undefined' &&
            window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
          return;
        }
        e.preventDefault();
        this.submitContent();
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
      // Set the initial undo/redo dimmed state (nothing to undo yet).
      this.updateHistoryButtons();
      if (this.options.autoFocus !== false) this.focus();
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
    // Every write path (setContent/setHTML/setMarkdown/setJSON, inserts, the
    // fromTextarea value bridge) must sync the placeholder, not just typing.
    this.updatePlaceholderVisibility();
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

    // Enable/disable the prompt-layout send button with content or attachments
    // (no-op when the toolbar has no send button).
    this._syncPromptSendState();

    // Get current content
    const content = this.getContent();

    // Call onChange callback if provided
    if (this.options.onChange && typeof this.options.onChange === 'function') {
      this.options.onChange(content);
    }

    // Persist draft if autosave is enabled
    this._scheduleAutosave(content);

    // Warn when the serialized content exceeds maxContentSize (bytes). Guards
    // against, e.g., pasting huge base64 images. Fires once per crossing.
    if (this.options.maxContentSize) {
      const size = content.length;
      const over = size > this.options.maxContentSize;
      if (over && !this._overflowed) {
        this._overflowed = true;
        this.emit('content:overflow', { size, max: this.options.maxContentSize });
      } else if (!over) {
        this._overflowed = false;
      }
    }

    // Emit change events ('change' is the documented name; 'text-change' kept
    // for backward compatibility).
    this.emit('change', content);
    this.emit('text-change', content);
  }

  /**
   * Ensure editor always has a paragraph element for editing
   * This prevents users from editing directly in the editor container
   */
  ensureEditorHasContent(clearSticky = false) {
    if (!this.isEditorEmpty()) return;

    // Only act when the caret/selection is actually inside this editor — avoids
    // clearing formats or stealing focus based on a selection elsewhere.
    const selInEditor = this.isSelectionInEditableArea(window.getSelection());
    const focusedHere = selInEditor || document.activeElement === this.editor;

    if (this.editor.children.length === 0) {
      // Truly empty (no block at all) → seed a paragraph so there's somewhere to
      // type. Only move the caret when the editor is actually focused (no autofocus).
      const paragraph = document.createElement('p');
      paragraph.innerHTML = '<br>';
      this.editor.appendChild(paragraph);
      if (focusedHere) this.setCursorToElement(paragraph);
    } else if (clearSticky && this.editor.innerHTML !== '<p><br></p>') {
      // DELETE-to-empty → strip leftover formatting (empty <b>/<i>, a heading the
      // text was deleted from, etc.) back to a clean paragraph. We do NOT do this
      // on a normal change, so an intentional empty block/format placeholder the
      // user just applied to an empty editor (heading, colour, font, line-height,
      // capitalization…) survives and the next typed character inherits it.
      const paragraph = document.createElement('p');
      paragraph.innerHTML = '<br>';
      this.editor.innerHTML = '';
      this.editor.appendChild(paragraph);
      this.setCursorToElement(paragraph);
      this.editor.focus();
    }

    // After a DELETE-to-empty, browsers keep a "pending" inline-format state for
    // the next typed character — clear it so new text isn't unexpectedly styled.
    if (clearSticky && focusedHere) {
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
   * Coalesce selection-driven UI updates to one run per animation frame.
   */
  _scheduleSelectionUpdate() {
    if (this._selUpdateQueued) return;
    this._selUpdateQueued = true;
    requestAnimationFrame(() => {
      this._selUpdateQueued = false;
      this.onSelectionChange();
    });
  }

  /**
   * Handle selection changes
   */
  onSelectionChange() {
    const selection = window.getSelection();
    // getSelection() can return null (e.g. a detached/hidden document); bail out
    // rather than throw on selection.rangeCount.
    if (!selection) return;
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    
    // Check if selection is within rich-editor-area
    const isInEditableArea = this.isSelectionInEditableArea(selection);

    // If the selection is inside this editor, it is the active instance.
    if (isInEditableArea) {
      Editor.currentInstance = this;
      // Remember the last real (non-collapsed) selection so popups (colour,
      // etc.) can restore it even if a tap clears the live selection on mobile.
      if (range && !range.collapsed) {
        this._lastRange = range.cloneRange();
      }
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
      // Only reflect a selection that lives inside THIS editor. On a page with
      // several editors the selection is global, so without this guard each
      // statusbar would walk up to <body> and show another editor's path.
      if (!currentNode || !this.editor.contains(currentNode)) {
        this.statusbarEls.breadcrumb.textContent = 'editor';
      } else {
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
      // Count by grapheme cluster so an emoji (surrogate pair / ZWJ / VS16
      // sequence) counts as one character, not the 2-3 UTF-16 code units that
      // String.length would report.
      const countChars = (s) => {
        if (!s) return 0;
        if (typeof Intl !== 'undefined' && Intl.Segmenter) {
          if (!this._graphemeSeg) this._graphemeSeg = new Intl.Segmenter();
          let n = 0;
          for (const _ of this._graphemeSeg.segment(s)) n++;
          return n;
        }
        return [...s].length; // code-point fallback
      };
      const chars = countChars(text);
      const charsNoSpaces = countChars(text.replace(/\s/g, ''));
      
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
   * Remove zero-width-space (U+200B) placeholders once real text sits beside
   * them. font/size/line-height insert <span …>​</span> on a collapsed
   * caret so typing inherits the style; this strips the ​ after the user
   * types, keeping content + Markdown clean. A LONE ​ (placeholder not yet
   * typed into) is left alone so the armed span survives.
   */
  _cleanupZeroWidth() {
    const ZWSP = String.fromCharCode(0x200B);
    if (this.editor.textContent.indexOf(ZWSP) === -1) return;
    const re = new RegExp(ZWSP, 'g');
    const sel = window.getSelection();
    let caretNode = null, caretOffset = 0;
    if (sel && sel.rangeCount) {
      const r = sel.getRangeAt(0);
      caretNode = r.startContainer; caretOffset = r.startOffset;
    }
    const walker = document.createTreeWalker(this.editor, NodeFilter.SHOW_TEXT, null);
    let node, restore = null;
    while ((node = walker.nextNode())) {
      const t = node.textContent;
      if (t.indexOf(ZWSP) === -1) continue;
      const stripped = t.replace(re, '');
      if (stripped.length === 0) continue; // lone placeholder — keep it
      if (node === caretNode) {
        const before = t.slice(0, caretOffset);
        const removedBefore = before.length - before.replace(re, '').length;
        restore = { node, offset: Math.max(0, caretOffset - removedBefore) };
      }
      node.textContent = stripped;
    }
    if (restore && sel) {
      const r = document.createRange();
      r.setStart(restore.node, Math.min(restore.offset, restore.node.textContent.length));
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
    }
  }

  /**
   * Ensure there is a caret/selection inside this editor (used before applying a
   * toolbar command when nothing is selected — e.g. an empty or never-focused
   * editor). Restores the last real range if it belongs here, otherwise focuses
   * and collapses the caret to the end of the content.
   */
  restoreSelectionToEditor() {
    const cur = window.getSelection();
    // A selection already inside this editor — but the editor may not be the
    // focused element (the toolbar button can take focus). execCommand only
    // applies/arms on a FOCUSED contentEditable, so always re-focus here, then
    // re-assert the existing selection (focus() can move the caret).
    if (cur && cur.rangeCount && this.editor.contains(cur.anchorNode)) {
      if (document.activeElement !== this.editor) {
        const saved = cur.getRangeAt(0).cloneRange();
        this.editor.focus();
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(saved);
      }
      return;
    }
    this.focus();
    const sel = window.getSelection();
    if (!sel) return;
    if (this._lastRange && this.editor.contains(this._lastRange.commonAncestorContainer)) {
      sel.removeAllRanges();
      sel.addRange(this._lastRange);
      return;
    }
    if (!sel.rangeCount || !this.editor.contains(sel.anchorNode)) {
      this.ensureEditorHasContent();
      // Collapse INSIDE the last block element (e.g. the <p>), not at the editor
      // level — block formats (heading/quote/list) need the caret within a block
      // to find it, and inline commands need a real text position.
      const target = this.editor.lastElementChild || this.editor;
      const r = document.createRange();
      r.selectNodeContents(target);
      r.collapse(false);
      sel.removeAllRanges();
      sel.addRange(r);
    }
  }

  /**
   * Get editor content
   */
  getContent() {
    const html = this.editor.innerHTML;
    // Find & Replace wraps matches in <mark class="yjd-find-hit"> as a transient
    // visual overlay. Strip those wrappers from the serialized output (via a
    // detached clone, so the live highlights stay visible during an active
    // search) — otherwise they leak into saved content, history and exports.
    if (html.indexOf('yjd-find-hit') === -1) return html;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    tmp.querySelectorAll('mark.yjd-find-hit').forEach((m) => {
      const parent = m.parentNode;
      while (m.firstChild) parent.insertBefore(m.firstChild, m);
      parent.removeChild(m);
    });
    return tmp.innerHTML;
  }

  /**
   * Set editor content
   */
  setContent(html) {
    // Wrap plain text content in paragraph tag if needed, then sanitize before
    // it reaches innerHTML — setContent is a public sink and is also the path
    // used to restore drafts, so untrusted HTML must never execute here.
    const processedContent = sanitizeHtml(this.wrapTextInParagraph(html));
    this.editor.innerHTML = processedContent;
    this.onContentChange();
  }

  /* ----- Export / import in common formats (HTML · JSON · Markdown) ----- */

  /** HTML string (alias of getContent). */
  getHTML() { return this.getContent(); }
  /** Set content from an HTML string (sanitised). */
  setHTML(html) { this.setContent(sanitizeHtml(html || '')); }

  // getJSON / setJSON / getMarkdown / setMarkdown are optional and live in
  // lib/core/serialize-methods.js so `serialize.js` (~3 KB) tree-shakes out of
  // Minimal builds. The all-in-one entry attaches them via applySerializeMethods().

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
   * Submit the current content — shared by Enter-to-send and the prompt
   * layout's send button. Calls options.submit.onSubmit (preferred) or
   * .onEnter with (content, editor). No-op if neither is configured or the
   * editor is empty.
   */
  submitContent() {
    const cfg = this.options.submit;
    if (!cfg) return;
    // Submittable when there's text OR at least one attachment.
    if (this.isEditorEmpty() && this.getAttachments().length === 0) return;
    const handler = cfg.onSubmit || cfg.onEnter;
    if (typeof handler === 'function') handler(this._contentForSubmit(), this);
    // Chat semantics: clear attachments after send (the handler read them above).
    if (this._attachments) this._attachments.clear();
  }

  /**
   * The content string handed to the submit handler. Normally just getContent(),
   * but when prompt.serializeAttachments is set the tray's attachments are
   * appended to it so a markdown/HTML store gets them inline without the
   * integrator wiring getAttachments() by hand:
   *   true       → a default HTML tail (<img> / <a>) per attachment
   *   (att)=>str → a custom string per attachment (e.g. markdown `![](src)`)
   */
  _contentForSubmit() {
    const tail = this._serializeAttachmentsTail('html');
    const content = this.getContent();
    return tail ? content + tail : content;
  }

  /**
   * The serialized-attachment tail for the given target format ('html' |
   * 'markdown'), or '' when prompt.serializeAttachments is off or there are no
   * attachments. Shared by the submit handler (HTML) and the fromTextarea
   * bridge (matches the textarea's format), so a markdown store gets markdown
   * image/link syntax rather than raw <img>.
   */
  _serializeAttachmentsTail(format) {
    const ser = this.options.prompt && this.options.prompt.serializeAttachments;
    if (!ser) return '';
    const atts = this.getAttachments();
    if (!atts.length) return '';
    const toStr = typeof ser === 'function' ? ser
      : (att) => this._defaultSerializeAttachment(att, format);
    return atts.map(toStr).filter((s) => typeof s === 'string' && s).join('');
  }

  /** Default serialization for an attachment (prompt.serializeAttachments: true). */
  _defaultSerializeAttachment(att, format) {
    const src = att.src || '';
    const name = (att.file && att.file.name) || att.kind || '';
    if (format === 'markdown') {
      const md = (s) => String(s == null ? '' : s).replace(/([[\]])/g, '\\$1');
      return att.kind === 'image'
        ? `\n\n![${md(name)}](${src})`
        : `\n\n[${md(name || src)}](${src})`;
    }
    const esc = (s) => String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    if (att.kind === 'image') return `<p><img src="${esc(src)}" alt="${esc(name)}"></p>`;
    return `<p><a href="${esc(src)}">${esc(name || src)}</a></p>`;
  }

  /**
   * True when the caret is inside a structural block that Enter should continue
   * (list item, blockquote, or code block) rather than submit. Used so plain
   * Enter builds list items / block lines instead of sending the message.
   */
  _caretInContinuableBlock() {
    if (typeof window === 'undefined' || !window.getSelection) return false;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    let node = sel.getRangeAt(0).startContainer;
    if (node && node.nodeType === 3) node = node.parentNode; // text → element
    if (!node || typeof node.closest !== 'function') return false;
    const block = node.closest('li, blockquote, pre');
    return !!(block && this.editor.contains(block));
  }

  /**
   * Attach a file (prompt layout) as a chat-style thumbnail instead of inserting
   * it into the message text. kind: 'image' | 'video' | 'file'. The tray
   * component loads lazily on first use.
   */
  async promptAttach(kind) {
    if (!this._attachments) {
      const { default: PromptAttachments } = await import('../ui/prompt-attachments.js');
      this._attachments = new PromptAttachments(this);
    }
    this._attachments.pick(kind || 'image');
  }

  /** The prompt layout's current attachments: [{ kind, file, src }]. Empty otherwise. */
  getAttachments() {
    return this._attachments ? this._attachments.getAll() : [];
  }

  /**
   * Add a context chip to the prompt tray (an AI-prompt reference like @file /
   * @selection / a URL). ctx: { label, value?, meta? }. Read with getContext().
   */
  async addContext(ctx) {
    if (!this._attachments) {
      const { default: PromptAttachments } = await import('../ui/prompt-attachments.js');
      this._attachments = new PromptAttachments(this);
    }
    return this._attachments.addContext(ctx);
  }

  /** The prompt layout's current context chips: [{ id, label, value, meta }]. */
  getContext() {
    return this._attachments ? this._attachments.getContext() : [];
  }

  /**
   * AI authorship (with ai.trackAuthorship): AI-written spans carry
   * class="yjd-ai-mark" data-ai. Toggle a highlight of them, read them, or strip
   * the marks before saving.
   */
  showAiMarks(on = true) {
    this.editor.classList.toggle('yjd-show-ai', !!on);
    return this;
  }
  /** AI-authored runs currently in the document: [{ text }]. */
  getAiRanges() {
    return [...this.editor.querySelectorAll('.yjd-ai-mark')].map((m) => ({ text: m.textContent }));
  }
  /** Remove the authorship marks (unwrap), leaving the text as normal content. */
  stripAiMarks() {
    this.editor.querySelectorAll('.yjd-ai-mark').forEach((m) => {
      const parent = m.parentNode;
      while (m.firstChild) parent.insertBefore(m.firstChild, m);
      parent.removeChild(m);
    });
    this.editor.normalize();
    this.onContentChange();
    return this;
  }

  /** Re-evaluate the send button's enabled state (text OR attachments present). */
  _syncPromptSendState() {
    const tb = this.getModule('toolbar');
    if (!tb) return;
    if (typeof tb.updateSendState === 'function') {
      tb.updateSendState(this.isEditorEmpty() && this.getAttachments().length === 0);
    }
    if (typeof tb.updateTokenMeter === 'function') {
      tb.updateTokenMeter(typeof this.getText === 'function' ? this.getText() : '');
    }
  }

  /**
   * Clear all content, leaving an empty paragraph. Also empties the prompt
   * attachment tray so it resets the whole composer (text + attachments).
   */
  clear() {
    this.editor.innerHTML = '<p><br></p>';
    if (this._attachments) this._attachments.clear();
    this.onContentChange();
    this.updatePlaceholderVisibility();
  }

  /** Remove all prompt-layout attachments from the tray (no effect on the text). */
  clearAttachments() {
    if (this._attachments) this._attachments.clear();
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
   * Snapshot of the current selection — the context an AI action (or any tool)
   * needs to operate on what the user picked. Returns null when the selection
   * is outside this editor.
   * @returns {{text:string, html:string, isEmpty:boolean, range:Range}|null}
   */
  getSelection() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    const range = sel.getRangeAt(0);
    if (!this.editor.contains(range.commonAncestorContainer)) return null;
    const holder = document.createElement('div');
    holder.appendChild(range.cloneContents());
    return {
      text: range.toString(),
      html: holder.innerHTML,
      isEmpty: range.collapsed,
      // A detached clone, so the snapshot doesn't mutate as the caret moves.
      range: range.cloneRange(),
    };
  }

  /**
   * Replace the current selection with new content (sanitized, undo-aware). The
   * write path for AI rewrites and any "replace what I selected" tool. With a
   * collapsed selection it inserts at the caret.
   * @param {string} content
   * @param {{asText?: boolean}} [opts] - insert as plain text instead of HTML
   */
  replaceSelection(content, opts = {}) {
    if (typeof content !== 'string') return;
    const history = this.getModule('history');
    if (history && typeof history.saveBeforeFormat === 'function') history.saveBeforeFormat();
    this.focus();
    if (opts.asText) {
      execFormat('insertText', content);
    } else {
      execFormat('insertHTML', sanitizeHtml(content));
    }
    this.onContentChange();
  }

  /**
   * Open a streaming sink at the current caret/selection so an AI response can
   * be written token-by-token. The first append replaces the selection; later
   * appends extend it. Designed for the "watch it type" UX.
   *
   *   const s = editor.streamInto();
   *   for await (const chunk of res) s.append(chunk);
   *   s.commit();            // or s.cancel() to undo the whole stream
   *
   * @returns {{append(t:string):void, commit():void, cancel():void}}
   */
  streamInto() {
    const history = this.getModule('history');
    if (history && typeof history.saveBeforeFormat === 'function') history.saveBeforeFormat();
    this.focus();
    // Snapshot the pre-stream HTML so cancel() can restore it in one step —
    // a stream produces several history entries, so a single undo() wouldn't
    // roll back the whole thing.
    const snapshot = this.editor.innerHTML;
    let inserted = '';
    const append = (chunk) => {
      if (typeof chunk !== 'string' || chunk === '') return;
      execFormat('insertText', chunk);
      inserted += chunk;
      this.onContentChange();
    };
    return {
      append,
      commit: () => { this.onContentChange(); },
      cancel: () => {
        if (inserted) {
          this.editor.innerHTML = snapshot;
          this.onContentChange();
        }
      },
    };
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
    if (imageItem && this.insertImageFile) {
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

  // insertImageFile lives in lib/core/editor-input.js (attached by
  // applyEditorInput) so it tree-shakes out of Minimal builds.

  /**
   * Human-readable byte size, e.g. 24576 -> "24 KB".
   */
  static formatBytes(bytes) {
    if (!bytes && bytes !== 0) return '';
    const u = ['B', 'KB', 'MB', 'GB'];
    let i = 0, n = bytes;
    while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
    return `${n >= 10 || i === 0 ? Math.round(n) : n.toFixed(1)} ${u[i]}`;
  }

  /**
   * Progressive-enhance a <textarea> into an editor with TWO-WAY sync, returning
   * the editor with a controller (getValue/setValue/destroy). Defined on the
   * base Editor so it is available from the tree-shakeable `/core` entry too
   * (no need to pull the all-in-one build just for fromTextarea).
   *
   *   const ed = Editor.fromTextarea('#body', { format: 'markdown' });
   *
   * @param {HTMLTextAreaElement|string} textarea
   * @param {object} [options]  Editor options + optional `format: 'html'|'markdown'`.
   * @returns {Editor}
   */
  static fromTextarea(textarea, options = {}) {
    const ta = typeof textarea === 'string' ? document.querySelector(textarea) : textarea;
    if (!ta) throw new Error('Editor.fromTextarea: textarea not found');

    const format = options.format === 'markdown' ? 'markdown' : 'html';
    if (format === 'markdown' && typeof Editor.prototype.getMarkdown !== 'function') {
      throw new Error(
        "Editor.fromTextarea: format:'markdown' needs the serialize methods. " +
        "Use the all-in-one build, or call applySerializeMethods(Editor) from " +
        "'@oix1987/yjd/lib/core/serialize-methods.js'."
      );
    }
    // When prompt.serializeAttachments is set, fold tray attachments into the
    // synced textarea value (in the textarea's own format) so a store that reads
    // ta.value / getMarkdown() — not the submit handler's content arg — still
    // gets the attachments. No-op tail otherwise.
    const read = (ed) => {
      const base = format === 'markdown' ? ed.getMarkdown() : ed.getContent();
      const tail = ed._serializeAttachmentsTail(format);
      return tail ? base + tail : base;
    };
    const writeVal = (ed, v) => (format === 'markdown' ? ed.setMarkdown(v || '') : ed.setHTML(v || ''));

    const mount = document.createElement('div');
    ta.after(mount);
    ta.style.display = 'none';
    ta.setAttribute('aria-hidden', 'true');

    const nativeDesc = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
    let raw = ta.value || '';
    let syncing = false;

    const initial = raw;
    // `this` is the class fromTextarea was called on (Editor or a subclass).
    const editor = new this(mount, {
      width: '100%',
      ...options,
      content: options.content != null ? options.content
        : (format === 'markdown' ? '' : initial),
    });
    // Markdown initial content is applied post-construction via the (optional)
    // setMarkdown method — keeps `markdownToHtml` out of the core Editor bundle.
    if (format === 'markdown' && options.content == null && initial) {
      editor.setMarkdown(initial);
    }

    Object.defineProperty(ta, 'value', {
      configurable: true,
      get() { return raw; },
      set(v) {
        raw = v == null ? '' : String(v);
        nativeDesc.set.call(ta, raw);
        if (!syncing) writeVal(editor, raw);
      },
    });

    const onChange = () => {
      const next = read(editor);
      if (raw === next) return;
      raw = next;
      syncing = true;
      nativeDesc.set.call(ta, next);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.dispatchEvent(new Event('change', { bubbles: true }));
      syncing = false;
    };
    editor.on('change', onChange);
    onChange();

    editor.textarea = ta;
    editor.getValue = () => read(editor);
    editor.setValue = (v) => { writeVal(editor, v); };
    const baseDestroy = editor.destroy.bind(editor);
    editor.destroy = () => {
      const last = read(editor);
      editor.off('change', onChange);
      baseDestroy();
      mount.remove();
      delete ta.value;
      nativeDesc.set.call(ta, last);
      ta.style.display = '';
      ta.removeAttribute('aria-hidden');
    };
    return editor;
  }

  // openFileAttachmentPicker + insertFileAttachment live in
  // lib/core/editor-input.js (attached by applyEditorInput) so they tree-shake
  // out of Minimal builds.

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

  // linkifyBeforeCaret + handleMarkdownShortcut live in lib/core/editor-input.js
  // (attached by applyEditorInput) so they tree-shake out of Minimal builds.

  // Direction (setDirection/getDirection/toggleDirection/_getSelectedBlocks/
  // toggleTextDirection) and toggleFullscreen live in lib/core/editor-commands.js
  // so they tree-shake out of Minimal builds. Attached by applyEditorCommands().

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
   * True when an autocomplete/popup that captures Enter is open (mention, slash
   * command, emoji). Used by submit.onEnter so Enter chooses the item instead
   * of submitting. App code can call it too.
   * @returns {boolean}
   */
  isMenuOpen() {
    const m = this.modules.get('mention');
    if (m && m.isOpen) return true;
    const s = this.modules.get('slash-menu');
    if (s && s.isOpen) return true;
    // Note: the AI selection bar is intentionally NOT treated as an open menu —
    // it doesn't capture Enter, so suppressing submit would only insert a stray
    // newline. Enter-to-submit stays available while the bar floats.
    // Any visible portaled popup (emoji, link, image, table…).
    const sel = '.yjd-mention-menu, .yjd-slash-menu, .emoji-picker-popup.visible, .link-popup, .image-popup, .video-popup, .tag-popup';
    return [...document.querySelectorAll(sel)].some((el) => {
      if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return false;
      return getComputedStyle(el).display !== 'none';
    });
  }

  // clearFormatting lives in lib/core/editor-commands.js (attached by
  // applyEditorCommands) so it tree-shakes out of Minimal builds.

  /**
   * Convert the current block to a given type.
   * @param {('p'|'h1'|'h2'|'h3'|'h4'|'h5'|'h6'|'blockquote'|'pre'|'ul'|'ol')} type
   */
  setBlockType(type) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    let block = sel.getRangeAt(0).startContainer;
    block = block.nodeType === Node.TEXT_NODE ? block.parentElement : block;
    const BLOCK = /^(P|DIV|H[1-6]|BLOCKQUOTE|PRE|LI)$/;
    while (block && block !== this.editor && !BLOCK.test(block.tagName)) {
      block = block.parentElement;
    }
    if (!block || block === this.editor) return;

    const history = this.getModule('history');
    if (history && typeof history.saveBeforeFormat === 'function') history.saveBeforeFormat();

    if (type === 'ul' || type === 'ol') {
      const r = document.createRange();
      r.selectNodeContents(block);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
      execFormat(type === 'ul' ? 'insertUnorderedList' : 'insertOrderedList');
    } else {
      const el = document.createElement(type);
      while (block.firstChild) el.appendChild(block.firstChild);
      if (el.textContent === '' && !el.querySelector('*')) el.innerHTML = '<br>';
      block.replaceWith(el);
      const r = document.createRange();
      r.selectNodeContents(el);
      r.collapse(false);
      sel.removeAllRanges();
      sel.addRange(r);
    }
    this._emitChange();
    this.updatePlaceholderVisibility();
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
   * Switch the colour theme at runtime.
   * @param {'inherit'|'light'|'dark'|'auto'} theme
   */
  setTheme(theme) {
    const t = ['inherit', 'light', 'dark', 'auto'].includes(theme) ? theme : 'inherit';
    this.options.theme = t;
    this._applyThemeAttr(t);
    this.emit('theme:change', t);
    return this;
  }

  /** @returns {string} The current theme option. */
  getTheme() {
    return this.options.theme || 'inherit';
  }

  /**
   * Apply (or clear, for 'inherit') the data-theme attribute on the wrapper.
   * 'inherit' leaves it off so the editor follows the nearest ancestor theme.
   */
  _applyThemeAttr(theme) {
    if (!this.wrapper) return;
    if (theme === 'inherit') this.wrapper.removeAttribute('data-theme');
    else this.wrapper.setAttribute('data-theme', theme);
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
    const alwaysAllowedCommands = ['more', 'send', 'undo', 'redo', 'code-view', 'theme', 'text-direction', 'find', 'ai', 'fullscreen'];

    if (alwaysAllowedCommands.includes(command)) {
      // These commands can execute regardless of selection location
      switch (command) {
        case 'more':
          // More command is handled by toolbar module itself
          return;
        case 'send':
          this.submitContent();
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
          this.toggleTextDirection();
          return;
        case 'fullscreen':
          this.toggleFullscreen();
          return;
        case 'find':
          // Find/replace module listens to 'toolbar-click' and opens its panel
          return;
        case 'ai': {
          const aiMod = this.getModule('ai');
          if (aiMod && typeof aiMod.openFromToolbar === 'function') aiMod.openFromToolbar();
          return;
        }
      }
    }
    
    // For all other commands, check if current selection is in editable area
    let selection = window.getSelection();
    let isInEditableArea = this.isSelectionInEditableArea(selection);

    // No live selection in this editor — e.g. an empty or never-focused editor,
    // or the toolbar's pointerdown kept focus out. Drop the caret into this
    // editor so the command has somewhere to apply instead of doing nothing.
    if (!isInEditableArea) {
      this.restoreSelectionToEditor();
      selection = window.getSelection();
      isInEditableArea = this.isSelectionInEditableArea(selection);
    }

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
      case 'file':
        if (this.openFileAttachmentPicker) this.openFileAttachmentPicker();
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
   * Get a cached format instance for state checks (created once per editor).
   */
  _getFormatInstance(formatName) {
    if (!this._fmtCache) this._fmtCache = new Map();
    if (this._fmtCache.has(formatName)) return this._fmtCache.get(formatName);
    const FormatClass = this.registry.get(`formats/${formatName}`);
    if (!FormatClass) return null;
    let inst;
    if (FormatClass.createForEditor) {
      inst = FormatClass.createForEditor(this.instanceId);
    } else {
      const original = Editor.currentInstance;
      Editor.currentInstance = this;
      inst = new FormatClass();
      Editor.currentInstance = original;
    }
    this._fmtCache.set(formatName, inst);
    return inst;
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
        // Reuse a cached instance per format (was creating 19 instances on
        // every caret move — wasteful garbage). isActive() reads live
        // selection/DOM, so a cached instance is safe.
        const formatInstance = this._getFormatInstance(formatName);
        if (formatInstance) {
          toolbar.setButtonActive(formatName, formatInstance.isActive());
          if (formatName === 'line-height' && typeof formatInstance.updateButtonText === 'function') {
            formatInstance.updateButtonText();
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

    this.updateColorSwatches();
    this.updateHistoryButtons();
  }

  /**
   * Undo/redo are always visible (no show/hide flicker); they're just dimmed
   * and disabled when there's nothing to act on.
   */
  updateHistoryButtons() {
    const toolbar = this.getModule('toolbar');
    if (!toolbar || typeof toolbar.getButton !== 'function') return;
    const history = this.getModule('history');
    const canUndo = !!(history && typeof history.canUndo === 'function' && history.canUndo());
    const canRedo = !!(history && typeof history.canRedo === 'function' && history.canRedo());
    const setState = (btn, enabled) => {
      if (!btn) return;
      btn.classList.remove('rte-hidden');   // always shown now
      btn.disabled = !enabled;
      btn.classList.toggle('is-disabled', !enabled);
    };
    setState(toolbar.getButton('undo'), canUndo);
    setState(toolbar.getButton('redo'), canRedo);
  }

  /**
   * Reflect the colour at the caret on the toolbar's colour/background swatch
   * bars. Falls back to the CSS default (via clearing the inline style) when no
   * explicit colour is applied.
   */
  updateColorSwatches() {
    const toolbar = this.getModule('toolbar');
    if (!toolbar || typeof toolbar.getButton !== 'function') return;

    const apply = (name, color) => {
      const btn = toolbar.getButton(name);
      if (!btn) return;
      const swatch = btn.querySelector('.rte-swatch');
      if (!swatch) return;
      if (color) {
        swatch.style.background = color;
        btn.classList.add('has-color');
      } else {
        swatch.style.removeProperty('background');
        btn.classList.remove('has-color');
      }
    };

    // On a collapsed caret with no styled element yet (e.g. a colour just chosen
    // on an empty editor), fall back to the armed colour so the swatch shows now.
    const sel = window.getSelection();
    const collapsed = sel && sel.isCollapsed;
    const ColorClass = this.registry.get('formats/color');
    if (ColorClass && typeof ColorClass.getCurrentColor === 'function') {
      apply('color', ColorClass.getCurrentColor() || (collapsed ? this._armedFore : null));
    }
    const BgClass = this.registry.get('formats/background');
    if (BgClass && typeof BgClass.getCurrentColor === 'function') {
      apply('background', BgClass.getCurrentColor() || (collapsed ? this._armedBack : null));
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
    // Use isEditorEmpty() (text AND media) rather than textContent alone, so an
    // image/table-only editor doesn't keep showing the placeholder.
    const empty = this.isEditorEmpty();
    this.editor.classList.toggle('placeholder-visible', empty);

    // Render the placeholder INSIDE the first block so its ::before inherits that
    // block's direction / text-align / font / line-height and stays aligned with
    // the caret when those params change. Clear the previous host first.
    if (this._phBlock && this._phBlock.classList) {
      this._phBlock.classList.remove('rte-placeholder');
      this._phBlock.removeAttribute('data-placeholder');
    }
    this._phBlock = null;
    if (empty) {
      const block = this.editor.firstElementChild;
      if (block) {
        block.setAttribute('data-placeholder', this.editor.getAttribute('data-placeholder') || '');
        block.classList.add('rte-placeholder');
        this._phBlock = block;
      }
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

    // Remove the document-level selection listener
    if (this._onDocSelectionChange) {
      document.removeEventListener('selectionchange', this._onDocSelectionChange);
      this._onDocSelectionChange = null;
    }
    if (this._contentObserver) {
      this._contentObserver.disconnect();
      this._contentObserver = null;
    }
    clearTimeout(this._contentEmitTimer);
    if (this._fmtCache) this._fmtCache.clear();

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