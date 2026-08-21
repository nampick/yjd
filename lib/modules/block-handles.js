import Module from '../core/module.js';
import { registerIcons, S } from '../ui/icons.js';

registerIcons({
  'drag-handle': S('<circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none"/>')
});

const BLOCK_SELECTOR = 'p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, pre, table, hr, details, div';

/**
 * Block handles (UI 2.0 editor surface): hovering a block reveals a left-gutter
 * pair — ⠿ (drag to reorder, one undo step) and + (insert a block below, which
 * opens the slash menu). The gutter chrome lives in the wrapper, never in the
 * content DOM, so nothing extra serializes.
 *
 * Off by default in the prompt layout (a one-line composer has no blocks to
 * reorder).
 */
export default class BlockHandles extends Module {
  constructor(editor, options = {}) {
    super(editor, options);
    if (editor.options.layout === 'prompt') return;
    this.block = null;
    this.dragging = false;
    // Reserve the design's left gutter (the handles need ~40px of margin).
    this.editor.wrapper.classList.add('yjd-has-block-handles');
    this._build();
    this._bind();
  }

  _build() {
    const gutter = document.createElement('div');
    gutter.className = 'yjd-block-gutter';
    gutter.style.display = 'none';

    const drag = document.createElement('button');
    drag.type = 'button';
    drag.className = 'yjd-block-drag';
    drag.title = this.t('block.dragMove', 'Drag to move');
    drag.setAttribute('aria-label', this.t('block.dragMoveAria', 'Drag to move block'));
    drag.setAttribute('tabindex', '-1');
    drag.innerHTML = S('<circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none"/>');

    const plus = document.createElement('button');
    plus.type = 'button';
    plus.className = 'yjd-block-plus';
    plus.title = this.t('block.addBelow', 'Add block below');
    plus.setAttribute('aria-label', this.t('block.addBelow', 'Add block below'));
    plus.setAttribute('tabindex', '-1');
    plus.innerHTML = S('<path d="M12 5v14"/><path d="M5 12h14"/>');

    gutter.append(drag, plus);
    this.gutter = gutter;
    this.dragBtn = drag;
    this.plusBtn = plus;
    this.editor.wrapper.appendChild(gutter);

    const indicator = document.createElement('div');
    indicator.className = 'yjd-drop-indicator';
    indicator.style.display = 'none';
    this.indicator = indicator;
    this.editor.wrapper.appendChild(indicator);
  }

