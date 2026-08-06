import Module from '../core/module.js';

/**
 * Side panel (UI 2.0 editor surface) — the design's right rail with three
 * tabs: Outline · Comments · Versions.
 *
 * - Outline: live heading tree (H1–H3); click scrolls the heading into view.
 * - Comments: anchored to the selection as a `data-comment-id` mark; the
 *   thread data stays in memory — read/persist via getComments()/setComments()
 *   and the comment:add / comment:remove / comment:click events.
 * - Versions: manual snapshots (saveVersion(label)) restorable in one undo
 *   step; read/persist via getVersions()/setVersions().
 *
 * Opt-in: `sidePanel: true` (or `{ tabs: ['outline','comments','versions'] }`).
 * The rail lives OUTSIDE the content DOM — nothing extra serializes except
 * the comment marks themselves (plain spans, sanitizer-safe).
 */
export default class SidePanel extends Module {
  constructor(editor, options = {}) {
    super(editor, options);
    const cfg = editor.options.sidePanel;
    if (!cfg) return;
    this.cfg = typeof cfg === 'object' ? cfg : {};
    this.tabs = this.cfg.tabs || ['outline', 'comments', 'versions'];
    this.activeTab = this.tabs[0];
    this.comments = [];
    this.versions = [];
    this._cid = 0;
    this._build();
    this._bind();
    this._renderBody();
    this._exposeApi();
  }

  /* ------------------------------------------------------------------ */
  _build() {
    const rail = document.createElement('div');
    rail.className = 'yjd-side-panel';

    const tabsBar = document.createElement('div');
    tabsBar.className = 'yjd-side-tabs';
    const LABELS = { outline: 'Outline', comments: 'Comments', versions: 'Versions' };
    this.tabBtns = {};
    this.tabs.forEach((t) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'yjd-side-tab' + (t === this.activeTab ? ' active' : '');
      b.textContent = LABELS[t] || t;
      b.addEventListener('click', () => {
        this.activeTab = t;
        Object.entries(this.tabBtns).forEach(([k, el]) => el.classList.toggle('active', k === t));
        this._renderBody();
      });
      this.tabBtns[t] = b;
      tabsBar.appendChild(b);
    });

    const body = document.createElement('div');
    body.className = 'yjd-side-body';

    rail.append(tabsBar, body);
    this.rail = rail;
    this.body = body;

