/**
 * Optional input-path methods for the Editor.
 *
 * Image drop/paste embedding, file attachments, auto-linkify and markdown
 * shortcuts are behaviours a Minimal comment box never needs — but they were
 * large (~430 lines) and lived in the core Editor class, weighing on every
 * bundle. They move here so `/core` Minimal drops them; the all-in-one entry
 * calls `applyEditorInput(Editor)` to keep the default build fully featured.
 *
 * The core paste/drop/keydown handlers call these via `this.<method>?.(...)`,
 * so a build without them degrades gracefully (the gesture is a no-op).
 * `/core` users who want any of these call applyEditorInput(Editor) themselves.
 */
import { execFormat } from '../utils/exec-command.js';
import { isSafeUrl } from '../utils/sanitize.js';
import IconUtils, { registerIcons, S } from '../ui/icons.js';

// The file-chip glyph is only needed by the (optional) file-attachment feature.
registerIcons({
  file: S('<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>')
});

export function applyEditorInput(Editor) {
  const P = Editor.prototype;

  /** Read an image File and insert it (base64 or via options.image.upload) at the caret. */
  P.insertImageFile = function insertImageFile(file) {
    if (!file || !file.type || !file.type.startsWith('image/')) return;

    const cfg = this.options.image || {};
    if (cfg.accept && cfg.accept !== 'image/*') {
      const ok = cfg.accept.split(',').some(a => {
        a = a.trim();
        return a.endsWith('/*') ? file.type.startsWith(a.slice(0, -1)) : file.type === a;
      });
      if (!ok) { this.emit('image:error', { file, reason: 'type' }); return; }
    }
    if (cfg.maxSize && file.size > cfg.maxSize) {
      this.emit('image:error', { file, reason: 'size' });
      return;
    }

    const makeImg = (src, extra = '') => {
      const ImageClass = this.registry.get('formats/image');
      if (ImageClass && typeof ImageClass.create === 'function') {
        const img = ImageClass.create(src);
        if (!img) return null;
        if (extra) img.setAttribute('data-state', extra);
        return img;
      }
      return null;
    };

    if (typeof cfg.upload !== 'function') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const html = (makeImg(ev.target.result) || {}).outerHTML
          || `<img src="${ev.target.result}" class="inserted-image" style="max-width:100%" contenteditable="false">`;
        this.focus();
        execFormat('insertHTML', html);
        this.onContentChange();
      };
      reader.readAsDataURL(file);
      return;
    }

    const placeholderId = 'rte-up-' + Math.round(performance.now()) + '-' + (this._upCounter = (this._upCounter || 0) + 1);
    const escName = (file.name || 'image')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const phHTML =
      `<span class="yjd-upload" id="${placeholderId}" contenteditable="false" data-state="uploading">` +
      `<span class="yjd-spinner" aria-hidden="true"></span>` +
      `<span class="yjd-upload-label">${escName}</span>` +
      `</span>`;
    this.focus();
    execFormat('insertHTML', phHTML);
    this.emit('image:upload', { file });

    Promise.resolve(cfg.upload(file)).then((url) => {
      const el = this.editor.querySelector('#' + placeholderId);
      if (!el) return;
      if (url) {
        const img = makeImg(url);
        if (img) { el.replaceWith(img); } else { el.remove(); }
        this.emit('image:uploaded', { file, url });
      } else {
        el.remove();
      }
      this.onContentChange();
    }).catch((err) => {
      const el = this.editor.querySelector('#' + placeholderId);
      if (el) el.remove();
      this.emit('image:error', { file, reason: 'upload', error: err });
      this.onContentChange();
    });
  };

  /** Open the native picker for a non-image attachment, then insert it as a file chip. */
  P.openFileAttachmentPicker = function openFileAttachmentPicker() {
    const cfg = this.options.file || {};
    const sel = window.getSelection();
    const savedRange = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = cfg.accept || '*/*';
    input.style.display = 'none';
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (file) {
        this.focus();
        const s = window.getSelection();
        if (savedRange) { s.removeAllRanges(); s.addRange(savedRange); }
        else if (!s.rangeCount || !this.editor.contains(s.anchorNode)) {
          const r = document.createRange();
          r.selectNodeContents(this.editor); r.collapse(false);
          s.removeAllRanges(); s.addRange(r);
        }
        this.insertFileAttachment(file);
      }
      input.remove();
    });
    document.body.appendChild(input);
    input.click();
  };

  /**
   * Insert a non-image File as a "file chip" (icon + name + size) that
   * serializes to a Markdown link. Uploads via options.file.upload, else data URL.
   */
  P.insertFileAttachment = function insertFileAttachment(file) {
    if (!file) return;
    const cfg = this.options.file || {};

    if (cfg.accept && cfg.accept !== '*/*') {
      const name = (file.name || '').toLowerCase();
      const ok = cfg.accept.split(',').some(a => {
        a = a.trim().toLowerCase();
        if (!a) return false;
        if (a.startsWith('.')) return name.endsWith(a);
        if (a.endsWith('/*')) return (file.type || '').startsWith(a.slice(0, -1));
        return file.type === a;
      });
      if (!ok) { this.emit('file:error', { file, reason: 'type' }); return; }
    }
    if (cfg.maxSize && file.size > cfg.maxSize) {
      this.emit('file:error', { file, reason: 'size' });
      return;
    }

    const ico = IconUtils && typeof IconUtils.getIcon === 'function'
      ? (IconUtils.getIcon('file') || '') : '';
    const esc = (s) => String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const makeChip = (url, meta = {}, state = '') => {
      const name = meta.name || file.name || 'file';
      const size = meta.size != null ? meta.size : Editor.formatBytes(file.size);
      const a = document.createElement('a');
      a.className = 'yjd-file-chip';
      a.setAttribute('contenteditable', 'false');
      a.setAttribute('href', url || '#');
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      a.setAttribute('data-name', name);
      if (size) a.setAttribute('data-size', size);
      if (state) a.setAttribute('data-state', state);
      const icoHTML = state === 'uploading'
        ? '<span class="yjd-spinner" aria-hidden="true"></span>' : ico;
      a.innerHTML =
        `<span class="yjd-file-ico" contenteditable="false">${icoHTML}</span>` +
        `<span class="yjd-file-name">${esc(name)}</span>` +
        (size ? `<span class="yjd-file-size">${esc(size)}</span>` : '');
      return a;
    };

    const insertChipHTML = (html) => {
      this.focus();
      execFormat('insertHTML', html + '&nbsp;');
      this.onContentChange();
    };

    if (typeof cfg.upload !== 'function') {
      const reader = new FileReader();
      reader.onload = (ev) => insertChipHTML(makeChip(ev.target.result).outerHTML);
      reader.onerror = () => this.emit('file:error', { file, reason: 'read' });
      reader.readAsDataURL(file);
      return;
    }

    const id = 'rte-file-' + Math.round(performance.now()) + '-' + (this._fileCounter = (this._fileCounter || 0) + 1);
    const ph = makeChip('#', {}, 'uploading');
    ph.id = id;
    ph.style.opacity = '0.6';
    insertChipHTML(ph.outerHTML);
    this.emit('file:upload', { file });

    Promise.resolve(cfg.upload(file)).then((res) => {
      const el = this.editor.querySelector('#' + id);
      if (!el) return;
      const url = typeof res === 'string' ? res : (res && res.url);
      if (!url) { el.remove(); this.onContentChange(); return; }
      const name = (res && res.name) || el.getAttribute('data-name');
      const size = (res && res.size) || el.getAttribute('data-size');
      el.setAttribute('href', url);
      el.setAttribute('data-name', name);
      if (size) el.setAttribute('data-size', size);
      el.style.opacity = '';
      el.removeAttribute('data-state');
      el.removeAttribute('id');
      const icoEl = el.querySelector('.yjd-file-ico');
      if (icoEl) icoEl.innerHTML = ico;
      const nameEl = el.querySelector('.yjd-file-name');
      const sizeEl = el.querySelector('.yjd-file-size');
      if (nameEl) nameEl.textContent = name;
      if (sizeEl && size) sizeEl.textContent = size;
      this.emit('file:uploaded', { file, url, name, size });
      this.onContentChange();
    }).catch((err) => {
      const el = this.editor.querySelector('#' + id);
      if (el) el.remove();
      this.emit('file:error', { file, reason: 'upload', error: err });
      this.onContentChange();
    });
  };

  /**
   * Auto-linkify: if the text before a collapsed caret ends with a bare URL,
   * wrap it in an <a>. Called on space/Enter. Skips text already inside a link.
   */
  P.linkifyBeforeCaret = function linkifyBeforeCaret() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return;
    const node = range.startContainer;
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    if (node.parentElement && node.parentElement.closest && node.parentElement.closest('a')) return;

    const caret = range.startOffset;
    const before = node.textContent.slice(0, caret);
    const m = before.match(/(?:^|[\s(])((?:https?:\/\/|www\.)[^\s()<>]+[^\s()<>.,!?;:'"])$/i);
    if (!m) return;
    const urlText = m[1];
    const href = /^www\./i.test(urlText) ? 'http://' + urlText : urlText;
    if (!isSafeUrl(href)) return;

    const start = caret - urlText.length;
    const r = document.createRange();
    r.setStart(node, start);
    r.setEnd(node, caret);
    const a = document.createElement('a');
    a.href = href;
    a.textContent = urlText;
    r.deleteContents();
    r.insertNode(a);

    const after = document.createRange();
    after.setStartAfter(a);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);
    this.onContentChange();
  };

  /**
   * Transform a markdown marker at the start of the current block on space:
   * "# " → H1..H6, "-"/"*" → bullet, "1." → ordered, ">" → blockquote.
   */
  P.handleMarkdownShortcut = function handleMarkdownShortcut(e) {
    const sel = window.getSelection();
    if (!sel || !sel.isCollapsed || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);

    let block = range.startContainer;
    block = block.nodeType === Node.TEXT_NODE ? block.parentElement : block;
    while (block && block !== this.editor && block.tagName !== 'P' && block.tagName !== 'DIV') {
      block = block.parentElement;
    }
    if (!block || block === this.editor) return;

    const pre = document.createRange();
    pre.selectNodeContents(block);
    pre.setEnd(range.startContainer, range.startOffset);
    const marker = pre.toString();

    const blockMap = { '#': 'h1', '##': 'h2', '###': 'h3', '####': 'h4', '#####': 'h5', '######': 'h6', '>': 'blockquote' };
    const blockTag = blockMap[marker];
    const listType = (marker === '-' || marker === '*') ? 'ul'
      : /^\d+\.$/.test(marker) ? 'ol' : null;
    if (!blockTag && !listType) return;

    e.preventDefault();

    const history = this.getModule('history');
    if (history && typeof history.saveBeforeFormat === 'function') history.saveBeforeFormat();

    pre.deleteContents();

    if (blockTag) {
      const el = document.createElement(blockTag);
      while (block.firstChild) el.appendChild(block.firstChild);
      if (el.textContent === '' && !el.querySelector('*')) {
        el.innerHTML = '<br>';
      }
      block.replaceWith(el);
      const caret = document.createRange();
      caret.selectNodeContents(el);
      caret.collapse(true);
      sel.removeAllRanges();
      sel.addRange(caret);
    } else {
      const caret = document.createRange();
      caret.selectNodeContents(block);
      caret.collapse(true);
      sel.removeAllRanges();
      sel.addRange(caret);
      execFormat(listType === 'ul' ? 'insertUnorderedList' : 'insertOrderedList');
    }
    this._emitChange();
    this.updatePlaceholderVisibility();
  };

  return Editor;
}

export default applyEditorInput;
