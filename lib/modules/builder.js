import Module from '../core/module.js';

/**
 * Builder mode — the author-friendly page-builder surface.
 *
 *   new Editor(el, { builder: true, blocks: {…}, variables: {…} })
 *
 * Adds a left PALETTE of content tiles (Text, Heading, Button, Divider,
 * 1/2/3-column layouts, every registered slot block, Variable). Tiles insert
 * on click and drag-drop with a live insertion line — no slash commands or
 * trigger characters needed (they still work). Sections and columns get
 * always-visible outlines, an empty column becomes a click-to-add target,
 * and clicking a section's background opens its style inspector.
 */
export default class Builder extends Module {
  constructor(editor, options = {}) {
    super(editor, options);
    if (!editor.options.builder) return;
    this.enabled = true;
    editor.wrapper.classList.add('yjd-builder-mode');
    this._buildPalette();
    this._bindEditorClicks();
  }

  /* ------------------------------ palette ------------------------------ */

  _tiles() {
    const ed = this.editor;
    const tiles = [
      { id: 'text', label: this.t('builder.text', 'Text'), icon: '¶', make: () => this._el('p', '<br>') },
      { id: 'heading', label: this.t('builder.heading', 'Heading'), icon: 'H', make: () => this._el('h2', '<br>') },
    ];
    if (ed.getModule('button')) {
      tiles.push({ id: 'button', label: this.t('builder.button', 'Button'), icon: '▢', make: () => ed.getModule('button').create({}) });
    }
    tiles.push({ id: 'divider', label: this.t('builder.divider', 'Divider'), icon: '—', make: () => document.createElement('hr') });
    if (ed.getModule('sections')) {
      [1, 2, 3].forEach((n) => tiles.push({
        id: 'cols' + n,
        label: n === 1 ? this.t('builder.section', 'Section') : n + ' ' + this.t('builder.columns', 'columns'),
        icon: ['▭', '◫', '⫿'][n - 1],
        cols: n,
        make: () => {
          const sec = ed.getModule('sections').create(n, n === 1 ? {} : { background: 'transparent', padding: 0 });
          // Every column starts with an editable paragraph — an empty drop
          // frame reads as "broken", a caret line reads as "type here".
          sec.querySelectorAll(':scope > .yjd-col').forEach((c) => { if (!c.firstChild) c.innerHTML = '<p><br></p>'; });
          return sec;
        },
      }));
    }
    Object.entries(ed.options.blocks || {}).forEach(([name, def]) => {
      tiles.push({
        id: 'slot:' + name, label: def.label || name, icon: def.icon || '⬚',
        make: () => ed.getModule('blocks') && ed.getModule('blocks').makeCard(name),
      });
    });
    if (ed.options.variables && ed.options.variables.items) {
      tiles.push({ id: 'variable', label: this.t('builder.variable', 'Variable'), icon: (ed.options.variables.trigger || '{') + '}', variable: true });
    }
    return tiles;
  }

  _el(tag, inner) {
    const el = document.createElement(tag);
    el.innerHTML = inner;
    return el;
  }

  _buildPalette() {
    const rail = document.createElement('div');
    rail.className = 'yjd-palette';
    rail.setAttribute('contenteditable', 'false');
    const head = document.createElement('div');
    head.className = 'yjd-palette-head';
    head.textContent = this.t('builder.insert', 'Insert');
    rail.appendChild(head);

    this._tiles().forEach((tile) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'yjd-tile';
      b.dataset.tile = tile.id;
      b.innerHTML = `<span class="yjd-tile-icon">${tile.icon}</span><span class="yjd-tile-label">${tile.label}</span>`;
      b.title = this.t('builder.tileHint', 'Click to add · drag into the page');
      // Click: insert at the end (scrolled into view, caret placed).
      b.addEventListener('click', (e) => {
        e.preventDefault();
        this._insertTile(tile, null, null);
      });
      // Drag: live insertion line, drop where the line sits.
      b.addEventListener('pointerdown', (e) => this._startDrag(e, tile, b));
      rail.appendChild(b);
    });