    // Wrap the editor area + rail in a flex row (chrome bars stay full-width).
    const area = this.editor.editor;
    const holder = document.createElement('div');
    holder.className = 'yjd-side-layout';
    area.parentNode.insertBefore(holder, area);
    holder.appendChild(area);
    holder.appendChild(rail);
  }

  _bind() {
    this._onInput = () => {
      if (this.activeTab === 'outline') this._renderBody();
    };
    this.editor.editor.addEventListener('input', this._onInput);
    this._onClick = (e) => {
      const mark = e.target && e.target.closest ? e.target.closest('[data-comment-id]') : null;
      if (mark && this.editor.editor.contains(mark)) {
        this.editor.emit('comment:click', { id: mark.getAttribute('data-comment-id') });
        if (this.tabs.includes('comments')) {
          this.activeTab = 'comments';
          Object.entries(this.tabBtns).forEach(([k, el]) => el.classList.toggle('active', k === 'comments'));
          this._renderBody(mark.getAttribute('data-comment-id'));
        }
      }
    };
    this.editor.editor.addEventListener('click', this._onClick);
  }

  _exposeApi() {
    const ed = this.editor;
    ed.getOutline = () => this._outline();
    ed.addComment = (body, author) => this.addComment(body, author);
    ed.removeComment = (id) => this.removeComment(id);
    ed.getComments = () => this.comments.map((c) => ({ ...c }));
    ed.setComments = (list) => { this.comments = (list || []).map((c) => ({ ...c })); this._renderBody(); };
    ed.saveVersion = (label) => this.saveVersion(label);
    ed.getVersions = () => this.versions.map((v) => ({ ...v }));
    ed.setVersions = (list) => { this.versions = (list || []).map((v) => ({ ...v })); this._renderBody(); };
  }

  /* ------------------------------ outline ---------------------------- */
  _outline() {
    return [...this.editor.editor.querySelectorAll('h1, h2, h3')].map((el) => ({
      level: Number(el.tagName[1]),
      text: (el.textContent || '').trim(),
      el
    }));
  }

  /* ------------------------------ comments --------------------------- */
  /** Wrap the current selection in a comment mark and store the thread. */
  addComment(body, author = 'You') {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    if (!this.editor.editor.contains(range.startContainer)) return null;
    const h = this.editor.getModule('history');
    if (h && typeof h.saveBeforeFormat === 'function') h.saveBeforeFormat();
    const id = `c${Date.now().toString(36)}${++this._cid}`;
    const quote = sel.toString().slice(0, 80);
    const mark = document.createElement('span');
    mark.className = 'yjd-comment-mark';
    mark.setAttribute('data-comment-id', id);
    try {
      range.surroundContents(mark);
    } catch (e) {
      // Range crosses element boundaries — fall back to extract+wrap.
      mark.appendChild(range.extractContents());
      range.insertNode(mark);
    }
    const entry = { id, body: String(body || ''), author, quote, time: Date.now() };
    this.comments.push(entry);
    if (typeof this.editor.onContentChange === 'function') this.editor.onContentChange();
    this.editor.emit('comment:add', { ...entry });
    this._renderBody();
    return id;
  }

  removeComment(id) {
    this.comments = this.comments.filter((c) => c.id !== id);
    const mark = this.editor.editor.querySelector(`[data-comment-id="${id}"]`);
    if (mark) {
      const parent = mark.parentNode;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
      parent.normalize();
      if (typeof this.editor.onContentChange === 'function') this.editor.onContentChange();
    }
    this.editor.emit('comment:remove', { id });
    this._renderBody();
  }

  /* ------------------------------ versions --------------------------- */
  saveVersion(label = '') {
    const html = this.editor.getHTML ? this.editor.getHTML() : this.editor.editor.innerHTML;
    const words = (this.editor.editor.textContent || '').trim().split(/\s+/).filter(Boolean).length;
    const v = { v: `v${this.versions.length + 1}`, label, html, words, time: Date.now() };
    this.versions.unshift(v);
    this.editor.emit('version:save', { ...v });
    this._renderBody();
    return v;
  }

  restoreVersion(version) {
    const h = this.editor.getModule('history');
    if (h && typeof h.saveBeforeFormat === 'function') h.saveBeforeFormat();
    if (this.editor.setHTML) this.editor.setHTML(version.html);
    else this.editor.editor.innerHTML = version.html;
    if (typeof this.editor.onContentChange === 'function') this.editor.onContentChange();
    this.editor.emit('version:restore', { v: version.v });
  }

  /* ------------------------------ render ----------------------------- */
  _renderBody(focusCommentId) {
    if (!this.body) return;
    const b = this.body;
    b.innerHTML = '';
    if (this.activeTab === 'outline') {
      const rows = this._outline();
      if (!rows.length) return this._empty('No headings yet');
      rows.forEach((r) => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = `yjd-side-outline-row lvl-${r.level}`;
        row.innerHTML = `<span class="yjd-side-tag">H${r.level}</span><span class="yjd-side-title"></span>`;
        row.querySelector('.yjd-side-title').textContent = r.text || '(untitled)';
        row.addEventListener('click', () => r.el.scrollIntoView({ block: 'center', behavior: 'smooth' }));
        b.appendChild(row);
      });
    } else if (this.activeTab === 'comments') {
      if (!this.comments.length) return this._empty('No comments — select text and call addComment()');
      this.comments.forEach((c) => {
        const card = document.createElement('div');
        card.className = 'yjd-side-comment' + (c.id === focusCommentId ? ' focus' : '');
        const t = new Date(c.time);
        card.innerHTML =
          `<div class="yjd-side-comment-head"><span class="yjd-side-avatar"></span>` +
          `<span class="yjd-side-who"></span><span class="yjd-side-time"></span>` +
          `<button type="button" class="yjd-side-x" aria-label="Remove comment">×</button></div>` +
          `<div class="yjd-side-quote"></div><div class="yjd-side-text"></div>`;
        card.querySelector('.yjd-side-avatar').textContent = (c.author || '?')[0].toUpperCase();
        card.querySelector('.yjd-side-who').textContent = c.author || '';
        card.querySelector('.yjd-side-time').textContent =
          `${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}`;
        card.querySelector('.yjd-side-quote').textContent = c.quote || '';
        card.querySelector('.yjd-side-text').textContent = c.body || '';
        card.querySelector('.yjd-side-x').addEventListener('click', () => this.removeComment(c.id));
        card.addEventListener('click', (e) => {
          if (e.target.closest('.yjd-side-x')) return;
          const mark = this.editor.editor.querySelector(`[data-comment-id="${c.id}"]`);
          if (mark) mark.scrollIntoView({ block: 'center', behavior: 'smooth' });
        });
        b.appendChild(card);
      });
    } else if (this.activeTab === 'versions') {
      if (!this.versions.length) return this._empty('No versions — call saveVersion()');
      this.versions.forEach((v, i) => {
        const t = new Date(v.time);
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'yjd-side-version' + (i === 0 ? ' current' : '');
        row.innerHTML =
          `<span class="yjd-side-v"></span><span class="yjd-side-vwho"></span>` +
          `<span class="yjd-side-spacer"></span><span class="yjd-side-vtag"></span>` +
          `<span class="yjd-side-vtime"></span>`;
        row.querySelector('.yjd-side-v').textContent = v.v;
        row.querySelector('.yjd-side-vwho').textContent = `${v.words} words`;
        const tag = row.querySelector('.yjd-side-vtag');
        if (i === 0) tag.textContent = 'Current';
        else if (v.label) tag.textContent = v.label;
        else tag.remove();
        row.querySelector('.yjd-side-vtime').textContent =
          `${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}`;
        row.addEventListener('click', () => { if (i !== 0) this.restoreVersion(v); });
        b.appendChild(row);
      });
    }
  }

  _empty(text) {
    const e = document.createElement('div');
    e.className = 'yjd-side-empty';
    e.textContent = text;
    this.body.appendChild(e);
  }

  destroy() {
    if (!this.rail) { super.destroy(); return; }
    this.editor.editor.removeEventListener('input', this._onInput);
    this.editor.editor.removeEventListener('click', this._onClick);
    // Unwrap the layout holder, keeping the editor area in place.
    const holder = this.rail.parentNode;
    if (holder && holder.classList.contains('yjd-side-layout')) {
      holder.parentNode.insertBefore(this.editor.editor, holder);
      holder.remove();
    }
    super.destroy();
  }
}
