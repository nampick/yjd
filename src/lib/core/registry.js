/**
 * Registry system - Inspired by Quill's registration system
 * Manages registration and retrieval of modules, formats, themes, and UI components
 */
class Registry {
  constructor() {
    this.modules = new Map();
    this.formats = new Map();
    this.themes = new Map();
    this.ui = new Map();
  }

  /**
   * Register a module, format, theme, or UI component
   * @param {string|object} path - Registration path or object with multiple registrations
   * @param {*} def - Definition to register
   * @param {boolean} suppressWarning - Suppress overwrite warnings
   */
  register(path, def, suppressWarning = false) {
    if (typeof path === 'object') {
      // Bulk registration
      Object.entries(path).forEach(([key, value]) => {
        this.register(key, value, suppressWarning);
      });
      return;
    }

    const [type, name] = path.split('/');
    
    if (!suppressWarning && this.get(path)) {
      console.warn(`Overwriting ${path}`);
    }

    switch (type) {
      case 'modules':
        this.modules.set(name, def);
        break;
      case 'formats':
        this.formats.set(name, def);
        break;
      case 'themes':
        this.themes.set(name, def);
        break;
      case 'ui':
        this.ui.set(name, def);
        break;
      default:
        console.warn(`Unknown registry type: ${type}`);
    }
  }

  /**
   * Get a registered item
   * @param {string} path - Registration path
   * @returns {*}
   */
  get(path) {
    const [type, name] = path.split('/');
    
    switch (type) {
      case 'modules':
        return this.modules.get(name);
      case 'formats':
        return this.formats.get(name);
      case 'themes':
        return this.themes.get(name);
      case 'ui':
        return this.ui.get(name);
      default:
        return null;
    }
  }

  /**
   * Check if an item is registered
   * @param {string} path - Registration path
   * @returns {boolean}
   */
  has(path) {
    return this.get(path) !== null && this.get(path) !== undefined;
  }

  /**
   * Get all registered items of a type
   * @param {string} type - Type to get (modules, formats, themes, ui)
   * @returns {Map}
   */
  getAll(type) {
    switch (type) {
      case 'modules':
        return new Map(this.modules);
      case 'formats':
        return new Map(this.formats);
      case 'themes':
        return new Map(this.themes);
      case 'ui':
        return new Map(this.ui);
      default:
        return new Map();
    }
  }

  /**
   * Unregister an item
   * @param {string} path - Registration path
   */
  unregister(path) {
    const [type, name] = path.split('/');
    
    switch (type) {
      case 'modules':
        this.modules.delete(name);
        break;
      case 'formats':
        this.formats.delete(name);
        break;
      case 'themes':
        this.themes.delete(name);
        break;
      case 'ui':
        this.ui.delete(name);
        break;
    }
  }

  /**
   * Clear all registrations
   */
  clear() {
    this.modules.clear();
    this.formats.clear();
    this.themes.clear();
    this.ui.clear();
  }

  /**
   * Get all registered items for debugging
   */
  getAllItems() {
    const items = {};
    items.modules = Array.from(this.modules.keys());
    items.formats = Array.from(this.formats.keys());
    items.themes = Array.from(this.themes.keys());
    items.ui = Array.from(this.ui.keys());
    return items;
  }
}

// Create singleton instance
const registry = new Registry();

export default registry; 