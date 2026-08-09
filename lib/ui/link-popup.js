/**
 * Link Popup Component — a compact, inline link input that appears right at the
 * selected text (Notion/Medium style). Shows just a URL field + Apply; the
 * display-text field only appears when no text is selected.
 */
import { appendPopup, calculatePopupPosition, setPopupPosition } from '../utils/popup-helper.js';
import { isSafeUrl } from '../utils/sanitize.js';

class LinkPopup {
  constructor(options = {}) {
    this.options = {
      onLinkSelect: null,
      editor: null,
      ...options
    };

    this.popup = null;
    this.isVisible = false;
    this.urlInput = null;
    this.textInput = null;

    this.createPopup();
  }

  /** Resolve a UI string through the editor's i18n (options.strings), else English. */
  _t(key, fallback) {
    const e = this.options.editor;
    return e && typeof e.t === 'function' ? e.t(key, fallback) : fallback;
  }

  createPopup() {
    this.popup = document.createElement('div');
    this.popup.className = 'link-popup link-popup--inline';

    const content = document.createElement('div');
    content.className = 'link-popup-content';

    // Display-text field — only shown when there's no selected text to link.
    this.textGroup = document.createElement('div');
    this.textGroup.className = 'link-popup-row';
    this.textInput = document.createElement('input');
    this.textInput.type = 'text';
    this.textInput.className = 'yjd-input';
    this.textInput.placeholder = this._t('popup.linkText', 'Text to display');
    this.textGroup.appendChild(this.textInput);

    // URL row: input + Apply.
    const row = document.createElement('div');
    row.className = 'link-popup-row';

    this.urlInput = document.createElement('input');
    this.urlInput.type = 'text';
    this.urlInput.className = 'yjd-input';
    this.urlInput.placeholder = this._t('popup.linkUrl', 'Paste or type a link…');

    this.applyBtn = document.createElement('button');
    this.applyBtn.type = 'button';
    this.applyBtn.className = 'yjd-button-confirm link-popup-apply';
    this.applyBtn.textContent = this._t('apply', 'Apply');
    this.applyBtn.onclick = () => { this.handleOk(); this._refocusEditor(); };

    row.appendChild(this.urlInput);
    row.appendChild(this.applyBtn);

    // Inline error message (UI 2.0 input-error recipe): shown when Apply is
    // pressed with an invalid/unsafe URL; cleared as soon as the user types.
    this.errorEl = document.createElement('div');
    this.errorEl.className = 'link-popup-error';
    this.errorEl.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16h.01"/></svg><span>Enter a valid URL</span>';
    this.errorEl.style.display = 'none';
    this.urlInput.addEventListener('input', () => this._clearError());

    content.appendChild(this.textGroup);
    content.appendChild(row);
    content.appendChild(this.errorEl);
    this.popup.appendChild(content);

    const onKey = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this.handleOk(); this._refocusEditor(); }
      if (e.key === 'Escape') { this.hide(); this._refocusEditor(); }
    };
    this.urlInput.onkeydown = onKey;
    this.textInput.onkeydown = onKey;

    appendPopup(this.popup);

    // Prevent focus loss when clicking on popup
    if (this.options.editor && typeof this.options.editor.preventFocusLoss === 'function') {
      this.options.editor.preventFocusLoss(this.popup);
    }
  }

  _refocusEditor() {
    if (this.options.editor) setTimeout(() => this.options.editor.focus(), 0);
  }

  _showError() {
    this.urlInput.classList.add('yjd-input--error');
    this.errorEl.style.display = '';
    this.urlInput.focus();
  }

  _clearError() {
    this.urlInput.classList.remove('yjd-input--error');
    this.errorEl.style.display = 'none';
  }

  handleOk() {
    const raw = this.urlInput.value.trim();
    if (!raw) { this._showError(); return; }

    // Friendly normalisation: bare domains get https://; keep anchors,
    // root-relative paths and explicit schemes (mailto:, tel:, …) as-is.
    let url = raw;
    const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url);
    if (!hasScheme && !url.startsWith('/') && !url.startsWith('#')) {
      url = 'https://' + url;
    }

    // Surface unsafe/invalid URLs here (danger ring + message) instead of the
    // old silent console.warn deep in insertLink.
    if (!isSafeUrl(url)) { this._showError(); return; }

    const text = this.textInput.value.trim();
    if (this.options.onLinkSelect) this.options.onLinkSelect({ url, text });
    this._clearError();
    this.hide();
  }

  show(anchor, existingLink = null, selectedText = '') {
    if (!anchor) return;

    this._clearError();
    const hasSelection = !!selectedText;
    this.urlInput.value = existingLink ? existingLink.url : '';
    this.textInput.value = selectedText || (existingLink ? existingLink.text : '');
    // No need to ask for display text when text is already selected.
    this.textGroup.style.display = hasSelection ? 'none' : '';

    const position = calculatePopupPosition(anchor, this.popup, { offsetY: 8, offsetX: 0 });
    setPopupPosition(this.popup, position);

    this.popup.classList.add('visible');
    this.isVisible = true;

    setTimeout(() => this.urlInput.focus(), 60);
    setTimeout(() => {
      document.addEventListener('click', this.closeOnClickOutside);
    }, 100);
  }

  hide() {
    this.popup.classList.remove('visible');
    this.isVisible = false;
    document.removeEventListener('click', this.closeOnClickOutside);
  }

  closeOnClickOutside = (e) => {
    if (!this.popup.contains(e.target)) {
      this.hide();
    }
  }

  destroy() {
    document.removeEventListener('click', this.closeOnClickOutside);
    if (this.popup && this.popup.parentNode) {
      this.popup.parentNode.removeChild(this.popup);
    }
  }
}

