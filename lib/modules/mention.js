import Module from '../core/module.js';

/**
 * @mention module — trigger-based autocomplete that inserts a token carrying an
 * id, so the serialized HTML/Markdown can tell the server who was tagged.
 *
 *   new Editor(el, {
 *     mention: {
 *       trigger: '@',
 *       source: async (query) => [{ id, name, avatar_url }],
 *       renderItem: (item) => `<img src="${item.avatar_url}"> ${item.name}`,
 *       // optional extra triggers, e.g. '#' for task refs:
 *       triggers: [{ char: '#', source: async (q) => [...] }]
 *     }
 *   })
 *
 * Token HTML: <span class="mention" data-id="ID" data-trigger="@"
 *               contenteditable="false">@Name</span>
 * → getMarkdown() emits `@[Name](id)`. Fires editor.on('mention:select', item).
 */
export default class Mention extends Module {
  constructor(editor, options = {}) {
    super(editor, options);
    this.isOpen = false;
    this.activeIndex = 0;
    this.items = [];
    this.sources = this._buildSources();
    this.buildMenu();
    this.bindEvents();
  }

  _buildSources() {
    const cfg = this.editor.options.mention || this.options || {};
    const map = {};
    const renderItem = cfg.renderItem;
    if (typeof cfg.source === 'function') {
      map[cfg.trigger || '@'] = { source: cfg.source, renderItem: cfg.renderItem || renderItem };
    }
    (cfg.triggers || []).forEach((t) => {
      if (t && t.char && typeof t.source === 'function') {
        map[t.char] = { source: t.source, renderItem: t.renderItem || renderItem };
      }
    });
    return map;
  }

  get enabled() { return Object.keys(this.sources).length > 0; }

  buildMenu() {
    const menu = document.createElement('div');
    menu.className = 'yjd-mention-menu';
    menu.setAttribute('role', 'listbox');
    menu.style.display = 'none';
    this.menu = menu;
    document.body.appendChild(menu);
  }

  bindEvents() {
    if (!this.enabled) return;
    this._onInput = () => this.handleInput();
    this.editor.editor.addEventListener('input', this._onInput);

    this._onKeydown = (e) => {
      if (!this.isOpen) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); this.move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); this.move(-1); }
      else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); this.choose(this.activeIndex); }
      else if (e.key === 'Escape') { e.preventDefault(); this.close(); }
    };
    this.editor.editor.addEventListener('keydown', this._onKeydown, true);

    this._onDocPointer = (e) => { if (this.isOpen && !this.menu.contains(e.target)) this.close(); };
    document.addEventListener('pointerdown', this._onDocPointer, true);
  }

  handleInput() {
    const sel = window.getSelection();
    if (!sel || !sel.isCollapsed || !sel.rangeCount) return this.close();
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return this.close();

    const triggers = Object.keys(this.sources).map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('');
    const before = node.textContent.slice(0, range.startOffset);
    const m = before.match(new RegExp(`(?:^|\\s)([${triggers}])([^\\s${triggers}]*)$`));
    if (!m) return this.close();

    this.char = m[1];
    this.query = m[2];
    this.node = node;
    this.start = range.startOffset - this.query.length - 1; // index of trigger char
    this._loadFor(range);
  }

  _loadFor(range) {
    const src = this.sources[this.char];
    if (!src) return this.close();
    clearTimeout(this._t);
    const q = this.query, char = this.char;
    this._t = setTimeout(() => {
      Promise.resolve(src.source(q)).then((items) => {
        // Ignore stale responses (user kept typing / switched trigger).
        if (this.char !== char || this.query !== q) return;
        this.items = Array.isArray(items) ? items : [];
        if (!this.items.length) return this.close();
        this.activeIndex = 0;
        this.render(src.renderItem);
        this.open(range);
      }).catch(() => this.close());
    }, 120);
  }

  open(range) {
    this.isOpen = true;
    this.menu.style.display = 'block';
    const rect = range.getBoundingClientRect();
    const x = rect.left || (range.startContainer.parentElement || this.editor.editor).getBoundingClientRect().left;
    const y = rect.bottom || rect.top;
    this.menu.style.left = `${Math.round(x + window.scrollX)}px`;
    this.menu.style.top = `${Math.round(y + window.scrollY + 6)}px`;
    const mh = this.menu.offsetHeight;
    if (rect.bottom + mh + 8 > window.innerHeight) {
      this.menu.style.top = `${Math.round(rect.top + window.scrollY - mh - 6)}px`;
    }
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.menu.style.display = 'none';
  }

  move(d) {
    this.activeIndex = (this.activeIndex + d + this.items.length) % this.items.length;
    [...this.menu.children].forEach((el, i) => {
      el.classList.toggle('active', i === this.activeIndex);
      el.setAttribute('aria-selected', i === this.activeIndex ? 'true' : 'false');
    });
  }

  render(renderItem) {
    this.menu.innerHTML = '';
    this.items.forEach((item, i) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'yjd-mention-item' + (i === this.activeIndex ? ' active' : '');
      el.setAttribute('role', 'option');
      el.setAttribute('aria-selected', i === this.activeIndex ? 'true' : 'false');
      const label = item.name || item.label || item.id || '';
      el.innerHTML = typeof renderItem === 'function'
        ? renderItem(item)
        : `${item.avatar_url ? `<img class="yjd-mention-avatar" src="${item.avatar_url}" alt="">` : ''}<span class="yjd-mention-name">${this.char}${label}</span>`;
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); this.choose(i); });
      this.menu.appendChild(el);
    });
  }

  choose(index) {
    const item = this.items[index];
    if (!item) return this.close();
    const name = item.name || item.label || item.id || '';
    try {
      const node = this.node;
      const sel = window.getSelection();
      const del = document.createRange();
      del.setStart(node, this.start);
      del.setEnd(node, this.start + this.query.length + 1);
      del.deleteContents();

      const span = document.createElement('span');
      span.className = 'mention';
      span.setAttribute('data-id', String(item.id != null ? item.id : ''));
      span.setAttribute('data-trigger', this.char);
      span.setAttribute('contenteditable', 'false');
      span.textContent = this.char + name;
      del.insertNode(span);

      const space = document.createTextNode(' ');
      span.after(space);
      const caret = document.createRange();
      caret.setStart(space, 1);
      caret.collapse(true);
      sel.removeAllRanges();
      sel.addRange(caret);
    } catch (e) { /* node moved */ }

    this.close();
    this.editor.focus();
    if (typeof this.editor.onContentChange === 'function') this.editor.onContentChange();
    this.editor.emit('mention:select', item);
  }

  destroy() {
    if (this._onInput) this.editor.editor.removeEventListener('input', this._onInput);
    if (this._onKeydown) this.editor.editor.removeEventListener('keydown', this._onKeydown, true);
    if (this._onDocPointer) document.removeEventListener('pointerdown', this._onDocPointer, true);
    if (this.menu && this.menu.parentNode) this.menu.parentNode.removeChild(this.menu);
    super.destroy();
  }
}
