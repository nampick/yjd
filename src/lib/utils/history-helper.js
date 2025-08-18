import Editor from '../core/editor.js';

/**
 * Helper function to save history state before applying format
 * This should be called by all format operations to ensure proper undo/redo functionality
 */
export function saveBeforeFormat() {
  const editor = Editor.getCurrentInstance();
  if (editor) {
    const historyModule = editor.getModule('history');
    if (historyModule && typeof historyModule.saveBeforeFormat === 'function') {
      historyModule.saveBeforeFormat();
    }
  }
}

/**
 * Helper function to check if history module is available
 */
export function hasHistoryModule() {
  const editor = Editor.getCurrentInstance();
  if (editor) {
    const historyModule = editor.getModule('history');
    return historyModule && typeof historyModule.saveBeforeFormat === 'function';
  }
  return false;
} 