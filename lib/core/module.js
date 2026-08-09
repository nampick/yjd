/**
 * Base Module class - Inspired by Quill's architecture
 * All editor modules should extend this class
 */
export default class Module {
  static DEFAULTS = {};

  constructor(editor, options = {}) {
    this.editor = editor;
    this.options = { ...this.constructor.DEFAULTS, ...options };
    this.events = new Map();
  }

  /**
   * Resolve a UI string through the editor's i18n (options.strings), else the
   * English `fallback`. Safe when the editor lacks `t()` (e.g. a partial test
   * harness) — the fallback is returned. Modules should call this rather than
   * `this.editor.t` directly.
   */
  t(key, fallback, params) {
    return (this.editor && typeof this.editor.t === 'function')
      ? this.editor.t(key, fallback, params) : fallback;
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {function} handler - Event handler
   */
  on(event, handler) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(handler);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {function} handler - Event handler
   */
  off(event, handler) {
    if (this.events.has(event)) {
      const handlers = this.events.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.events.has(event)) {
      this.events.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Called when module is being destroyed
   * Override this method to cleanup resources
   */
  destroy() {
    this.events.clear();
  }

  /**
   * Called when editor content changes
   * Override this method to respond to content changes
   */
  onContentChange() {
    // Override in subclasses
  }

  /**
   * Called when selection changes
   * Override this method to respond to selection changes
   */
  onSelectionChange(range) {
    // Override in subclasses
  }
} 