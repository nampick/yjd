import Module from '../core/module.js';
import IconUtils, { registerIcons, S } from '../ui/icons.js';
import { wordDiff } from '../utils/word-diff.js';

// Escape a (possibly app-supplied via options.strings) label before it goes into
// the bar/diff innerHTML templates.
const aiEsc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

registerIcons({
  'ai': S('<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M18 17.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>'),
  check: S('<polyline points="20 6 9 17 4 12"/>'),
  // Selection-menu glyphs (UI 2.0): length/complexity cues drawn as line pairs.
  'ai-shorten': S('<path d="M4 8h16"/><path d="M7 16h10"/>'),
  'ai-lengthen': S('<path d="M7 8h10"/><path d="M4 16h16"/>'),
  'ai-simplify': S('<path d="M4 7h16"/><path d="M4 12h11"/><path d="M4 17h6"/>'),
  'ai-summarize': S('<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h9"/>')
});

/**
 * AI module — turns yjd into a "write-with-AI" surface without bundling any
 * model. Like @mention's `source`, the app supplies a `complete` hook that
 * calls whatever LLM it likes; the module is INERT until one is given.
 *
 *   new Editor(el, {
 *     ai: {
 *       // REQUIRED. Resolve to the generated text. Stream by calling onToken
 *       // with each chunk (the returned/!resolved string is the source of
 *       // truth; if you only stream, return undefined and chunks are joined).
 *       complete: async ({ action, prompt, text, html, signal }, onToken) => {
 *         const res = await fetch('/api/ai', {
 *           method: 'POST', signal,
 *           body: JSON.stringify({ action, prompt, text })
 *         });
 *         return (await res.json()).text;
 *       },
 *       // optional — replace/extend the selection-toolbar actions
 *       actions: [{ id, label, prompt }],
 *       // optional — inline ghost-text autocomplete (Tab to accept)
 *       autocomplete: true | { debounce: 400, minChars: 3, maxContext: 600 },
 *     }
 *   })
 *
 * Events: ai:start {action}, ai:done {action, result}, ai:accept {result},
 *         ai:discard, ai:error {error}.
 *
 * Nothing the module renders ever lives in the editable DOM, so getContent()/
 * getJSON()/onChange stay clean: the selection toolbar is portaled to <body>
 * and the ghost-text hint is a positioned overlay, not editable content.
 */

// Built-in selection actions. Each `prompt` is handed to complete() verbatim as
// the instruction; the app's hook decides how to combine it with `text`.
const DEFAULT_ACTIONS = [
  { id: 'improve',   label: 'Improve writing',  icon: 'ai', prompt: 'Improve the writing, grammar and clarity of the text. Return only the rewritten text, no preamble.' },
  { id: 'fix',       label: 'Fix spelling & grammar', icon: 'check', prompt: 'Fix spelling and grammar. Return only the corrected text.' },
  { id: 'shorten',   label: 'Make shorter',     icon: 'ai-shorten', prompt: 'Make the text more concise while keeping its meaning. Return only the text.' },
  { id: 'lengthen',  label: 'Make longer',      icon: 'ai-lengthen', prompt: 'Expand the text with more detail while keeping its tone. Return only the text.' },
  { id: 'simplify',  label: 'Simplify',         icon: 'ai-simplify', prompt: 'Rewrite the text in simpler, clearer language. Return only the text.' },
  { id: 'summarize', label: 'Summarize',        icon: 'ai-summarize', prompt: 'Summarize the text in one or two sentences. Return only the summary.' },
];

// --rte-* theme vars copied onto the portaled menus so a themed editor themes
// its AI surfaces too (mirrors Mention.THEME_VARS).
const THEME_VARS = ['--rte-accent', '--rte-accent-ink', '--rte-accent-ink-on', '--rte-accent-weak', '--rte-accent-ring', '--rte-ink', '--rte-ink-2', '--rte-muted', '--rte-faint', '--rte-border', '--rte-border-strong', '--rte-bg', '--rte-chrome', '--rte-chrome-2', '--rte-radius', '--rte-radius-md', '--rte-radius-sm', '--rte-radius-xs', '--rte-shadow', '--rte-shadow-sm', '--rte-t', '--rte-mono', '--rte-ui', '--rte-danger', '--rte-danger-weak', '--rte-success', '--rte-success-weak'];

export default class Ai extends Module {
  constructor(editor, options = {}) {
    super(editor, options);
    this.cfg = editor.options.ai || options || {};
    this.actions = Array.isArray(this.cfg.actions) && this.cfg.actions.length
      ? this.cfg.actions
      : DEFAULT_ACTIONS;
    this.savedRange = null;   // selection captured when the toolbar opens
    this.controller = null;   // AbortController for the in-flight request
    this.ghost = null;        // pending ghost-text suggestion string
    this.reqSeq = 0;          // monotonic id so a stale completion can't win
    this.auto = this._parseAutocfg();  // static after construction
    // Diff-edit: when accepting an edit of SELECTED text, show a word-level diff
    // (accept/reject per word) instead of a blind replace. On by default; set
    // ai.diff:false for the old replace-on-accept behaviour.
    this.diffMode = this.cfg.diff !== false;

    if (!this.enabled) return;
    // Public, documented handle: editor.ai.run(...) / editor.ai.autocomplete().
    this.editor.ai = this;
    this._build();
    this._bind();
  }

