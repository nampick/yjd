/**
 * Optional toolbar-command methods for the Editor.
 *
 * These features (full-screen, per-block text direction, clear-formatting) are
 * only reachable from their toolbar buttons — a Minimal build never shows them,
 * so keeping their bodies out of the core Editor class lets them tree-shake
 * away. The all-in-one entry calls `applyEditorCommands(Editor)`; `/core` users
 * who wire these toolbar items call it themselves.
 */
import IconUtils from '../ui/icons.js';
import { execFormat } from '../utils/exec-command.js';

export function applyEditorCommands(Editor) {
  const P = Editor.prototype;

  /** Set text direction ('ltr' | 'rtl') on the editor root. */
  P.setDirection = function setDirection(dir) {
    const d = dir === 'rtl' ? 'rtl' : 'ltr';
    this.editor.setAttribute('dir', d);
    const toolbar = this.getModule('toolbar');
    if (toolbar) toolbar.setButtonActive('text-direction', d === 'rtl');
  };

  /** @returns {'ltr'|'rtl'} Current text direction. */
  P.getDirection = function getDirection() {
    return this.editor.getAttribute('dir') === 'rtl' ? 'rtl' : 'ltr';
  };

  /** Toggle between LTR and RTL for the whole editor (public API / init option). */
  P.toggleDirection = function toggleDirection() {
    this.setDirection(this.getDirection() === 'rtl' ? 'ltr' : 'rtl');
  };

  /**
   * The block elements the current selection touches (direct children of the
   * editable root), or the caret's containing block.
   */
  P._getSelectedBlocks = function _getSelectedBlocks() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return [];
    const range = sel.getRangeAt(0);
    const root = this.editor;
    const BLOCK = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'LI'];
    const blocks = [];
    Array.from(root.children).forEach((c) => {
      if (c.nodeType === Node.ELEMENT_NODE && BLOCK.includes(c.tagName) && range.intersectsNode(c)) {
        blocks.push(c);
      }
    });
    if (blocks.length) return blocks;
    let n = range.startContainer;
    while (n && n !== root) {
      if (n.nodeType === Node.ELEMENT_NODE && BLOCK.includes(n.tagName)) return [n];
      n = n.parentNode;
    }
    return [];
  };

  /**
   * Toolbar "text direction" action: toggle dir on the selected block(s) so the
   * attribute lives in the content. Falls back to the editor-wide toggle.
   */
  P.toggleTextDirection = function toggleTextDirection() {
    const blocks = this._getSelectedBlocks();
    if (!blocks.length) { this.toggleDirection(); return; }
    const history = this.getModule('history');
    if (history && typeof history.saveBeforeFormat === 'function') history.saveBeforeFormat();
    const makeRtl = (blocks[0].getAttribute('dir') || '').toLowerCase() !== 'rtl';
    blocks.forEach((b) => {
      if (makeRtl) b.setAttribute('dir', 'rtl');
      else b.removeAttribute('dir');
    });
    const toolbar = this.getModule('toolbar');
    if (toolbar) toolbar.setButtonActive('text-direction', makeRtl);
    this.onContentChange();
  };

  /** Toggle distraction-free full-screen: the editor fills the viewport. Esc exits. */
  P.toggleFullscreen = function toggleFullscreen() {
    const on = !this.wrapper.classList.contains('yjd-fullscreen');
    this.wrapper.classList.toggle('yjd-fullscreen', on);
    document.body.classList.toggle('yjd-fullscreen-lock', on);
    const toolbar = this.getModule('toolbar');
    const btn = toolbar && toolbar.getButton && toolbar.getButton('fullscreen');
    if (btn) {
      const icon = btn.querySelector('.icon');
      const svg = IconUtils.getIcon(on ? 'fullscreen-exit' : 'fullscreen');
      if (icon && svg) icon.innerHTML = svg;
      btn.title = on ? 'Exit full screen (Esc)' : 'Full screen (Esc to exit)';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    if (on) {
      if (!this._fsEsc) {
        this._fsEsc = (e) => { if (e.key === 'Escape' && this.wrapper.classList.contains('yjd-fullscreen')) this.toggleFullscreen(); };
        document.addEventListener('keydown', this._fsEsc);
      }
    } else if (this._fsEsc) {
      document.removeEventListener('keydown', this._fsEsc);
      this._fsEsc = null;
    }
    this.emit('fullscreen', on);
  };

  /** Remove inline formatting (and links) from the current selection. */
  P.clearFormatting = function clearFormatting() {
    const historyModule = this.getModule('history');
    if (historyModule && typeof historyModule.saveBeforeFormat === 'function') {
      historyModule.saveBeforeFormat();
    }
    this.focus();
    execFormat('removeFormat');
    execFormat('unlink');
    this.onContentChange();
    this.updateToolbarButtonStates();
  };

  return Editor;
}

export default applyEditorCommands;
