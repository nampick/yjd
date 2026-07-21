import Module from '../core/module.js';
import ColorPicker from '../ui/color-picker.js';
import IconUtils, { registerIcons, S } from '../ui/icons.js';
import createCustomButton from '../ui/select-button.js';

// Icons for the prompt/chat layout's bottom action bar.
registerIcons({
  send: S('<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>'),
  plus: S('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'),
  file: S('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>')
});

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
      { group: 'tools', items: ['clear-format', 'text-direction', 'find', 'code-view', 'fullscreen'] }
    ]
  };

  constructor(editor, options = {}) {
    super(editor, options);
    this.buttons = new Map();
    this.toolbar2Visible = false;
    this.events = new Map(); // Add event system
    
    
    // Prompt/chat bottom bar — used explicitly (toolbar:'prompt') or implied by
    // layout:'prompt' when no other toolbar config is given. Bar is:
    // [ + add ] [ format tools ] … [ send ]. Overflow split is off (a compact
    // input bar wraps rather than growing a "More" row).
    const _promptLayout = this.editor.options.layout === 'prompt';
    // The prompt preset applies whenever layout:'prompt' is set — UNLESS the
    // integrator supplies an explicit toolbar layout (an items array, 'full' /
    // 'compact', or toolbar1/toolbar2). A plain config object like
    // { overflow:false } or { exclude:[…] } must NOT silently disable the
    // prompt bar (it used to fall through to the full default toolbar).
    const _explicitToolbarLayout = Array.isArray(options.toolbar) ||
      options.toolbar === 'full' || options.toolbar === 'compact' ||
      !!options.toolbar1 || !!options.toolbar2;
    const _wantPrompt = options.toolbar === 'prompt' ||
      (_promptLayout && !_explicitToolbarLayout);
    if (_promptLayout && !_wantPrompt && typeof console !== 'undefined') {
      console.warn("[yjd] layout:'prompt' with an explicit toolbar layout — the " +
        "prompt bar (add/tools/send) is not applied. Use toolbar:'prompt' (or " +
        'leave toolbar unset) to keep it.');
    }

    // Handle toolbar configuration
    if (_wantPrompt) {
      const promptCfg = this.editor.options.prompt || {};
      const tools = Array.isArray(promptCfg.tools) ? promptCfg.tools : ['bold', 'italic'];
      this.options = {
        container: null,
        toolbar1: [
          { group: 'add', items: ['add'] },
          { group: 'fmt', items: tools },
          { group: 'send', items: ['send'] }
        ],
        toolbar2: []
      };
      this._promptPreset = true;
    } else if (Array.isArray(options.toolbar)) {
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

    // { overflow: false } on the toolbar option (any config form) turns the
    // "more" split off entirely — the primary row wraps instead.
    this._overflowDisabled = this._promptPreset || !!(options.toolbar && typeof options.toolbar === 'object' &&
      !Array.isArray(options.toolbar) && options.toolbar.overflow === false);

    // Surface an AI button at the start of row 1 whenever a model is configured
    // (the AI module is otherwise inert). Dedupe so a hand-placed 'ai' in a
    // custom toolbar config isn't duplicated.
    const aiCfg = this.editor.options.ai;
    if (aiCfg && typeof aiCfg.complete === 'function') {
      const present = [this.options.toolbar1, this.options.toolbar2]
        .some(rows => (rows || []).some(g => g.items && g.items.includes('ai')));
      if (!present) {
        this.options.toolbar1 = [{ group: 'ai', items: ['ai'] }, ...(this.options.toolbar1 || [])];
      }
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
    const keepEditorFocus = (e) => {
      if (e.target.closest('button')) {
        // Make sure the editor has a caret BEFORE the command/select fires, so
        // tools work even on an empty or never-focused editor. No-ops when a
        // valid editor selection already exists (so it never hijacks one).
        if (this.editor && typeof this.editor.restoreSelectionToEditor === 'function') {
          this.editor.restoreSelectionToEditor();
        }
        e.preventDefault();
      }
    };
    container.addEventListener('pointerdown', keepEditorFocus);
    // Belt-and-suspenders for engines that fire mousedown without a preceding
    // pointerdown (older iOS WebViews): pressing a bar button — send, +add, or a
    // format tool — must never blur the contenteditable, or the soft keyboard
    // drops after every send in a chat/prompt composer. preventDefault keeps
    // focus while the click still fires the button's handler normally.
    container.addEventListener('mousedown', keepEditorFocus);

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
      // The history group (undo/redo) is pinned to the right, next to the "More"
      // button, and never overflows into the hidden panel — so the action
      // cluster [undo][redo][more] always stays together and visible, which
      // makes the "More" button read as part of that right-side group instead
      // of a lone, unexplained icon.
      if (group.group === 'history') {
        this.pinnedGroup = groupContainer;
      } else {
        this.flowGroups.push(groupContainer);
      }
    });

    // The "more" button lives at the end of the primary row; shown only when
    // there is overflow. When overflow is disabled (prompt bar, or an explicit
    // { overflow:false }) the row wraps instead, so we skip the button entirely
    // rather than leaving a hidden, focusable dead node in the DOM. reflow()
    // guards on `!this.moreBtn` and no-ops in that case.
    if (!this._overflowDisabled) {
      this.addMoreButton(this.toolbar1);
      this.moreBtn = this.buttons.get('more');
      if (this.moreBtn) this.moreBtn.classList.add('more-btn');
    }

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
    // Keep the pinned history group immediately left of the "More" button, after
    // all flow groups — so the right-side cluster is always [undo][redo][more].
    if (this.pinnedGroup) this.toolbar1.insertBefore(this.pinnedGroup, this.moreBtn);

    if (this._overflowDisabled) {
      this.moreBtn.style.display = 'none';
      this.toolbar2.style.display = 'none';
      this.toolbar2Visible = false;
      this._syncMoreButton();
      this._updateRoving();
      return;
    }

    // On touch devices, skip the "More" split entirely — keep every tool in one
    // horizontally-scrollable row (how Google Docs / Notion handle mobile)
    // instead of wrapping into a cramped multi-row panel. Gated on touch, NOT
    // viewport width, so a narrow *desktop* window still uses the "More" overflow
    // split (swipe-scroll is reserved for real touch devices). The CSS mobile
    // toolbar block uses the same query so the two stay in sync.
    if (typeof window !== 'undefined' && window.matchMedia &&
        window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
      this.moreBtn.style.display = 'none';
      this.toolbar2.style.display = 'none';
      this.toolbar2Visible = false;
      this._syncMoreButton();
      this._updateRoving();
      return;
    }

    const cs = getComputedStyle(this.toolbar1);
    const padL = parseFloat(cs.paddingLeft) || 0;
    const padR = parseFloat(cs.paddingRight) || 0;
    const avail = this.toolbar1.clientWidth - padL - padR;
    if (avail <= 0) return; // not laid out yet; will reflow on resize

    // The pinned history group always sits on the right, so it permanently
    // consumes room the flow groups can't use.
    const pinnedW = this.pinnedGroup ? this.pinnedGroup.offsetWidth + GAP : 0;

    let total = 0;
    this.flowGroups.forEach((g, i) => { total += g.offsetWidth + (i > 0 ? GAP : 0); });

    if (total + pinnedW <= avail) {
      // Everything fits (flow groups + pinned history) — no overflow needed.
      this.moreBtn.style.display = 'none';
      this.toolbar2.style.display = 'none';
      this.toolbar2Visible = false;
      this._syncMoreButton();
      this._updateRoving();
      return;
    }

    // Measure every group up front (all currently in the primary row) so the
    // same widths drive both the row-1 cut and the overflow row-packing.
    // offsetWidth excludes margins — the CSS zeroes group margins inside an
    // overflow row, so a row's spacing is exactly ROW_GAP and the budget below
    // matches what renders (no margin drift).
    const widths = this.flowGroups.map(g => g.offsetWidth);

    // Overflow needed — keep groups that fit, reserving room for the pinned
    // history group and the "More" button that share the right edge.
    const budget = avail - pinnedW - ((this.moreBtn.offsetWidth || 32) + GAP);
    let used = 0;
    let cut = this.flowGroups.length;
    for (let i = 0; i < this.flowGroups.length; i++) {
      const w = widths[i] + (i > 0 ? GAP : 0);
      if (used + w > budget) { cut = i; break; }
      used += w;
    }
    if (cut < 1) cut = 1; // always keep at least one group visible

    // Pack the overflow groups into full-width row wrappers inside toolbar-2,
    // one row per line that fits `avail`. A flex-wrap container can't draw a
    // separator between its wrapped lines, so we build real rows: each
    // .rich-editor-toolbar-2-row is one toolbar line the CSS gives even padding
    // + a border between rows. (The empty wrappers from the previous reflow are
    // gone already — every group was pulled back into toolbar1 at the top.)
    while (this.toolbar2.firstChild) this.toolbar2.removeChild(this.toolbar2.firstChild);
    const ROW_GAP = 20; // MUST match the gap on .rich-editor-toolbar-2-row in CSS
    let row = null;
    let rowUsed = 0; // sum of group widths + gaps already placed on the current row
    for (let i = cut; i < this.flowGroups.length; i++) {
      const w = widths[i];
      const need = row ? rowUsed + ROW_GAP + w : w;
      if (!row || need > avail - 1 /* sub-px safety */) {
        row = document.createElement('div');
        row.className = 'rich-editor-toolbar-2-row';
        // Match the primary row's horizontal padding exactly (it may shrink at
        // responsive breakpoints) so a row's content box equals `avail` and the
        // width budget below can never overflow the rendered row.
        row.style.paddingLeft = padL + 'px';
        row.style.paddingRight = padR + 'px';
        this.toolbar2.appendChild(row);
        rowUsed = w;
      } else {
        rowUsed = need;
      }
      row.appendChild(this.flowGroups[i]);
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
    // Send/submit button (prompt layout): accent pill, disabled while empty.
    if (format === 'send') {
      return this.addSendButton(container);
    }
    // "+" add button (prompt layout): opens a popover of insert actions.
    if (format === 'add') {
      return this.addAddButton(container);
    }

    // Custom buttons with dropdowns
    const customButtons = {
      'heading': { text: 'Paragraph', width: '150px', title: 'Paragraph style', icon: 'heading' },
      'font-family': { text: 'Font Family', width: '156px', title: 'Font', icon: 'font-family' },
      // Line-height only ever shows a short number (1.0–2.0), so size to content
      // instead of reserving room for the "Line Height" placeholder label.
      'line-height': { text: 'Line Height', width: 'auto', title: 'Line spacing', icon: 'line-height' },
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
      'ai': 'AI assistant',

      'import': 'Import Files',
      'code-view': 'Switch to HTML Editor',
      'fullscreen': 'Full screen (Esc to exit)',

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
   * Send/submit button for the prompt layout's bottom bar. Disabled while the
   * editor is empty; clicking emits a 'send' command the editor turns into a
   * submit (same handler as Enter-to-send).
   */
  addSendButton(container) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rich-editor-toolbar-btn rte-send-btn';
    button.dataset.command = 'send';
    button.title = 'Send';
    button.setAttribute('aria-label', 'Send');
    button.disabled = true; // nothing to send yet
    const icon = IconUtils.getIcon('send');
    button.innerHTML = icon ? `<span class="icon">${icon}</span>` : '&#8593;';
    button.addEventListener('click', (e) => {
      e.preventDefault();
      this.emit('toolbar-click', { command: 'send', button });
    });
    this.buttons.set('send', button);
    this.sendBtn = button;
    container.appendChild(button);
    return button;
  }

  /**
   * Reflect editor emptiness on the send button (called by the editor on every
   * content change). No-op when there's no send button.
   */
  updateSendState(isEmpty) {
    if (this.sendBtn) this.sendBtn.disabled = !!isEmpty;
  }

  /**
   * "+" add button for the prompt layout. Opens a popover of insert actions
   * (add image / file / video / table, or app-defined items). The popover
   * component is imported lazily on first open so it never touches editors that
   * don't use it.
   */
  addAddButton(container) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rich-editor-toolbar-btn rte-add-btn';
    button.dataset.command = 'add';
    button.title = 'Add';
    button.setAttribute('aria-label', 'Add');
    button.setAttribute('aria-haspopup', 'menu');
    const icon = IconUtils.getIcon('plus');
    button.innerHTML = icon ? `<span class="icon">${icon}</span>` : '+';
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      const items = this._resolveAddItems();
      const actionable = items.filter((it) => !it.separator);
      const isTouch = typeof window !== 'undefined' && window.matchMedia &&
        window.matchMedia('(hover: none) and (pointer: coarse)').matches;
      // Mobile (or a single configured item): tap "+" runs one action directly —
      // no popover. Prefer the image action. Desktop with 2+ items opens the menu
      // (add image / file / video, each attaching as a thumbnail).
      if (isTouch || actionable.length <= 1) {
        const pick = actionable.find((it) => /image/i.test(it.label || '')) || actionable[0];
        if (pick) this._onAddSelect(pick);
        return;
      }
      if (!this._addMenu) {
        const { default: AddMenu } = await import('../ui/add-menu.js');
        this._addMenu = new AddMenu({
          anchor: button,
          items,
          onSelect: (item) => this._onAddSelect(item)
        });
      }
      button.classList.toggle('open');
      this._addMenu.toggle();
    });
    this.buttons.set('add', button);
    container.appendChild(button);
    return button;
  }

  /** Built-in add items, keyed by command; each maps to an existing toolbar command. */
  static ADD_ITEMS = {
    // command → insert inline (used outside the prompt layout); kind → attach as
    // a chat thumbnail (used inside the prompt layout).
    image: { label: 'Add image', icon: 'image', command: 'image', kind: 'image' },
    file:  { label: 'Add file',  icon: 'file',  command: 'file',  kind: 'file' },
    video: { label: 'Add video', icon: 'video', command: 'video', kind: 'video' },
    table: { label: 'Add table', icon: 'table', command: 'table' }
  };

  /**
   * Resolve options.prompt.add into concrete menu items. Accepts a list of
   * built-in keys ('image' | 'file' | 'video' | 'table'), custom item objects
   * ({ label, icon?, onSelect(editor) }), or the string 'separator'. Defaults to
   * image + file + video (a desktop popover; on mobile "+" adds an image
   * directly). In the prompt layout image/file/video ATTACH as thumbnails rather
   * than inserting inline.
   */
  _resolveAddItems() {
    const cfg = (this.editor.options.prompt && this.editor.options.prompt.add) || ['image', 'file', 'video'];
    const isPrompt = this.editor.options.layout === 'prompt';
    const out = [];
    cfg.forEach((entry) => {
      if (entry === 'separator' || (entry && entry.separator)) { out.push({ separator: true }); return; }
      if (typeof entry === 'string') {
        const item = Toolbar.ADD_ITEMS[entry];
        if (!item) return;
        // Prompt: image/file/video attach as thumbnails; other built-ins (table)
        // keep their inline command.
        if (isPrompt && item.kind) {
          out.push({ label: item.label, icon: item.icon, onSelect: (ed) => ed.promptAttach(item.kind) });
        } else {
          out.push(item);
        }
      } else if (entry && (entry.command || typeof entry.onSelect === 'function')) {
        out.push(entry);
      }
    });
    return out;
  }

  /** Run a chosen add item: a built-in command reuses the existing toolbar
   *  dispatch; a custom item calls its onSelect(editor). */
  _onAddSelect(item) {
    if (!item) return;
    if (typeof item.onSelect === 'function') { item.onSelect(this.editor); return; }
    if (!item.command) return;
    // Put the caret back into the editor (the menu click moved focus out) so an
    // insert command lands where the user was typing, then dispatch the same
    // command the equivalent toolbar button would.
    this.editor.focus();
    if (typeof this.editor.restoreSelectionToEditor === 'function') {
      this.editor.restoreSelectionToEditor();
    }
    this.emit('toolbar-click', { command: item.command });
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

    // Hidden until reflow() proves there is overflow — an always-visible "⋯"
    // on a toolbar that fits is a dead affordance (and editors mounted inside
    // hidden panels never get a first successful reflow).
    button.style.display = 'none';

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