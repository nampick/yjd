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
import Table from './formats/table.js';
import Heading from './formats/heading.js';
import TextSize from './formats/text-size.js';
import FontFamily from './formats/font-family.js';
import LineHeight from './formats/line-height.js';
import Capitalization from './formats/capitalization.js';
import TextAlign from './formats/text-align.js';
import List from './formats/list.js';
import Indent, { IndentIncrease, IndentDecrease } from './formats/indent.js';
import Emoji from './formats/emoji.js';
import Image from './formats/image.js';
import Video from './formats/video.js';
import Tag from './formats/tag.js';
import Template from './formats/template.js';
import Import from './formats/import.js';

// Import modules
import Toolbar from './modules/toolbar.js';
import History from './modules/history.js';
import BlockToolbar from './modules/block-toolbar.js';
import TableToolbar from './modules/table-toolbar.js';
import CodeView from './modules/code-view.js';
import ThemeSwitcher from './modules/theme-switcher.js';
import ResizeHandles from './modules/resize-handles.js';

// Import UI components
import ColorPicker from './ui/color-picker.js';
import IconLoader from './ui/icon-loader.js';
import LinkPopup from './ui/link-popup.js';
import TablePopup from './ui/table-popup.js';
import TextAlignPicker from './ui/text-align-picker.js';
import ListPicker from './ui/list-picker.js';
import EmojiPicker from './ui/emoji-picker.js';
import ImagePopup from './ui/image-popup.js';
import VideoPopup from './ui/video-popup.js';
import TagPopup from './ui/tag-popup.js';
import TemplatePopup from './ui/template-popup.js';
import createCustomButton from './ui/select-button.js';

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
registry.register('formats/table', Table, true);
registry.register('formats/heading', Heading, true);
registry.register('formats/text-size', TextSize, true);
registry.register('formats/font-family', FontFamily, true);
registry.register('formats/line-height', LineHeight, true);
registry.register('formats/capitalization', Capitalization, true);
registry.register('formats/text-align', TextAlign, true);
registry.register('formats/list', List, true);
registry.register('formats/indent', Indent, true);
registry.register('formats/indent-increase', IndentIncrease, true);
registry.register('formats/indent-decrease', IndentDecrease, true);
registry.register('formats/emoji', Emoji, true);
registry.register('formats/image', Image, true);
registry.register('formats/video', Video, true);
registry.register('formats/tag', Tag, true);
registry.register('formats/template', Template, true);
registry.register('formats/import', Import, true);

// Register default modules
registry.register('modules/toolbar', Toolbar, true);
registry.register('modules/history', History, true);
registry.register('modules/block-toolbar', BlockToolbar, true);
registry.register('modules/table-toolbar', TableToolbar, true);
registry.register('modules/code-view', CodeView, true);
registry.register('modules/theme-switcher', ThemeSwitcher, true);
registry.register('modules/resize-handles', ResizeHandles, true);

// Register UI components
registry.register('ui/color-picker', ColorPicker, true);
registry.register('ui/text-align-picker', TextAlignPicker, true);
registry.register('ui/list-picker', ListPicker, true);
registry.register('ui/emoji-picker', EmojiPicker, true);
registry.register('ui/image-popup', ImagePopup, true);
registry.register('ui/video-popup', VideoPopup, true);
registry.register('ui/tag-popup', TagPopup, true);
registry.register('ui/template-popup', TemplatePopup, true);
registry.register('ui/custom-button', createCustomButton, true);

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
  Table,
  Heading,
  TextSize,
  FontFamily,
  LineHeight,
  Capitalization,
  TextAlign,
  List,
  Indent,
  IndentIncrease,
  IndentDecrease,
  Emoji,
  Image,
  Video,
  Tag,
  Template,
  Import
};

// Export modules
export {
  Toolbar,
  History,
  BlockToolbar,
  TableToolbar,
  CodeView,
  ThemeSwitcher,
  ResizeHandles
};

// Export UI components
export {
  ColorPicker,
  IconLoader,
  LinkPopup,
  TablePopup,
  TextAlignPicker,
  ListPicker,
  EmojiPicker,
  ImagePopup,
  VideoPopup,
  TagPopup,
  TemplatePopup,
  createCustomButton
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