/**
 * Link view bar (UI 2.0) — the small floating bar shown when the caret lands
 * on an existing link: shortened href · edit · copy · unlink. The bar itself
 * is dumb chrome; `onEdit` / `onUnlink` are wired by the Link format.
 */
class LinkBar {
  constructor(options = {}) {
    this.options = { onEdit: null, onUnlink: null, editor: null, ...options };
    this.linkEl = null;
    this.isVisible = false;
    this._build();
  }

  _build() {
    const S = (body) =>
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
    this.bar = document.createElement('div');
    this.bar.className = 'link-bar';

    this.urlEl = document.createElement('a');
    this.urlEl.className = 'link-bar-url';
    this.urlEl.target = '_blank';
    this.urlEl.rel = 'noopener noreferrer';
    this.bar.appendChild(this.urlEl);

    const sep = document.createElement('span');
    sep.className = 'link-bar-sep';
    this.bar.appendChild(sep);

    const mkBtn = (cls, title, svg) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `link-bar-btn ${cls}`;
      b.title = title;
      b.setAttribute('aria-label', title);
      b.innerHTML = svg;
      b.addEventListener('pointerdown', (e) => e.preventDefault());
      this.bar.appendChild(b);
      return b;
    };

    this.editBtn = mkBtn('link-bar-edit', 'Edit link',
      S('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'));
    this.copyBtn = mkBtn('link-bar-copy', 'Copy link',
      S('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>'));
    this.unlinkBtn = mkBtn('link-bar-unlink', 'Remove link',
      S('<path d="M17 7h1a5 5 0 0 1 3.5 8.5"/><path d="M7 17H6a5 5 0 0 1-3.5-8.5"/><path d="M9 12h3"/><path d="m3 3 18 18"/>'));

    this.editBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const el = this.linkEl;
      this.hide();
      if (el && this.options.onEdit) this.options.onEdit(el);
    });
    this.copyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const href = this.linkEl ? this.linkEl.href : '';
      if (!href) return;
      const done = () => {
        this.copyBtn.classList.add('copied');
        setTimeout(() => this.copyBtn.classList.remove('copied'), 900);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(href).then(done, () => {});
      } else {
        done();
      }
    });
    this.unlinkBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const el = this.linkEl;
      this.hide();
      if (el && this.options.onUnlink) this.options.onUnlink(el);
    });

    appendPopup(this.bar);
    if (this.options.editor && typeof this.options.editor.preventFocusLoss === 'function') {
      this.options.editor.preventFocusLoss(this.bar);
    }
  }

  show(linkEl) {
    if (!linkEl) return;
    this.linkEl = linkEl;
    const href = linkEl.getAttribute('href') || '';
    this.urlEl.href = href;
    // Shortened display: strip scheme, cap length.
    let label = href.replace(/^https?:\/\//, '');
    if (label.length > 32) label = label.slice(0, 31) + '…';
    this.urlEl.textContent = label || 'link';

    if (!document.body.contains(this.bar)) appendPopup(this.bar);
    const position = calculatePopupPosition(linkEl, this.bar, { offsetY: 6, offsetX: 0 });
    setPopupPosition(this.bar, position);
    this.bar.classList.add('visible');
    this.isVisible = true;
    setTimeout(() => document.addEventListener('click', this._outside), 100);
  }

  hide() {
    this.bar.classList.remove('visible');
    this.isVisible = false;
    this.linkEl = null;
    document.removeEventListener('click', this._outside);
  }

  _outside = (e) => {
    if (!this.bar.contains(e.target)) this.hide();
  };

  destroy() {
    document.removeEventListener('click', this._outside);
    if (this.bar && this.bar.parentNode) this.bar.parentNode.removeChild(this.bar);
  }
}

export { LinkBar };
export default LinkPopup;
