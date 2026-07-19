import Editor from './lib/core/editor.js';
import registry from './lib/core/registry.js';
import Module from './lib/core/module.js';
import { Format, InlineFormat, BlockFormat } from './lib/core/format.js';
import StylesLoader from './lib/styles-loader.js';
import { renderStatic } from './lib/static.js';
import { htmlToMarkdown, markdownToHtml, domToJson, jsonToHtml } from './lib/serialize.js';
import { applySerializeMethods } from './lib/core/serialize-methods.js';

// The all-in-one build ships getJSON/setJSON/getMarkdown/setMarkdown; the
// tree-shakeable /core Editor omits them (keeps serialize.js out of Minimal).
applySerializeMethods(Editor);

// Import formats
import Bold from './lib/formats/bold.js';
import Italic from './lib/formats/italic.js';
import Underline from './lib/formats/underline.js';
import Strike from './lib/formats/strike.js';
import Subscript from './lib/formats/subscript.js';
import Superscript from './lib/formats/superscript.js';
import Color from './lib/formats/color.js';
import Background from './lib/formats/background.js';
import Link from './lib/formats/link.js';
import Table from './lib/formats/table.js';
import Heading from './lib/formats/heading.js';
import FontFamily from './lib/formats/font-family.js';
import LineHeight from './lib/formats/line-height.js';
import Capitalization from './lib/formats/capitalization.js';
import TextAlign from './lib/formats/text-align.js';
import List from './lib/formats/list.js';
import Indent, { IndentIncrease, IndentDecrease } from './lib/formats/indent.js';
import Emoji from './lib/formats/emoji.js';
import Image from './lib/formats/image.js';
import Video from './lib/formats/video.js';
import Tag from './lib/formats/tag.js';
import TextSize from './lib/formats/text-size.js';

import Import from './lib/formats/import.js';

// Import modules
import Toolbar from './lib/modules/toolbar.js';
import History from './lib/modules/history.js';
import BlockToolbar from './lib/modules/block-toolbar.js';
import TableToolbar from './lib/modules/table-toolbar.js';
import CodeView from './lib/modules/code-view.js';
import FindReplace from './lib/modules/find-replace.js';
import SlashMenu from './lib/modules/slash-menu.js';
import Mention from './lib/modules/mention.js';
import Ai from './lib/modules/ai.js';

import ResizeHandles from './lib/modules/resize-handles.js';

// Import UI components
import ColorPicker from './lib/ui/color-picker.js';
import IconUtils from './lib/ui/icons.js';
import LinkPopup from './lib/ui/link-popup.js';
import TablePopup from './lib/ui/table-popup.js';
import TextAlignPicker from './lib/ui/text-align-picker.js';
import ListPicker from './lib/ui/list-picker.js';
import EmojiPicker from './lib/ui/emoji-picker.js';
import ImagePopup from './lib/ui/image-popup.js';
import VideoPopup from './lib/ui/video-popup.js';
import TagPopup from './lib/ui/tag-popup.js';

import createCustomButton from './lib/ui/select-button.js';



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
registry.register('formats/text-size', TextSize, true);

registry.register('formats/import', Import, true);

// Register default modules
registry.register('modules/toolbar', Toolbar, true);
registry.register('modules/history', History, true);
registry.register('modules/block-toolbar', BlockToolbar, true);
registry.register('modules/table-toolbar', TableToolbar, true);
registry.register('modules/code-view', CodeView, true);
registry.register('modules/find-replace', FindReplace, true);
registry.register('modules/slash-menu', SlashMenu, true);
registry.register('modules/mention', Mention, true);
registry.register('modules/ai', Ai, true);

registry.register('modules/resize-handles', ResizeHandles, true);

// Register UI components
registry.register('ui/color-picker', ColorPicker, true);
registry.register('ui/text-align-picker', TextAlignPicker, true);
registry.register('ui/list-picker', ListPicker, true);
registry.register('ui/emoji-picker', EmojiPicker, true);
registry.register('ui/image-popup', ImagePopup, true);
registry.register('ui/video-popup', VideoPopup, true);
registry.register('ui/tag-popup', TagPopup, true);

registry.register('ui/custom-button', createCustomButton, true);



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

  // fromTextarea() is inherited from the base Editor (defined in core so it is
  // also available from the tree-shakeable /core entry). RichEditor.fromTextarea
  // therefore returns a fully-featured RichEditor (via `new this(...)`).
}

// Export classes for extension. `yjd` is the brand-aligned name; `RichEditor`
// is kept as an alias for backward compatibility.
export {
  RichEditor as default,
  RichEditor,
  RichEditor as yjd,
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
  TextSize,

  Import
};

// Export modules
export {
  Toolbar,
  History,
  BlockToolbar,
  TableToolbar,
  CodeView,
  FindReplace,
  SlashMenu,
  Mention,
  Ai,

  ResizeHandles
};

// Export UI components
export {
  ColorPicker,
  IconUtils,
  LinkPopup,
  TablePopup,
  TextAlignPicker,
  ListPicker,
  EmojiPicker,
  ImagePopup,
  VideoPopup,
  TagPopup,

  createCustomButton
};

// Static rendering + serialization helpers
export {
  renderStatic,
  htmlToMarkdown,
  markdownToHtml,
  domToJson,
  jsonToHtml
};




/**
 * Utility function to create editor instance
 * @param {string|Element} selector - DOM selector or element
 * @param {object} options - Editor options
 */
export function createEditor(selector, options = {}) {
  return new RichEditor(selector, options);
} 