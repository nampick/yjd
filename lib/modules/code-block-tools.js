import Module from '../core/module.js';

/**
 * Code-block tools (UI 2.0) — the design's code card carries a header line
 * with the language label and a Copy affordance. The real <pre> stays clean
 * (nothing extra serializes); this module floats a small chip bar over the
 * top-right corner of the code block the caret is in.
 *
 * Language label comes from `data-lang` on the <pre> when present.
 */
export default class CodeBlockTools extends Module {
  constructor(editor, options = {}) {
    super(editor, options);
    this.pre = null;
    this._build();
    this._bind();
  }

  _build() {
    const bar = document.createElement('div');
    bar.className = 'yjd-codeblock-bar';
    bar.style.display = 'none';

    this.langEl = document.createElement('span');
    this.langEl.className = 'yjd-codeblock-lang';

    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'yjd-codeblock-copy';
    copy.title = 'Copy code';
    copy.setAttribute('aria-label', 'Copy code');
    copy.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg><span>Copy</span>';
    copy.addEventListener('pointerdown', (e) => e.preventDefault());
    copy.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!this.pre) return;
      const text = this.pre.textContent || '';
      const done = () => {
        copy.classList.add('copied');
        copy.querySelector('span').textContent = 'Copied';
        setTimeout(() => {
          copy.classList.remove('copied');
          const s = copy.querySelector('span');
          if (s) s.textContent = 'Copy';
        }, 900);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, () => {});
      } else {
        done();
      }
    });
    this.copyBtn = copy;

    bar.append(this.langEl, copy);
    this.bar = bar;
    this.editor.wrapper.appendChild(bar);
  }

  _bind() {
    this._onSel = () => this._sync();
    document.addEventListener('selectionchange', this._onSel);
    this._onInput = () => this._sync();
    this.editor.editor.addEventListener('input', this._onInput);
    this._onScroll = () => { if (this.pre) this._position(); };
    this.editor.editor.addEventListener('scroll', this._onScroll);
  }

  _sync() {
    const sel = window.getSelection();
    let pre = null;
    if (sel && sel.rangeCount) {
      let node = sel.getRangeAt(0).startContainer;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
      pre = node && node.closest ? node.closest('pre') : null;
      if (pre && !this.editor.editor.contains(pre)) pre = null;
    }
    if (pre === this.pre && pre) { this._position(); return; }
    this.pre = pre;
    if (!pre) { this.bar.style.display = 'none'; return; }
    const lang = pre.getAttribute('data-lang') || '';
    this.langEl.textContent = lang;
    this.langEl.style.display = lang ? '' : 'none';
    this.bar.style.display = 'inline-flex';
    this._position();
  }

  _position() {
    if (!this.pre) return;
    const wrapRect = this.editor.wrapper.getBoundingClientRect();
    const preRect = this.pre.getBoundingClientRect();
    this.bar.style.top = `${Math.round(preRect.top - wrapRect.top + 6)}px`;
    this.bar.style.left = '';
    this.bar.style.right = `${Math.round(wrapRect.right - preRect.right + 6)}px`;
  }

  destroy() {
    document.removeEventListener('selectionchange', this._onSel);
    this.editor.editor.removeEventListener('input', this._onInput);
    this.editor.editor.removeEventListener('scroll', this._onScroll);
    if (this.bar && this.bar.parentNode) this.bar.parentNode.removeChild(this.bar);
    super.destroy();
  }
}
