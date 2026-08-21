import Module from '../core/module.js';
import { isSafeUrl } from '../utils/sanitize.js';
import { appendPopup, calculatePopupPosition, setPopupPosition } from '../utils/popup-helper.js';

/**
 * Button element (#83) — a first-class styled CTA block.
 *
 * DOM: <div class="yjd-btn-wrap" data-align="center" contenteditable="false">
 *        <a class="yjd-button" href="…" data-props='{"bg":…}' style="…">
 *          <span class="yjd-button-label" contenteditable="true">Label</span>
 *        </a>
 *      </div>
 *
 * data-props is canonical ({ bg, color, radius, padding, align, full });
 * the inline style is derived presentation. Click (outside the label) opens
 * a small inspector popover; the label is editable inline and never splits
 * into runs. getEmailHTML() compiles the same props to the bulletproof
 * table+VML pattern.
 *
 * When the host declares theme colors (options.theme.colors, #85), the color
 * fields render those swatches; `theme.strict` hides free-form inputs.
 */
export default class ButtonBlock extends Module {
  static DEFAULT_PROPS = { bg: null, color: '#ffffff', radius: 10, padding: 12, align: 'center', full: false };

  constructor(editor, options = {}) {
    super(editor, options);
    this._onClick = (e) => {
      const btn = e.target.closest && e.target.closest('.yjd-btn-wrap');
      if (!btn || !this.editor.editor.contains(btn)) return;
      // NEVER follow the href inside the editor — a label click would
      // otherwise navigate the host page to the (possibly token) URL.
      e.preventDefault();
      // Clicks on the label edit its text; anywhere else opens the inspector.
      if (e.target.closest('.yjd-button-label')) return;
      this.openInspector(btn);
    };
    this.editor.editor.addEventListener('click', this._onClick);
    this._onDocDown = (e) => {
      if (this.popup && !this.popup.contains(e.target) && !e.target.closest('.yjd-btn-wrap')) {
        this.closeInspector();
      }
    };
    document.addEventListener('pointerdown', this._onDocDown, true);
    this._onKey = (e) => { if (e.key === 'Escape') this.closeInspector(); };
    document.addEventListener('keydown', this._onKey);
    // Restyle buttons arriving via setContent (props → derived style).
    this.restyleAll();
  }

  _accent() {
    const t = this.editor.options.theme;
    return (t && t.colors && (t.colors.brand || Object.values(t.colors)[0])) || '#6d5efc';
  }

  propsOf(wrap) {
    const a = wrap.querySelector('a.yjd-button');
    let p = {};
    try { p = JSON.parse((a && a.getAttribute('data-props')) || '{}'); } catch (e) { /* defaults */ }
    return { ...ButtonBlock.DEFAULT_PROPS, bg: this._accent(), ...p };
  }

  applyProps(wrap, props) {
    const a = wrap.querySelector('a.yjd-button');
    if (!a) return;
    // Token-named colors resolve through the CURRENT theme (#85) — documents
    // saved with { bgToken: 'brand' } re-render after a re-brand.
    const colors = (this.editor.options.theme && this.editor.options.theme.colors) || {};
    if (props.bgToken && colors[props.bgToken]) props.bg = colors[props.bgToken];
    if (props.colorToken && colors[props.colorToken]) props.color = colors[props.colorToken];
    a.setAttribute('data-props', JSON.stringify(props));
    wrap.setAttribute('data-align', props.align);
    wrap.style.textAlign = props.align;
    a.style.cssText =
      `display:${props.full ? 'block' : 'inline-block'};background:${props.bg};color:${props.color};` +
      `border-radius:${props.radius}px;padding:${props.padding}px ${props.padding * 2}px;` +
      `font-weight:600;text-decoration:none;text-align:center;`;
  }

  /** Build (and optionally insert) a button block. */
  create(props = {}) {
    const p = { ...ButtonBlock.DEFAULT_PROPS, bg: this._accent(), ...props };
    const wrap = document.createElement('div');
    wrap.className = 'yjd-btn-wrap';
    wrap.setAttribute('contenteditable', 'false');
    const a = document.createElement('a');
    a.className = 'yjd-button';
    a.setAttribute('href', props.href && isSafeUrl(props.href) ? props.href : '#');
    const label = document.createElement('span');
    label.className = 'yjd-button-label';
    label.setAttribute('contenteditable', 'true');
    label.textContent = props.label || this.t('button.defaultLabel', 'Open');
    a.appendChild(label);
    wrap.appendChild(a);
    this.applyProps(wrap, p);
    return wrap;
  }

  insert(props = {}) {
    const history = this.editor.getModule('history');
    if (history && typeof history.saveBeforeFormat === 'function') history.saveBeforeFormat();
    const wrap = this.create(props);
    if (typeof this.editor.insertBlock === 'function') this.editor.insertBlock(wrap);
    else this.editor.editor.appendChild(wrap);
    if (typeof this.editor.onContentChange === 'function') this.editor.onContentChange();
    this.editor.emit('button:insert', {});
    return wrap;
  }

  /** Re-derive inline styles from data-props (after setContent). */
  restyleAll() {
    this.editor.editor.querySelectorAll('.yjd-btn-wrap').forEach((wrap) => {
      wrap.setAttribute('contenteditable', 'false');
      const label = wrap.querySelector('.yjd-button-label');
      if (label) label.setAttribute('contenteditable', 'true');
      this.applyProps(wrap, this.propsOf(wrap));
    });
  }

