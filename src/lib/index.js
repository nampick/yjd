import Editor from './core/editor.js';
import registry from './core/registry.js';
import Module from './core/module.js';
import { Format, InlineFormat, BlockFormat } from './core/format.js';
import StylesLoader from './styles-loader.js';

// Import formats
import Bold from './formats/bold.js';
import Italic from './formats/italic.js';
import Underline from './formats/underline.js';
import Strike from './formats/strike.js';
import Subscript from './formats/subscript.js';
import Superscript from './formats/superscript.js';
import Color from './formats/color.js';

// Import modules
import Toolbar from './modules/toolbar.js';
import History from './modules/history.js';
import BlockToolbar from './modules/block-toolbar.js';

// Import UI components
import ColorPicker from './ui/color-picker.js';

// Import themes
import LightTheme from './themes/light.js';
import DarkTheme from './themes/dark.js';

// Register default formats
registry.register('formats/bold', Bold, true);
registry.register('formats/italic', Italic, true);
registry.register('formats/underline', Underline, true);
registry.register('formats/strike', Strike, true);
registry.register('formats/subscript', Subscript, true);
registry.register('formats/superscript', Superscript, true);
registry.register('formats/color', Color, true);

// Register default modules
registry.register('modules/toolbar', Toolbar, true);
registry.register('modules/history', History, true);
registry.register('modules/block-toolbar', BlockToolbar, true);

// Register UI components
registry.register('ui/color-picker', ColorPicker, true);


// Register themes
registry.register('themes/light', LightTheme, true);
registry.register('themes/dark', DarkTheme, true);

// Load CSS styles
StylesLoader.loadStyles().catch(error => {
  console.warn('Could not load Rich Editor styles:', error);
});

// Main Editor class with registration system
class RichEditor extends Editor {
  /**
   * Register a module, format, or theme
   * @param {string|object} path - Registration path
   * @param {*} definition - Class definition
   * @param {boolean} suppressWarning - Suppress overwrite warnings
   */
  static register(path, definition, suppressWarning = false) {
    registry.register(path, definition, suppressWarning);
  }

  /**
   * Get registered item
   * @param {string} path - Registration path
   */
  static get(path) {
    return registry.get(path);
  }

  /**
   * Create new editor instance
   * @param {string|Element} selector - DOM selector or element
   * @param {object} options - Editor options
   */
  static create(selector, options = {}) {
    return new RichEditor(selector, options);
  }
}

// Export classes for extension
export {
  RichEditor as default,
  Editor,
  Module,
  Format,
  InlineFormat,
  BlockFormat,
  registry
};

// Export formats
export {
  Bold,
  Italic,
  Underline,
  Strike,
  Subscript,
  Superscript,
  Color
};

// Export modules
export {
  Toolbar,
  History,
  BlockToolbar
};

// Export UI components
export {
  ColorPicker
};


// Export themes
export {
  LightTheme,
  DarkTheme
};

/**
 * Utility function to create editor instance
 * @param {string|Element} selector - DOM selector or element
 * @param {object} options - Editor options
 */
export function createEditor(selector, options = {}) {
  return new RichEditor(selector, options);
} 