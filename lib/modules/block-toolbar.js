import Module from '../core/module.js';
import IconUtils, { registerIcons, S } from '../ui/icons.js';
import { execFormat, queryFormatState } from '../utils/exec-command.js';

registerIcons({
  bold: S('<path d="M6 4h8a4 4 0 0 1 0 8H6z"/><path d="M6 12h9a4 4 0 0 1 0 8H6z"/>'),
  italic: S('<line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/>'),
  underline: S('<path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" x2="20" y1="20" y2="20"/>'),
  strike: S('<path d="M16 4H9a3 3 0 0 0-2.8 4"/><path d="M14 12a4 4 0 0 1 0 8H8"/><line x1="4" x2="20" y1="12" y2="12"/>'),
  link: S('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.8 1.8"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.8-1.8"/>'),
  code: S('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>'),
  color: S('<path d="m4 19 8-14 8 14"/><path d="M7.5 13h9"/>'),
  background: S('<path d="m9 11-6 6v3h9l3-3"/><path d="M22 12 12 2l-4 4 10 10z"/>'),
  'font-family': S('<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/>')
});

/**
 * Block Toolbar Module - Floating toolbar hiện lên khi select text hoặc ấn Enter
 */
class BlockToolbar extends Module {
  static DEFAULTS = {
    showOnSelection: true,
    // Off by default: popping a full formatting bar on every Enter covers content
    // and is non-standard. The bubble now shows only for a real selection. Apps
    // can opt back in with { blockToolbar: { showOnEnter: true } }.
    showOnEnter: false,
    buttons: ['bold', 'italic', 'underline', 'strike', 'code']
  };

  constructor(editor, options = {}) {
    super(editor, options);
    this.blockToolbar = null;
    this.isVisible = false;
    this.currentSelection = null; // Store current selection for scroll updates
    this.currentCursorPosition = null; // Store current cursor position for scroll updates
    this.originalTags = new Map(); // Store original tags before converting to code
    this.init();
  }

  init() {
    this.preloadIcons();
    this.createBlockToolbar();
    this.setupEventListeners();
  }

  async preloadIcons() {
    // Icons are now inline, no need to preload
    // This method is kept for backward compatibility
  }

