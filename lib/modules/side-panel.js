import Module from '../core/module.js';
import { sanitizeHtml } from '../utils/sanitize.js';

/**
 * Side panel (UI 2.0 editor surface) — the design's right rail with three
 * tabs: Outline · Comments · Versions.
 *
 * - Outline: live heading tree (H1–H3); click scrolls the heading into view.
 * - Comments (design section 09 — Review): a comment is a mark on a range —
 *   `span.yjd-comment-mark[data-comment-id]` — with the THREAD data kept in
 *   memory. Threads support replies and resolve/unresolve, render in the rail
 *   behind an Open/Resolved filter, open as an anchored popover (bottom sheet
 *   on touch), and survive anchor deletion as "orphaned" cards. New comments
 *   come from the ⌘⌥M shortcut or editor.openCommentComposer() on a selection.
 *   Persist via getComments()/setComments() and the comment:* events.
 * - Versions: manual snapshots (saveVersion(label)) restorable in one undo
 *   step; read/persist via getVersions()/setVersions().
 *
 * Opt-in: `sidePanel: true` (or `{ tabs: [...], user: { name: 'You' } }`).
 * The rail lives OUTSIDE the content DOM — nothing extra serializes except
 * the comment marks themselves (plain spans, sanitizer-safe).
 */

const AVATAR_COLORS = ['#0f8a5f', '#c2571c', '#1f6fdc', '#5b5bd6', '#8b2fa0', '#a86500'];

