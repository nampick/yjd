import Module from '../core/module.js';

/**
 * Merge-tag variable chips (#78) — declared `{token}` placeholders rendered as
 * atomic inline chips with a trigger picker and a sample-value preview.
 *
 *   new Editor(el, {
 *     variables: {
 *       trigger: '{',                       // typing it opens the picker
 *       items: {
 *         shopName: { label: 'Shop name', sample: 'acme-store' },
 *         month:    { label: 'Month',     sample: 'August' },
 *       },
 *     },
 *   })
 *
 * Chip HTML: <span class="yjd-var mention" data-var="shopName"
 *              data-token="{shopName}" contenteditable="false">{shopName}</span>
 *
 * The 'mention' class is deliberate: every existing token path (getText(),
 * plainText flattening, markdown serialization) already emits
 * `.mention[data-token]` as its token, so chips inherit correct text
 * serialization for free. getContent()/getHTML() additionally downgrade chips
 * to their raw token text via Editor#_serializeAtoms, so the stored document
 * format stays "plain text + tokens" — nothing proprietary.
 */
export default class Variables extends Module {
  static THEME_VARS = ['--rte-bg', '--rte-chrome', '--rte-chrome-2', '--rte-ink', '--rte-muted', '--rte-border', '--rte-border-strong', '--rte-accent', '--rte-accent-ink', '--rte-accent-weak', '--rte-accent-ink-on', '--rte-radius-md', '--rte-shadow'];

  constructor(editor, options = {}) {
    super(editor, options);
    const cfg = editor.options.variables || options || {};
    this.trigger = cfg.trigger || '{';
    this.items = cfg.items && typeof cfg.items === 'object' ? cfg.items : {};
    this.isOpen = false;
    this.activeIndex = 0;
    this.filtered = [];
    this._previewOn = false;
    if (!this.enabled) return;
    this.buildMenu();
    this.bindEvents();
    // Upgrade tokens already present in the initial content.
    this.upgrade(this.editor.editor);
  }

  get enabled() { return Object.keys(this.items).length > 0; }

  /* ------------------------------ chips ------------------------------ */

  tokenFor(name) { return this.trigger + name + this._closer(); }

  _closer() {
    // '{' → '}', '{{'-style triggers are the blocks module's territory; other
    // single-char triggers (e.g. '%') close with the same char.
    return this.trigger === '{' ? '}' : this.trigger;
  }

  makeChip(name) {
    const item = this.items[name];
    const span = document.createElement('span');
    span.className = 'yjd-var mention';
    span.setAttribute('data-var', name);
    span.setAttribute('data-token', this.tokenFor(name));
    span.setAttribute('contenteditable', 'false');
    if (item && item.sample != null) span.setAttribute('data-sample', String(item.sample));
    if (item && item.label) span.title = item.label + (item.sample != null ? ' — e.g. ' + item.sample : '');
    span.textContent = this._previewOn && item && item.sample != null
      ? String(item.sample) : this.tokenFor(name);
    return span;
  }

