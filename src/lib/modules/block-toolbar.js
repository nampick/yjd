import Module from '../core/module.js';
import IconLoader from '../ui/icon-loader.js';

/**
 * Block Toolbar Module - Floating toolbar hiện lên khi select text hoặc ấn Enter
 */
class BlockToolbar extends Module {
  static DEFAULTS = {
    showOnSelection: true,
    showOnEnter: true,
    buttons: ['bold', 'italic', 'underline', 'strike', 'code']
  };

  constructor(editor, options = {}) {
    super(editor, options);
    this.blockToolbar = null;
    this.isVisible = false;
    this.init();
  }

  init() {
    this.preloadIcons();
    this.createBlockToolbar();
    this.setupEventListeners();
  }

  async preloadIcons() {
    const iconNames = ['bold', 'italic', 'underline', 'strike', 'code', 'heading'];
    await IconLoader.preloadIcons(iconNames);
  }

  createBlockToolbar() {
    this.blockToolbar = document.createElement('div');
    this.blockToolbar.className = 'block-toolbar';
    const buttons = [
      { cmd: 'bold', icon: 'bold', title: 'Bold (Ctrl+B)' },
      { cmd: 'italic', icon: 'italic', title: 'Italic (Ctrl+I)' },
      { cmd: 'underline', icon: 'underline', title: 'Underline (Ctrl+U)' },
      { cmd: 'strike', icon: 'strike', title: 'Strikethrough' },
      { cmd: 'code', icon: 'code', title: 'Code' },
      { cmd: 'font', icon: 'heading', title: 'Font Family' }
    ];
    buttons.forEach(({ cmd, icon, title }) => {
      const button = document.createElement('button');
      button.className = 'block-toolbar-btn';
      button.title = title;
      button.dataset.command = cmd;
      const iconElement = IconLoader.createIconElement(icon, { width: '16px', height: '16px' });
      button.appendChild(iconElement);
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleCommand(cmd, button);
      });
      this.blockToolbar.appendChild(button);
    });
    this.editor.wrapper.appendChild(this.blockToolbar);
  }

  setupEventListeners() {
    if (this.options.showOnSelection) {
      this.editor.editor.addEventListener('mouseup', () => {
        setTimeout(() => this.handleSelectionChange(), 0);
      });
    }
    if (this.options.showOnEnter) {
      this.editor.editor.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          requestAnimationFrame(() => {
            setTimeout(() => this.showAtCursorAfterEnter(), 10);
          });
        }
      });
    }
    document.addEventListener('mousedown', (e) => {
      if (!e.target.closest('.block-toolbar') && !e.target.closest('.rich-editor-area')) {
        this.hide();
      }
    });
    window.addEventListener('scroll', () => {
      if (this.isVisible) this.hide();
    });
    this.editor.editor.addEventListener('keyup', () => {
      if (this.isVisible) {
        this.updateButtonStates();
      } else {
        this.handleSelectionChange();
      }
    });
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
    const rect = this.getCursorPositionAfterEnter();
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
    this.blockToolbar.style.left = Math.max(0, x - this.blockToolbar.offsetWidth / 2) + 'px';
    this.blockToolbar.style.top = Math.max(0, y - this.blockToolbar.offsetHeight) + 'px';
    this.ensureToolbarInViewport();
    this.updateButtonStates();
  }

  ensureToolbarInViewport() {
    if (!this.blockToolbar) return;
    const toolbarRect = this.blockToolbar.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let left = parseInt(this.blockToolbar.style.left);
    let top = parseInt(this.blockToolbar.style.top);
    if (toolbarRect.right > viewportWidth) left = Math.max(0, left - (toolbarRect.right - viewportWidth + 10));
    if (toolbarRect.left < 0) left = Math.max(0, left - toolbarRect.left + 10);
    if (toolbarRect.top < 0) top = Math.max(0, top - toolbarRect.top + 10);
    if (toolbarRect.bottom > viewportHeight) top = Math.max(0, top - (toolbarRect.bottom - viewportHeight + 10));
    this.blockToolbar.style.left = left + 'px';
    this.blockToolbar.style.top = top + 'px';
  }

  hide() {
    if (!this.blockToolbar || !this.isVisible) return;
    this.blockToolbar.classList.remove('visible');
    this.isVisible = false;
  }

  handleCommand(command, button) {
    const selection = window.getSelection();
    const isInEditableArea = this.editor.isSelectionInEditableArea ?
      this.editor.isSelectionInEditableArea(selection) : true;
    if (!isInEditableArea) {
      this.hide();
      return;
    }
    if (command === 'font') return; // Remove font handler if not implemented
    const formatClass = this.editor.registry.get(`formats/${command}`);
    if (formatClass) {
      const format = new formatClass();
      if (typeof format.toggle === 'function') format.toggle();
      else if (typeof format.apply === 'function') format.apply();
    } else {
      document.execCommand(command, false, null);
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
    if (command === 'font') {
      isActive = false;
    } else if (command === 'code') {
      const formatClass = this.editor.registry.get('formats/code');
      if (formatClass) {
        const format = new formatClass();
        isActive = format.isActive();
      }
    } else {
      try {
        isActive = document.queryCommandState(command);
      } catch (e) {
        isActive = false;
      }
    }
    if (isActive) button.classList.add('active');
    else button.classList.remove('active');
  }

  destroy() {
    if (this.blockToolbar && this.blockToolbar.parentNode) {
      this.blockToolbar.parentNode.removeChild(this.blockToolbar);
    }
    this.blockToolbar = null;
    this.isVisible = false;
  }
}

export default BlockToolbar; 