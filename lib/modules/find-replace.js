import Module from '../core/module.js';
import IconUtils from '../ui/icons.js';

/**
 * Find & Replace module.
 *
 * Opens with Ctrl/Cmd+F or the toolbar "find" button. Highlights matches
 * (wrapping them in <mark> within single text nodes), supports next/prev
 * navigation, replace-current and replace-all. Matches that span across
 * formatting boundaries (e.g. half inside a <b>) are not highlighted — a
 * documented limitation of the per-text-node approach.
 */
export default class FindReplace extends Module {
  constructor(editor, options = {}) {
    super(editor, options);
    this.hits = [];
    this.activeIndex = -1;
    this.caseSensitive = false;
    this.isOpen = false;
    this.buildPanel();
    this.bindEvents();
  }

  buildPanel() {
    const panel = document.createElement('div');
    panel.className = 'yjd-find-replace';

    const mkInput = (ph, cls) => {
      const i = document.createElement('input');
      i.type = 'text';
      i.placeholder = ph;
      i.className = `yjd-find-input ${cls}`;
      i.setAttribute('aria-label', ph);
      return i;
    };
    const mkBtn = (label, title, cls = '', icon = null) => {
      const b = document.createElement('button');
      b.type = 'button';
      if (icon) {
        const svg = IconUtils.getIcon(icon);
        b.innerHTML = svg ? `<span class="icon">${svg}</span>` : label;
      } else {
        b.textContent = label;
      }
      b.title = title;
      b.setAttribute('aria-label', title);
      b.className = `yjd-find-btn ${cls}`.trim();
      return b;
    };

    // Two rows: find controls, then replace controls
    const findRow = document.createElement('div');
    findRow.className = 'yjd-find-row';
    const replaceRow = document.createElement('div');
    replaceRow.className = 'yjd-find-row';

    this.findInput = mkInput('Find', 'yjd-find-field');
    this.replaceInput = mkInput('Replace with', 'yjd-find-field');
    this.countEl = document.createElement('span');
    this.countEl.className = 'yjd-find-count';
    this.countEl.textContent = '0/0';

    this.prevBtn = mkBtn('', 'Previous match', 'yjd-find-icon', 'chevron-up');
    this.nextBtn = mkBtn('', 'Next match', 'yjd-find-icon', 'chevron-down');
    this.caseBtn = mkBtn('Aa', 'Match case', 'yjd-find-icon yjd-find-toggle');
    this.closeBtn = mkBtn('', 'Close (Esc)', 'yjd-find-icon yjd-find-close', 'close');
    this.replaceBtn = mkBtn('Replace', 'Replace current');
    this.replaceAllBtn = mkBtn('Replace all', 'Replace all matches');

    findRow.append(this.findInput, this.countEl, this.prevBtn, this.nextBtn, this.caseBtn, this.closeBtn);
    replaceRow.append(this.replaceInput, this.replaceBtn, this.replaceAllBtn);
    panel.append(findRow, replaceRow);

    this.panel = panel;
    this.editor.wrapper.appendChild(panel);
  }

