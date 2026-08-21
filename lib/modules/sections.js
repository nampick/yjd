import Module from '../core/module.js';

/**
 * Section & Columns (#84) — the minimal container model:
 *
 *   Document = (blocks | Section)[]     ← untouched blocks = implicit section
 *   Section  = div.yjd-section[data-style] > 1–3 × div.yjd-col > blocks
 *
 * data-style is canonical ({ background, padding, radius, full }); the inline
 * style is derived. No nesting (a section never contains a section), max 3
 * equal columns. Sections are inserted from the slash menu; hovering shows a
 * "Section" pill that opens the inspector (background / padding / radius /
 * column count / delete). getEmailHTML() compiles sections to full-width
 * bands whose columns stack on narrow clients.
 */
export default class Sections extends Module {
  static DEFAULT_STYLE = { background: 'transparent', padding: 16, radius: 8 };

  constructor(editor, options = {}) {
    super(editor, options);
    this._buildPill();
    this._onOver = (e) => {
      const sec = e.target.closest && e.target.closest('.yjd-section');
      if (sec && this.editor.editor.contains(sec)) this._showPill(sec);
      else if (!e.target.closest('.yjd-section-pill')) this._hidePill();
    };
    this.editor.editor.addEventListener('mouseover', this._onOver);
    this._onDocDown = (e) => {
      if (this.popup && !this.popup.contains(e.target) && !e.target.closest('.yjd-section-pill')) {
        this.closeInspector();
      }
    };
    document.addEventListener('pointerdown', this._onDocDown, true);
    this.restyleAll();
  }

  /* ------------------------------ model ------------------------------ */

  styleOf(sec) {
    let s = {};
    try { s = JSON.parse(sec.getAttribute('data-style') || '{}'); } catch (e) { /* defaults */ }
    return { ...Sections.DEFAULT_STYLE, ...s };
  }

  applyStyle(sec, style) {
    sec.setAttribute('data-style', JSON.stringify(style));
    sec.style.cssText =
      `background:${style.background};padding:${style.padding}px;` +
      `border-radius:${style.radius}px;`;
  }

  /** Create a section with `cols` columns; first column gets `blocks` or an empty paragraph. */
  create(cols = 1, style = {}) {
    const sec = document.createElement('div');
    sec.className = 'yjd-section';
    for (let i = 0; i < Math.min(3, Math.max(1, cols)); i++) {
      const col = document.createElement('div');
      col.className = 'yjd-col';
      if (i === 0) col.innerHTML = '<p><br></p>';
      sec.appendChild(col);
    }
    this.applyStyle(sec, { ...Sections.DEFAULT_STYLE, ...style });
    return sec;
  }

  insert(style = {}) {
    const history = this.editor.getModule('history');
    if (history && typeof history.saveBeforeFormat === 'function') history.saveBeforeFormat();
    const sec = this.create(1, style);
    if (typeof this.editor.insertBlock === 'function') this.editor.insertBlock(sec);
    else this.editor.editor.appendChild(sec);
    // Caret into the first paragraph.
    const p = sec.querySelector('p');
    if (p) {
      const sel = window.getSelection();
      const r = document.createRange();
      r.setStart(p, 0);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
    }
    if (typeof this.editor.onContentChange === 'function') this.editor.onContentChange();
    this.editor.emit('section:insert', {});
    return sec;
  }

  /** Change the column count (1–3): extra columns appended empty; removed columns merge back. */
  setColumns(sec, count) {
    count = Math.min(3, Math.max(1, count));
    const cols = [...sec.children].filter((c) => c.classList.contains('yjd-col'));
    if (cols.length === count) return;
    const history = this.editor.getModule('history');
    if (history && typeof history.saveBeforeFormat === 'function') history.saveBeforeFormat();
    if (cols.length < count) {
      for (let i = cols.length; i < count; i++) {
        const col = document.createElement('div');
        col.className = 'yjd-col';
        sec.appendChild(col);
      }
    } else {
      const keep = cols.slice(0, count);
      cols.slice(count).forEach((col) => {
        while (col.firstChild) keep[keep.length - 1].appendChild(col.firstChild);
        sec.removeChild(col);
      });
    }
    if (typeof this.editor.onContentChange === 'function') this.editor.onContentChange();
    this.editor.emit('section:columns', { count });
  }

  /** Re-derive inline styles + normalize legacy markup after setContent. */
  restyleAll() {
    this.editor.editor.querySelectorAll('.yjd-section').forEach((sec) => {
      // No nesting: a section inside a section is unwrapped to its columns' blocks.
      if (sec.parentElement && sec.parentElement.closest('.yjd-section')) {
        const parentCol = sec.parentElement;
        [...sec.querySelectorAll('.yjd-col')].forEach((col) => {
          while (col.firstChild) parentCol.insertBefore(col.firstChild, sec);
        });
        parentCol.removeChild(sec);
        return;
      }
      this.applyStyle(sec, this.styleOf(sec));
      // Every section holds at least one column; stray direct blocks move into the first.
      let firstCol = sec.querySelector(':scope > .yjd-col');
      if (!firstCol) {
        firstCol = document.createElement('div');
        firstCol.className = 'yjd-col';
        while (sec.firstChild) firstCol.appendChild(sec.firstChild);
        sec.appendChild(firstCol);
      }
    });
  }

  /* ------------------------------ chrome ------------------------------ */