  /** Inert until the app provides a model call. */
  get enabled() { return typeof this.cfg.complete === 'function'; }

  /* --------------------------------------------------------------------- */
  /* DOM                                                                    */
  /* --------------------------------------------------------------------- */

  _build() {
    // Floating selection toolbar (actions + free-form ask).
    const t = (k, fb) => aiEsc(this.t('ai.' + k, fb));
    const bar = document.createElement('div');
    bar.className = 'yjd-ai-bar';
    bar.setAttribute('role', 'toolbar');
    bar.style.display = 'none';
    bar.innerHTML =
      `<div class="yjd-ai-head">${t('editSelection', 'Edit selection')}</div>` +
      '<div class="yjd-ai-actions"></div>' +
      '<form class="yjd-ai-ask">' +
        `<span class="yjd-ai-ask-ic">${IconUtils.getIcon('ai')}</span>` +
        '<input type="text" class="yjd-ai-input" ' +
        `placeholder="${t('ask', 'Ask AI…')}" aria-label="${t('ask', 'Ask AI…')}">` +
        '<span class="yjd-ai-kbd">↵</span>' +
      '</form>' +
      '<div class="yjd-ai-panel" hidden>' +
        '<div class="yjd-ai-result" aria-live="polite"></div>' +
        '<div class="yjd-ai-foot">' +
          `<button type="button" class="yjd-ai-accept" data-act="accept">${t('accept', 'Accept')}</button>` +
          `<button type="button" class="yjd-ai-retry"  data-act="retry">${t('retry', 'Retry')}</button>` +
          `<button type="button" class="yjd-ai-discard" data-act="discard">${t('discard', 'Discard')}</button>` +
        '</div>' +
      '</div>';
    this.bar = bar;
    this.actionsEl = bar.querySelector('.yjd-ai-actions');
    this.panel = bar.querySelector('.yjd-ai-panel');
    this.resultEl = bar.querySelector('.yjd-ai-result');
    this.input = bar.querySelector('.yjd-ai-input');

    this.actions.forEach((a) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'yjd-ai-act';
      b.dataset.id = a.id;
      // UI 2.0 menu row: icon + label (custom actions fall back to the sparkle).
      const ic = document.createElement('span');
      ic.className = 'yjd-ai-act-ic';
      ic.innerHTML = IconUtils.getIcon(a.icon) || IconUtils.getIcon('ai') || '';
      const lb = document.createElement('span');
      lb.className = 'yjd-ai-act-label';
      lb.textContent = this.t('ai.action.' + a.id, a.label || a.id);
      b.append(ic, lb);
      // pointerdown (not click) + preventDefault keeps the editor selection.
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); this.run(a); });
      this.actionsEl.appendChild(b);
    });

    bar.querySelector('.yjd-ai-ask').addEventListener('submit', (e) => {
      e.preventDefault();
      const q = this.input.value.trim();
      if (q) this.run({ id: 'ask', label: 'Ask AI', prompt: q });
    });
    // Keep selection while focusing the input.
    this.input.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.panel.querySelector('.yjd-ai-foot').addEventListener('pointerdown', (e) => e.preventDefault());
    this.panel.querySelector('[data-act="accept"]').addEventListener('click', () => this._accept());
    this.panel.querySelector('[data-act="retry"]').addEventListener('click', () => this._retry());
    this.panel.querySelector('[data-act="discard"]').addEventListener('click', () => this.closeBar());
    document.body.appendChild(bar);

    // Diff-review toolbar: shown while an inline AI diff awaits accept/reject.
    if (this.diffMode) {
      const db = document.createElement('div');
      db.className = 'yjd-ai-diffbar';
      db.style.display = 'none';
      const dt = (k, fb) => aiEsc(this.t('ai.' + k, fb));
      db.innerHTML =
        `<span class="yjd-ai-diffhint">${dt('diffHint', 'Click a word to keep/drop · ⏎ accept · esc reject')}</span>` +
        `<button type="button" class="yjd-ai-accept" data-act="apply">${dt('accept', 'Accept')}</button>` +
        `<button type="button" class="yjd-ai-discard" data-act="revert">${dt('reject', 'Reject')}</button>`;
      db.addEventListener('pointerdown', (e) => e.preventDefault()); // keep the diff selection
      db.querySelector('[data-act="apply"]').addEventListener('click', () => this._finalizeDiff());
      db.querySelector('[data-act="revert"]').addEventListener('click', () => this._revertDiff());
      this.diffBar = db;
      document.body.appendChild(db);
    }

    if (this.auto) {
      const g = document.createElement('span');
      g.className = 'yjd-ai-ghost';
      g.setAttribute('aria-hidden', 'true');
      g.style.display = 'none';
      this.ghostEl = g;
      (this.editor.wrapper || document.body).appendChild(g);
    }
  }

  _bind() {
    // Auto-open on a settled selection is OPT-IN (ai.openOnSelect: true) — by
    // default the selection shows the formatting bubble, and this menu opens
    // from the bubble's "✦ AI" entry or the toolbar pill (design behaviour;
    // both popping at once covered each other).
    if (this.cfg.openOnSelect) {
      this._onSelect = () => {
        if (this._busy) return;
        clearTimeout(this._selT);
        this._selT = setTimeout(() => this._maybeOpenBar(), 80);
      };
      document.addEventListener('selectionchange', this._onSelect);
    }

    this._onDocPointer = (e) => {
      if (this.barOpen && !this.bar.contains(e.target) && !this.editor.editor.contains(e.target)) this.closeBar();
    };
    document.addEventListener('pointerdown', this._onDocPointer, true);

    // Ghost-text autocomplete (opt-in).
    if (this.auto) {
      this._onInput = () => this._scheduleGhost();
      this.editor.editor.addEventListener('input', this._onInput);
      this._onGhostKey = (e) => this._ghostKeydown(e);
      this.editor.editor.addEventListener('keydown', this._onGhostKey, true);
    }
  }

  _parseAutocfg() {
    const a = this.cfg.autocomplete;
    if (!a) return null;
    const d = a === true ? {} : a;
    return { debounce: d.debounce ?? 400, minChars: d.minChars ?? 3, maxContext: d.maxContext ?? 600 };
  }

  _applyTheme(el) {
    const root = this.editor.wrapper || this.editor.root;
    if (!root) return;
    const cs = getComputedStyle(root);
    THEME_VARS.forEach((v) => {
      const val = cs.getPropertyValue(v);
      if (val) el.style.setProperty(v, val.trim());
    });
  }

  /* --------------------------------------------------------------------- */
  /* Selection toolbar                                                      */
  /* --------------------------------------------------------------------- */

  _selectionInEditor() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return null;
    if (!this.editor.editor.contains(range.commonAncestorContainer)) return null;
    return range;
  }

  _maybeOpenBar() {
    if (this.barOpen && this._busy) return;
    // A toolbar-opened bar is pinned — ignore selection changes entirely.
    if (this._pinned) return;
    // Don't react to the selection collapsing because focus moved INTO the bar
    // (e.g. the user clicked the "Ask AI" input) — that must not close it.
    if (this.bar.contains(document.activeElement)) return;
    const range = this._selectionInEditor();
    if (!range || !range.toString().trim()) {
      if (this.barOpen && !this._busy) this.closeBar();
      return;
    }
    this.savedRange = range.cloneRange();
    this._openBar(range);
  }

  /**
   * Open the bar from the toolbar button. With a selection it behaves like the
   * auto-popup (run actions on the selection); with none it opens at the caret
   * and focuses the "Ask AI" field for free-form generation inserted there.
   */
  openFromToolbar() {
    if (!this.enabled) return;
    // Pinned: opened deliberately, so selection changes must NOT auto-close it
    // (only an outside click / Discard / Accept should). Cleared on close.
    this._pinned = true;
    const range = this._selectionInEditor();
    if (range && range.toString().trim()) {
      this.savedRange = range.cloneRange();
      this._openBar(range);
      return;
    }
    // No selection → anchor at the caret (if inside the editor) and ask.
    const sel = window.getSelection();
    const caret = (sel && sel.rangeCount && this.editor.editor.contains(sel.getRangeAt(0).commonAncestorContainer))
      ? sel.getRangeAt(0).cloneRange() : null;
    this.savedRange = caret;            // collapsed caret → accept inserts here
    this.barOpen = true;
    this._resetPanel();
    this.bar.style.display = 'block';
    this._applyTheme(this.bar);
    if (caret) {
      this._positionBar(caret);
    } else {
      // First open, no caret in the document yet: the range fallback would
      // anchor to the EDITOR BOX and drop the panel below the whole document.
      // Anchor to the toolbar pill that was clicked instead.
      const pill = this.editor.wrapper.querySelector('.ai-btn');
      this._positionBarAtElement(pill || this.editor.editor);
    }
    // Defer so the click's own focus settling doesn't steal it back.
    setTimeout(() => this.input.focus(), 0);   // jump straight to "Ask AI…"
  }

  /** Position the bar under an ELEMENT anchor (toolbar pill), viewport-clamped. */
  _positionBarAtElement(el) {
    const rect = el.getBoundingClientRect();
    const bw = this.bar.offsetWidth;
    const bh = this.bar.offsetHeight;
    // Right-align to the pill (it sits at the toolbar's right edge).
    let x = rect.right + window.scrollX - bw;
    x = Math.max(8 + window.scrollX, Math.min(x, window.scrollX + window.innerWidth - bw - 8));
    let y = rect.bottom + window.scrollY + 8;
    if (rect.bottom + bh + 16 > window.innerHeight) y = rect.top + window.scrollY - bh - 8;
    this.bar.style.left = `${Math.round(x)}px`;
    this.bar.style.top = `${Math.round(Math.max(window.scrollY + 8, y))}px`;
  }

  /** Show the bar (action row) anchored to a range and position it. */
  _openBar(range) {
    this.barOpen = true;
    this._resetPanel();
    this.bar.style.display = 'block';
    this._applyTheme(this.bar);
    this._positionBar(range);
  }

  /**
   * Position the bar under (or above, if no room) the anchor range, clamped to
   * the viewport. Falls back to the editor's box when no range is available
   * (e.g. a programmatic run() with no prior selection).
   */
  _positionBar(range) {
    // getClientRects is missing on jsdom's Range — fall back to the editor box.
    const rect = (range && typeof range.getClientRects === 'function' && range.getClientRects().length)
      ? range.getBoundingClientRect()
      : this.editor.editor.getBoundingClientRect();
    const bw = this.bar.offsetWidth;
    const bh = this.bar.offsetHeight;
    const x = Math.max(8 + window.scrollX, Math.min(rect.left + window.scrollX, window.scrollX + window.innerWidth - bw - 8));
    let y = rect.bottom + window.scrollY + 8;
    if (rect.bottom + bh + 16 > window.innerHeight) y = rect.top + window.scrollY - bh - 8;
    this.bar.style.left = `${Math.round(x)}px`;
    this.bar.style.top = `${Math.round(Math.max(window.scrollY + 8, y))}px`;
  }

  closeBar() {
    if (!this.barOpen) return;
    this._abort();
    this.barOpen = false;
    this._busy = false;
    this._pinned = false;
    this.bar.style.display = 'none';
    const wasGenerating = this._panelShown;
    this._resetPanel();
    this.savedRange = null;
    // Only signal a discard when there was actually a result/in-flight request
    // to discard — not when the user merely deselected.
    if (wasGenerating) this.editor.emit('ai:discard', {});
  }

  _resetPanel() {
    this.panel.hidden = true;
    this.resultEl.textContent = '';
    this.actionsEl.style.display = '';
    this.bar.querySelector('.yjd-ai-ask').style.display = '';
    this.input.value = '';
    this.lastResult = '';
    this._panelShown = false;
  }

  /* --------------------------------------------------------------------- */
  /* Running a request                                                      */
  /* --------------------------------------------------------------------- */

  /**
   * Run an AI action against the current selection (or `opts.text`). Accepts a
   * built-in/custom action object or a free-form prompt string. Returns the
   * generated text. Public: editor.ai.run('Translate to French').
   */
  async run(action, opts = {}) {
    if (!this.enabled) return '';
    const act = typeof action === 'string' ? { id: 'ask', label: 'Ask AI', prompt: action } : action;
    // Capture the selection if the bar wasn't opened from one (programmatic call).
    if (!this.savedRange) {
      const r = this._selectionInEditor();
      if (r) this.savedRange = r.cloneRange();
    }
    // Placeholder safety (#80): variable chips / slot cards inside the
    // selection are serialized to opaque sentinels so the model can't mangle
    // them; ctx.placeholders tells the `complete` hook what they mean.
    const enc = opts.text != null
      ? { text: opts.text, list: [] }
      : this._encodePlaceholders(this.savedRange);
    const text = enc.text;
    this._phList = enc.list;
    this.lastAction = act;

    // Make sure the bar is visible (a programmatic run() has no open bar yet).
    if (!this.barOpen) { this.barOpen = true; this._applyTheme(this.bar); }
    this.bar.style.display = 'block';

    this._abort();
    this.controller = new AbortController();
    const myReq = ++this.reqSeq;       // token: only the latest request may win
    this._busy = true;
    this._showPanel('');
    this.editor.emit('ai:start', { action: act.id });

    let acc = '';
    const display = (t) => this._decodeSentinels(t, enc.list);
    const onToken = (chunk) => {
      if (typeof chunk !== 'string' || myReq !== this.reqSeq) return;
      acc += chunk;
      this._showPanel(display(acc));
    };

    try {
      const ret = await this.cfg.complete(
        {
          action: act.id, prompt: act.prompt || act.id, text, html: opts.html || '',
          signal: this.controller.signal,
          placeholders: enc.list.map((e) => ({ kind: e.kind, name: e.name, sample: e.sample })),
        },
        onToken
      );
      // A newer request (Retry / another action) superseded this one — discard
      // its result even if the app ignored the abort signal.
      if (myReq !== this.reqSeq) return '';
      let result = (typeof ret === 'string' && ret.length ? ret : acc).trim();
      // Placeholder policy (#80): decode surviving sentinels, then apply
      // cfg.placeholders — 'restore' (default) re-appends dropped tokens,
      // 'reject' discards the run, 'ask' leaves the loss visible in the diff.
      const restored = this._restorePlaceholders(result, enc.list);
      if (!restored.ok) {
        this._busy = false;
        this._resetPanel();
        this.barOpen = false;
        this.bar.style.display = 'none';
        if (typeof this.editor.showToast === 'function') {
          this.editor.showToast(this.t('ai.placeholdersLost',
            'AI response dropped a required placeholder — rewrite rejected.'));
        }
        this.editor.emit('ai:rejected', { action: act.id, missing: restored.missing });
        return '';
      }
      result = restored.text;
      this._busy = false;
      this.lastResult = result;
      this._showPanel(result);
      this.editor.emit('ai:done', { action: act.id, result });
      return result;
    } catch (err) {
      if (myReq !== this.reqSeq) return '';
      this._busy = false;
      if (err && err.name === 'AbortError') return '';
      this._showError(err);
      this.editor.emit('ai:error', { error: err });
      return '';
    }
  }

  _showPanel(text) {
    this.actionsEl.style.display = 'none';
    this.bar.querySelector('.yjd-ai-ask').style.display = 'none';
    this.panel.hidden = false;
    this.resultEl.classList.remove('is-error');
    this.resultEl.textContent = text || '…';
    // Reposition only once when the panel first appears (it's taller than the
    // action row) — not on every streamed token, which would thrash layout.
    if (!this._panelShown) {
      this._panelShown = true;
      this._positionBar(this.savedRange);
    }
  }

  _showError(err) {
    this._busy = false;
    this._panelShown = true;
    this.panel.hidden = false;
    this.resultEl.classList.add('is-error');
    this.resultEl.textContent = (err && err.message) ? err.message : this.t('ai.error', 'Something went wrong.');
  }

  _accept() {
    const result = this.lastResult;
    if (!result) return;
    // Focus FIRST, then restore the original selection — focusing an editable
    // in Chrome can clobber a range that was set while it was unfocused.
    this.editor.focus();
    if (this.savedRange) {
      try {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(this.savedRange);
      } catch (e) { /* range detached — fall back to the live caret */ }
    }
    const orig = this.savedRange ? this.savedRange.toString() : '';
    // Diff-review path: a non-empty selection WITHIN ONE block that changed. An
    // inline word diff can't span block boundaries cleanly (it would leave a
    // stray span between paragraphs), so multi-block edits fall back to a plain
    // replace.
    if (this.diffMode && orig.trim() && orig !== result && this.savedRange
        && this._sameBlock(this.savedRange)) {
      this._openDiff(orig, result);
      return;
    }
    this.editor.replaceSelection(result, { asText: true });
    if (typeof this.editor._upgradeAtoms === 'function') this.editor._upgradeAtoms();
    this.editor.emit('ai:accept', { result });
    this.barOpen = false;
    this._pinned = false;
    this.bar.style.display = 'none';
    this._resetPanel();
    this.savedRange = null;
  }

  /* --------------------------------------------------------------------- */
  /* Diff-edit: inline word diff with per-word accept/reject                 */
  /* --------------------------------------------------------------------- */

  // True when a range starts and ends in the SAME block element.
  /* --------------------------------------------------------------------- */
  /* Placeholder safety (#80)                                                */
  /* --------------------------------------------------------------------- */

  /**
   * Serialize a range's text with every variable chip / slot card replaced by
   * an opaque sentinel (⟦v1⟧, ⟦b2⟧). Returns { text, list } where list maps
   * sentinels back to tokens and carries metadata for ctx.placeholders.
   */
  _encodePlaceholders(range) {
    if (!range) return { text: '', list: [] };
    const frag = range.cloneContents();
    const list = [];
    const walk = (el) => {
      let out = '';
      el.childNodes.forEach((n) => {
        if (n.nodeType === 3) { out += n.textContent; return; }
        if (n.nodeType !== 1) return;
        const isAtom = n.classList &&
          (n.classList.contains('mention') || n.classList.contains('yjd-slot')) &&
          n.getAttribute('data-token');
        if (isAtom) {
          const kind = n.classList.contains('yjd-slot') ? 'block' : 'variable';
          const id = (kind === 'block' ? 'b' : 'v') + (list.length + 1);
          list.push({
            id, kind,
            token: n.getAttribute('data-token'),
            name: n.getAttribute('data-var') || n.getAttribute('data-slot') || n.getAttribute('data-id') || '',
            sample: n.getAttribute('data-sample') || undefined,
          });
          out += '\u27e6' + id + '\u27e7';
          return;
        }
        if (n.tagName === 'BR') { out += '\n'; return; }
        const block = /^(P|DIV|LI|H[1-6]|BLOCKQUOTE|PRE|TR)$/.test(n.tagName);
        out += walk(n) + (block ? '\n' : '');
      });
      return out;
    };
    const text = walk(frag).replace(/\n+$/, '');
    return list.length ? { text, list } : { text: range.toString(), list: [] };
  }

  /** Swap sentinels for their tokens (display + final restore). */
  _decodeSentinels(text, list) {
    if (!list || !list.length) return text;
    return text.replace(/\u27e6([vb]\d+)\u27e7/g, (m, id) => {
      const e = list.find((x) => x.id === id);
      return e ? e.token : '';
    });
  }

  /**
   * Apply the placeholder policy to a model response: sentinels (and literal
   * tokens the model echoed back) count as survivors; missing placeholders
   * are re-appended ('restore', default), rejected ('reject'), or left for
   * the diff view to surface ('ask').
   */
  _restorePlaceholders(result, list) {
    if (!list || !list.length) return { ok: true, text: result, missing: [] };
    let text = this._decodeSentinels(result, list);
    const missing = list.filter((e) => text.indexOf(e.token) === -1);
    const policy = this.cfg.placeholders || 'restore';
    if (!missing.length) return { ok: true, text, missing };
    if (policy === 'reject') return { ok: false, text, missing: missing.map((e) => e.token) };
    if (policy === 'ask') {
      // Leave the loss visible: the diff view shows the token as a removal the
      // user must explicitly accept.
      this.editor.emit('ai:placeholders-missing', { missing: missing.map((e) => e.token) });
      return { ok: true, text, missing: missing.map((e) => e.token) };
    }
    // 'restore': re-append dropped placeholders in their original order.
    const tail = missing.map((e) => e.token).join(' ');
    text = text.length ? text + '\n' + tail : tail;
    this.editor.emit('ai:placeholders-restored', { restored: missing.map((e) => e.token) });
    return { ok: true, text, missing: [] };
  }

  /**
   * Whole-document rewrite (#80): streams the model response INTO the document
   * via streamInto() (first append replaces the select-all), restores dropped
   * placeholders per policy, re-chips atoms, and is undoable in one step.
   *
   *   await editor.ai.runDocument({ prompt: 'Half as long, same warm tone' })
   */
  async runDocument(opts = {}) {
    if (typeof this.cfg.complete !== 'function') return '';
    const range = document.createRange();
    range.selectNodeContents(this.editor.editor);
    const enc = this._encodePlaceholders(range);

    // Select-all so the sink's first append replaces the whole document.
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    const sink = this.editor.streamInto();

    this._abort();
    this.controller = new AbortController();
    const myReq = ++this.reqSeq;
    this.editor.emit('ai:start', { action: 'document' });

    // Buffered sentinel decode: hold back a trailing partial ⟦…⟧ so tokens
    // never stream into the document half-written.
    let acc = '', buf = '';
    const flush = (chunk, final) => {
      buf += chunk;
      let out = buf;
      if (!final) {
        const cut = out.lastIndexOf('\u27e6');
        if (cut !== -1 && out.indexOf('\u27e7', cut) === -1) { buf = out.slice(cut); out = out.slice(0, cut); }
        else buf = '';
      } else buf = '';
      out = this._decodeSentinels(out, enc.list);
      if (out) sink.append(out);
    };

    try {
      const ret = await this.cfg.complete(
        {
          action: 'document', prompt: opts.prompt || '', text: enc.text,
          html: this.editor.getContent(), signal: this.controller.signal,
          placeholders: enc.list.map((e) => ({ kind: e.kind, name: e.name, sample: e.sample })),
        },
        (chunk) => {
          if (typeof chunk !== 'string' || myReq !== this.reqSeq) return;
          acc += chunk;
          flush(chunk, false);
        }
      );
      if (myReq !== this.reqSeq) return '';
      const raw = typeof ret === 'string' && ret.length ? ret : acc;
      // If the hook only returned (no streaming), nothing has been flushed yet.
      if (!acc && raw) flush(raw, true); else flush('', true);
      const restored = this._restorePlaceholders(raw, enc.list);
      if (!restored.ok) {
        sink.cancel();
        if (typeof this.editor.showToast === 'function') {
          this.editor.showToast(this.t('ai.placeholdersLost',
            'AI response dropped a required placeholder — rewrite rejected.'));
        }
        this.editor.emit('ai:rejected', { action: 'document', missing: restored.missing });
        return '';
      }
      // Streamed content already carries decoded tokens; append any restored
      // tail the policy added beyond what was streamed.
      const streamed = this._decodeSentinels(raw, enc.list);
      if (restored.text.length > streamed.length) sink.append(restored.text.slice(streamed.length));
      sink.commit();
      if (typeof this.editor._upgradeAtoms === 'function') this.editor._upgradeAtoms();
      this.editor.emit('ai:done', { action: 'document', result: restored.text });
      return restored.text;
    } catch (err) {
      if (myReq !== this.reqSeq) return '';
      sink.cancel();
      if (err && err.name === 'AbortError') return '';
      this.editor.emit('ai:error', { error: err });
      return '';
    }
  }

  _sameBlock(range) {
    const blk = (n) => {
      n = n && n.nodeType === 3 ? n.parentNode : n;
      return n && n.closest ? n.closest('p,li,h1,h2,h3,h4,h5,h6,blockquote,pre,td,th') : null;
    };
    // An endpoint sitting ON a block container — e.g. a programmatic
    // selectNodeContents(editableRoot) before editor.ai.run() — resolves to
    // the child block it points AT, so a whole-field selection over a single
    // block still gets the word diff instead of silently degrading to a plain
    // replace (#71). Multi-block selections still fall back (an inline word
    // diff can't span block boundaries).
    const descend = (node, offset, atEnd) => {
      let n = node;
      while (n && n.nodeType === 1 && !blk(n) && n.childNodes.length) {
        const idx = Math.min(atEnd ? Math.max(0, offset - 1) : offset, n.childNodes.length - 1);
        n = n.childNodes[idx];
        offset = atEnd && n.childNodes ? n.childNodes.length : 0;
      }
      return n;
    };
    const a = blk(descend(range.startContainer, range.startOffset, false));
    const b = blk(descend(range.endContainer, range.endOffset, true));
    return !!a && a === b;
  }

  _openDiff(orig, result) {
    const range = this.savedRange;
    const node = this._buildDiffNode(orig, result);
    try {
      range.deleteContents();
      range.insertNode(node);
    } catch (e) {
      // Range detached — fall back to a plain replace so accept still works.
      this.editor.replaceSelection(result, { asText: true });
      this.editor.emit('ai:accept', { result });
      this._closeAiBar();
      return;
    }
    this._activeDiff = node;
    node.addEventListener('click', (e) => this._onDiffClick(e));
    this._diffKeyHandler = (e) => this._onDiffKey(e);
    document.addEventListener('keydown', this._diffKeyHandler, true);
    this._closeAiBar();
    this.diffBar.style.display = 'flex';
    this._applyTheme(this.diffBar);
    this._positionDiffBar();
    this.savedRange = null;
  }

  _buildDiffNode(orig, result) {
    const span = document.createElement('span');
    span.className = 'yjd-ai-diff';
    span.setAttribute('contenteditable', 'false');
    span.setAttribute('data-orig', orig);
    for (const run of wordDiff(orig, result)) {
      if (run.t === '=') { span.appendChild(document.createTextNode(run.s)); continue; }
      const el = document.createElement(run.t === '-' ? 'del' : 'ins');
      el.className = run.t === '-' ? 'yjd-ai-del' : 'yjd-ai-ins';
      el.textContent = run.s;
      span.appendChild(el);
    }
    return span;
  }

  // Click a removed/added word to toggle it. A del+ins replacement is one hunk:
  // toggling either flips both to the same state, so you switch cleanly between
  // "use the new word" and "keep the original" (never both, never neither).
  _onDiffClick(e) {
    const el = e.target.closest && e.target.closest('ins, del');
    if (!el || !this._activeDiff || !this._activeDiff.contains(el)) return;
    const off = !el.classList.contains('yjd-ai-off');
    el.classList.toggle('yjd-ai-off', off);
    const pair = this._pairOf(el);
    if (pair) pair.classList.toggle('yjd-ai-off', off);
    this._positionDiffBar();
  }

  // The del↔ins forming one replacement (immediately adjacent, no text between).
  _pairOf(el) {
    const sib = el.tagName === 'DEL' ? el.nextSibling
      : (el.tagName === 'INS' ? el.previousSibling : null);
    return sib && sib.nodeType === 1 && (sib.tagName === 'INS' || sib.tagName === 'DEL')
      && sib.tagName !== el.tagName ? sib : null;
  }

  // Enter accepts the open diff, Escape rejects it.
  _onDiffKey(e) {
    if (!this._activeDiff) return;
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); this._finalizeDiff(); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this._revertDiff(); }
  }

  _positionDiffBar() {
    if (!this._activeDiff || !this.diffBar) return;
    const r = this._activeDiff.getBoundingClientRect();
    const bh = this.diffBar.offsetHeight || 40;
    let y = r.top + window.scrollY - bh - 8;
    if (y < window.scrollY + 4) y = r.bottom + window.scrollY + 8;
    this.diffBar.style.top = `${y}px`;
    this.diffBar.style.left = `${Math.max(8, r.left + window.scrollX)}px`;
  }

  // Accept: keep active additions + non-restored deletions dropped.
  _finalizeDiff() {
    const node = this._activeDiff;
    if (!node) return;
    let out = '';
    node.childNodes.forEach((c) => {
      if (c.nodeType === 3) { out += c.textContent; return; }
      const off = c.classList && c.classList.contains('yjd-ai-off');
      if (c.tagName === 'DEL') { if (off) out += c.textContent; }      // off = keep the original word
      else if (c.tagName === 'INS') { if (!off) out += c.textContent; } // off = drop the added word
    });
    // Provenance: wrap AI-written text in a mark so it can be shown/stripped.
    let applied;
    if (this.cfg.trackAuthorship && out) {
      applied = document.createElement('span');
      applied.className = 'yjd-ai-mark';
      applied.setAttribute('data-ai', '1');
      applied.textContent = out;
    } else {
      applied = document.createTextNode(out);
    }
    node.replaceWith(applied);
    try {
      const range = document.createRange();
      range.setStartAfter(applied); range.collapse(true);
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
    } catch (e) { /* caret placement is best-effort */ }
    this.editor.focus();
    if (typeof this.editor.onContentChange === 'function') this.editor.onContentChange();
    this.editor.emit('ai:accept', { result: out });
    this._closeDiff();
  }

  // Reject: put the original text back.
  _revertDiff() {
    const node = this._activeDiff;
    if (!node) return;
    node.replaceWith(document.createTextNode(node.getAttribute('data-orig') || ''));
    if (typeof this.editor.onContentChange === 'function') this.editor.onContentChange();
    this.editor.emit('ai:discard', {});
    this._closeDiff();
  }

  _closeDiff() {
    this._activeDiff = null;
    if (this._diffKeyHandler) {
      document.removeEventListener('keydown', this._diffKeyHandler, true);
      this._diffKeyHandler = null;
    }
    if (this.diffBar) this.diffBar.style.display = 'none';
  }

  _closeAiBar() {
    this.barOpen = false;
    this._pinned = false;
    this.bar.style.display = 'none';
    this._resetPanel();
    this.savedRange = null;
  }

  _retry() {
    if (this.lastAction) this.run(this.lastAction);
  }

  _abort() {
    if (this.controller) { try { this.controller.abort(); } catch (e) { /* noop */ } this.controller = null; }
  }

  /* --------------------------------------------------------------------- */
  /* Ghost-text autocomplete                                                */
  /* --------------------------------------------------------------------- */

  _scheduleGhost() {
    const cfg = this.auto;
    if (!cfg || this._busy) return;
    this._hideGhost();
    this._abortGhost();   // cancel any in-flight request so it can't render stale
    clearTimeout(this._ghostT);
    this._ghostT = setTimeout(() => this._requestGhost(cfg), cfg.debounce);
  }

  async _requestGhost(cfg) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    if (!this.editor.editor.contains(range.commonAncestorContainer)) return;
    // Only suggest at the end of a text run (no text immediately to the right).
    const node = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE && range.startOffset < node.textContent.length) return;
    const ctxText = this.editor.getText().slice(-cfg.maxContext);
    if (ctxText.trim().length < cfg.minChars) return;

    this._abortGhost();
    this._ghostCtrl = new AbortController();
    const signal = this._ghostCtrl.signal;
    try {
      const ret = await this.cfg.complete({ action: 'autocomplete', prompt: '', text: ctxText, html: '', signal }, () => {});
      const suggestion = typeof ret === 'string' ? ret : '';
      if (!suggestion || signal.aborted) return;
      // Stale guard: caret must still be collapsed where we asked.
      const s2 = window.getSelection();
      if (!s2 || !s2.isCollapsed) return;
      this._showGhost(suggestion, s2.getRangeAt(0));
    } catch (e) { /* ignore */ }
  }

  _showGhost(text, range) {
    if (!this.ghostEl) return;
    this.ghost = text;
    this.ghostEl.textContent = text;
    const rect = range.getBoundingClientRect();
    const host = (this.editor.wrapper || document.body).getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height && !rect.left)) return;
    this.ghostEl.style.display = 'inline';
    this.ghostEl.style.left = `${Math.round(rect.left - host.left + (this.editor.wrapper ? this.editor.wrapper.scrollLeft : 0))}px`;
    this.ghostEl.style.top = `${Math.round(rect.top - host.top + (this.editor.wrapper ? this.editor.wrapper.scrollTop : 0))}px`;
  }

  _hideGhost() {
    this.ghost = null;
    if (this.ghostEl) this.ghostEl.style.display = 'none';
  }

  _abortGhost() {
    if (this._ghostCtrl) { try { this._ghostCtrl.abort(); } catch (e) { /* noop */ } this._ghostCtrl = null; }
  }

  /** Manually trigger a completion at the caret (public). */
  autocomplete() { if (this.auto) this._requestGhost(this.auto); }

  _ghostKeydown(e) {
    if (!this.ghost) return;
    if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      const text = this.ghost;
      this._hideGhost();
      this.editor.insertText(text);
    } else if (e.key === 'Escape') {
      this._hideGhost();
    } else if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) {
      // Bare modifier presses don't change the text — keep the suggestion.
    } else {
      // Any text-changing / navigation key invalidates the suggestion.
      this._hideGhost();
    }
  }

  destroy() {
    this._abort();
    this._abortGhost();
    clearTimeout(this._selT);
    clearTimeout(this._ghostT);
    if (this._onSelect) document.removeEventListener('selectionchange', this._onSelect);
    if (this._onDocPointer) document.removeEventListener('pointerdown', this._onDocPointer, true);
    if (this._onInput) this.editor.editor.removeEventListener('input', this._onInput);
    if (this._onGhostKey) this.editor.editor.removeEventListener('keydown', this._onGhostKey, true);
    if (this._diffKeyHandler) document.removeEventListener('keydown', this._diffKeyHandler, true);
    if (this.bar && this.bar.parentNode) this.bar.parentNode.removeChild(this.bar);
    if (this.diffBar && this.diffBar.parentNode) this.diffBar.parentNode.removeChild(this.diffBar);
    if (this.ghostEl && this.ghostEl.parentNode) this.ghostEl.parentNode.removeChild(this.ghostEl);
    if (this.editor.ai === this) delete this.editor.ai;
    super.destroy();
  }
}