  bindEvents() {
    // Open with Ctrl/Cmd+F from within the editor
    this._onKeydown = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        this.open();
      }
    };
    this.editor.editor.addEventListener('keydown', this._onKeydown);

    // Open from the toolbar "find" button
    this._onToolbarClick = (data) => {
      if (data && data.command === 'find') this.open();
    };
    this.editor.on('toolbar-click', this._onToolbarClick);

    this.findInput.addEventListener('input', () => this.runSearch());
    this.findInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this.navigate(e.shiftKey ? -1 : 1); }
      else if (e.key === 'Escape') { e.preventDefault(); this.close(); }
    });
    this.replaceInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this.replaceCurrent(); }
      else if (e.key === 'Escape') { e.preventDefault(); this.close(); }
    });
    this.prevBtn.addEventListener('click', () => this.navigate(-1));
    this.nextBtn.addEventListener('click', () => this.navigate(1));
    this.replaceBtn.addEventListener('click', () => this.replaceCurrent());
    this.replaceAllBtn.addEventListener('click', () => this.replaceAll());
    this.caseBtn.addEventListener('click', () => {
      this.caseSensitive = !this.caseSensitive;
      this.caseBtn.classList.toggle('active', this.caseSensitive);
      this.caseBtn.setAttribute('aria-pressed', this.caseSensitive ? 'true' : 'false');
      this.runSearch();
    });
    this.closeBtn.addEventListener('click', () => this.close());
  }

  open() {
    this.isOpen = true;
    this.panel.classList.add('open');
    // Sit just below the toolbar so the panel never covers its buttons
    // (the toolbar height changes when "More" is expanded).
    const toolbar = this.editor.wrapper.querySelector('.rich-editor-toolbar-container');
    if (toolbar) this.panel.style.top = (toolbar.offsetHeight + 6) + 'px';
    // Prefill with the current selection (if any, single-line)
    const sel = window.getSelection();
    const selText = sel && !sel.isCollapsed ? sel.toString() : '';
    if (selText && !selText.includes('\n')) this.findInput.value = selText;
    this.findInput.focus();
    this.findInput.select();
    this.runSearch();
  }

  close() {
    this.isOpen = false;
    this.panel.classList.remove('open');
    this.clearHighlights();
    this.hits = [];
    this.activeIndex = -1;
    this.editor.focus();
  }

  escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Run `fn` without the history module recording the resulting DOM mutations —
   * search highlights are a transient visual overlay and must never enter the
   * undo stack (otherwise Undo can restore <mark>-wrapped content).
   */
  _withoutHistory(fn) {
    const h = this.editor.getModule('history');
    if (!h) return fn();
    h.suppressed = true;
    try { return fn(); }
    finally { setTimeout(() => { h.suppressed = false; }, 0); }
  }

  clearHighlights() {
    this._withoutHistory(() => {
      const marks = this.editor.editor.querySelectorAll('mark.yjd-find-hit');
      marks.forEach((m) => {
        const parent = m.parentNode;
        if (!parent) return;
        while (m.firstChild) parent.insertBefore(m.firstChild, m);
        parent.removeChild(m);
        parent.normalize();
      });
    });
  }

  runSearch() {
    this.clearHighlights();
    this.hits = [];
    this.activeIndex = -1;

    const term = this.findInput.value;
    if (!term) { this.updateCount(); return; }

    let regex;
    try {
      regex = new RegExp(this.escapeRegex(term), this.caseSensitive ? 'g' : 'gi');
    } catch (e) {
      this.updateCount();
      return;
    }

    const root = this.editor.editor;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.length) textNodes.push(node);
    }

    this._withoutHistory(() => {
      textNodes.forEach((textNode) => {
        const text = textNode.nodeValue;
        const ranges = [];
        regex.lastIndex = 0;
        let m;
        while ((m = regex.exec(text)) !== null) {
          if (m[0].length === 0) { regex.lastIndex++; continue; }
          ranges.push([m.index, m.index + m[0].length]);
        }
        // Wrap from last match to first so earlier offsets stay valid
        for (let i = ranges.length - 1; i >= 0; i--) {
          const r = document.createRange();
          r.setStart(textNode, ranges[i][0]);
          r.setEnd(textNode, ranges[i][1]);
          const mark = document.createElement('mark');
          mark.className = 'yjd-find-hit';
          try { r.surroundContents(mark); } catch (e) { /* skip un-wrappable */ }
        }
      });
    });

    // Collect in document order
    this.hits = Array.from(root.querySelectorAll('mark.yjd-find-hit'));
    if (this.hits.length) {
      this.activeIndex = 0;
      this.highlightActive(true);
    }
    this.updateCount();
  }

  highlightActive(scroll) {
    this.hits.forEach((m, i) => {
      m.classList.toggle('active', i === this.activeIndex);
    });
    if (scroll && this.activeIndex >= 0 && this.hits[this.activeIndex]) {
      this.hits[this.activeIndex].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  navigate(dir) {
    if (!this.hits.length) return;
    this.activeIndex = (this.activeIndex + dir + this.hits.length) % this.hits.length;
    this.highlightActive(true);
    this.updateCount();
  }

  updateCount() {
    const total = this.hits.length;
    const cur = total ? this.activeIndex + 1 : 0;
    this.countEl.textContent = `${cur}/${total}`;
  }

  replaceCurrent() {
    if (this.activeIndex < 0 || !this.hits[this.activeIndex]) return;
    const history = this.editor.getModule('history');
    if (history && typeof history.saveBeforeFormat === 'function') history.saveBeforeFormat();

    const mark = this.hits[this.activeIndex];
    const at = this.activeIndex;
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(this.replaceInput.value), mark);
    parent.normalize();
    this.editor.onContentChange();

    this.runSearch();
    if (this.hits.length) {
      this.activeIndex = Math.min(at, this.hits.length - 1);
      this.highlightActive(true);
      this.updateCount();
    }
  }

  replaceAll() {
    if (!this.hits.length) return;
    const history = this.editor.getModule('history');
    if (history && typeof history.saveBeforeFormat === 'function') history.saveBeforeFormat();

    const repl = this.replaceInput.value;
    this.hits.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) parent.replaceChild(document.createTextNode(repl), mark);
    });
    this.editor.editor.normalize();
    this.editor.onContentChange();
    this.runSearch();
  }

  destroy() {
    this.editor.editor.removeEventListener('keydown', this._onKeydown);
    this.editor.off('toolbar-click', this._onToolbarClick);
    this.clearHighlights();
    if (this.panel && this.panel.parentNode) this.panel.parentNode.removeChild(this.panel);
    super.destroy();
  }
}