    this.rail = rail;
    this.editor.wrapper.insertBefore(rail, this.editor.editor);
  }

  /* --------------------------- insert + drag --------------------------- */

  _insertTile(tile, container, before) {
    const ed = this.editor;
    if (tile.variable) {
      // The variable picker is caret-driven: focus, type its trigger.
      ed.focus();
      document.execCommand('insertText', false, (ed.options.variables.trigger || '{'));
      const m = ed.getModule('variables');
      if (m && typeof m.handleInput === 'function') setTimeout(() => m.handleInput(), 0);
      return;
    }
    const history = ed.getModule('history');
    if (history && typeof history.saveBeforeFormat === 'function') history.saveBeforeFormat();
    const el = tile.make();
    if (!el) return;
    if (container) {
      container.insertBefore(el, before || null);
    } else {
      ed.editor.appendChild(el);
    }
    el.scrollIntoView({ block: 'nearest' });
    // Caret into the new element when it's editable text.
    if (/^(P|H[1-6])$/.test(el.tagName) || el.querySelector('p')) {
      const target = /^(P|H[1-6])$/.test(el.tagName) ? el : el.querySelector('p');
      const sel = window.getSelection();
      const r = document.createRange();
      r.setStart(target, 0);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
    }
    if (typeof ed.onContentChange === 'function') ed.onContentChange();
    ed.emit('builder:insert', { tile: tile.id });
  }

  _startDrag(e, tile, tileEl) {
    if (tile.variable) return; // caret-driven, click only
    e.preventDefault();
    const ed = this.editor;
    let dragging = false;
    let drop = null; // { container, before }

    const indicator = document.createElement('div');
    indicator.className = 'yjd-drop-indicator';
    indicator.style.display = 'none';
    ed.wrapper.appendChild(indicator);

    const containers = () => [ed.editor, ...ed.editor.querySelectorAll(':scope .yjd-col')];

    const onMove = (ev) => {
      if (!dragging && (Math.abs(ev.clientX - e.clientX) + Math.abs(ev.clientY - e.clientY)) > 5) {
        dragging = true;
        tileEl.classList.add('dragging');
        document.body.style.cursor = 'grabbing';
      }
      if (!dragging) return;
      const under = document.elementFromPoint(ev.clientX, ev.clientY);
      if (!under || !ed.wrapper.contains(under)) { indicator.style.display = 'none'; drop = null; return; }
      // Target container: the column under the pointer, else the root.
      const col = under.closest && under.closest('.yjd-col');
      const container = (col && ed.editor.contains(col)) ? col : ed.editor;
      // Insertion slot: before the first child block whose midpoint is below.
      let before = null;
      for (const child of container.children) {
        const r = child.getBoundingClientRect();
        if (ev.clientY < r.top + r.height / 2) { before = child; break; }
      }
      drop = { container, before };
      // Line at the slot.
      const wrapRect = ed.wrapper.getBoundingClientRect();
      const cRect = container.getBoundingClientRect();
      const y = before ? before.getBoundingClientRect().top - 3 : cRect.bottom - 3;
      indicator.style.display = 'block';
      indicator.style.top = Math.round(y - wrapRect.top) + 'px';
      indicator.style.left = Math.round(cRect.left - wrapRect.left + 4) + 'px';
      indicator.style.width = Math.round(cRect.width - 8) + 'px';
    };
    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      tileEl.classList.remove('dragging');
      document.body.style.cursor = '';
      indicator.remove();
      if (dragging && drop) this._insertTile(tile, drop.container, drop.before);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }

  /* ------------------------- friendly structure ------------------------- */

  _bindEditorClicks() {
    this._onClick = (e) => {
      const t = e.target;
      // Clicking an EMPTY column starts a paragraph there — the fastest
      // "add content here" affordance.
      if (t.classList && t.classList.contains('yjd-col') && !t.firstElementChild) {
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        t.appendChild(p);
        const sel = window.getSelection();
        const r = document.createRange();
        r.setStart(p, 0);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
        e.preventDefault();
        return;
      }
      // Clicking a section's own background (not a block inside it) opens its
      // inspector — no hunting for the hover pill.
      if (t.classList && (t.classList.contains('yjd-section') || t.classList.contains('yjd-col'))) {
        const sec = t.closest('.yjd-section');
        const m = this.editor.getModule('sections');
        if (sec && m && typeof m.openInspector === 'function') {
          e.preventDefault();
          m.openInspector(sec);
        }
      }
    };
    this.editor.editor.addEventListener('click', this._onClick);
  }

  destroy() {
    if (this.rail && this.rail.parentNode) this.rail.parentNode.removeChild(this.rail);
    if (this._onClick) this.editor.editor.removeEventListener('click', this._onClick);
  }
}
