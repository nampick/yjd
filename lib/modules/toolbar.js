import Module from '../core/module.js';
import ColorPicker from '../ui/color-picker.js';
import IconUtils, { registerIcons, S } from '../ui/icons.js';
import createCustomButton from '../ui/select-button.js';

// Icons for the prompt/chat layout's bottom action bar.
registerIcons({
  send: S('<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>'),
  plus: S('<path d="M12 5v14"/><path d="M5 12h14"/>'),
  file: S('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'),
  quote: S('<path d="M4 5v14"/><path d="M9 8h11"/><path d="M9 13h8"/><path d="M9 18h11"/>'),
  print: S('<path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7" rx="1"/>'),
  download: S('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>'),
  date: S('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/>')
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
      // UI 2.0 v2 chrome bar: the sixteen primary tools that earn their
      // place — history · block picker · B I U S · colour+highlight ·
      // list+align · link/image/table. Everything else lives in the counted
      // overflow row behind the "⋯ +N" toggle.
      { group: 'history', items: ['undo', 'redo'] },
      { group: 'paragraph', items: ['heading'] },
      { group: 'text-format', items: ['bold', 'italic', 'underline', 'strike'] },
      { group: 'colors', items: ['color', 'background'] },
      { group: 'paragraph-ops', items: ['list', 'text-align'] },
      { group: 'insert', items: ['link', 'image', 'table'] },
      // The "more" toggle (with its overflow count) and the auto-injected AI
      // group sit on the right.
      { group: 'more', items: ['more'] }
    ],
    toolbar2: [
      { group: 'font', items: ['font-family', 'text-size'] },
      { group: 'script', items: ['superscript', 'subscript', 'code', 'clear-format', 'capitalization'] },
      { group: 'rhythm', items: ['indent-increase', 'indent-decrease', 'line-height', 'letter-spacing'] },
      { group: 'blocks', items: ['quote'] },
      { group: 'media', items: ['video', 'emoji', 'file', 'tag', 'horizontal-rule'] },
      { group: 'tools', items: ['find', 'code-view', 'text-direction', 'import', 'fullscreen'] }
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
      // `format` is the intuitive name integrators reach for; `tools` is the
      // historical one. Accept both — an explicit [] means "no format buttons",
      // so the empty group is dropped instead of rendering an empty pill. (#62)
      let tools = Array.isArray(promptCfg.format) ? promptCfg.format
        : (Array.isArray(promptCfg.tools) ? promptCfg.tools : ['bold', 'italic']);
      // Plain-text mode: format buttons would be promises the host breaks on
      // save — none render, whatever the config says. (#60)
      if (this.editor.options.plainText) {
        if (tools.length && (promptCfg.format || promptCfg.tools) && typeof console !== 'undefined') {
          console.warn('[yjd] plainText:true — prompt format buttons are disabled; ' +
            'the configured prompt.format/tools list is ignored.');
        }
        tools = [];
      }
      // Send is a submit affordance — without a submit handler there is nothing
      // to send, so don't render a dead button (e.g. a prompt-styled field in a
      // settings form). (#63)
      const submitCfg = this.editor.options.submit;
      const hasSubmit = !!(submitCfg &&
        (typeof submitCfg.onSubmit === 'function' || typeof submitCfg.onEnter === 'function'));
      this.options = {
        container: null,
        toolbar1: [
          { group: 'add', items: ['add'] },
          ...(tools.length ? [{ group: 'fmt', items: tools }] : []),
          ...(hasSubmit ? [{ group: 'send', items: ['send'] }] : [])
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
    } else if (this.editor.options.plainText) {
      // Plain-text mode without an explicit layout: no formatting controls to
      // offer — just history. (An explicit toolbar config above is honoured,
      // but its format buttons are inert; see Editor#toggleFormat.) (#60)
      this.options = {
        container: null,
        toolbar1: [{ group: 'history', items: ['undo', 'redo'] }],
        toolbar2: []
      };
    } else {
      // Use full default configuration
      this.options = { ...Toolbar.DEFAULTS, ...options };
    }

    // { overflow: false } on the toolbar option (any config form) turns the
    // "more" split off entirely — the primary row wraps instead.
    this._overflowDisabled = this._promptPreset || !!(options.toolbar && typeof options.toolbar === 'object' &&
      !Array.isArray(options.toolbar) && options.toolbar.overflow === false);

    // Surface an "Ask AI" pill on the right of row 1 whenever a model is
    // configured (the AI module is otherwise inert) — UI 2.0 places AI
    // affordances on the accent, right-aligned before the "more" toggle.
    // Dedupe so a hand-placed 'ai' in a custom toolbar config isn't duplicated.
    const aiCfg = this.editor.options.ai;
    if (aiCfg && typeof aiCfg.complete === 'function') {
      const present = [this.options.toolbar1, this.options.toolbar2]
        .some(rows => (rows || []).some(g => g.items && g.items.includes('ai')));
      if (!present) {
        // v2 order: [spacer] ⋯+N · divider · Ask AI (AI sits outermost right).
        this.options.toolbar1 = [...(this.options.toolbar1 || []), { group: 'ai', items: ['ai'] }];
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
    container.setAttribute('aria-label', this.editor.t('toolbar.aria', 'Text formatting'));

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

    // UI 2.0 v2: toolbar1 = the primary row; toolbar2 = the FIXED overflow —
    // its tools never promote into row 1, they live behind the counted "⋯ +N"
    // toggle. reflow() may still DEMOTE primary groups into the overflow row
    // when the editor is too narrow.
    this.flowGroups = [];
    this.overflowGroups = [];
    const buildGroup = (group) => {
      const groupContainer = document.createElement('div');
      groupContainer.className = `toolbar-group toolbar-group-${group.group}`;
      group.items.forEach(item => {
        if (typeof item === 'string') this.addButton(groupContainer, item);
      });
      return groupContainer;
    };
    (this.options.toolbar1 || []).forEach(group => {
      if (!group || !group.group || !Array.isArray(group.items)) return;
      // The "more" toggle is managed separately (added at the end).
      if (group.items.length === 1 && group.items[0] === 'more') return;
      const groupContainer = buildGroup(group);
      this.toolbar1.appendChild(groupContainer);
      // The AI group is pinned outermost right and never overflows.
      if (group.group === 'ai') {
        this.pinnedGroup = groupContainer;
      } else {
        this.flowGroups.push(groupContainer);
      }
    });
    (this.options.toolbar2 || []).forEach(group => {
      if (!group || !group.group || !Array.isArray(group.items)) return;
      // Built detached; reflow() places them in the overflow row.
      this.overflowGroups.push(buildGroup(group));
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
   * Resolved --rte-gap token in px (the spacing between toolbar groups).
   * Read from the rendered toolbar so :root/ancestor/wrapper overrides apply.
   */
  _gapToken() {
    if (this.toolbar1) {
      const v = parseFloat(getComputedStyle(this.toolbar1).getPropertyValue('--rte-gap'));
      if (!Number.isNaN(v)) return v;
    }
    return 6;
  }

  /**
   * Distribute groups between the primary row and the overflow ("more") row so
   * the primary row always fits on a single line at the current width.
   */
  reflow() {
    if (!this.toolbar1 || !this.flowGroups || !this.moreBtn) return;
    // Group spacing follows the --rte-gap token (the CSS uses the same var for
    // the sibling margin and the overflow row's flex gap), so a themed editor
    // that overrides the token reflows with the right budget automatically.
    const GAP = this._gapToken();

    // Pull every primary group back into row 1 (in priority order) to measure.
    this.flowGroups.forEach(g => this.toolbar1.insertBefore(g, this.moreBtn));
    // Keep the pinned AI group OUTERMOST right, after the "⋯ +N" toggle —
    // the v2 right cluster is [spacer][⋯ +N][divider][Ask AI].
    if (this.pinnedGroup) this.toolbar1.appendChild(this.pinnedGroup);

    if (this._overflowDisabled) {
      // No overflow UI at all — everything (incl. the fixed overflow groups)
      // lives inline on the wrapping primary row.
      this.overflowGroups.forEach(g => this.toolbar1.insertBefore(g, this.moreBtn));
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

    // Touch devices: the primary row swipe-scrolls (CSS), so nothing demotes —
    // but the fixed overflow keeps its counted "⋯ +N" toggle.
    const isTouch = typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    // The pinned AI group + the always-present toggle consume right-edge room.
    const pinnedW = this.pinnedGroup ? this.pinnedGroup.offsetWidth + GAP : 0;
    const moreW = (this.moreBtn.offsetWidth || 52) + GAP;

    // v2: the overflow is FIXED — toolbar2 tools never promote into row 1.
    // Row 1 only DEMOTES its own tail groups when the editor is too narrow.
    const widths = this.flowGroups.map(g => g.offsetWidth);
    let cut = this.flowGroups.length;
    if (!isTouch) {
      const budget = avail - pinnedW - moreW;
      let used = 0;
      for (let i = 0; i < this.flowGroups.length; i++) {
        const w = widths[i] + (i > 0 ? GAP : 0);
        if (used + w > budget) { cut = i; break; }
        used += w;
      }
      if (cut < 1) cut = 1; // always keep at least one group visible
    }

    // Everything bound for the overflow, in order: demoted primary tail groups,
    // then the fixed overflow groups.
    const overflowGroups = [...this.flowGroups.slice(cut), ...this.overflowGroups];
    // Measure the FIXED overflow groups' widths by borrowing the visible primary
    // row for one synchronous read (they otherwise live detached / in a hidden
    // toolbar2, where offsetWidth is 0). The demoted groups' widths are already
    // known from `widths`.
    const fixedW = this.overflowGroups.map((g) => {
      this.toolbar1.insertBefore(g, this.moreBtn);
      return g.offsetWidth;
    });
    const overflowW = [...widths.slice(cut), ...fixedW];

    // Pack the overflow into MULTIPLE non-wrapping rows (one per line that fits
    // `avail`), the layout the CSS is built for: dividers sit between groups
    // WITHIN a row and a hairline border separates ROWS — never a stray divider
    // stranded at a wrapped line start (the old single flex-wrap row's mess).
    while (this.toolbar2.firstChild) this.toolbar2.removeChild(this.toolbar2.firstChild);
    let curRow = null, rowUsed = 0;
    const startRow = () => {
      curRow = document.createElement('div');
      curRow.className = 'rich-editor-toolbar-2-row yjd-noscroll';
      curRow.style.paddingLeft = padL + 'px';
      curRow.style.paddingRight = padR + 'px';
      this.toolbar2.appendChild(curRow);
      rowUsed = 0;
    };
    overflowGroups.forEach((g, i) => {
      const w = overflowW[i];
      if (!curRow || (rowUsed > 0 && rowUsed + GAP + w > avail)) startRow();
      curRow.appendChild(g);
      rowUsed += (rowUsed > 0 ? GAP : 0) + w;
    });

    const hasOverflow = this.overflowGroups.length > 0 || cut < this.flowGroups.length;
    this.moreBtn.style.display = hasOverflow ? '' : 'none';
    this.toolbar2.style.display = hasOverflow && this.toolbar2Visible ? 'flex' : 'none';
    if (!hasOverflow) this.toolbar2Visible = false;
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
    // Count the tools currently folded into the overflow row.
    const n = this.toolbar2 ? this.toolbar2.querySelectorAll('.rich-editor-toolbar-btn, .custom-select-button').length : 0;
    if (this.moreCountEl) {
      this.moreCountEl.textContent = n ? (this.toolbar2Visible ? String(n) : `+${n}`) : '';
    }
    if (this.toolbar2Visible) {
      m.classList.add('active', 'open');
      m.title = n ? this.editor.t('toolbar.hideNTools', 'Hide {n} more tools', { n }) : this.editor.t('toolbar.hideMore', 'Hide more options');
    } else {
      m.classList.remove('active');
      m.classList.remove('open');
      m.title = n ? this.editor.t('toolbar.showNTools', 'Show {n} more tools', { n }) : this.editor.t('toolbar.showMore', 'More options');
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

    // Custom buttons with dropdowns. Width is content-driven: a long value
    // ("X-Large", "Comic Sans MS") widens the trigger instead of truncating.
    const customButtons = {
      'heading': { text: this.editor.t('toolbar.headingTrigger', 'Paragraph'), width: 'auto', title: this.editor.t('toolbar.headingTitle', 'Paragraph style') },
      'font-family': { text: this.editor.t('toolbar.fontTrigger', 'Font Family'), width: 'auto', title: this.editor.t('toolbar.fontTitle', 'Font') },
      'text-size': { text: this.editor.t('toolbar.sizeTrigger', 'Text Size'), width: 'auto', title: this.editor.t('toolbar.sizeTitle', 'Font size') }
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
      'text-align': { icon: 'text-align', title: this.editor.t('toolbar.text-align', 'Text align') },
      'list': { icon: 'list', title: this.editor.t('toolbar.list', 'List') }
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

    // UI 2.0: the AI trigger is a labelled accent pill ("Ask AI"), not a bare
    // icon — the accent is reserved for AI affordances so it reads as a layer.
    if (format === 'ai') {
      const label = document.createElement('span');
      label.className = 'rte-btn-label';
      label.textContent = 'Ask AI';
      button.appendChild(label);
    }

    // Set title based on format
    const titles = {
      'bold': 'Bold · ⌘B',
      'italic': 'Italic · ⌘I',
      'underline': 'Underline · ⌘U',
      'strike': 'Strikethrough',
      'code': 'Inline code',
      'subscript': 'Subscript',
      'superscript': 'Superscript',
      'color': 'Text Color',
      'background': 'Highlight',
      'link': 'Link · ⌘K',
      'table': 'Insert Table',
      'undo': 'Undo · ⌘Z',
      'redo': 'Redo · ⇧⌘Z',
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
      'quote': 'Blockquote',
      'line-height': 'Line spacing',
      'capitalization': 'Letter case',
      'print': 'Print',
      'download': 'Download',
      'letter-spacing': 'Letter spacing',
      'date': 'Insert date',
      'find': 'Find & replace · ⌘F',
      'ai': 'AI assistant',

      'import': 'Import Files',
      'code-view': 'Switch to HTML Editor',
      'fullscreen': 'Full screen (Esc to exit)',

    };
    // Localisable: options.strings can override any tooltip via a 'toolbar.<fmt>'
    // key, falling back to the English text above.
    const enTitle = titles[format] || format;
    button.title = (this.editor && typeof this.editor.t === 'function')
      ? this.t('toolbar.' + format, enTitle) : enTitle;
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
          iconElement.style.fontWeight = '500';
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
    button.title = this.t('toolbar.send', 'Send');
    button.setAttribute('aria-label', button.title);
    button.disabled = true; // nothing to send yet
    const icon = IconUtils.getIcon('send');
    button.innerHTML = icon ? `<span class="icon">${icon}</span>` : '&#8593;';
    button.addEventListener('click', (e) => {
      e.preventDefault();
      this.emit('toolbar-click', { command: 'send', button });
    });
    // Optional token/cost meter for AI prompt inputs — shown left of send.
    const tcfg = this.editor.options.prompt && this.editor.options.prompt.tokens;
    if (tcfg) {
      const meter = document.createElement('span');
      meter.className = 'rte-token-meter';
      meter.setAttribute('aria-live', 'polite');
      this.tokenMeter = meter;
      this._tokenCfg = tcfg === true ? {} : tcfg;
      container.appendChild(meter);
      this.updateTokenMeter(this.editor.getText ? this.editor.getText() : '');
    }
    this.buttons.set('send', button);
    this.sendBtn = button;
    container.appendChild(button);
    return button;
  }

  /**
   * Reflect editor emptiness on the send button (called by the editor on every
   * content change). No-op when there's no send button.
   */
  /** Refresh the prompt token/cost meter for the given message text. */
  updateTokenMeter(text) {
    if (!this.tokenMeter) return;
    const c = this._tokenCfg || {};
    const n = typeof c.estimate === 'function' ? c.estimate(text) : Math.ceil((text || '').length / 4);
    let label = typeof c.label === 'function' ? c.label(n)
      : (n >= 1000 ? `~${(n / 1000).toFixed(1)}k` : `~${n}`) + ' tokens';
    if (typeof c.costPer1k === 'number' && n > 0) {
      label += ` · ${c.currency || '$'}${((n / 1000) * c.costPer1k).toFixed(c.costPer1k < 0.1 ? 4 : 2)}`;
    }
    this.tokenMeter.textContent = n > 0 ? label : '';
  }

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
    button.title = this.t('toolbar.add', 'Add');
    button.setAttribute('aria-label', button.title);
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
          head: this.t('addMenu.head', 'Attach'),
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
    const isPrompt = this.editor.options.layout === 'prompt';
    // Prompt keeps its attach-first defaults; the standard layout's "+" is the
    // design's block-insert menu, so table joins the defaults there.
    const cfg = (this.editor.options.prompt && this.editor.options.prompt.add) ||
      (isPrompt ? ['image', 'file', 'video'] : ['image', 'file', 'video', 'table']);
    const out = [];
    cfg.forEach((entry) => {
      if (entry === 'separator' || (entry && entry.separator)) { out.push({ separator: true }); return; }
      if (typeof entry === 'string') {
        const item = Toolbar.ADD_ITEMS[entry];
        if (!item) return;
        // Localisable label: 'addMenu.<key>' overrides the built-in English.
        const label = (typeof this.editor.t === 'function')
          ? this.t('addMenu.' + entry, item.label) : item.label;
        // Prompt: image/file/video attach as thumbnails; other built-ins (table)
        // keep their inline command.
        if (isPrompt && item.kind) {
          out.push({ label, icon: item.icon, onSelect: (ed) => ed.promptAttach(item.kind) });
        } else {
          out.push({ ...item, label });
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
    // Counted overflow (UI 2.0 v2): "+N" tools behind the toggle, "N" while open.
    const count = document.createElement('span');
    count.className = 'rte-more-count';
    button.appendChild(count);
    this.moreCountEl = count;
    button.title = this.t('toolbar.more', 'More Options');
    button.setAttribute('aria-label', button.title);
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