  /* ---------------------------- inspector ---------------------------- */

  openInspector(wrap) {
    this.closeInspector();
    const props = this.propsOf(wrap);
    const a = wrap.querySelector('a.yjd-button');
    const pop = document.createElement('div');
    pop.className = 'yjd-btn-inspector';
    this.popup = pop;
    this.target = wrap;

    const history = this.editor.getModule('history');
    if (history && typeof history.saveBeforeFormat === 'function') history.saveBeforeFormat();

    const field = (labelText, control) => {
      const row = document.createElement('label');
      row.className = 'yjd-btn-field';
      const cap = document.createElement('span');
      cap.textContent = labelText;
      row.append(cap, control);
      pop.appendChild(row);
      return control;
    };
    const commit = () => {
      this.applyProps(wrap, props);
      if (typeof this.editor.onContentChange === 'function') this.editor.onContentChange();
      this.editor.emit('style:change', { element: 'button', props: { ...props } });
    };

    // Label + URL
    const labelInput = field(this.t('button.label', 'Label'), Object.assign(document.createElement('input'), { type: 'text', value: (a.textContent || '').trim() }));
    labelInput.className = 'yjd-input';
    labelInput.addEventListener('input', () => {
      const lbl = wrap.querySelector('.yjd-button-label');
      if (lbl) lbl.textContent = labelInput.value;
      commit();
    });
    const urlInput = field(this.t('button.url', 'URL'), Object.assign(document.createElement('input'), { type: 'text', value: a.getAttribute('href') || '' }));
    urlInput.className = 'yjd-input';
    urlInput.addEventListener('change', () => {
      // Tokens like {{ctaUrl}} are legal hrefs here — the send pipeline
      // resolves them; only reject actively dangerous schemes.
      const v = urlInput.value.trim();
      a.setAttribute('href', !v || /^(javascript|vbscript|data):/i.test(v) ? '#' : v);
      commit();
    });

    // Colors: theme swatches first; free input unless theme.strict.
    const theme = this.editor.options.theme || {};
    const colors = theme.colors || {};
    const colorControl = (key) => {
      const box = document.createElement('div');
      box.className = 'yjd-btn-swatches';
      Object.entries(colors).forEach(([name, hex]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'yjd-btn-swatch';
        b.title = name;
        b.style.background = hex;
        b.addEventListener('click', (e) => {
          e.preventDefault();
          // Serialize by token NAME (#85): re-branding = change the theme,
          // not the documents. The hex is kept as a fallback.
          props[key] = hex;
          props[key + 'Token'] = name;
          commit();
        });
        box.appendChild(b);
      });
      if (!theme.strict) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'yjd-input yjd-btn-hex';
        input.value = props[key] || '';
        input.placeholder = '#rrggbb';
        input.addEventListener('change', () => {
          props[key] = input.value.trim() || props[key];
          delete props[key + 'Token'];      // a free value detaches the token
          commit();
        });
        box.appendChild(input);
      }
      return box;
    };
    field(this.t('button.bg', 'Background'), colorControl('bg'));
    field(this.t('button.textColor', 'Text'), colorControl('color'));

    // Radius / padding / align / full width
    const radius = field(this.t('button.radius', 'Radius'), Object.assign(document.createElement('input'), { type: 'number', value: props.radius, min: 0, max: 999 }));
    radius.className = 'yjd-input yjd-btn-num';
    radius.addEventListener('input', () => { props.radius = parseInt(radius.value, 10) || 0; commit(); });
    const padding = field(this.t('button.padding', 'Padding'), Object.assign(document.createElement('input'), { type: 'number', value: props.padding, min: 4, max: 40 }));
    padding.className = 'yjd-input yjd-btn-num';
    padding.addEventListener('input', () => { props.padding = parseInt(padding.value, 10) || 12; commit(); });

    const alignBox = document.createElement('div');
    alignBox.className = 'yjd-btn-aligns';
    ['left', 'center', 'right'].forEach((al) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = al === 'left' ? '⇤' : al === 'center' ? '↔' : '⇥';
      b.title = al;
      b.className = 'yjd-btn-align' + (props.align === al ? ' active' : '');
      b.addEventListener('click', (e) => {
        e.preventDefault();
        props.align = al;
        [...alignBox.children].forEach((c) => c.classList.toggle('active', c === b));
        commit();
      });
      alignBox.appendChild(b);
    });
    field(this.t('button.align', 'Align'), alignBox);

    const full = Object.assign(document.createElement('input'), { type: 'checkbox', checked: !!props.full });
    full.addEventListener('change', () => { props.full = full.checked; commit(); });
    field(this.t('button.fullWidth', 'Full width'), full);

    // Position via the shared helper — correct in BOTH popup strategies
    // (in-wrapper absolute and body-portal fixed).
    appendPopup(pop, this.editor.instanceId);
    setPopupPosition(pop, calculatePopupPosition(wrap, pop, { offsetY: 8 }));
  }

  closeInspector() {
    if (this.popup && this.popup.parentNode) this.popup.parentNode.removeChild(this.popup);
    this.popup = null;
    this.target = null;
  }

  destroy() {
    this.closeInspector();
    this.editor.editor.removeEventListener('click', this._onClick);
    document.removeEventListener('pointerdown', this._onDocDown, true);
    document.removeEventListener('keydown', this._onKey);
  }
}
