import Module from '../core/module.js';

/**
 * Custom atomic blocks — "slots" (#79). Declared machine-filled sections
 * render as non-editable cards, list in the slash menu, and serialize back to
 * their token string verbatim.
 *
 *   new Editor(el, {
 *     blocks: {
 *       stats:   { label: 'Stats grid',     icon: '📊', description: 'Views · clicks', token: '{{stats}}' },
 *       revenue: { label: 'Revenue banner', icon: '💰', token: '{{revenue}}' },
 *       cta:     { label: 'Button', icon: '🔘', token: '{{cta:$arg}}',
 *                  arg: { label: 'Button label', default: 'Open the app' } },
 *     },
 *   })
 *
 * Card HTML: <div class="yjd-slot" data-slot="cta" data-arg="Open the app"
 *              contenteditable="false">…chrome…</div>
 *
 * getContent()/getHTML() downgrade cards to `<p>{{token}}</p>` via
 * Editor#_serializeAtoms; setContent() upgrades recognized token paragraphs
 * back to cards. Cards are draggable/deletable with block-handles (they are
 * ordinary top-level blocks) and never editable inside — except the optional
 * one-line `arg` input.
 */
export default class Blocks extends Module {
  constructor(editor, options = {}) {
    super(editor, options);
    const cfg = editor.options.blocks || options || {};
    this.items = cfg && typeof cfg === 'object' ? cfg : {};
    if (!this.enabled) return;
    this.upgrade(this.editor.editor);
  }

  get enabled() { return Object.keys(this.items).length > 0; }

  /** The serialized token for a block, with `$arg` substituted. */
  tokenFor(name, arg) {
    const def = this.items[name];
    if (!def) return '';
    return String(def.token || '').replace('$arg', arg != null ? arg : (def.arg && def.arg.default) || '');
  }

  /** Build the atomic card element for a declared block. */
  makeCard(name, arg) {
    const def = this.items[name];
    if (!def) return null;
    const card = document.createElement('div');
    card.className = 'yjd-slot';
    card.setAttribute('data-slot', name);
    card.setAttribute('contenteditable', 'false');
    if (def.arg) card.setAttribute('data-arg', arg != null ? arg : (def.arg.default || ''));
    // data-token mirrors the serialized token so every text path (getText,
    // plainText, _serializeAtoms, AI sentinels) reads ONE attribute.
    card.setAttribute('data-token', this.tokenFor(name, card.getAttribute('data-arg')));

    const head = document.createElement('div');
    head.className = 'yjd-slot-head';
    const icon = document.createElement('span');
    icon.className = 'yjd-slot-icon';
    icon.textContent = def.icon || '⬚';
    const label = document.createElement('span');
    label.className = 'yjd-slot-label';
    label.textContent = def.label || name;
    const tok = document.createElement('code');
    tok.className = 'yjd-slot-token';
    tok.textContent = this.tokenFor(name, card.getAttribute('data-arg'));
    head.append(icon, label, tok);
    card.appendChild(head);

    if (def.description) {
      const desc = document.createElement('div');
      desc.className = 'yjd-slot-desc';
      desc.textContent = def.description;
      card.appendChild(desc);
    }

    if (def.arg) {
      const row = document.createElement('label');
      row.className = 'yjd-slot-arg';
      const cap = document.createElement('span');
      cap.textContent = (def.arg.label || 'Value') + ':';
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'yjd-slot-arg-input';
      input.value = card.getAttribute('data-arg') || '';
      // The input lives inside a contenteditable=false card; stop the editor's
      // key handling from seeing its keystrokes.
      input.addEventListener('keydown', (e) => e.stopPropagation());
      input.addEventListener('input', () => {
        card.setAttribute('data-arg', input.value);
        card.setAttribute('data-token', this.tokenFor(name, input.value));
        tok.textContent = this.tokenFor(name, input.value);
        if (typeof this.editor.onContentChange === 'function') this.editor.onContentChange();
      });
      row.append(cap, input);
      card.appendChild(row);
    }

    // Optional host-rendered preview, collapsed by default.
    if (typeof def.preview === 'function') {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'yjd-slot-preview-toggle';
      btn.textContent = this.t('blocks.preview', 'Preview');
      const pane = document.createElement('div');
      pane.className = 'yjd-slot-preview';
      pane.style.display = 'none';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const open = pane.style.display === 'none';
        if (open && !pane.childNodes.length) {
          try { pane.innerHTML = String(def.preview(card.getAttribute('data-arg')) || ''); } catch (err) { /* host error → empty */ }
        }
        pane.style.display = open ? 'block' : 'none';
      });
      card.append(btn, pane);
    }
    return card;
  }

  /** Insert a block card at the caret's block position (used by the slash menu). */
  insert(name, arg) {
    const card = this.makeCard(name, arg);
    if (!card) return;
    if (typeof this.editor.insertBlock === 'function') {
      this.editor.insertBlock(card);
    } else {
      this.editor.editor.appendChild(card);
    }
    this.editor.emit('block:insert', { name });
    if (typeof this.editor.onContentChange === 'function') this.editor.onContentChange();
  }

  /**
   * Upgrade paragraphs whose text is exactly a registered token (arg patterns
   * included) into cards. Unregistered `{{foo}}` text is left untouched.
   */
  upgrade(root) {
    if (!this.enabled || !root) return;
    const defs = Object.entries(this.items);
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matchers = defs.map(([name, def]) => {
      const token = String(def.token || '');
      const pattern = token.includes('$arg')
        ? new RegExp('^' + esc(token).replace('\\$arg', '(.*)') + '$')
        : new RegExp('^' + esc(token) + '$');
      return { name, pattern, hasArg: token.includes('$arg') };
    });
    [...root.children].forEach((child) => {
      if (child.classList && child.classList.contains('yjd-slot')) return;
      const text = (child.textContent || '').trim();
      if (!text) return;
      for (const m of matchers) {
        const hit = text.match(m.pattern);
        if (hit) {
          const card = this.makeCard(m.name, m.hasArg ? hit[1] : undefined);
          if (card) root.replaceChild(card, child);
          break;
        }
      }
    });
  }
}
