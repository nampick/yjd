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
import Background from './formats/background.js';
import Link from './formats/link.js';
import Image from './formats/image.js';
import Code from './formats/code.js';
import Align from './formats/align.js';
import { Paragraph, Pre } from './formats/paragraph.js';
import { Heading, H1, H2, H3, H4, H5, H6 } from './formats/heading.js';

// Import modules
import Toolbar from './modules/toolbar.js';
import History from './modules/history.js';
import Table from './modules/table.js';
import Media from './modules/media.js';
import BlockToolbar from './modules/block-toolbar.js';
import CommandHandler from './modules/command-handler.js';

// Import UI components
import Tooltip from './ui/tooltip.js';
import ColorPicker from './ui/picker.js';
import TableGridSelector from './ui/table-grid-selector.js';
import AlignSelector from './ui/align-selector.js';
import HeadingSelector from './ui/heading-selector.js';

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
registry.register('formats/background', Background, true);
registry.register('formats/link', Link, true);
registry.register('formats/image', Image, true);
registry.register('formats/code', Code, true);
registry.register('formats/align', Align, true);
registry.register('formats/paragraph', Paragraph, true);
registry.register('formats/pre', Pre, true);
registry.register('formats/heading', Heading, true);
registry.register('formats/h1', H1, true);
registry.register('formats/h2', H2, true);
registry.register('formats/h3', H3, true);
registry.register('formats/h4', H4, true);
registry.register('formats/h5', H5, true);
registry.register('formats/h6', H6, true);

// Register default modules
registry.register('modules/toolbar', Toolbar, true);
registry.register('modules/history', History, true);
registry.register('modules/table', Table, true);
registry.register('modules/media', Media, true);
registry.register('modules/block-toolbar', BlockToolbar, true);
registry.register('modules/command-handler', CommandHandler, true);

// Register UI components
registry.register('ui/tooltip', Tooltip, true);
registry.register('ui/picker', ColorPicker, true);
registry.register('ui/table-grid-selector', TableGridSelector, true);
console.log('🔍 Registering AlignSelector...');
registry.register('ui/align-selector', AlignSelector, true);
console.log('✅ AlignSelector registered');
registry.register('ui/heading-selector', HeadingSelector, true);

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
  Color,
  Background,
  Link,
  Image,
  Code,
  Align,
  Paragraph,
  Pre,
  Heading,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6
};

// Export modules
export {
  Toolbar,
  History,
  Table,
  Media,
  BlockToolbar,
  CommandHandler
};

// Export UI components
export {
  Tooltip,
  ColorPicker,
  TableGridSelector,
  AlignSelector,
  HeadingSelector
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