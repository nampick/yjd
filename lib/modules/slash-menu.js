import Module from '../core/module.js';
import IconUtils, { registerIcons, S } from '../ui/icons.js';

// Escape a (possibly app-supplied via options.strings) label/hint before it goes
// into innerHTML, so a translation can't inject markup.
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

registerIcons({
  heading: S('<path d="M4 5v14"/><path d="M12 5v14"/><path d="M4 12h8"/><path d="M17 19V9l-2 1.5"/>'),
  'list-bullet': S('<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><circle cx="3.5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="3.5" cy="18" r="1" fill="currentColor" stroke="none"/>'),
  'list-ordered': S('<line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>'),
  table: S('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M3 15h18"/><path d="M9 4v16"/><path d="M15 4v16"/>'),
  code: S('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>'),
  'code-view': S('<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>'),
  'font-family': S('<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/>'),
  'horizontal-rule': S('<line x1="3" x2="21" y1="12" y2="12"/>'),
  // UI 2.0 block glyphs — one icon per block type instead of reusing 'heading'.
  'heading-2': S('<path d="M4 5v14"/><path d="M12 5v14"/><path d="M4 12h8"/><path d="M16 11a2.5 2.5 0 1 1 4 2L16 19h5"/>'),
  'heading-3': S('<path d="M4 5v14"/><path d="M12 5v14"/><path d="M4 12h8"/><path d="M16 10a2 2 0 1 1 2.5 2.5A2 2 0 1 1 16 16"/>'),
  paragraph: S('<path d="M13 4v16"/><path d="M17 4v16"/><path d="M19 4H9.5a4.5 4.5 0 0 0 0 9H13"/>'),
  blockquote: S('<path d="M4 5v14"/><path d="M9 8h11"/><path d="M9 13h8"/><path d="M9 18h11"/>'),
  'code-block': S('<rect x="2.5" y="4" width="19" height="16" rx="2"/><path d="m8 10-2 2 2 2"/><path d="m14 10 2 2-2 2"/>'),
  callout: S('<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M7 12h.01"/><path d="M11 10h6"/><path d="M11 14h4"/>'),
  toggle: S('<path d="m6 7 4 4-4 4"/><path d="M13 11h7"/><path d="M13 17h7"/><path d="M13 5h7"/>')
});

/**
 * Slash command menu.
 *
 * Type "/" at the start of a block (or after whitespace) to open a quick menu
 * of block commands. Filter by typing, navigate with ↑/↓, choose with Enter,
 * dismiss with Esc. Selecting a command removes the typed "/query" and applies
 * the block transform.
 */
export default class SlashMenu extends Module {
  constructor(editor, options = {}) {
    super(editor, options);
    this.isOpen = false;
    this.activeIndex = 0;
    this.query = '';
    this.filtered = [];
    this.commands = this.buildCommands();
    this.buildMenu();
    this.bindEvents();
  }