  _bind() {
    this._onMove = (e) => {
      if (this.dragging) return;
      const t = e.target;
      if (this.gutter.contains(t)) return;
      let block = t && t.closest ? t.closest(BLOCK_SELECTOR) : null;
      // Draggable blocks are direct children of the editable area OR of a
      // section column (#84) — dragging between columns works like dragging
      // between root blocks.
      while (block && !this._isContainer(block.parentElement)) {
        block = block.parentElement && block.parentElement.closest
          ? block.parentElement.closest(BLOCK_SELECTOR) : null;
      }
      // Pointer over the gutter band (the area's left padding) hits no block —
      // fall back to the block on this row so the handles don't vanish on the
      // way to them.
      if (!block) block = this._blockAtY(e.clientY);
      if (!block || !this.editor.editor.contains(block)) return this._hide();
      this._showFor(block);
    };
    this.editor.editor.addEventListener('mousemove', this._onMove);
    this._onLeave = (e) => {
      if (this.dragging) return;
      const to = e.relatedTarget;
      if (to && (this.gutter.contains(to) || this.editor.editor.contains(to))) return;
      this._hide();
    };
    this.editor.editor.addEventListener('mouseleave', this._onLeave);
    this.gutter.addEventListener('mouseleave', this._onLeave);
    this._onScroll = () => { if (this.block && !this.dragging) this._position(); };
    this.editor.editor.addEventListener('scroll', this._onScroll);
    this._onInput = () => { if (!this.dragging) this._hide(); };
    this.editor.editor.addEventListener('input', this._onInput);

    // "+" → new paragraph below this block, caret in it, slash menu open.
    this.plusBtn.addEventListener('pointerdown', (e) => e.preventDefault());
    this.plusBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const block = this.block;
      if (!block) return;
      const h = this.editor.getModule('history');
      if (h && typeof h.saveBeforeFormat === 'function') h.saveBeforeFormat();
      const p = document.createElement('p');
      p.textContent = '/';
      block.after(p);
      // Focus FIRST (it may restore a stale saved selection), then place the
      // caret after the "/" so the slash menu's input path sees it.
      this.editor.focus();
      const sel = window.getSelection();
      const r = document.createRange();
      r.setStart(p.firstChild, 1);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
      this.editor.editor.dispatchEvent(new InputEvent('input', { bubbles: true }));
      if (typeof this.editor.onContentChange === 'function') this.editor.onContentChange();
      this._hide();
    });

    // Drag to reorder (pointer-based; the indicator line marks the drop slot).
    this.dragBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const block = this.block;
      if (!block) return;
      this.dragging = true;
      this._dropBefore = null;
      this.gutter.classList.add('dragging');
      document.body.style.cursor = 'grabbing';
      block.classList.add('yjd-block-dragging');

      const onMove = (ev) => {
        this._lastX = ev.clientX; this._lastY = ev.clientY;
        const blocks = this._allBlocks().filter((el) => el !== block && !el.contains(block) && !block.contains(el));
        let before = null;
        for (const b of blocks) {
          const r = b.getBoundingClientRect();
          if (ev.clientY < r.top + r.height / 2) { before = b; break; }
        }
        this._dropBefore = before;
        this._showIndicator(before, blocks);
      };
      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        this.dragging = false;
        this.gutter.classList.remove('dragging');
        document.body.style.cursor = '';
        block.classList.remove('yjd-block-dragging');
        this.indicator.style.display = 'none';
        const before = this._dropBefore;
        const changed = before !== undefined &&
          before !== block && before !== block.nextSibling;
        if (changed) {
          const h = this.editor.getModule('history');
          if (h && typeof h.saveBeforeFormat === 'function') h.saveBeforeFormat();
          // Drop lands in the container that owns `before` — root or a section
          // column (#84); with no target below, an empty hovered column takes
          // the block, else it goes to the end of the root.
          if (before && this._isContainer(before.parentElement)) {
            before.parentElement.insertBefore(block, before);
          } else if (before && before.classList && before.classList.contains('yjd-section')) {
            this.editor.editor.insertBefore(block, before);
          } else {
            const under = document.elementFromPoint(this._lastX || 0, this._lastY || 0);
            const col = under && under.closest && under.closest('.yjd-col');
            if (col && this.editor.editor.contains(col) && !block.contains(col)) col.appendChild(block);
            else this.editor.editor.appendChild(block);
          }
          if (typeof this.editor.onContentChange === 'function') this.editor.onContentChange();
        }
        this._hide();
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    });
  }

  /** The direct child block whose vertical band contains clientY. */
  _isContainer(el) {
    return !!el && (el === this.editor.editor ||
      (el.classList && el.classList.contains('yjd-col') && this.editor.editor.contains(el)));
  }

  /** Every draggable block: root children plus blocks inside section columns. */
  _allBlocks() {
    const out = [];
    [...this.editor.editor.children].forEach((child) => {
      if (child.classList && child.classList.contains('yjd-section')) {
        child.querySelectorAll(':scope > .yjd-col > *').forEach((b) => out.push(b));
        out.push(child); // the section itself is draggable as one unit
      } else {
        out.push(child);
      }
    });
    return out;
  }

  _blockAtY(clientY) {
    const kids = [...this.editor.editor.children];
    for (const child of kids) {
      const r = child.getBoundingClientRect();
      if (clientY >= r.top && clientY <= r.bottom) return child;
    }
    // Between two blocks (block margins belong to no rect): snap to the
    // nearest neighbour instead of returning null — a null here hid the
    // handles for the width of the margin and re-showed them in the next
    // block, so the gutter blinked on every vertical block crossing. Above
    // the first block / below the last one, keep resolving to none. (#65)
    for (let i = 0; i < kids.length - 1; i++) {
      const a = kids[i].getBoundingClientRect();
      const b = kids[i + 1].getBoundingClientRect();
      if (clientY > a.bottom && clientY < b.top) {
        return clientY - a.bottom <= b.top - clientY ? kids[i] : kids[i + 1];
      }
    }
    return null;
  }

  _showFor(block) {
    if (block === this.block) { this._position(); return; }
    this.block = block;
    this.gutter.style.display = 'inline-flex';
    this._position();
  }

  _position() {
    if (!this.block) return;
    const wrapRect = this.editor.wrapper.getBoundingClientRect();
    const blockRect = this.block.getBoundingClientRect();
    const areaRect = this.editor.editor.getBoundingClientRect();
    // Sit in the content padding just left of the text column.
    const left = Math.max(2, blockRect.left - wrapRect.left - 48);
    // Centre the handles on the block's FIRST LINE, not its top edge — an H1's
    // tall line box otherwise leaves them floating above the text.
    const cs = getComputedStyle(this.block);
    let lineH = parseFloat(cs.lineHeight);
    if (!lineH || Number.isNaN(lineH)) lineH = (parseFloat(cs.fontSize) || 16) * 1.4;
    lineH = Math.min(lineH, blockRect.height);
    const gutterH = this.gutter.offsetHeight || 22;
    const top = blockRect.top - wrapRect.top +
      (parseFloat(cs.paddingTop) || 0) + Math.max(0, (lineH - gutterH) / 2);
    this.gutter.style.left = `${Math.round(left)}px`;
    this.gutter.style.top = `${Math.round(top)}px`;
    // Hide when the block scrolled out of the visible area band.
    const visible = blockRect.bottom > areaRect.top && blockRect.top < areaRect.bottom;
    this.gutter.style.display = visible ? 'inline-flex' : 'none';
  }

  _showIndicator(before, blocks) {
    const wrapRect = this.editor.wrapper.getBoundingClientRect();
    let y;
    if (before) {
      y = before.getBoundingClientRect().top - wrapRect.top - 2;
    } else {
      const last = blocks[blocks.length - 1];
      if (!last) return;
      y = last.getBoundingClientRect().bottom - wrapRect.top + 2;
    }
    const areaRect = this.editor.editor.getBoundingClientRect();
    this.indicator.style.display = 'block';
    this.indicator.style.top = `${Math.round(y)}px`;
    this.indicator.style.left = `${Math.round(areaRect.left - wrapRect.left + 16)}px`;
    this.indicator.style.width = `${Math.round(areaRect.width - 32)}px`;
  }

  _hide() {
    this.block = null;
    if (this.gutter) this.gutter.style.display = 'none';
  }

  destroy() {
    this.editor.wrapper.classList.remove('yjd-has-block-handles');
    if (!this.gutter) { super.destroy(); return; }
    this.editor.editor.removeEventListener('mousemove', this._onMove);
    this.editor.editor.removeEventListener('mouseleave', this._onLeave);
    this.editor.editor.removeEventListener('scroll', this._onScroll);
    this.editor.editor.removeEventListener('input', this._onInput);
    this.gutter.remove();
    this.indicator.remove();
    super.destroy();
  }
}
