import Module from '../core/module.js';

/**
 * Content schema (#81) — required blocks/variables, allowed tags, max length,
 * validated live.
 *
 *   new Editor(el, {
 *     schema: {
 *       require: ['block:cta', 'variable:shopName'],
 *       allowTags: ['h1','h2','p','ul','ol','li','strong','em','a','br','blockquote','hr'],
 *       maxLength: 5000,
 *     },
 *   })
 *
 * A violation renders a dismissable warning strip above the status bar and
 * fires `schema:violation` with a machine-readable list; `editor.validate()`
 * returns the same synchronously. Deleting a required block stays ALLOWED
 * (undo must remain simple) — the strip is the guard, not an edit block.
 * Content arriving via setContent with tags outside allowTags is flattened to
 * allowed equivalents (unwrap, keep children).
 */
export default class Schema extends Module {
  // Editor chrome that never counts as content markup.
  static CHROME = '.yjd-var, .yjd-slot, .yjd-btn-wrap, .yjd-section, .yjd-col, .rte-placeholder';

  constructor(editor, options = {}) {
    super(editor, options);
    this.cfg = editor.options.schema || options || {};
    this._dismissed = false;
    this._strip = null;
    this.filterTags(this.editor.editor);
  }

  /** Synchronous validation: { valid, violations: [{rule, detail}] }. */
  validate() {
    const v = [];
    const root = this.editor.editor;

    (this.cfg.require || []).forEach((req) => {
      const [kind, name] = String(req).split(':');
      let ok = true, label = req;
      if (kind === 'block') {
        ok = !!root.querySelector(`.yjd-slot[data-slot="${name}"]`);
        const def = (this.editor.options.blocks || {})[name];
        label = (def && def.label) || name;
      } else if (kind === 'variable') {
        ok = !!root.querySelector(`.yjd-var[data-var="${name}"]`);
        const def = ((this.editor.options.variables || {}).items || {})[name];
        label = (def && def.label) || name;
      } else if (kind === 'button') {
        ok = !!root.querySelector('.yjd-btn-wrap');
        label = 'Button';
      }
      if (!ok) {
        v.push({
          rule: 'require', detail: req,
          message: this.t('schema.missing', 'Missing required block: {name}', { name: label }),
        });
      }
    });

    if (Array.isArray(this.cfg.allowTags) && this.cfg.allowTags.length) {
      const allow = new Set(this.cfg.allowTags.map((t) => t.toUpperCase()));
      const bad = new Set();
      root.querySelectorAll('*').forEach((el) => {
        if (el.closest(Schema.CHROME)) return;
        if (!allow.has(el.tagName)) bad.add(el.tagName.toLowerCase());
      });
      bad.forEach((tag) => v.push({
        rule: 'allowTags', detail: tag,
        message: this.t('schema.disallowedTag', 'Disallowed element: <{tag}>', { tag }),
      }));
    }

    if (this.cfg.maxLength) {
      const len = (this.editor.getText() || '').length;
      if (len > this.cfg.maxLength) {
        v.push({
          rule: 'maxLength', detail: String(len),
          message: this.t('schema.tooLong', 'Content is {len} characters (max {max})', { len, max: this.cfg.maxLength }),
        });
      }
    }

    return { valid: v.length === 0, violations: v };
  }

  /**
   * Flatten disallowed tags in-place (setContent/paste path): the element is
   * unwrapped and its children kept, so a pasted <table> degrades to its text
   * instead of entering the document.
   */
  filterTags(root) {
    if (!Array.isArray(this.cfg.allowTags) || !this.cfg.allowTags.length) return;
    const allow = new Set(this.cfg.allowTags.map((t) => t.toUpperCase()));
    let changed = true;
    while (changed) {
      changed = false;
      for (const el of [...root.querySelectorAll('*')]) {
        if (el.closest(Schema.CHROME)) continue;
        if (allow.has(el.tagName)) continue;
        // Table cells/rows unwrap to their text content in reading order.
        const parent = el.parentNode;
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
        changed = true;
      }
    }
  }

  /* ------------------------- live warning strip ------------------------- */

  onContentChange() {
    clearTimeout(this._t);
    this._t = setTimeout(() => this._check(), 150);
  }

  _check() {
    const { valid, violations } = this.validate();
    if (valid) {
      this._dismissed = false;
      this._removeStrip();
      return;
    }
    this.editor.emit('schema:violation', { violations });
    if (this._dismissed) return;
    this._renderStrip(violations);
  }

  _renderStrip(violations) {
    if (!this._strip) {
      const strip = document.createElement('div');
      strip.className = 'yjd-schema-warn';
      strip.setAttribute('role', 'status');
      const msg = document.createElement('span');
      msg.className = 'yjd-schema-warn-msg';
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'yjd-schema-warn-close';
      close.textContent = '×';
      close.setAttribute('aria-label', this.t('schema.dismiss', 'Dismiss'));
      close.addEventListener('click', () => {
        this._dismissed = true;
        this._removeStrip();
      });
      strip.append(msg, close);
      this._strip = strip;
      // Above the status bar (or at the wrapper's end when there is none).
      const statusbar = this.editor.wrapper.querySelector('.rich-editor-statusbar');
      if (statusbar) this.editor.wrapper.insertBefore(strip, statusbar);
      else this.editor.wrapper.appendChild(strip);
    }
    this._strip.querySelector('.yjd-schema-warn-msg').textContent =
      violations.map((x) => x.message).join(' · ');
  }

  _removeStrip() {
    if (this._strip && this._strip.parentNode) this._strip.parentNode.removeChild(this._strip);
    this._strip = null;
  }

  destroy() {
    clearTimeout(this._t);
    this._removeStrip();
  }
}
