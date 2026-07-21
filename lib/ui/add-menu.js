/**
 * Add-menu — the popover behind the prompt layout's "+" button. A small list of
 * insert actions (add image / file / video / table, or app-defined items).
 *
 * Loaded lazily (dynamic import from the toolbar) only when a "+" button is
 * first clicked, so it stays out of the base bundle for editors that don't use
 * the prompt layout.
 */
import { appendPopup } from '../utils/popup-helper.js';
import IconUtils from './icons.js';

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
    appendPopup(this.popup);
  }

  toggle() { this.visible ? this.hide() : this.show(); }

  show() {
    this.visible = true;
    this.popup.classList.add('visible');
    // Open ABOVE the "+" button (it sits on the bottom bar); fall back to below
    // only if there isn't room above. Positioned relative to the popup's
    // containing block (the editor's absolute popup-container).
    const parent = this.popup.offsetParent || this.popup.parentElement;
    const cRect = parent.getBoundingClientRect();
    const aRect = this.anchor.getBoundingClientRect();
    const gap = 8;
    const h = this.popup.offsetHeight;
    // Open above when the viewport has room there (the container is
    // overflow:visible, so a container-negative top is fine). Only drop below
    // when the menu would run off the top of the screen.
    const roomAbove = aRect.top - h - gap >= 0;
    const top = roomAbove
      ? aRect.top - cRect.top - h - gap
      : aRect.bottom - cRect.top + gap;
    this.popup.style.top = `${Math.round(top)}px`;
    this.popup.style.left = `${Math.round(aRect.left - cRect.left)}px`;
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
