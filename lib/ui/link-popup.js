/**
 * Link Popup Component — a compact, inline link input that appears right at the
 * selected text (Notion/Medium style). Shows just a URL field + Apply; the
 * display-text field only appears when no text is selected.
 */
import { appendPopup, calculatePopupPosition, setPopupPosition } from '../utils/popup-helper.js';

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
    this.textInput.placeholder = 'Text to display';
    this.textGroup.appendChild(this.textInput);

    // URL row: input + Apply.
    const row = document.createElement('div');
    row.className = 'link-popup-row';

    this.urlInput = document.createElement('input');
    this.urlInput.type = 'text';
    this.urlInput.className = 'yjd-input';
    this.urlInput.placeholder = 'Paste or type a link…';

    this.applyBtn = document.createElement('button');
    this.applyBtn.type = 'button';
    this.applyBtn.className = 'yjd-button-confirm link-popup-apply';
    this.applyBtn.textContent = 'Apply';
    this.applyBtn.onclick = () => { this.handleOk(); this._refocusEditor(); };

    row.appendChild(this.urlInput);
    row.appendChild(this.applyBtn);

    content.appendChild(this.textGroup);
    content.appendChild(row);
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

  handleOk() {
    const raw = this.urlInput.value.trim();
    if (!raw) { this.urlInput.focus(); return; }

    // Friendly normalisation: bare domains get https://; keep anchors,
    // root-relative paths and explicit schemes (mailto:, tel:, …) as-is.
    let url = raw;
    const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url);
    if (!hasScheme && !url.startsWith('/') && !url.startsWith('#')) {
      url = 'https://' + url;
    }

    const text = this.textInput.value.trim();
    if (this.options.onLinkSelect) this.options.onLinkSelect({ url, text });
    this.hide();
  }

  show(anchor, existingLink = null, selectedText = '') {
    if (!anchor) return;

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

export default LinkPopup;