function avatarColor(name) {
  let h = 0;
  const s = String(name || '?');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

/** Short relative time per the design's mono stamps: now · 41m · 2h · yest · 3d. */
function relTime(ts) {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  return days === 1 ? 'yest' : `${days}d`;
}

export default class SidePanel extends Module {
  constructor(editor, options = {}) {
    super(editor, options);
    const cfg = editor.options.sidePanel;
    if (!cfg) return;
    this.cfg = typeof cfg === 'object' ? cfg : {};
    this.tabs = this.cfg.tabs || ['outline', 'comments', 'versions'];
    this.user = (this.cfg.user && this.cfg.user.name) || 'You';
    this.activeTab = this.tabs[0];
    this.comments = [];
    this.versions = [];
    this._cid = 0;
    this._commentFilter = 'open';
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
      if (this.activeTab === 'outline' || this.activeTab === 'comments') this._renderBody();
    };
    this.editor.editor.addEventListener('input', this._onInput);
    this._onClick = (e) => {
      const mark = e.target && e.target.closest ? e.target.closest('[data-comment-id]') : null;
      if (mark && this.editor.editor.contains(mark)) {
        const id = mark.getAttribute('data-comment-id');
        this.editor.emit('comment:click', { id });
        this.openCommentThread(id);
      }
    };
    this.editor.editor.addEventListener('click', this._onClick);
    // ⌘⌥M / Ctrl+Alt+M → comment composer on the selection (design shortcut).
    this._onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.altKey && (e.code === 'KeyM' || e.key.toLowerCase() === 'm' || e.key === 'µ')) {
        e.preventDefault();
        this.openCommentComposer();
      }
    };
    this.editor.editor.addEventListener('keydown', this._onKey);
  }

  _exposeApi() {
    const ed = this.editor;
    ed.getOutline = () => this._outline();
    ed.addComment = (body, author) => this.addComment(body, author);
    ed.removeComment = (id) => this.removeComment(id);
    ed.addReply = (id, body, author) => this.addReply(id, body, author);
    ed.resolveComment = (id, by) => this.resolveComment(id, by);
    ed.unresolveComment = (id) => this.unresolveComment(id);
    ed.openCommentComposer = () => this.openCommentComposer();
    ed.openCommentThread = (id) => this.openCommentThread(id);
    ed.getComments = () => this.comments.map((c) => ({ ...c, replies: (c.replies || []).map((r) => ({ ...r })) }));
    ed.setComments = (list) => {
      this.comments = (list || []).map((c) => ({ replies: [], resolved: false, ...c }));
      this._renderBody();
    };
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
  addComment(body, author) {
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
    const entry = {
      id, body: String(body || ''), author: author || this.user, quote,
      time: Date.now(), replies: [], resolved: false
    };
    this.comments.push(entry);
    if (typeof this.editor.onContentChange === 'function') this.editor.onContentChange();
    this.editor.emit('comment:add', { ...entry });
    this._showCommentsTab();
    return id;
  }

  removeComment(id) {
    this.comments = this.comments.filter((c) => c.id !== id);
    this._unwrapMark(id);
    this.editor.emit('comment:remove', { id });
    this._renderBody();
  }

  addReply(id, body, author) {
    const c = this.comments.find((x) => x.id === id);
    if (!c || !String(body || '').trim()) return null;
    const reply = { author: author || this.user, body: String(body).trim(), time: Date.now() };
    (c.replies = c.replies || []).push(reply);
    this.editor.emit('comment:reply', { id, ...reply });
    this._renderBody();
    return reply;
  }

  /** Resolve keeps the thread (rail + export) but clears the highlight. */
  resolveComment(id, by) {
    const c = this.comments.find((x) => x.id === id);
    if (!c || c.resolved) return;
    c.resolved = true;
    c.resolvedBy = by || this.user;
    this._unwrapMark(id);
    this.editor.emit('comment:resolve', { id, by: c.resolvedBy });
    this._closePopover();
    this._renderBody();
  }

  unresolveComment(id) {
    const c = this.comments.find((x) => x.id === id);
    if (!c || !c.resolved) return;
    c.resolved = false;
    delete c.resolvedBy;
    this.editor.emit('comment:unresolve', { id });
    this._renderBody();
  }

  _unwrapMark(id) {
    const mark = this.editor.editor.querySelector(`[data-comment-id="${id}"]`);
    if (mark) {
      const parent = mark.parentNode;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
      parent.normalize();
      if (typeof this.editor.onContentChange === 'function') this.editor.onContentChange();
    }
  }

  _mark(id) {
    return this.editor.editor.querySelector(`[data-comment-id="${id}"]`);
  }

  _showCommentsTab(focusId) {
    if (this.tabs.includes('comments')) {
      this.activeTab = 'comments';
      Object.entries(this.tabBtns).forEach(([k, el]) => el.classList.toggle('active', k === 'comments'));
    }
    this._renderBody(focusId);
  }

  /* --------------------- thread popover / composer -------------------- */
  _closePopover() {
    if (this._pop) { this._pop.remove(); this._pop = null; }
    if (this._popOutside) {
      document.removeEventListener('pointerdown', this._popOutside, true);
      this._popOutside = null;
    }
    if (this._popKey) {
      document.removeEventListener('keydown', this._popKey, true);
      this._popKey = null;
    }
  }

  _openPopover(el, anchorEl) {
    this._closePopover();
    el.classList.add('yjd-comment-pop');
    this.editor.wrapper.appendChild(el);
    // Anchor under the mark (or the selection) inside the wrapper; the touch
    // stylesheet re-pins it as a bottom sheet.
    const wrapRect = this.editor.wrapper.getBoundingClientRect();
    let rect = null;
    if (anchorEl) rect = anchorEl.getBoundingClientRect();
    else {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) rect = sel.getRangeAt(0).getBoundingClientRect();
    }
    if (rect && rect.height) {
      const w = el.offsetWidth || 262;
      let left = rect.left - wrapRect.left;
      left = Math.max(8, Math.min(left, wrapRect.width - w - 8));
      el.style.left = `${Math.round(left)}px`;
      el.style.top = `${Math.round(rect.bottom - wrapRect.top + 8)}px`;
    } else {
      el.style.left = '50%';
      el.style.top = '80px';
      el.style.transform = 'translateX(-50%)';
    }
    this._pop = el;
    this._popOutside = (e) => { if (!el.contains(e.target)) this._closePopover(); };
    this._popKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); this._closePopover(); } };
    setTimeout(() => {
      document.addEventListener('pointerdown', this._popOutside, true);
      document.addEventListener('keydown', this._popKey, true);
    }, 0);
    return el;
  }

  _avatar(name, small) {
    const a = document.createElement('span');
    a.className = 'yjd-c-avatar' + (small ? ' sm' : '');
    a.style.background = avatarColor(name);
    a.textContent = (name || '?')[0].toUpperCase();
    return a;
  }

  _threadRow(author, body, time) {
    const row = document.createElement('div');
    row.className = 'yjd-c-row';
    const col = document.createElement('div');
    col.className = 'yjd-c-col';
    const head = document.createElement('div');
    head.className = 'yjd-c-head';
    const who = document.createElement('span');
    who.className = 'yjd-c-who';
    who.textContent = author;
    const t = document.createElement('span');
    t.className = 'yjd-c-time';
    t.textContent = relTime(time);
    head.append(who, t);
    const text = document.createElement('span');
    text.className = 'yjd-c-body';
    text.textContent = body;
    col.append(head, text);
    row.append(this._avatar(author), col);
    return row;
  }

  /** Design "Anchor + thread popover": thread + reply footer, on the mark. */
  openCommentThread(id) {
    const c = this.comments.find((x) => x.id === id);
    if (!c) return;
    this._showCommentsTab(id);
    const pop = document.createElement('div');

    const list = document.createElement('div');
    list.className = 'yjd-c-thread';
    list.appendChild(this._threadRow(c.author, c.body, c.time));
    (c.replies || []).forEach((r) => list.appendChild(this._threadRow(r.author, r.body, r.time)));

    const foot = document.createElement('div');
    foot.className = 'yjd-c-replyrow';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Reply…';
    input.className = 'yjd-input yjd-c-replyinput';
    const send = document.createElement('button');
    send.type = 'button';
    send.className = 'yjd-button-confirm yjd-c-replybtn';
    send.textContent = 'Reply';
    const submit = () => {
      if (!input.value.trim()) return;
      this.addReply(id, input.value, this.user);
      this.openCommentThread(id); // re-render with the new reply
    };
    send.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    foot.append(this._avatar(this.user, true), input, send);

    const actions = document.createElement('div');
    actions.className = 'yjd-c-actions';
    const resolve = document.createElement('button');
    resolve.type = 'button';
    resolve.className = 'yjd-c-resolve';
    resolve.innerHTML =
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>Resolve';
    resolve.addEventListener('click', () => this.resolveComment(id, this.user));
    actions.appendChild(resolve);

    pop.append(actions, list, foot);
    this._openPopover(pop, this._mark(id));
    setTimeout(() => input.focus(), 0);
  }

  /** Design "New comment composer": quote header, ⌘⏎ submits, Esc discards. */
  openCommentComposer() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    if (!this.editor.editor.contains(range.startContainer)) return;
    const saved = range.cloneRange();
    const quoteText = sel.toString().slice(0, 90);

    const pop = document.createElement('div');
    pop.classList.add('yjd-c-composer');

    const quote = document.createElement('div');
    quote.className = 'yjd-c-quote';
    quote.textContent = `"${quoteText}"`;

    const field = document.createElement('textarea');
    field.className = 'yjd-c-field';
    field.rows = 3;
    field.placeholder = 'Comment…';

    const rowBtns = document.createElement('div');
    rowBtns.className = 'yjd-c-composer-foot';
    const spacer = document.createElement('div');
    spacer.style.flex = '1';
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'yjd-button-cancel yjd-c-cbtn';
    cancel.textContent = 'Cancel';
    const submitBtn = document.createElement('button');
    submitBtn.type = 'button';
    submitBtn.className = 'yjd-button-confirm yjd-c-cbtn';
    submitBtn.textContent = 'Comment';

    const submit = () => {
      const text = field.value.trim();
      if (!text) return;
      this._closePopover();
      // Restore the selection the composer was opened on, then mark it.
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(saved);
      this.addComment(text, this.user);
    };
    submitBtn.addEventListener('click', submit);
    cancel.addEventListener('click', () => this._closePopover());
    field.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); submit(); }
    });

    rowBtns.append(spacer, cancel, submitBtn);
    pop.append(quote, field, rowBtns);
    this._openPopover(pop, null);
    const hint = document.createElement('div');
    hint.className = 'yjd-c-hint';
    hint.textContent = '⌘⏎ submits · Esc discards';
    pop.appendChild(hint);
    setTimeout(() => field.focus(), 0);
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
    else this.editor.editor.innerHTML = sanitizeHtml(version.html);
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
      this._renderComments(b, focusCommentId);
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
        // The "Current" row tracks the LIVE document — a stale snapshot count
        // next to a "Current" tag read as wrong once the user kept typing.
        const liveWords = i === 0
          ? (this.editor.editor.textContent || '').trim().split(/\s+/).filter(Boolean).length
          : v.words;
        row.querySelector('.yjd-side-vwho').textContent = `${liveWords} words`;
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

  /** Design "Thread rail": Open/Resolved chips, thread cards, resolved rows. */
  _renderComments(b, focusCommentId) {
    const open = this.comments.filter((c) => !c.resolved);
    const resolved = this.comments.filter((c) => c.resolved);

    const bar = document.createElement('div');
    bar.className = 'yjd-c-filter';
    [['open', `Open · ${open.length}`], ['resolved', `Resolved · ${resolved.length}`]].forEach(([key, label]) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'yjd-c-chip' + (this._commentFilter === key ? ' on' : '');
      chip.textContent = label;
      chip.addEventListener('click', () => { this._commentFilter = key; this._renderBody(); });
      bar.appendChild(chip);
    });
    b.appendChild(bar);

    const list = this._commentFilter === 'resolved' ? resolved : open;
    if (!list.length) {
      return this._empty(this._commentFilter === 'resolved'
        ? 'Nothing resolved yet'
        : 'No open comments — select text and press ⌘⌥M');
    }

    list.forEach((c) => {
      if (c.resolved) {
        const row = document.createElement('div');
        row.className = 'yjd-c-resolved';
        row.innerHTML =
          '<span class="yjd-c-check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>' +
          '<span class="yjd-c-resolved-text"></span>' +
          '<button type="button" class="yjd-c-undo">Undo</button>';
        row.querySelector('.yjd-c-resolved-text').textContent =
          `Resolved by ${c.resolvedBy || '?'} — "${c.body.slice(0, 40)}"`;
        row.querySelector('.yjd-c-undo').addEventListener('click', () => this.unresolveComment(c.id));
        b.appendChild(row);
        return;
      }
      const card = document.createElement('div');
      const orphan = !this._mark(c.id);
      card.className = 'yjd-c-card' + (c.id === focusCommentId ? ' focus' : '');
      const head = document.createElement('div');
      head.className = 'yjd-c-head';
      const who = document.createElement('span');
      who.className = 'yjd-c-who';
      who.textContent = c.author;
      const spacer = document.createElement('div');
      spacer.style.flex = '1';
      const t = document.createElement('span');
      t.className = 'yjd-c-time';
      t.textContent = relTime(c.time);
      head.append(this._avatar(c.author), who, spacer, t);
      const body = document.createElement('span');
      body.className = 'yjd-c-body';
      body.textContent = c.body;
      card.append(head, body);
      if (c.replies && c.replies.length) {
        const rep = document.createElement('span');
        rep.className = 'yjd-c-replies';
        rep.textContent = `${c.replies.length} repl${c.replies.length > 1 ? 'ies' : 'y'}`;
        card.appendChild(rep);
      }
      if (orphan) {
        const o = document.createElement('div');
        o.className = 'yjd-c-orphan';
        o.innerHTML =
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg><span>Anchor text was deleted</span>';
        card.appendChild(o);
      }
      card.addEventListener('click', () => {
        const mark = this._mark(c.id);
        if (mark) mark.scrollIntoView({ block: 'center', behavior: 'smooth' });
        this.openCommentThread(c.id);
      });
      b.appendChild(card);
    });
  }

  _empty(text) {
    const e = document.createElement('div');
    e.className = 'yjd-side-empty';
    e.textContent = text;
    this.body.appendChild(e);
  }

  destroy() {
    if (!this.rail) { super.destroy(); return; }
    this._closePopover();
    this.editor.editor.removeEventListener('input', this._onInput);
    this.editor.editor.removeEventListener('click', this._onClick);
    this.editor.editor.removeEventListener('keydown', this._onKey);
    // Unwrap the layout holder, keeping the editor area in place.
    const holder = this.rail.parentNode;
    if (holder && holder.classList.contains('yjd-side-layout')) {
      holder.parentNode.insertBefore(this.editor.editor, holder);
      holder.remove();
    }
    super.destroy();
  }
}
