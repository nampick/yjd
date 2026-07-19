import Module from '../core/module.js';
import { registerIcons, S } from '../ui/icons.js';

registerIcons({
  'ai': S('<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/><path d="M5 3v4"/><path d="M3 5h4"/><path d="M19 17v4"/><path d="M17 19h4"/>')
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
  { id: 'improve',   label: 'Improve writing',  prompt: 'Improve the writing, grammar and clarity of the text. Return only the rewritten text, no preamble.' },
  { id: 'fix',       label: 'Fix spelling & grammar', prompt: 'Fix spelling and grammar. Return only the corrected text.' },
  { id: 'shorten',   label: 'Make shorter',     prompt: 'Make the text more concise while keeping its meaning. Return only the text.' },
  { id: 'lengthen',  label: 'Make longer',      prompt: 'Expand the text with more detail while keeping its tone. Return only the text.' },
  { id: 'simplify',  label: 'Simplify',         prompt: 'Rewrite the text in simpler, clearer language. Return only the text.' },
  { id: 'summarize', label: 'Summarize',        prompt: 'Summarize the text in one or two sentences. Return only the summary.' },
];

// --rte-* theme vars copied onto the portaled menus so a themed editor themes
// its AI surfaces too (mirrors Mention.THEME_VARS).
const THEME_VARS = ['--rte-accent', '--rte-accent-ink', '--rte-accent-weak', '--rte-ink', '--rte-muted', '--rte-border', '--rte-bg', '--rte-radius-md', '--rte-shadow'];

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
    const bar = document.createElement('div');
    bar.className = 'yjd-ai-bar';
    bar.setAttribute('role', 'toolbar');
    bar.style.display = 'none';
    bar.innerHTML =
      '<div class="yjd-ai-actions"></div>' +
      '<form class="yjd-ai-ask"><input type="text" class="yjd-ai-input" ' +
      'placeholder="Ask AI to edit or write…" aria-label="Ask AI"></form>' +
      '<div class="yjd-ai-panel" hidden>' +
        '<div class="yjd-ai-result" aria-live="polite"></div>' +
        '<div class="yjd-ai-foot">' +
          '<button type="button" class="yjd-ai-accept" data-act="accept">Accept</button>' +
          '<button type="button" class="yjd-ai-retry"  data-act="retry">Retry</button>' +
          '<button type="button" class="yjd-ai-discard" data-act="discard">Discard</button>' +
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
      b.textContent = a.label || a.id;
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
    // Open the toolbar on a settled non-empty selection inside the editor.
    this._onSelect = () => {
      if (this._busy) return;
      clearTimeout(this._selT);
      this._selT = setTimeout(() => this._maybeOpenBar(), 80);
    };
    document.addEventListener('selectionchange', this._onSelect);

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
    this._positionBar(caret);
    // Defer so the click's own focus settling doesn't steal it back.
    setTimeout(() => this.input.focus(), 0);   // jump straight to "Ask AI…"
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
    const rect = (range && range.getClientRects().length)
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
    const text = opts.text != null ? opts.text : (this.savedRange ? this.savedRange.toString() : '');
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
    const onToken = (chunk) => {
      if (typeof chunk !== 'string' || myReq !== this.reqSeq) return;
      acc += chunk;
      this._showPanel(acc);
    };

    try {
      const ret = await this.cfg.complete(
        { action: act.id, prompt: act.prompt || act.id, text, html: opts.html || '', signal: this.controller.signal },
        onToken
      );
      // A newer request (Retry / another action) superseded this one — discard
      // its result even if the app ignored the abort signal.
      if (myReq !== this.reqSeq) return '';
      const result = (typeof ret === 'string' && ret.length ? ret : acc).trim();
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
    this.resultEl.textContent = (err && err.message) ? err.message : 'Something went wrong.';
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
    this.editor.replaceSelection(result, { asText: true });
    this.editor.emit('ai:accept', { result });
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
    if (this.bar && this.bar.parentNode) this.bar.parentNode.removeChild(this.bar);
    if (this.ghostEl && this.ghostEl.parentNode) this.ghostEl.parentNode.removeChild(this.ghostEl);
    if (this.editor.ai === this) delete this.editor.ai;
    super.destroy();
  }
}