  buildCommands() {
    const ed = this.editor;
    const cmds = [];
    // Ask AI first — only when a model is wired (ai.complete). Selects the
    // current block and opens the AI bar, so the instruction edits it (with the
    // diff-review UX). Natural-language "slash → AI".
    // Localisable label/hint via 'slash.<id>' / 'slash.<id>.hint'.
    const t = (id, label, hint) => ({ label: this.t('slash.' + id, label), hint: this.t('slash.' + id + '.hint', hint) });
    if (ed.options.ai && typeof ed.options.ai.complete === 'function') {
      cmds.push({ id: 'ai', ...t('ai', 'Ask AI…', 'Edit or write with AI'), icon: 'ai', run: () => this._askAi() });
    }
    return cmds.concat([
      { id: 'h1', ...t('h1', 'Heading 1', 'Big section heading'), icon: 'heading', key: '#', run: () => ed.setBlockType('h1') },
      { id: 'h2', ...t('h2', 'Heading 2', 'Medium heading'), icon: 'heading-2', key: '##', run: () => ed.setBlockType('h2') },
      { id: 'h3', ...t('h3', 'Heading 3', 'Small heading'), icon: 'heading-3', key: '###', run: () => ed.setBlockType('h3') },
      { id: 'ul', ...t('ul', 'Bullet list', 'Unordered list'), icon: 'list-bullet', key: '-', run: () => ed.setBlockType('ul') },
      { id: 'ol', ...t('ol', 'Numbered list', 'Ordered list'), icon: 'list-ordered', key: '1.', run: () => ed.setBlockType('ol') },
      { id: 'quote', ...t('quote', 'Quote', 'Blockquote'), icon: 'blockquote', key: '>', run: () => ed.setBlockType('blockquote') },
      { id: 'code', ...t('code', 'Code block', 'Preformatted code'), icon: 'code-block', key: '```', run: () => ed.setBlockType('pre') },
      { id: 'callout', ...t('callout', 'Callout', 'Highlighted note'), icon: 'callout', run: () => this.insertCallout() },
      { id: 'toggle', ...t('toggle', 'Toggle', 'Collapsible section'), icon: 'toggle', run: () => this.insertToggle() },
      { id: 'hr', ...t('hr', 'Divider', 'Horizontal rule'), icon: 'horizontal-rule', key: '---', run: () => ed.insertHorizontalRule() },
      { id: 'table', ...t('table', 'Table', '3×3 table'), icon: 'table', run: () => this.insertTable() },
      { id: 'p', ...t('p', 'Text', 'Plain paragraph'), icon: 'paragraph', run: () => ed.setBlockType('p') },
      // Button block (#83) — only when its module is loaded.
      ...(ed.getModule && ed.getModule('button') ? [{
        id: 'button', ...t('button', 'Button', 'Styled CTA button'), iconText: '▢',
        run: () => { const m = ed.getModule('button'); if (m) m.insert({}); },
      }] : []),
      // Section container (#84) — only when its module is loaded.
      ...(ed.getModule && ed.getModule('sections') ? [{
        id: 'section', ...t('section', 'Section', 'Background band with columns'), iconText: '◫',
        run: () => { const m = ed.getModule('sections'); if (m) m.insert({}); },
      }] : [])
    ]).concat(this._atomCommands());
  }

  /**
   * Registered template atoms (#78/#79): one entry per declared custom block,
   * plus a "Variable…" entry when variables are configured — so removed
   * sections/tokens are re-insertable without retyping their syntax.
   */
  _atomCommands() {
    const ed = this.editor;
    const cmds = [];
    const blocks = ed.options.blocks;
    if (blocks && typeof blocks === 'object') {
      Object.entries(blocks).forEach(([name, def]) => {
        cmds.push({
          id: 'block:' + name,
          label: def.label || name,
          hint: def.description || def.token || '',
          iconText: def.icon || '⬚',
          run: () => {
            const m = ed.getModule && ed.getModule('blocks');
            if (m && typeof m.insert === 'function') m.insert(name);
          },
        });
      });
    }
    const vars = ed.options.variables;
    if (vars && vars.items && Object.keys(vars.items).length) {
      cmds.push({
        id: 'variable',
        label: this.t('slash.variable', 'Variable…'),
        hint: this.t('slash.variable.hint', 'Insert a merge-tag placeholder'),
        iconText: (vars.trigger || '{') + '…',
        run: () => this._openVariablePicker(),
      });
    }
    return cmds;
  }

  /** Insert the variables trigger char so its own picker takes over. */
  _openVariablePicker() {
    const ed = this.editor;
    const trigger = (ed.options.variables && ed.options.variables.trigger) || '{';
    if (typeof ed.insertText === 'function') ed.insertText(trigger);
    else document.execCommand('insertText', false, trigger);
    // The variables module listens on 'input'; execCommand fires it, but a
    // programmatic insertText may not — nudge it directly.
    const m = ed.getModule && ed.getModule('variables');
    if (m && typeof m.handleInput === 'function') setTimeout(() => m.handleInput(), 0);
  }