  _buildPill() {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'yjd-section-pill';
    pill.textContent = this.t('section.pill', 'Section');
    pill.style.display = 'none';
    pill.addEventListener('pointerdown', (e) => e.preventDefault());
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      if (this._pillTarget) this.openInspector(this._pillTarget);
    });
    this.pill = pill;
    this.editor.wrapper.appendChild(pill);
  }

  _showPill(sec) {
    this._pillTarget = sec;
    const wrapRect = this.editor.wrapper.getBoundingClientRect();
    const r = sec.getBoundingClientRect();
    this.pill.style.display = 'block';
    this.pill.style.left = Math.max(4, r.right - wrapRect.left - 64) + 'px';
    this.pill.style.top = Math.max(0, r.top - wrapRect.top - 10) + 'px';
  }

  _hidePill() {
    if (this.popup) return; // keep visible while the inspector is open
    this.pill.style.display = 'none';
  }

  openInspector(sec) {
    this.closeInspector();
    const style = this.styleOf(sec);
    const pop = document.createElement('div');
    pop.className = 'yjd-btn-inspector yjd-section-inspector';
    this.popup = pop;

    const history = this.editor.getModule('history');
    if (history && typeof history.saveBeforeFormat === 'function') history.saveBeforeFormat();

    const commit = () => {
      this.applyStyle(sec, style);
      if (typeof this.editor.onContentChange === 'function') this.editor.onContentChange();
      this.editor.emit('style:change', { element: 'section', props: { ...style } });
    };
    const field = (labelText, control) => {
      const row = document.createElement('label');
      row.className = 'yjd-btn-field';
      const cap = document.createElement('span');
      cap.textContent = labelText;
      row.append(cap, control);
      pop.appendChild(row);
      return control;
    };

    // Background: theme swatches (+ free hex unless strict), plus "none".
    const theme = this.editor.options.theme || {};
    const swatches = document.createElement('div');
    swatches.className = 'yjd-btn-swatches';
    const none = document.createElement('button');
    none.type = 'button';
    none.className = 'yjd-btn-swatch yjd-swatch-none';
    none.title = this.t('section.noBackground', 'None');
    none.addEventListener('click', (e) => { e.preventDefault(); style.background = 'transparent'; commit(); });
    swatches.appendChild(none);
    Object.entries(theme.colors || {}).forEach(([name, hex]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'yjd-btn-swatch';
      b.title = name;
      b.style.background = hex;
      b.addEventListener('click', (e) => { e.preventDefault(); style.background = hex; commit(); });
      swatches.appendChild(b);
    });
    if (!theme.strict) {
      const hex = document.createElement('input');
      hex.type = 'text';
      hex.className = 'yjd-input yjd-btn-hex';
      hex.placeholder = '#rrggbb';
      hex.value = style.background === 'transparent' ? '' : style.background;
      hex.addEventListener('change', () => { style.background = hex.value.trim() || 'transparent'; commit(); });
      swatches.appendChild(hex);
    }
    field(this.t('section.background', 'Background'), swatches);

    const pad = field(this.t('section.padding', 'Padding'), Object.assign(document.createElement('input'), { type: 'number', value: style.padding, min: 0, max: 64 }));
    pad.className = 'yjd-input yjd-btn-num';
    pad.addEventListener('input', () => { style.padding = parseInt(pad.value, 10) || 0; commit(); });
    const rad = field(this.t('section.radius', 'Radius'), Object.assign(document.createElement('input'), { type: 'number', value: style.radius, min: 0, max: 48 }));
    rad.className = 'yjd-input yjd-btn-num';
    rad.addEventListener('input', () => { style.radius = parseInt(rad.value, 10) || 0; commit(); });

    // Column count 1–3
    const colBox = document.createElement('div');
    colBox.className = 'yjd-btn-aligns';
    const current = () => [...sec.children].filter((c) => c.classList.contains('yjd-col')).length;
    [1, 2, 3].forEach((n) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'yjd-btn-align' + (current() === n ? ' active' : '');
      b.textContent = String(n);
      b.addEventListener('click', (e) => {
        e.preventDefault();
        this.setColumns(sec, n);
        [...colBox.children].forEach((c) => c.classList.toggle('active', c === b));
      });
      colBox.appendChild(b);
    });
    field(this.t('section.columns', 'Columns'), colBox);

    // Delete section (blocks are removed with it — undoable).
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'yjd-section-delete';
    del.textContent = this.t('section.delete', 'Delete section');
    del.addEventListener('click', (e) => {
      e.preventDefault();
      const h = this.editor.getModule('history');
      if (h && typeof h.saveBeforeFormat === 'function') h.saveBeforeFormat();
      sec.remove();
      this.closeInspector();
      this._hidePill();
      if (typeof this.editor.onContentChange === 'function') this.editor.onContentChange();
    });
    pop.appendChild(del);

    const container = this.editor.getPopupContainer ? this.editor.getPopupContainer() : this.editor.wrapper;
    container.appendChild(pop);
    const wrapRect = this.editor.wrapper.getBoundingClientRect();
    const r = sec.getBoundingClientRect();
    pop.style.position = 'absolute';
    pop.style.left = Math.max(8, r.right - wrapRect.left - 248) + 'px';
    pop.style.top = (r.top - wrapRect.top + 24) + 'px';
  }

  closeInspector() {
    if (this.popup && this.popup.parentNode) this.popup.parentNode.removeChild(this.popup);
    this.popup = null;
  }

  destroy() {
    this.closeInspector();
    this.editor.editor.removeEventListener('mouseover', this._onOver);
    document.removeEventListener('pointerdown', this._onDocDown, true);
    if (this.pill && this.pill.parentNode) this.pill.parentNode.removeChild(this.pill);
  }
}
