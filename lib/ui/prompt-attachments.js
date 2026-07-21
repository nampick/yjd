/**
 * Prompt attachments tray — chat-style attachments for the prompt layout.
 * Images / videos / files added via "+" show as removable thumbnails ABOVE the
 * bottom bar and do NOT go into the message text; they travel alongside it. The
 * app reads them with editor.getAttachments() in its submit handler.
 *
 * Loaded lazily (dynamic import) the first time something is attached, so it
 * costs nothing for editors that never attach a file.
 */
import IconUtils from './icons.js';

const ACCEPT = { image: 'image/*', video: 'video/*', file: '*/*' };

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = (e) => resolve(e.target.result);
    r.onerror = () => reject(new Error('Failed to read file'));
    r.readAsDataURL(file);
  });
}

export default class PromptAttachments {
  constructor(editor) {
    this.editor = editor;
    this.items = []; // { id, kind, file, src, url?, el }
    this._id = 0;
    this.tray = document.createElement('div');
    this.tray.className = 'rte-prompt-attachments';
    // Sits between the text and the bottom bar (CSS `order`).
    const bar = editor.wrapper.querySelector('.rich-editor-toolbar-container');
    editor.wrapper.insertBefore(this.tray, bar || null);
  }

  /** Open the file picker for a kind ('image' | 'video' | 'file') and attach. */
  pick(kind) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = kind === 'image' && this.editor.options.image && this.editor.options.image.accept
      ? this.editor.options.image.accept
      : (ACCEPT[kind] || '*/*');
    input.multiple = true;
    input.style.display = 'none';
    input.addEventListener('change', async () => {
      const files = input.files ? Array.from(input.files) : [];
      for (const f of files) await this.add(f, kind);
      input.remove();
    });
    document.body.appendChild(input);
    input.click();
  }

  async add(file, kind) {
    if (!file) return;
    const id = ++this._id;
    const isImage = kind === 'image' || (file.type && file.type.indexOf('image/') === 0);
    const promptCfg = this.editor.options.prompt || {};
    const upload = this.editor.options.image && this.editor.options.image.upload;
    // Will the built-in upload hook run on add? (deferUpload hands uploading to
    // the integrator instead.)
    const willUpload = !promptCfg.deferUpload && typeof upload === 'function' && (isImage || kind === 'file');
    // status: 'pending' while an upload is in flight, 'done' once resolved (or
    // when there's nothing to upload), 'error' if the upload hook throws.
    // meta: an open bag an integrator can fill (e.g. from an 'attachment:add'
    // handler with a server key / mimeType / size) — surfaced by getAll().
    const item = { id, kind, file, src: undefined, url: undefined, status: willUpload ? 'pending' : 'done', meta: {} };
    if (isImage) item.src = await readAsDataURL(file); // real thumbnail for images
    this.items.push(item);
    this._renderChip(item);
    this._sync();
    // Fire the add event BEFORE any upload so an integrator with its own upload
    // model (or prompt.deferUpload) can take over — they may set item.src /
    // item.url / item.meta / item.status, which getAll() then reflects.
    this.editor.emit('attachment:add', item);

    if (willUpload) {
      try {
        item.url = await upload(file);
        item.status = 'done';
      } catch (e) {
        item.status = 'error'; // keep the data URL / file; integrator decides
      }
      this._sync();
    }
  }

  _renderChip(item) {
    const chip = document.createElement('div');
    chip.className = `rte-attach-chip rte-attach-${item.kind || 'file'}`;
    if (item.src) {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.file.name || '';
      chip.appendChild(img);
    } else {
      // Video / non-image file: an icon tile + the file name.
      const icon = document.createElement('span');
      icon.className = 'rte-attach-ic';
      icon.innerHTML = IconUtils.getIcon(item.kind === 'video' ? 'video' : 'file') || '';
      const name = document.createElement('span');
      name.className = 'rte-attach-name';
      name.textContent = item.file.name || item.kind;
      chip.appendChild(icon);
      chip.appendChild(name);
    }
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'rte-attach-close';
    close.setAttribute('aria-label', 'Remove attachment');
    close.innerHTML = '&times;';
    close.addEventListener('click', (e) => { e.preventDefault(); this.remove(item.id); });
    chip.appendChild(close);
    item.el = chip;
    this.tray.appendChild(chip);
  }

  remove(id) {
    const i = this.items.findIndex((x) => x.id === id);
    if (i < 0) return;
    const [item] = this.items.splice(i, 1);
    if (item.el) item.el.remove();
    this._sync();
    this.editor.emit('attachment:remove', item);
  }

  clear() {
    this.items.forEach((x) => x.el && x.el.remove());
    this.items = [];
    this._sync();
  }

  /**
   * What the app gets, per attachment:
   *   id     stable within this composer (correlate with add/remove events)
   *   kind   'image' | 'video' | 'file'
   *   file   the File
   *   src    the UPLOADED URL when an upload hook ran, else the preview value
   *          (image data URL, or undefined for a non-image before upload). Note
   *          the chip's thumbnail always uses the data URL; src here is the URL.
   *   status 'pending' | 'done' | 'error' (see add())
   *   meta   integrator-supplied bag (empty object by default)
   */
  getAll() {
    return this.items.map((x) => ({
      id: x.id, kind: x.kind, file: x.file, src: x.url || x.src, status: x.status, meta: x.meta
    }));
  }

  _sync() {
    this.tray.classList.toggle('has-items', this.items.length > 0);
    if (typeof this.editor._syncPromptSendState === 'function') this.editor._syncPromptSendState();
  }
}
