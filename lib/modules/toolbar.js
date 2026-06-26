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
      // Most-used inline formatting leads; the block-style (Paragraph) picker
      // sits after it rather than first.
      { group: 'text-format', items: ['bold', 'italic', 'underline', 'strike'] },
      { group: 'paragraph', items: ['heading'] },
      { group: 'colors', items: ['color', 'background'] },
      { group: 'link', items: ['link'] },
      { group: 'paragraph-ops', items: ['list', 'indent-increase', 'indent-decrease', 'text-align'] },
      { group: 'insert', items: ['image', 'table'] },
      // Undo/redo live on the right and stay hidden until there's history.
      { group: 'history', items: ['undo', 'redo'] },
      { group: 'more', items: ['more'] }
    ],
    toolbar2: [
      { group: 'font', items: ['font-family', 'text-size', 'line-height'] },
      { group: 'script', items: ['subscript', 'superscript', 'capitalization'] },
      { group: 'media', items: ['emoji', 'video', 'tag', 'horizontal-rule'] },
      { group: 'tools', items: ['clear-format', 'text-direction', 'find', 'code-view'] }
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
    } else if (options.toolbar === 'full') {
      // Explicit full preset == the defaults.
      this.options = { ...Toolbar.DEFAULTS, ...options };
    } else if (options.toolbar === 'compact') {
      // One tidy row of the essentials — good for comment boxes.
      this.options = {
        container: null,
        toolbar1: [
          { group: 'text-format', items: ['bold', 'italic', 'underline'] },
          { group: 'link', items: ['link'] },
          { group: 'paragraph-ops', items: ['list'] },
          { group: 'insert', items: ['image', 'emoji'] },
          { group: 'more', items: ['more'] }
        ],
        toolbar2: []
      };
    } else if (options.toolbar && typeof options.toolbar === 'object' && Array.isArray(options.toolbar.exclude)) {
      // Start from the defaults and drop the named items (and any group left empty).
      const drop = new Set(options.toolbar.exclude);
      const prune = (rows) => (rows || [])
        .map(g => ({ ...g, items: g.items.filter(it => !drop.has(it)) }))
        .filter(g => g.items.length && !(g.items.length === 1 && g.items[0] === 'more' && false));
      this.options = {
        container: null,
        toolbar1: prune(Toolbar.DEFAULTS.toolbar1),
        toolbar2: prune(Toolbar.DEFAULTS.toolbar2)
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
    container.setAttribute('role', 'toolbar');
    container.setAttribute('aria-label', 'Text formatting');

    // Prevent toolbar from taking focus away from editor
    this.editor.preventFocusLoss(container);

    // Keep the editor's text selection when a toolbar button is pressed (mouse
    // OR touch). Without this, tapping e.g. Bold on mobile can clear the
    // selection before the click handler runs, so the format applies to nothing.
    // preventing pointerdown's default stops the focus/selection change while
    // the click still fires normally.
    container.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) e.preventDefault();
    });

    // Primary (always-visible) row and overflow ("more") row
    this.toolbar1 = document.createElement('div');
    this.toolbar1.className = 'rich-editor-toolbar-1';
    this.toolbar2 = document.createElement('div');
    this.toolbar2.className = 'rich-editor-toolbar-2';
    this.toolbar2.style.display = 'none';

    // Build every group (toolbar1 first = higher priority, then toolbar2) into
    // the primary row. reflow() later moves whatever doesn't fit into the
    // overflow row, so the toolbar adapts to any width instead of wrapping.
    this.flowGroups = [];
    const merged = [...(this.options.toolbar1 || []), ...(this.options.toolbar2 || [])];
    merged.forEach(group => {
      if (!group || !group.group || !Array.isArray(group.items)) return;
      // The "more" toggle is managed separately (added at the end).
      if (group.items.length === 1 && group.items[0] === 'more') return;
      const groupContainer = document.createElement('div');
      groupContainer.className = `toolbar-group toolbar-group-${group.group}`;
      group.items.forEach(item => {
        if (typeof item === 'string') this.addButton(groupContainer, item);
      });
      this.toolbar1.appendChild(groupContainer);
      this.flowGroups.push(groupContainer);
    });

    // The "more" button lives at the end of the primary row; shown only when
    // there is overflow.
    this.addMoreButton(this.toolbar1);
    this.moreBtn = this.buttons.get('more');
    if (this.moreBtn) this.moreBtn.classList.add('more-btn');

    container.appendChild(this.toolbar1);
    container.appendChild(this.toolbar2);

    // Responsive reflow: re-distribute groups whenever the toolbar resizes.
    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(() => this._scheduleReflow());
      this._ro.observe(container);
    }
    requestAnimationFrame(() => this.reflow());

    // Keyboard navigation (arrow keys move between buttons; roving tabindex).
    this._setupKeyboardNav(container);

    return container;
  }

  /**
   * All currently focusable (visible, enabled) toolbar buttons in order.
   */
  _focusableButtons() {
    return Array.from(
      this.container.querySelectorAll('.rich-editor-toolbar-btn, .custom-select-button')
    ).filter(b => !b.disabled && b.offsetParent !== null);
  }

  /**
   * Roving tabindex: only one button is in the tab order at a time.
   */
  _updateRoving() {
    const btns = this._focusableButtons();
    btns.forEach((b, i) => { b.tabIndex = i === 0 ? 0 : -1; });
  }

  /**
   * Arrow-key navigation across the toolbar (ARIA toolbar pattern).
   */
  _setupKeyboardNav(container) {
    container.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      const btns = this._focusableButtons();
      if (!btns.length) return;
      const cur = btns.indexOf(document.activeElement);
      let next;
      if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = btns.length - 1;
      else if (cur === -1) next = 0;
      else next = e.key === 'ArrowRight'
        ? (cur + 1) % btns.length
        : (cur - 1 + btns.length) % btns.length;
      e.preventDefault();
      btns.forEach(b => { b.tabIndex = -1; });
      btns[next].tabIndex = 0;
      btns[next].focus();
    });
  }

  /**
   * Debounce reflow to one run per animation frame.
   */
  _scheduleReflow() {
    if (this._reflowQueued) return;
    this._reflowQueued = true;
    requestAnimationFrame(() => {
      this._reflowQueued = false;
      this.reflow();
    });
  }

  /**
   * Distribute groups between the primary row and the overflow ("more") row so
   * the primary row always fits on a single line at the current width.
   */
  reflow() {
    if (!this.toolbar1 || !this.flowGroups || !this.moreBtn) return;
    const GAP = 12; // matches .toolbar-group spacing

    // Pull every group back into the primary row (in priority order) to measure.
    this.flowGroups.forEach(g => this.toolbar1.insertBefore(g, this.moreBtn));

    // On small screens, skip the "More" split entirely — keep every tool in one
    // horizontally-scrollable row (how Google Docs / Notion handle mobile)
    // instead of wrapping into a cramped multi-row panel.
    if (typeof window !== 'undefined' && window.matchMedia &&
        window.matchMedia('(max-width: 640px)').matches) {
      this.moreBtn.style.display = 'none';
      this.toolbar2.style.display = 'none';
      this.toolbar2Visible = false;
      this._syncMoreButton();
      this._updateRoving();
      return;
    }

    const cs = getComputedStyle(this.toolbar1);
    const avail = this.toolbar1.clientWidth -
      (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    if (avail <= 0) return; // not laid out yet; will reflow on resize

    let total = 0;
    this.flowGroups.forEach((g, i) => { total += g.offsetWidth + (i > 0 ? GAP : 0); });

    if (total <= avail) {
      // Everything fits — no overflow needed.
      this.moreBtn.style.display = 'none';
      this.toolbar2.style.display = 'none';
      this.toolbar2Visible = false;
      this._syncMoreButton();
      this._updateRoving();
      return;
    }

    // Overflow needed — keep groups that fit (reserving room for "more").
    const budget = avail - ((this.moreBtn.offsetWidth || 32) + GAP);
    let used = 0;
    let cut = this.flowGroups.length;
    for (let i = 0; i < this.flowGroups.length; i++) {
      const w = this.flowGroups[i].offsetWidth + (i > 0 ? GAP : 0);
      if (used + w > budget) { cut = i; break; }
      used += w;
    }
    if (cut < 1) cut = 1; // always keep at least one group visible

    for (let i = cut; i < this.flowGroups.length; i++) {
      this.toolbar2.appendChild(this.flowGroups[i]);
    }

    this.moreBtn.style.display = '';
    this.toolbar2.style.display = this.toolbar2Visible ? 'flex' : 'none';
    this._syncMoreButton();
    this._updateRoving();
  }

  /**
   * Sync the "more" button visual state with toolbar2 visibility.
   */
  _syncMoreButton() {
    const m = this.moreBtn;
    if (!m) return;
    m.setAttribute('aria-expanded', this.toolbar2Visible ? 'true' : 'false');
    if (this.toolbar2Visible) {
      m.classList.add('active');
      m.title = 'Hide more options';
    } else {
      m.classList.remove('active');
      m.title = 'More options';
    }
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
      'heading': { text: 'Paragraph', width: '124px', title: 'Paragraph style', icon: 'heading' },
      'font-family': { text: 'Font Family', width: '156px', title: 'Font', icon: 'font-family' },
      'line-height': { text: 'Line Height', width: '116px', title: 'Line spacing', icon: 'line-height' },
      'capitalization': { text: 'Capitalization', width: '146px', title: 'Letter case', icon: 'capitalization' },
      'text-size': { text: 'Text Size', width: '116px', title: 'Font size', icon: 'text-size' }
    };

    if (customButtons[format]) {
      const config = customButtons[format];
      const customButton = createCustomButton(config.text, { width: config.width, icon: config.icon });
      customButton.dataset.command = format;
      customButton.classList.add('rich-editor-toolbar-btn', `${format}-btn`);
      customButton.title = config.title;
      customButton.setAttribute('aria-label', config.title);
      customButton.setAttribute('aria-haspopup', 'true');
      
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
      button.setAttribute('aria-label', config.title);

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
      'file': 'Attach File',
      'video': 'Insert Video',
      'tag': 'Insert Tag',
      'horizontal-rule': 'Insert Horizontal Rule',
      'clear-format': 'Clear Formatting',
      'text-direction': 'Toggle Text Direction (LTR/RTL)',
      'find': 'Find & Replace (Ctrl+F)',

      'import': 'Import Files',
      'code-view': 'Switch to HTML Editor',

    };
    
    button.title = titles[format] || format;
    button.setAttribute('aria-label', button.title);

    // Colour buttons get a swatch bar that reflects the colour at the caret.
    if (format === 'color' || format === 'background') {
      const swatch = document.createElement('span');
      swatch.className = 'rte-swatch';
      button.appendChild(swatch);
    }

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
    button.setAttribute('aria-label', 'More Options');
    button.setAttribute('aria-expanded', 'false');

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
    // Nothing to toggle when there's no overflow.
    if (this.moreBtn && this.moreBtn.style.display === 'none') return;

    this.toolbar2Visible = !this.toolbar2Visible;
    this.toolbar2.style.display = this.toolbar2Visible ? 'flex' : 'none';
    this._syncMoreButton();
    this._updateRoving();
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
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
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
    if (this._ro) {
      this._ro.disconnect();
      this._ro = null;
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.buttons.clear();
    this.events.clear();
  }
}

export default Toolbar; 