  // Select the current block and open the AI bar so a typed instruction edits
  // it (falling back to insert-at-caret for an empty block).
  _askAi() {
    const ed = this.editor;
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      let node = sel.getRangeAt(0).startContainer;
      if (node.nodeType === 3) node = node.parentNode;
      const block = node && node.closest && node.closest('p, li, h1, h2, h3, h4, h5, h6, blockquote, pre');
      if (block && ed.editor.contains(block) && block.textContent.trim()) {
        const r = document.createRange();
        r.selectNodeContents(block);
        sel.removeAllRanges(); sel.addRange(r);
      }
    }
    if (ed.ai && typeof ed.ai.openFromToolbar === 'function') ed.ai.openFromToolbar();
  }

  insertTable() {
    const Table = this.editor.registry.get('formats/table');
    if (Table && typeof Table.createTableElement === 'function' && typeof this.editor.insertBlock === 'function') {
      this.editor.insertBlock(Table.createTableElement(3, 3));
    }
  }

  /** Place the caret at the start of an (empty) block's first paragraph. */
  _focusInto(el) {
    const target = el.querySelector('p') || el;
    if (!target.firstChild) target.appendChild(document.createTextNode('​'));
    const sel = window.getSelection();
    const r = document.createRange();
    r.setStart(target.firstChild, target.firstChild.nodeType === 3 ? target.firstChild.length : 0);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
  }

  /**
   * Callout block (UI 2.0): tinted note with a leading icon (CSS-drawn, so the
   * content DOM stays clean). Variants via data-callout: info | success |
   * warning | danger — default info.
   */
  insertCallout() {
    const div = document.createElement('div');
    div.className = 'yjd-callout';
    div.setAttribute('data-callout', 'info');
    const p = document.createElement('p');
    p.appendChild(document.createTextNode('​'));
    div.appendChild(p);
    this.editor.insertBlock(div);
    this._focusInto(div);
    if (typeof this.editor.onContentChange === 'function') this.editor.onContentChange();
  }

  /**
   * Toggle block (UI 2.0): native <details>/<summary>, so the collapse state
   * costs nothing to serialize and works in the read view for free.
   */
  insertToggle() {
    const details = document.createElement('details');
    details.className = 'yjd-toggle';
    details.setAttribute('open', '');
    const summary = document.createElement('summary');
    summary.textContent = this.t('slash.toggleSummary', 'Toggle');
    const p = document.createElement('p');
    p.appendChild(document.createTextNode('​'));
    details.append(summary, p);
    this.editor.insertBlock(details);
    this._focusInto(details);
    if (typeof this.editor.onContentChange === 'function') this.editor.onContentChange();
  }

  buildMenu() {
    const menu = document.createElement('div');
    menu.className = 'yjd-slash-menu';
    menu.setAttribute('role', 'listbox');
    menu.style.display = 'none';
    this.menu = menu;
    document.body.appendChild(menu);
  }

  bindEvents() {
    this._onInput = () => this.handleInput();
    this.editor.editor.addEventListener('input', this._onInput);

    // Keyboard interaction while open (capture so we beat other handlers).
    this._onKeydown = (e) => {
      if (!this.isOpen) return;
      const handled = ['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key);
      if (handled) { e.preventDefault(); e.stopPropagation(); }
      if (e.key === 'ArrowDown') this.move(1);
      else if (e.key === 'ArrowUp') this.move(-1);
      else if (e.key === 'Enter') this.choose(this.activeIndex);
      else if (e.key === 'Escape') this.close();
    };
    this.editor.editor.addEventListener('keydown', this._onKeydown, true);

    this._onDocPointer = (e) => {
      if (this.isOpen && !this.menu.contains(e.target)) this.close();
    };
    document.addEventListener('pointerdown', this._onDocPointer, true);
  }

  handleInput() {
    const sel = window.getSelection();
    if (!sel || !sel.isCollapsed || !sel.rangeCount) return this.close();
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return this.close();

    const before = node.textContent.slice(0, range.startOffset);
    const m = before.match(/(?:^|\s)\/([^\s/]*)$/);
    if (!m) return this.close();

    this.query = m[1];
    this.slashNode = node;
    this.slashStart = range.startOffset - this.query.length - 1; // index of "/"
    const q = this.query.toLowerCase();
    this.filtered = this.commands.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      (c.hint || '').toLowerCase().includes(q));
    if (!this.filtered.length) return this.close();
    this.activeIndex = 0;
    this.render();
    this.open(range);
  }

  open(range) {
    this.isOpen = true;
    this.menu.style.display = 'block';
    this._applyTheme();
    // Position below the caret.
    const rect = range.getBoundingClientRect();
    const x = rect.left || (range.startContainer.parentElement || this.editor.editor).getBoundingClientRect().left;
    const y = rect.bottom || rect.top;
    this.menu.style.left = `${Math.round(x + window.scrollX)}px`;
    this.menu.style.top = `${Math.round(y + window.scrollY + 6)}px`;
    // Flip up if off the bottom.
    const mh = this.menu.offsetHeight;
    if (rect.bottom + mh + 8 > window.innerHeight) {
      this.menu.style.top = `${Math.round(rect.top + window.scrollY - mh - 6)}px`;
    }
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.menu.style.display = 'none';
  }

  /**
   * Copy the editor's --rte-* theme vars onto the portaled menu so it matches
   * the editor (dark mode + custom app theming), since it lives on <body>.
   */
  _applyTheme() {
    const root = this.editor.wrapper || this.editor.root;
    if (!root) return;
    const cs = getComputedStyle(root);
    ['--rte-bg', '--rte-chrome-2', '--rte-ink', '--rte-ink-2', '--rte-muted', '--rte-faint', '--rte-border', '--rte-border-strong', '--rte-accent', '--rte-accent-ink', '--rte-accent-weak', '--rte-radius-md', '--rte-radius-sm', '--rte-radius-xs', '--rte-shadow', '--rte-mono', '--rte-ui', '--rte-t']
      .forEach((v) => { const val = cs.getPropertyValue(v); if (val) this.menu.style.setProperty(v, val.trim()); });
  }

  move(delta) {
    this.activeIndex = (this.activeIndex + delta + this.filtered.length) % this.filtered.length;
    this.render();
  }

  render() {
    this.menu.innerHTML = '';
    // Section header (UI 2.0): mono uppercase label above the block list.
    const head = document.createElement('div');
    head.className = 'yjd-slash-head';
    head.textContent = this.t('slash.head', 'Blocks');
    this.menu.appendChild(head);
    this.filtered.forEach((cmd, i) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'yjd-slash-item' + (i === this.activeIndex ? ' active' : '');
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', i === this.activeIndex ? 'true' : 'false');

      const icon = document.createElement('span');
      icon.className = 'yjd-slash-icon';
      // Registered SVG icon, or literal text (emoji) for app-declared blocks.
      if (cmd.iconText) icon.textContent = cmd.iconText;
      else icon.innerHTML = IconUtils.getIcon(cmd.icon) || '';

      const text = document.createElement('span');
      text.className = 'yjd-slash-text';
      text.innerHTML = `<span class="yjd-slash-label">${esc(cmd.label)}</span><span class="yjd-slash-hint">${esc(cmd.hint)}</span>`;

      item.append(icon, text);
      // Markdown shortcut chip on the right (e.g. "#", "-", "```").
      if (cmd.key) {
        const kbd = document.createElement('span');
        kbd.className = 'yjd-slash-key';
        kbd.textContent = cmd.key;
        item.appendChild(kbd);
      }
      // pointerdown (not click) so the editor selection isn't lost first.
      item.addEventListener('pointerdown', (e) => { e.preventDefault(); this.choose(i); });
      this.menu.appendChild(item);
    });
  }

  choose(index) {
    const cmd = this.filtered[index];
    if (!cmd) return this.close();

    // Remove the typed "/query" then run the command.
    try {
      const node = this.slashNode;
      const sel = window.getSelection();
      const del = document.createRange();
      del.setStart(node, this.slashStart);
      del.setEnd(node, this.slashStart + this.query.length + 1);
      del.deleteContents();
      const caret = document.createRange();
      caret.setStart(node, this.slashStart);
      caret.collapse(true);
      sel.removeAllRanges();
      sel.addRange(caret);
    } catch (e) { /* node moved; run anyway */ }

    this.close();
    this.editor.focus();
    cmd.run(this.editor);
  }

  destroy() {
    this.editor.editor.removeEventListener('input', this._onInput);
    this.editor.editor.removeEventListener('keydown', this._onKeydown, true);
    document.removeEventListener('pointerdown', this._onDocPointer, true);
    if (this.menu && this.menu.parentNode) this.menu.parentNode.removeChild(this.menu);
    super.destroy();
  }
}
