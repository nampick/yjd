import Module from '../core/module.js';
import IconUtils from '../ui/icons.js';

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
    return [
      { id: 'h1', label: 'Heading 1', hint: 'Big section heading', icon: 'heading', run: () => ed.setBlockType('h1') },
      { id: 'h2', label: 'Heading 2', hint: 'Medium heading', icon: 'heading', run: () => ed.setBlockType('h2') },
      { id: 'h3', label: 'Heading 3', hint: 'Small heading', icon: 'heading', run: () => ed.setBlockType('h3') },
      { id: 'ul', label: 'Bullet list', hint: 'Unordered list', icon: 'list-bullet', run: () => ed.setBlockType('ul') },
      { id: 'ol', label: 'Numbered list', hint: 'Ordered list', icon: 'list-ordered', run: () => ed.setBlockType('ol') },
      { id: 'quote', label: 'Quote', hint: 'Blockquote', icon: 'code', run: () => ed.setBlockType('blockquote') },
      { id: 'code', label: 'Code block', hint: 'Preformatted code', icon: 'code-view', run: () => ed.setBlockType('pre') },
      { id: 'hr', label: 'Divider', hint: 'Horizontal rule', icon: 'horizontal-rule', run: () => ed.insertHorizontalRule() },
      { id: 'table', label: 'Table', hint: '3×3 table', icon: 'table', run: () => this.insertTable() },
      { id: 'p', label: 'Text', hint: 'Plain paragraph', icon: 'font-family', run: () => ed.setBlockType('p') }
    ];
  }

  insertTable() {
    const Table = this.editor.registry.get('formats/table');
    if (Table && typeof Table.createTableElement === 'function' && typeof this.editor.insertBlock === 'function') {
      this.editor.insertBlock(Table.createTableElement(3, 3));
    }
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
      if (e.key === 'ArrowDown') { e.preventDefault(); this.move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); this.move(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); this.choose(this.activeIndex); }
      else if (e.key === 'Escape') { e.preventDefault(); this.close(); }
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

  move(delta) {
    this.activeIndex = (this.activeIndex + delta + this.filtered.length) % this.filtered.length;
    this.render();
  }

  render() {
    this.menu.innerHTML = '';
    this.filtered.forEach((cmd, i) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'yjd-slash-item' + (i === this.activeIndex ? ' active' : '');
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', i === this.activeIndex ? 'true' : 'false');

      const icon = document.createElement('span');
      icon.className = 'yjd-slash-icon';
      icon.innerHTML = IconUtils.getIcon(cmd.icon) || '';

      const text = document.createElement('span');
      text.className = 'yjd-slash-text';
      text.innerHTML = `<span class="yjd-slash-label">${cmd.label}</span><span class="yjd-slash-hint">${cmd.hint}</span>`;

      item.append(icon, text);
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
