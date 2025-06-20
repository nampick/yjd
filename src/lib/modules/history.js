import Module from '../core/module.js';

/**
 * History Module - Handles undo/redo functionality
 * Extracted from FormatManager.js and ToolbarManager.js logic
 */
class History extends Module {
  static DEFAULTS = {
    delay: 1000,        // Delay between history saves
    maxStack: 100,      // Maximum number of undo states
    userOnly: false     // Only save user-initiated changes
  };

  constructor(editor, options = {}) {
    super(editor, options);
    this.stack = [];
    this.index = -1;
    this.lastSave = 0;
    this.savedSelection = null;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.saveState(); // Save initial state
  }

  /**
   * Setup event listeners for automatic history saving
   */
  setupEventListeners() {
    // Save state on input with debouncing
    this.editor.editor.addEventListener('input', () => {
      this.handleInput();
    });

    // Save state on specific commands
    this.editor.editor.addEventListener('keydown', (e) => {
      // Save state before destructive operations
      if (e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Delete') {
        this.saveState();
      }
    });

    // Handle undo/redo shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        this.undo();
      } else if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || 
                 ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        this.redo();
      }
    });
  }

  /**
   * Handle input event with debouncing
   */
  handleInput() {
    const now = Date.now();
    if (now - this.lastSave > this.options.delay) {
      this.saveState();
      this.lastSave = now;
    }
  }

  /**
   * Save current editor state
   */
  saveState() {
    const content = this.editor.getContent();
    const selection = this.saveSelection();
    
    // Don't save if content hasn't changed
    if (this.stack.length > 0 && this.stack[this.index]?.content === content) {
      return;
    }

    // Remove any redo states if we're not at the end
    if (this.index < this.stack.length - 1) {
      this.stack.splice(this.index + 1);
    }

    // Add new state
    this.stack.push({
      content,
      selection,
      timestamp: Date.now()
    });

    // Limit stack size
    if (this.stack.length > this.options.maxStack) {
      this.stack.shift();
    } else {
      this.index++;
    }
  }

  /**
   * Undo last change
   */
  undo() {
    if (!this.canUndo()) return false;

    this.index--;
    const state = this.stack[this.index];
    
    this.restoreState(state);
    this.onHistoryChange('undo');
    
    return true;
  }

  /**
   * Redo last undone change
   */
  redo() {
    if (!this.canRedo()) return false;

    this.index++;
    const state = this.stack[this.index];
    
    this.restoreState(state);
    this.onHistoryChange('redo');
    
    return true;
  }

  /**
   * Check if undo is possible
   */
  canUndo() {
    return this.index > 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo() {
    return this.index < this.stack.length - 1;
  }

  /**
   * Restore editor state
   * @param {object} state - State to restore
   */
  restoreState(state) {
    if (!state) return;

    // Restore content
    this.editor.setContent(state.content);
    
    // Restore selection
    if (state.selection) {
      setTimeout(() => {
        this.restoreSelection(state.selection);
      }, 10);
    }
  }

  /**
   * Save current selection
   */
  saveSelection() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;

    const range = selection.getRangeAt(0);
    const editorEl = this.editor.editor;
    
    // Calculate offset relative to editor
    const startOffset = this.getOffsetInEditor(range.startContainer, range.startOffset, editorEl);
    const endOffset = this.getOffsetInEditor(range.endContainer, range.endOffset, editorEl);
    
    return {
      startOffset,
      endOffset,
      collapsed: range.collapsed
    };
  }

  /**
   * Restore selection
   * @param {object} selectionState - Selection state to restore
   */
  restoreSelection(selectionState) {
    if (!selectionState) return;

    const editorEl = this.editor.editor;
    const range = document.createRange();
    const selection = window.getSelection();

    try {
      const startNode = this.getNodeAtOffset(editorEl, selectionState.startOffset);
      const endNode = this.getNodeAtOffset(editorEl, selectionState.endOffset);

      if (startNode && endNode) {
        range.setStart(startNode.node, startNode.offset);
        range.setEnd(endNode.node, endNode.offset);
        
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (error) {
      console.warn('Could not restore selection:', error);
      // Fallback: focus editor
      this.editor.focus();
    }
  }

  /**
   * Get offset of a position within editor
   * @param {Node} node - DOM node
   * @param {number} offset - Offset within node
   * @param {Element} root - Root element (editor)
   */
  getOffsetInEditor(node, offset, root) {
    let totalOffset = 0;
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let currentNode;
    while (currentNode = walker.nextNode()) {
      if (currentNode === node) {
        return totalOffset + offset;
      }
      totalOffset += currentNode.textContent.length;
    }

    return totalOffset;
  }

  /**
   * Get node at specific offset within editor
   * @param {Element} root - Root element (editor)
   * @param {number} targetOffset - Target offset
   */
  getNodeAtOffset(root, targetOffset) {
    let currentOffset = 0;
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let currentNode;
    while (currentNode = walker.nextNode()) {
      const nodeLength = currentNode.textContent.length;
      if (currentOffset + nodeLength >= targetOffset) {
        return {
          node: currentNode,
          offset: targetOffset - currentOffset
        };
      }
      currentOffset += nodeLength;
    }

    // Fallback: return last node
    return {
      node: root.lastChild || root,
      offset: 0
    };
  }

  /**
   * Clear history
   */
  clear() {
    this.stack = [];
    this.index = -1;
    this.saveState(); // Save current state as first entry
  }

  /**
   * Get current history state info
   */
  getState() {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      stackLength: this.stack.length,
      currentIndex: this.index
    };
  }

  /**
   * Called when history changes (undo/redo)
   * @param {string} action - 'undo' or 'redo'
   */
  onHistoryChange(action) {
    // Notify other modules about history change
    this.editor.modules.forEach(module => {
      if (module !== this && typeof module.onHistoryChange === 'function') {
        module.onHistoryChange(action, this.getState());
      }
    });

    // Trigger custom event
    const event = new CustomEvent('historychange', {
      detail: { action, state: this.getState() }
    });
    this.editor.editor.dispatchEvent(event);
  }

  /**
   * Force save current state (useful before major operations)
   */
  forceSave() {
    this.saveState();
  }

  /**
   * Destroy module
   */
  destroy() {
    this.stack = [];
    this.index = -1;
    this.savedSelection = null;
  }
}

export default History; 