import Module from '../core/module.js';

/**
 * Best-effort language detection for the header label. Explicit `data-lang`
 * always wins; this only runs when the block has none. The result is shown in
 * the floating chrome and NEVER written back to the DOM, so nothing extra
 * serializes and the guess stays live as the code changes.
 */
export function detectLanguage(source) {
  const text = String(source || '').slice(0, 2000);
  const t = text.trim();
  if (!t || t.length < 8) return '';
  const score = (re) => (t.match(re) || []).length;

  if (/^<\?php/.test(t)) return 'php';
  if (/^\s*<(!doctype|html|head|body|div|span|section|article|table|p[\s>]|a[\s>]|ul[\s>]|li[\s>]|h[1-6][\s>])/i.test(t)) return 'html';
  if ((/^[{[]/.test(t) && /"[^"]+"\s*:/.test(t)) && !/\b(function|const|let|var|=>)\b/.test(t)) return 'json';
  if (/#include\s*</.test(t)) return 'c';
  if (/\b(SELECT|INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE)\b/i.test(t) && /\b(FROM|WHERE|VALUES|SET|TABLE)\b/i.test(t)) return 'sql';
  if (/^#!\s*\/.*\b(sh|bash|zsh)\b/m.test(t) || score(/^\s*(sudo|echo|cd|curl|grep|chmod|mkdir|export\s+\w+=|\$\(\w)/gm) >= 2) return 'bash';
  if (/\bpackage\s+\w+/.test(t) && /\bfunc\s+\w*\(/.test(t)) return 'go';
  if (/:=/.test(t) && /\bfunc\b/.test(t)) return 'go';
  if (/\bfn\s+\w+\s*\(/.test(t) && /\b(let\s+mut|println!|impl|::)/.test(t)) return 'rust';
  if (/\b(public|private)\s+(class|static|final)\b/.test(t) || /System\.out\.print/.test(t)) return 'java';
  if (/^\s*(def|class)\s+\w+.*:\s*$/m.test(t) || /^\s*(import\s+\w+|from\s+\S+\s+import)\s*$/m.test(t) || /\bprint\(/.test(t) && !/[;{]/.test(t)) return 'python';
  if (/^\s*(def\s+\w+|puts\s|end)\s*$/m.test(t) && !/[{;]/.test(t)) return 'ruby';
  const jsSignals = score(/\b(const|let|var|function|return|import|export|console\.\w+|=>)\b/g);
  if (jsSignals >= 2) {
    if (/\b(interface|type)\s+\w+\s*=?|:\s*(string|number|boolean|void)\b|<[A-Z]\w*>/.test(t)) return 'typescript';
    return 'javascript';
  }
  if (/[.#]?[\w-]+\s*\{[^{}]*[\w-]+\s*:[^{}]+\}/.test(t) && !/[<>]/.test(t)) return 'css';
  if (score(/^[\w-]+:\s+\S/gm) >= 2 && !/[{};]/.test(t)) return 'yaml';
  return '';
}

/**
 * Code-block tools (UI 2.0) — the design's code card carries a header line
 * with the language label and a Copy affordance. The real <pre> stays clean
 * (nothing extra serializes); this module floats a small chip bar over the
 * top-right corner of the code block the caret is in.
 *
 * Language label comes from `data-lang` on the <pre> when present, else it is
 * DETECTED from the content (detectLanguage); `data-filename` appends the
 * design's "javascript · word-diff.js" form.
 */
export default class CodeBlockTools extends Module {
  constructor(editor, options = {}) {
    super(editor, options);
    this.pre = null;
    // Reserves the header strip inside <pre> (CSS pads the top) so the
    // lang/Copy line never overlaps the first line of code.
    this.editor.wrapper.classList.add('yjd-has-codetools');
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
    copy.title = this.t('code.copyCode', 'Copy code');
    copy.setAttribute('aria-label', this.t('code.copyCode', 'Copy code'));
    copy.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg><span></span>';
    copy.querySelector('span').textContent = this.t('code.copy', 'Copy');
    copy.addEventListener('pointerdown', (e) => e.preventDefault());
    copy.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!this.pre) return;
      const text = this.pre.textContent || '';
      const done = () => {
        copy.classList.add('copied');
        copy.querySelector('span').textContent = this.t('code.copied', 'Copied');
        setTimeout(() => {
          copy.classList.remove('copied');
          const s = copy.querySelector('span');
          if (s) s.textContent = this.t('code.copy', 'Copy');
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
    if (pre === this.pre && pre) { this._syncLabel(); this._position(); return; }
    this.pre = pre;
    if (!pre) { this.bar.style.display = 'none'; return; }
    this._syncLabel();
    this.bar.style.display = 'inline-flex';
    this._position();
  }

  _syncLabel() {
    const pre = this.pre;
    if (!pre) return;
    const lang = pre.getAttribute('data-lang') || detectLanguage(pre.textContent);
    const file = pre.getAttribute('data-filename') || '';
    const label = lang && file ? `${lang} · ${file}` : (lang || file);
    if (label !== this._label) {
      this._label = label;
      this.langEl.textContent = label;
      this.langEl.style.display = label ? '' : 'none';
    }
  }

  _position() {
    if (!this.pre) return;
    // Span the block's full width — lang label left, Copy right, like the
    // design's header strip.
    const wrapRect = this.editor.wrapper.getBoundingClientRect();
    const preRect = this.pre.getBoundingClientRect();
    this.bar.style.top = `${Math.round(preRect.top - wrapRect.top + 7)}px`;
    this.bar.style.left = `${Math.round(preRect.left - wrapRect.left)}px`;
    this.bar.style.width = `${Math.round(preRect.width)}px`;
    this.bar.style.right = 'auto';
  }

  destroy() {
    document.removeEventListener('selectionchange', this._onSel);
    this.editor.editor.removeEventListener('input', this._onInput);
    this.editor.editor.removeEventListener('scroll', this._onScroll);
    if (this.bar && this.bar.parentNode) this.bar.parentNode.removeChild(this.bar);
    super.destroy();
  }
}
