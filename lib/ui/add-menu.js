/**
 * Add-menu — the popover behind the prompt layout's "+" button. A small list of
 * insert actions (add image / file / video / table, or app-defined items).
 *
 * Loaded lazily (dynamic import from the toolbar) only when a "+" button is
 * first clicked, so it stays out of the base bundle for editors that don't use
 * the prompt layout.
 */
import IconUtils from './icons.js';

// Theme tokens the menu paints with — copied from the editor onto the portaled
// popup so it stays themed even though it lives on <body> (custom properties
// don't cascade from the editor when the node is moved out).
const THEME_TOKENS = [
  '--rte-bg', '--rte-border', '--rte-border-strong', '--rte-ink',
  '--rte-muted', '--rte-chrome-2', '--rte-radius-md', '--rte-accent'
];

/**
 * @param {Object} opts
 * @param {HTMLElement} opts.anchor   The "+" button the menu points at.
 * @param {Array} opts.items          Resolved items: { label, icon?, command?, onSelect?, separator? }.
 * @param {(item:Object)=>void} opts.onSelect  Called with the chosen item.
 */
export default class AddMenu {
  constructor({ anchor, items, onSelect }) {
    this.anchor = anchor;
    this.items = items || [];
    this.onSelect = onSelect;
    this.visible = false;
    this._build();
  }

  _build() {
    this.popup = document.createElement('div');
    this.popup.className = 'rte-add-menu-popup';
    this.popup.setAttribute('role', 'menu');
    this.items.forEach((it) => {
      if (it.separator) {
        const sep = document.createElement('div');
        sep.className = 'rte-add-sep';
        this.popup.appendChild(sep);
        return;
      }
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'rte-add-item';
      row.setAttribute('role', 'menuitem');
      const icon = it.icon ? IconUtils.getIcon(it.icon) : '';
      row.innerHTML =
        `<span class="rte-add-ic">${icon || ''}</span><span class="rte-add-label"></span>`;
      row.querySelector('.rte-add-label').textContent = it.label || '';
      row.addEventListener('click', (e) => {
        e.preventDefault();
        this.hide();
        if (typeof this.onSelect === 'function') this.onSelect(it);
      });
      this.popup.appendChild(row);
    });
    // Portal to <body> with a fixed position so the menu overlays anything above
    // the pill and is never clipped by the editor's stacking context / overflow.
    this.popup.style.position = 'fixed';
    this.popup.style.zIndex = '2147483000';
    document.body.appendChild(this.popup);
  }

  toggle() { this.visible ? this.hide() : this.show(); }

  show() {
    this.visible = true;
    // Re-copy theme tokens each open (theme may have changed) so the portaled
    // menu matches the editor it belongs to.
    const ed = this.anchor.closest('.yjd-rich-editor');
    if (ed) {
      const cs = getComputedStyle(ed);
      THEME_TOKENS.forEach((t) => this.popup.style.setProperty(t, cs.getPropertyValue(t)));
    }
    this.popup.classList.add('visible');
    // Position in viewport coordinates (fixed). Open ABOVE the "+" button; drop
    // below only if the menu would run off the top of the screen.
    const aRect = this.anchor.getBoundingClientRect();
    const gap = 8;
    const h = this.popup.offsetHeight;
    const top = aRect.top - h - gap >= 0 ? aRect.top - h - gap : aRect.bottom + gap;
    const left = Math.max(8, Math.min(aRect.left, window.innerWidth - this.popup.offsetWidth - 8));
    this.popup.style.top = `${Math.round(top)}px`;
    this.popup.style.left = `${Math.round(left)}px`;
    // Defer so the click that opened us doesn't immediately close it.
    setTimeout(() => {
      this._onOutside = (e) => {
        if (!this.popup.contains(e.target) && !this.anchor.contains(e.target)) this.hide();
      };
      document.addEventListener('click', this._onOutside);
    }, 0);
  }

  hide() {
    this.visible = false;
    this.popup.classList.remove('visible');
    if (this._onOutside) {
      document.removeEventListener('click', this._onOutside);
      this._onOutside = null;
    }
  }

  destroy() {
    this.hide();
    if (this.popup && this.popup.parentNode) this.popup.parentNode.removeChild(this.popup);
  }
}
