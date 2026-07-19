import Module from '../core/module.js';
import { sanitizeHtml, isSafeUrl } from '../utils/sanitize.js';

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
  // --rte-* theme vars copied onto the portaled menu when it opens, so it
  // matches the editor — including dark mode and custom app theming.
  static THEME_VARS = ['--rte-bg', '--rte-chrome', '--rte-chrome-2', '--rte-ink', '--rte-muted', '--rte-border', '--rte-border-strong', '--rte-accent', '--rte-accent-ink', '--rte-accent-weak', '--rte-accent-ink-on', '--rte-radius-md', '--rte-shadow'];

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
      // Stop here (capture phase) so an outer Enter-to-submit handler doesn't
      // also fire once choose() closes the menu.
      const handled = ['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(e.key);
      if (handled) { e.preventDefault(); e.stopPropagation(); }
      if (e.key === 'ArrowDown') this.move(1);
      else if (e.key === 'ArrowUp') this.move(-1);
      else if (e.key === 'Enter' || e.key === 'Tab') this.choose(this.activeIndex);
      else if (e.key === 'Escape') this.close();
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
    this._applyTheme();
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

  /**
   * The menu is portaled to <body>, so it can't inherit the editor's --rte-*
   * theme vars. Copy them across when opening so a themed editor themes its
   * mention menu too (no need to re-declare the vars on .yjd-mention-menu).
   */
  _applyTheme() {
    const root = this.editor.wrapper || this.editor.root;
    if (!root) return;
    const cs = getComputedStyle(root);
    Mention.THEME_VARS.forEach((v) => {
      const val = cs.getPropertyValue(v);
      if (val) this.menu.style.setProperty(v, val.trim());
    });
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
      if (typeof renderItem === 'function') {
        // App-supplied markup — sanitize as defense-in-depth so injected mention
        // data (e.g. a name/avatar pulled from a user directory) can't run script.
        el.innerHTML = sanitizeHtml(String(renderItem(item) ?? ''));
      } else {
        // Default row built via DOM APIs so item fields (avatar_url, name) are
        // treated as data, never as markup. avatar_url is URL-validated so a
        // javascript:/hostile value can't reach the img src.
        if (item.avatar_url && isSafeUrl(item.avatar_url, { allowDataImage: true })) {
          const img = document.createElement('img');
          img.className = 'yjd-mention-avatar';
          img.src = item.avatar_url;
          img.alt = '';
          el.appendChild(img);
        } else if (item.icon) {
          const ico = document.createElement('span');
          ico.className = 'yjd-mention-ico';
          // icon may be an inline SVG/HTML glyph for special entries (e.g. "@all").
          ico.innerHTML = sanitizeHtml(String(item.icon));
          el.appendChild(ico);
        }
        const nameEl = document.createElement('span');
        nameEl.className = 'yjd-mention-name';
        nameEl.textContent = this.char + label;
        el.appendChild(nameEl);
      }
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