  /**
   * Upgrade declared raw tokens in `root`'s text nodes to chips. Undeclared
   * `{foo}` stays plain text. Used on init, after setContent, and after AI
   * restores.
   */
  upgrade(root) {
    if (!this.enabled || !root) return;
    const names = Object.keys(this.items);
    if (!names.length) return;
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(names.map((n) => esc(this.tokenFor(n))).join('|'), 'g');
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) =>
        // Never re-tokenize inside an existing chip/card.
        n.parentElement && n.parentElement.closest('.yjd-var, .yjd-slot, [contenteditable="false"]')
          ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    const hits = [];
    let t;
    while ((t = walker.nextNode())) { if (re.test(t.textContent)) hits.push(t); re.lastIndex = 0; }
    hits.forEach((textNode) => {
      const frag = document.createDocumentFragment();
      let last = 0;
      const s = textNode.textContent;
      s.replace(re, (m, idx) => {
        if (idx > last) frag.appendChild(document.createTextNode(s.slice(last, idx)));
        const name = m.slice(this.trigger.length, m.length - this._closer().length);
        frag.appendChild(this.makeChip(name));
        last = idx + m.length;
        return m;
      });
      if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
      textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  /* ----------------------------- preview ----------------------------- */

  /**
   * Toggle sample-value preview: every chip displays its sample instead of its
   * token, and the editor is edit-locked while active (reading, not writing).
   */
  setPreview(on) {
    this._previewOn = !!on;
    this.editor.editor.querySelectorAll('.yjd-var[data-var]').forEach((chip) => {
      const name = chip.getAttribute('data-var');
      const item = this.items[name];
      chip.textContent = this._previewOn && item && item.sample != null
        ? String(item.sample) : this.tokenFor(name);
      chip.classList.toggle('yjd-var-preview', this._previewOn);
    });
    this.editor.editor.setAttribute('contenteditable', this._previewOn ? 'false' : 'true');
  }

  /* ------------------------------ picker ----------------------------- */

  buildMenu() {
    const menu = document.createElement('div');
    menu.className = 'yjd-mention-menu yjd-var-menu';
    menu.setAttribute('role', 'listbox');
    menu.style.display = 'none';
    this.menu = menu;
    document.body.appendChild(menu);
  }

  bindEvents() {
    this._onInput = () => this.handleInput();
    this.editor.editor.addEventListener('input', this._onInput);

    this._onKeydown = (e) => {
      if (!this.isOpen) return;
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
    const before = node.textContent.slice(0, range.startOffset);
    const trig = this.trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = before.match(new RegExp(`(?:^|\\s)${trig}([A-Za-z0-9_]*)$`));
    if (!m) return this.close();
    this.query = m[1];
    this.node = node;
    this.start = range.startOffset - this.query.length - this.trigger.length;
    const q = this.query.toLowerCase();
    this.filtered = Object.keys(this.items).filter((n) =>
      n.toLowerCase().includes(q) ||
      String(this.items[n].label || '').toLowerCase().includes(q));
    if (!this.filtered.length) return this.close();
    this.activeIndex = 0;
    this.render();
    this.open(range);
  }

  render() {
    this.menu.innerHTML = '';
    this.filtered.forEach((name, i) => {
      const item = this.items[name];
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'yjd-mention-item' + (i === this.activeIndex ? ' active' : '');
      row.setAttribute('role', 'option');
      const tok = document.createElement('span');
      tok.className = 'yjd-var-token';
      tok.textContent = this.tokenFor(name);
      const label = document.createElement('span');
      label.className = 'yjd-var-label';
      label.textContent = (item.label || name) + (item.sample != null ? ' · ' + item.sample : '');
      row.append(tok, label);
      row.addEventListener('pointerdown', (e) => e.preventDefault());
      row.addEventListener('click', () => this.choose(i));
      this.menu.appendChild(row);
    });
  }

  open(range) {
    const rect = range.getBoundingClientRect();
    Variables.THEME_VARS.forEach((v) => {
      const val = getComputedStyle(this.editor.wrapper).getPropertyValue(v);
      if (val) this.menu.style.setProperty(v, val);
    });
    this.menu.style.display = 'block';
    this.menu.style.position = 'fixed';
    this.menu.style.left = Math.round(rect.left) + 'px';
    this.menu.style.top = Math.round(rect.bottom + 4) + 'px';
    this.isOpen = true;
  }

  close() {
    if (!this.isOpen) return;
    this.menu.style.display = 'none';
    this.isOpen = false;
  }

  move(delta) {
    if (!this.filtered.length) return;
    this.activeIndex = (this.activeIndex + delta + this.filtered.length) % this.filtered.length;
    [...this.menu.children].forEach((el, i) => el.classList.toggle('active', i === this.activeIndex));
  }

  choose(i) {
    const name = this.filtered[i];
    if (!name || !this.node) return this.close();
    const history = this.editor.getModule('history');
    if (history && typeof history.saveBeforeFormat === 'function') history.saveBeforeFormat();

    // Replace "{query" with the chip + a trailing space.
    const del = document.createRange();
    del.setStart(this.node, this.start);
    del.setEnd(this.node, this.start + this.trigger.length + this.query.length);
    del.deleteContents();
    const chip = this.makeChip(name);
    del.insertNode(chip);
    const space = document.createTextNode(' ');
    chip.after(space);
    const caret = document.createRange();
    caret.setStart(space, 1);
    caret.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(caret);

    this.close();
    this.editor.emit('variable:insert', { name });
    if (typeof this.editor.onContentChange === 'function') this.editor.onContentChange();
  }

  destroy() {
    if (this._onInput) this.editor.editor.removeEventListener('input', this._onInput);
    if (this._onKeydown) this.editor.editor.removeEventListener('keydown', this._onKeydown, true);
    if (this._onDocPointer) document.removeEventListener('pointerdown', this._onDocPointer, true);
    if (this.menu && this.menu.parentNode) this.menu.parentNode.removeChild(this.menu);
  }
}