  createBlockToolbar() {
    this.blockToolbar = document.createElement('div');
    this.blockToolbar.className = 'block-toolbar';
    
    // Create toolbar container
    const toolbarContainer = document.createElement('div');
    toolbarContainer.className = 'block-toolbar-container';
    
    // Button set is configurable via options.buttons (array of command names);
    // defaults to the inline formatting set.
    const meta = {
      bold: { icon: 'bold', title: 'Bold (Ctrl+B)' },
      italic: { icon: 'italic', title: 'Italic (Ctrl+I)' },
      underline: { icon: 'underline', title: 'Underline (Ctrl+U)' },
      strike: { icon: 'strike', title: 'Strikethrough' },
      code: { icon: 'code', title: 'Code' },
      'font-family': { icon: 'font-family', title: 'Font Family' },
      link: { icon: 'link', title: 'Insert link' },
      color: { icon: 'color', title: 'Text color' },
      background: { icon: 'background', title: 'Background color' }
    };
    const names = Array.isArray(this.options.buttons) && this.options.buttons.length
      ? this.options.buttons
      : ['bold', 'italic', 'underline', 'strike', 'code', 'font-family'];
    const buttons = names.map(cmd => ({ cmd, icon: (meta[cmd] && meta[cmd].icon) || cmd, title: (meta[cmd] && meta[cmd].title) || cmd }));

    // Design bubble leads with "✦ AI" + divider when an AI model is wired —
    // the selection AI menu opens from HERE (it no longer auto-pops on every
    // selection, which used to cover this bubble).
    if (this.editor.options.ai && typeof this.editor.options.ai.complete === 'function') {
      const aiBtn = document.createElement('button');
      aiBtn.className = 'block-toolbar-btn block-toolbar-ai';
      aiBtn.title = 'Edit with AI';
      aiBtn.innerHTML =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/></svg><span>AI</span>';
      aiBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const ai = this.editor.getModule && this.editor.getModule('ai');
        this.hide();
        if (ai && typeof ai.openFromToolbar === 'function') ai.openFromToolbar();
      });
      toolbarContainer.appendChild(aiBtn);
      const sep = document.createElement('span');
      sep.className = 'block-toolbar-sep';
      toolbarContainer.appendChild(sep);
    }
    buttons.forEach(({ cmd, icon, title }) => {
      const button = document.createElement('button');
      button.className = 'block-toolbar-btn';
      button.title = title;
      button.dataset.command = cmd;
      const iconElement = IconUtils.createIconElement(icon, { width: '16px', height: '16px' });
      button.appendChild(iconElement);
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleCommand(cmd, button);
      });
      toolbarContainer.appendChild(button);
    });
    
    // "⋮" overflow (design "Touch bubble · overflow menu"): actions beyond the
    // core four fold into a scrollable sheet under the bubble.
    const moreSep = document.createElement('span');
    moreSep.className = 'block-toolbar-sep';
    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'block-toolbar-btn block-toolbar-more';
    more.title = 'More tools';
    more.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none"/></svg>';
    more.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._toggleSheet();
    });
    toolbarContainer.appendChild(moreSep);
    toolbarContainer.appendChild(more);
    this._buildSheet();

    // Create arrow element
    const arrow = document.createElement('div');
    arrow.className = 'block-toolbar-arrow';
    
    // Add container and arrow to toolbar
    this.blockToolbar.appendChild(toolbarContainer);
    this.blockToolbar.appendChild(arrow);
    
    this.editor.wrapper.appendChild(this.blockToolbar);
  }

  setupEventListeners() {
    // Keep references so listeners can be removed in destroy() (prevents leaks
    // on document/window when multiple editors are created/destroyed).
    this._onEditorMouseup = () => {
      setTimeout(() => this.handleSelectionChange(), 0);
    };

    this._onEditorKeydown = (e) => {
      // Only react to Enter; do NOT hide on every keystroke (that broke typing UX).
      if (e.key === 'Enter' && !e.shiftKey) {
        requestAnimationFrame(() => {
          setTimeout(() => this.showAtCursorAfterEnter(), 10);
        });
      }
    };

    this._onDocMousedown = (e) => {
      // Don't hide if clicking on font-family popup or its items
      if (e.target.closest('.font-family-select-popup') || e.target.closest('.custom-select-popup')) {
        return;
      }
      if (!e.target.closest('.block-toolbar') && !e.target.closest('.rich-editor-area')) {
        this.hide();
      }
    };

    this._onWindowScroll = () => {
      if (this.isVisible) this.updateToolbarPosition();
    };

    this._onEditorScroll = () => {
      if (this.isVisible) this.updateToolbarPosition();
    };

    this._onEditorKeyup = (e) => {
      // Shift + Enter hides the toolbar
      if (e.key === 'Enter' && e.shiftKey) {
        this.hide();
        return;
      }
      // Re-evaluate every keyup: keep the bubble while a real selection exists
      // (e.g. Shift+arrow) and hide it as soon as the selection collapses — e.g.
      // typing over a selection — instead of staying pinned while typing.
      this.handleSelectionChange();
    };

    if (this.options.showOnSelection) {
      this.editor.editor.addEventListener('mouseup', this._onEditorMouseup);
    }
    if (this.options.showOnEnter) {
      this.editor.editor.addEventListener('keydown', this._onEditorKeydown);
    }
    document.addEventListener('mousedown', this._onDocMousedown);
    window.addEventListener('scroll', this._onWindowScroll);
    this.editor.editor.addEventListener('scroll', this._onEditorScroll);
    this.editor.editor.addEventListener('keyup', this._onEditorKeyup);
  }

  handleSelectionChange() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return this.hide();
    const range = selection.getRangeAt(0);
    const isInEditableArea = this.editor.isSelectionInEditableArea ?
      this.editor.isSelectionInEditableArea(selection) :
      this.editor.editor.contains(range.commonAncestorContainer);
    if (!isInEditableArea) return this.hide();
    if (!range.collapsed && selection.toString().trim().length > 0) {
      this.showAtSelection(selection);
    } else {
      this.hide();
    }
  }

  showAtSelection(selection) {
    if (!selection || selection.rangeCount === 0) return;
    
    // Store current selection for scroll updates
    this.currentSelection = selection;
    this.currentCursorPosition = null;
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const editorRect = this.editor.wrapper.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    this.showAt(
      rect.left + rect.width / 2 - editorRect.left + scrollLeft,
      rect.top - editorRect.top + scrollTop - 10
    );
  }

  showAtCursorAfterEnter() {
    this.editor.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const isInEditableArea = this.editor.isSelectionInEditableArea ?
      this.editor.isSelectionInEditableArea(selection) :
      this.editor.editor.contains(range.commonAncestorContainer);
    if (!isInEditableArea) return;
    
    this.ensureCursorAtEndOfLine(range);
    
    // Store current cursor position for scroll updates
    this.currentSelection = selection;
    this.currentCursorPosition = this.getCursorPositionAfterEnter();
    
    const rect = this.currentCursorPosition;
    if (!rect) return;
    const editorRect = this.editor.wrapper.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    this.showAt(
      rect.left - editorRect.left + scrollLeft,
      rect.top - editorRect.top + scrollTop - 10
    );
  }

  ensureCursorAtEndOfLine(range) {
    if (!range.collapsed) return;
    const selection = window.getSelection();
    const currentNode = range.startContainer;
    if (currentNode.nodeType === Node.TEXT_NODE) {
      const textLength = currentNode.textContent.length;
      if (range.startOffset < textLength) {
        range.setStart(currentNode, textLength);
        range.setEnd(currentNode, textLength);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
      const walker = document.createTreeWalker(currentNode, NodeFilter.SHOW_TEXT, null, false);
      let lastTextNode = null, node;
      while (node = walker.nextNode()) lastTextNode = node;
      if (lastTextNode) {
        const textLength = lastTextNode.textContent.length;
        range.setStart(lastTextNode, textLength);
        range.setEnd(lastTextNode, textLength);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }

  getCursorPositionAfterEnter() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    const marker = document.createElement('span');
    marker.innerHTML = '&#8203;';
    marker.style.position = 'absolute';
    marker.style.visibility = 'hidden';
    marker.style.pointerEvents = 'none';
    range.insertNode(marker);
    const rect = marker.getBoundingClientRect();
    if (marker.parentNode) marker.parentNode.removeChild(marker);
    const newRange = document.createRange();
    newRange.setStart(range.startContainer, range.startOffset);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    return rect;
  }

  showAtCursor() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const isInEditableArea = this.editor.isSelectionInEditableArea ?
      this.editor.isSelectionInEditableArea(selection) :
      this.editor.editor.contains(range.commonAncestorContainer);
    if (!isInEditableArea) return;
    let rect;
    if (range.collapsed) {
      const span = document.createElement('span');
      span.innerHTML = '&#8203;';
      span.style.position = 'absolute';
      span.style.visibility = 'hidden';
      span.style.pointerEvents = 'none';
      range.insertNode(span);
      rect = span.getBoundingClientRect();
      if (span.parentNode) span.parentNode.removeChild(span);
      const newRange = document.createRange();
      newRange.setStart(range.startContainer, range.startOffset);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      rect = range.getBoundingClientRect();
    }
    const editorRect = this.editor.wrapper.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    this.showAt(
      rect.left - editorRect.left + scrollLeft,
      rect.top - editorRect.top + scrollTop - 10
    );
  }

  showAt(x, y) {
    if (!this.blockToolbar) return;
    this.blockToolbar.classList.add('visible');
    this.isVisible = true;
    this.ensureToolbarInViewport(x,y);
    this.updateButtonStates();
  }

  ensureToolbarInViewport(x,y) {
    if (!this.blockToolbar) return;
    
    // Lấy thông tin về editor-area
    const editorArea = this.editor.editor;
    const editorRect = editorArea.getBoundingClientRect();
    const toolbarRect = this.blockToolbar.getBoundingClientRect();
    const toolbarContainer = this.editor.wrapper.querySelector('.rich-editor-toolbar-container');
    const toolbarRect2 = toolbarContainer ? toolbarContainer.getBoundingClientRect() : null;
    // Guard: the chrome toolbar may be absent (module off / custom setup) — treat
    // its height as 0 instead of dereferencing null.
    const chromeH = toolbarRect2 ? toolbarRect2.height : 0;
    const chromeOffH = toolbarContainer ? toolbarContainer.offsetHeight : 0;

    let left = x - this.blockToolbar.offsetWidth/2;
    let top = editorRect.y + y -(chromeH) - editorArea.scrollTop - (editorRect.y + window.scrollY) +chromeOffH-49;

    let arrowLeft = '50%';
    let arrowDirection = 'down'; // mũi tên hướng xuống
    
    // Trường hợp 1: Vượt quá lề trái của editor
    if (left < 0) {
      left =(x - (this.blockToolbar.offsetWidth * (10/100)));
      if(left < 0) left = 0;
      arrowLeft = '10%'; // Mũi tên ở 10%
    }
    // Trường hợp 2: Vượt quá lề phải của editor
    if (left + this.blockToolbar.offsetWidth > (this.editor.wrapper.offsetWidth - 2)) {
      left = x - this.blockToolbar.offsetWidth*0.9;
      arrowLeft = '90%'; // Mũi tên ở 90%
    }
    
    // Trường hợp 3: Vượt quá lề trên của editor

    if (top < chromeH) {
      top = editorRect.y + y -(chromeH) - editorArea.scrollTop +100 - (editorRect.y + window.scrollY)+chromeOffH-49;
      arrowDirection = 'up'; // Mũi tên hướng lên
      if(top < chromeH ){
        this.hide();
        return;
      }
    }
    if(top > editorRect.height){
      this.hide();
      return;
    }
    // Cập nhật vị trí mũi tên
    const arrow = this.blockToolbar.querySelector('.block-toolbar-arrow');
    if (arrow) {
      arrow.style.left = arrowLeft;
      
      if (arrowDirection === 'up') {
        // Mũi tên hướng lên
        arrow.style.bottom = 'auto';
        arrow.style.top = '-8px';
        arrow.style.borderTop = 'none';
        arrow.style.borderBottom = '8px solid var(--rte-bg)';
        arrow.style.borderLeft = '6px solid transparent';
        arrow.style.borderRight = '6px solid transparent';
      } else {
        // Mũi tên hướng xuống (mặc định)
        arrow.style.top = 'auto';
        arrow.style.bottom = '-8px';
        arrow.style.borderBottom = 'none';
        arrow.style.borderTop = '8px solid var(--rte-bg)';
        arrow.style.borderLeft = '6px solid transparent';
        arrow.style.borderRight = '6px solid transparent';
      }
    }
    // Áp dụng vị trí cuối cùng
    this.blockToolbar.style.left = left + 'px';
    this.blockToolbar.style.top = top + 'px';
  }

  /**
   * Update toolbar position based on current selection or cursor position
   */
  updateToolbarPosition() {
    if (!this.isVisible) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      this.hide();
      return;
    }

    const range = selection.getRangeAt(0);
    const isInEditableArea = this.editor.isSelectionInEditableArea ?
      this.editor.isSelectionInEditableArea(selection) :
      this.editor.editor.contains(range.commonAncestorContainer);
    
    if (!isInEditableArea) {
      this.hide();
      return;
    }

    let rect;
    
    if (range.collapsed) {
      // For cursor position, get current cursor rect
      const span = document.createElement('span');
      span.innerHTML = '&#8203;';
      span.style.position = 'absolute';
      span.style.visibility = 'hidden';
      span.style.pointerEvents = 'none';
      
      try {
        range.insertNode(span);
        rect = span.getBoundingClientRect();
        if (span.parentNode) span.parentNode.removeChild(span);
        
        // Restore range
        const newRange = document.createRange();
        newRange.setStart(range.startContainer, range.startOffset);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } catch (e) {
        // If insertion fails, hide toolbar
        this.hide();
        return;
      }
    } else {
      // For selection, use selection rect
      rect = range.getBoundingClientRect();
    }

    const editorRect = this.editor.wrapper.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    let x, y;
    if (range.collapsed) {
      x = rect.left - editorRect.left + scrollLeft;
      y = rect.top - editorRect.top + scrollTop - 10;
    } else {
      x = rect.left + rect.width / 2 - editorRect.left + scrollLeft;
      y = rect.top - editorRect.top + scrollTop - 10;
    }
    
    this.updateToolbarAt(x, y);
    
    // Update font-family popup position if it's visible
    const fontFamilyFormat = this.editor.registry.get('formats/font-family');
    if (fontFamilyFormat && fontFamilyFormat.selectInstance && fontFamilyFormat.selectInstance.isVisible) {
      fontFamilyFormat.selectInstance.updatePosition();
    }
  }

  /**
   * Update toolbar position at specific coordinates
   */
  updateToolbarAt(x, y) {
    if (!this.blockToolbar) return;
    
    this.ensureToolbarInViewport(x, y);
    this.updateButtonStates();
  }

  hide() {
    if (!this.blockToolbar || !this.isVisible) return;
    this.blockToolbar.classList.remove('visible');
    this.isVisible = false;
    this._closeSheet();
    // Clear stored positions
    this.currentSelection = null;
    this.currentCursorPosition = null;

    // Hide any open font-family popup when block toolbar is hidden
    const fontFamilyFormat = this.editor.registry.get('formats/font-family');
    if (fontFamilyFormat && fontFamilyFormat.selectInstance) {
      fontFamilyFormat.selectInstance.hide();
    }
  }

  /**
   * "⋮" overflow sheet (design "Touch bubble · overflow menu"): a 206px list
   * of the actions that don't fit the bubble — highlight, comment, copy and
   * clear formatting. Lives inside the bubble so positioning follows it.
   */
  _buildSheet() {
    const sheet = document.createElement('div');
    sheet.className = 'block-toolbar-sheet';
    const kbd = (t) => `<span class="block-toolbar-kbd">${t}</span>`;
    const items = [
      {
        label: 'Highlight', kbd: '',
        icon: '<path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>',
        run: () => this.handleCommand('background', null)
      },
      {
        label: 'Comment', kbd: '⌘⌥M',
        icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
        when: () => !!(this.editor.openCommentComposer),
        run: () => { if (this.editor.openCommentComposer) this.editor.openCommentComposer(); }
      },
      {
        label: 'Copy', kbd: '',
        icon: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
        run: () => { try { document.execCommand('copy'); } catch (e) {} }
      },
      { separator: true },
      {
        label: 'Clear formatting', kbd: '', danger: true,
        icon: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
        run: () => this.handleCommand('clear-format', null)
      }
    ];
    items.forEach((it) => {
      if (it.separator) {
        const sep = document.createElement('div');
        sep.className = 'block-toolbar-sheet-sep';
        sheet.appendChild(sep);
        return;
      }
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'block-toolbar-item' + (it.danger ? ' danger' : '');
      row.innerHTML =
        `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${it.icon}</svg>` +
        `<span class="block-toolbar-item-label">${it.label}</span>` +
        (it.kbd ? kbd(it.kbd) : '');
      row.addEventListener('pointerdown', (e) => e.preventDefault());
      row.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._closeSheet();
        this.hide();
        it.run();
      });
      if (it.when) row._when = it.when;
      sheet.appendChild(row);
    });
    sheet.style.display = 'none';
    this.sheet = sheet;
    this.blockToolbar.appendChild(sheet);
  }

  _toggleSheet() {
    if (!this.sheet) return;
    if (this.sheet.style.display !== 'none') return this._closeSheet();
    // Conditional rows (e.g. Comment needs the side panel).
    [...this.sheet.querySelectorAll('.block-toolbar-item')].forEach((row) => {
      if (row._when) row.style.display = row._when() ? '' : 'none';
    });
    this.sheet.style.display = 'flex';
    const moreBtn = this.blockToolbar.querySelector('.block-toolbar-more');
    if (moreBtn) moreBtn.classList.add('open');
  }

  _closeSheet() {
    if (!this.sheet) return;
    this.sheet.style.display = 'none';
    const moreBtn = this.blockToolbar.querySelector('.block-toolbar-more');
    if (moreBtn) moreBtn.classList.remove('open');
  }

  handleCommand(command, button) {
    const selection = window.getSelection();
    const isInEditableArea = this.editor.isSelectionInEditableArea ?
      this.editor.isSelectionInEditableArea(selection) : true;
    if (!isInEditableArea) {
      this.hide();
      return;
    }
    
    // Special handling for font-family command
    if (command === 'font-family') {
      const fontFamilyFormat = this.editor.registry.get('formats/font-family');
      if (fontFamilyFormat) {
        const format = new fontFamilyFormat();
        format.toggle(button); // Pass the button as anchor
        this.updateButtonState(command, button);
        this.editor.focus();
        return;
      }
    }
    
    // Special handling for code command to use PRE tag from heading format
    if (command === 'code') {
      const headingFormat = this.editor.registry.get('formats/heading');
      if (headingFormat) {
        const heading = new headingFormat();
        const currentTag = heading.getCurrentTag();
        
        // If current tag is PRE, convert back to original tag or P
        // If current tag is not PRE, convert to PRE (code format)
        if (currentTag === 'PRE') {
          // Get the selection to find the block element
          const selection = window.getSelection();
          if (selection && selection.rangeCount) {
            const range = selection.getRangeAt(0);
            const block = this.getBlockElement(range.startContainer);
            
            if (block) {
              // Get original tag for this block, default to P
              const originalTag = this.originalTags.get(block) || 'P';
              heading.apply(originalTag);              
              this.originalTags.delete(block); // Clean up
            } else {
              heading.apply('P');
            }
          } else {
            heading.apply('P');
          }
        } else {
          // Store original tag before converting to PRE
          const selection = window.getSelection();
          if (selection && selection.rangeCount) {
            const range = selection.getRangeAt(0);
            const block = this.getBlockElement(range.startContainer);
            
            if (block) {
              this.originalTags.set(block, currentTag || 'P');
            }
          }
          
          heading.apply('PRE');
        }
        
        this.updateButtonState(command, button);
        this.editor.focus();
        return;
      }
    }

    const formatClass = this.editor.registry.get(`formats/${command}`);
    if (formatClass) {
      const format = new formatClass();
      if (typeof format.toggle === 'function') format.toggle();
      else if (typeof format.apply === 'function') format.apply();
    } else {
      execFormat(command);
    }
    this.updateButtonState(command, button);
    this.editor.focus();
  }

  updateButtonStates() {
    if (!this.blockToolbar) return;
    const buttons = this.blockToolbar.querySelectorAll('.block-toolbar-btn');
    buttons.forEach(button => {
      const command = button.dataset.command;
      this.updateButtonState(command, button);
    });
  }

  updateButtonState(command, button) {
    if (!button) return;
    let isActive = false;
    if (command === 'font-family') {
      const fontFamilyFormat = this.editor.registry.get('formats/font-family');
      if (fontFamilyFormat) {
        const format = new fontFamilyFormat();
        isActive = format.isActive();
      }
    } else if (command === 'code') {
      // Check if current block is PRE tag
      const headingFormat = this.editor.registry.get('formats/heading');
      if (headingFormat) {
        const heading = new headingFormat();
        const currentTag = heading.getCurrentTag();
        isActive = currentTag === 'PRE';
      }
    } else if (command === 'strike') {
      const formatClass = this.editor.registry.get(`formats/${command}`);
      if (formatClass) {
        const format = new formatClass();
        isActive = format.isActive();
      }
    } else {
      isActive = queryFormatState(command);
    }
    if (isActive) button.classList.add('active');
    else button.classList.remove('active');
  }

  /**
   * Get block element from a node
   * @param {Node} node - Node to find block element for
   * @returns {Element|null} Block element or null
   */
  getBlockElement(node) {
    if (!node) return null;
    
    // If node is an element and is a block, return it
    if (node.nodeType === Node.ELEMENT_NODE) {
      const blockTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'PRE', 'BLOCKQUOTE', 'DIV'];
      if (blockTags.includes(node.tagName)) {
        return node;
      }
    }
    
    // Walk up the DOM tree to find block element
    let current = node;
    while (current && current !== this.editor.editor) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const blockTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'PRE', 'BLOCKQUOTE', 'DIV'];
        if (blockTags.includes(current.tagName)) {
          return current;
        }
      }
      current = current.parentNode;
    }
    
    return null;
  }

  destroy() {
    // Remove event listeners (document/window ones would otherwise leak)
    if (this._onDocMousedown) {
      document.removeEventListener('mousedown', this._onDocMousedown);
      window.removeEventListener('scroll', this._onWindowScroll);
      this.editor.editor.removeEventListener('mouseup', this._onEditorMouseup);
      this.editor.editor.removeEventListener('keydown', this._onEditorKeydown);
      this.editor.editor.removeEventListener('scroll', this._onEditorScroll);
      this.editor.editor.removeEventListener('keyup', this._onEditorKeyup);
      this._onDocMousedown = this._onWindowScroll = this._onEditorMouseup = null;
      this._onEditorKeydown = this._onEditorScroll = this._onEditorKeyup = null;
    }

    if (this.blockToolbar && this.blockToolbar.parentNode) {
      this.blockToolbar.parentNode.removeChild(this.blockToolbar);
    }
    this.blockToolbar = null;
    this.isVisible = false;
    this.originalTags.clear(); // Clean up stored tags
  }
}

export default BlockToolbar; 