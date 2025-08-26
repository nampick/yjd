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
 * Helper function to trigger content change after format operations
 * This ensures onChange callback is called when formatting is applied
 */
export function triggerContentChange() {
  const editor = Editor.getCurrentInstance();
  if (editor && typeof editor.onContentChange === 'function') {
    // Use setTimeout to ensure the DOM changes are complete
    setTimeout(() => {
      editor.onContentChange();
    }, 0);
  }
}

/**
 * Helper function to save before format and trigger content change
 * This is a convenience function that combines both operations
 */
export function saveBeforeFormatAndTriggerChange() {
  saveBeforeFormat();
  triggerContentChange();
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