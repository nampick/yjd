import { Format } from '../core/format.js';
import CustomSelect from '../ui/customselect.js';
import { saveBeforeFormat } from '../utils/history-helper.js';
import Editor from '../core/editor.js';
import { registerIcons, S } from '../ui/icons.js';

registerIcons({
  'letter-spacing': S('<path d="M7 20V8"/><path d="M17 20V8"/><path d="M3 4h18"/><path d="m5 14 2-2 2 2"/><path d="m15 14 2-2 2 2"/>')
});

const SPACINGS = [
  { value: '-0.02em', label: 'Tight' },
  { value: 'normal', label: 'Normal' },
  { value: '0.05em', label: 'Wide' },
  { value: '0.1em', label: 'Wider' }
];

/**
 * Letter-spacing format (UI 2.0 `letter-spacing` icon) — a compact picker that
 * applies tracking to the block(s) containing the selection, mirroring the
 * line-height pattern in miniature.
 */
class LetterSpacing extends Format {
  static formatName = 'letter-spacing';

  constructor() {
    super();
    const currentEditor = Editor.getCurrentInstance();
    if (!currentEditor) return;
    this.editorId = currentEditor.instanceId;

    let select = currentEditor.getPopupInstance('letter-spacing');
    if (!select) {
      // eslint-disable-next-line prefer-const -- captured by onItemSelect below
      
      select = new CustomSelect({
        items: SPACINGS.map((s) => ({ value: s.value, label: `<span>${s.label}</span>`, title: s.label })),
        displayProperty: 'label',
        valueProperty: 'value',
        // Reuse the generic styled popup shell (a bespoke class would need its
        // own CSS in every popup selector list).
        className: 'custom-select',
        title: 'Letter spacing',
        width: 150,
        // Apply to the blocks captured when the picker opened — the click that
        // picks an item collapses the live selection first.
        onItemSelect: (value) => LetterSpacing.applyToBlocks(value, select._targets, this.editorId),
        editor: currentEditor,
        editorId: this.editorId
      });
      currentEditor.setPopupInstance('letter-spacing', select);
    }
    this.select = select;
  }

  /** Blocks intersecting the current selection inside this editor. */
  static _selectedBlocks(editor) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return [];
    const range = sel.getRangeAt(0);
    const blockOf = (node) => {
      if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
      return node && node.closest
        ? node.closest('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, td, th')
        : null;
    };
    const start = blockOf(range.startContainer);
    const end = blockOf(range.endContainer);
    if (!start || !editor.editor.contains(start)) return [];
    if (start === end || !end) return [start];
    // Walk the top-level blocks between start and end.
    const all = [...editor.editor.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, td, th')];
    const i = all.indexOf(start);
    const j = all.indexOf(end);
    if (i === -1 || j === -1) return [start];
    return all.slice(Math.min(i, j), Math.max(i, j) + 1);
  }

  static applyToBlocks(value, targets, editorId = null) {
    const editor = editorId ? Editor.getInstanceById(editorId) : Editor.getCurrentInstance();
    if (!editor) return;
    const blocks = (targets && targets.length && targets.filter((b) => b.isConnected)) ||
      LetterSpacing._selectedBlocks(editor);
    if (!blocks.length) return;
    saveBeforeFormat();
    blocks.forEach((b) => {
      if (value === 'normal') b.style.removeProperty('letter-spacing');
      else b.style.letterSpacing = value;
    });
    if (typeof editor.onContentChange === 'function') editor.onContentChange();
    editor.focus();
  }

  static applyToCurrentSelection(value, editorId = null) {
    LetterSpacing.applyToBlocks(value, null, editorId);
  }

  async toggle() {
    if (!this.select) return;
    if (this.select.isVisible) { this.select.hide(); return; }
    const editor = Editor.getInstanceById(this.editorId);
    if (!editor) return;
    const toolbar = editor.getModule('toolbar');
    const button = (toolbar && toolbar.getButton('letter-spacing')) ||
      editor.wrapper.querySelector('.rich-editor-toolbar-btn.letter-spacing-btn');
    if (!button) return;
    const blocks = LetterSpacing._selectedBlocks(editor);
    this.select._targets = blocks; // shared select instance — survives per-click format instances
    const current = blocks.length ? (blocks[0].style.letterSpacing || 'normal') : 'normal';
    this.select.setCurrentValue(current);
    await this.select.show(button);
  }

  isActive() { return false; }
}

export default LetterSpacing;
