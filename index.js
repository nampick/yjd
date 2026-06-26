import Editor from './lib/core/editor.js';
import registry from './lib/core/registry.js';
import Module from './lib/core/module.js';
import { Format, InlineFormat, BlockFormat } from './lib/core/format.js';
import StylesLoader from './lib/styles-loader.js';
import { renderStatic } from './lib/static.js';
import { htmlToMarkdown, markdownToHtml, domToJson, jsonToHtml } from './lib/serialize.js';

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

  /**
   * Progressive-enhance a <textarea>: hide it, mount an editor in its place,
   * and keep the textarea's value in sync so existing form submits keep working.
   *
   *   const ed = RichEditor.fromTextarea(document.querySelector('#body'), {
   *     // any editor option; `format` chooses how the textarea is read/written:
   *     format: 'html' | 'markdown',  // default 'html'
   *   });
   *
   * The textarea's current value seeds the editor (parsed as HTML or Markdown
   * per `format`). Binding is TWO-WAY: editor edits update textarea.value (and
   * fire native input/change events), and writing `textarea.value = …` from app
   * code (e.g. resetting a form) updates the editor. The returned editor also
   * carries a small controller:
   *
   *   const ed = RichEditor.fromTextarea('#body', { format: 'markdown' });
   *   ed.setValue(md);   // load new content into the editor
   *   ed.getValue();     // current content (html or markdown per `format`)
   *   ed.destroy();      // remove the editor, restore the textarea + last value
   *
   * @param {HTMLTextAreaElement|string} textarea  Element or selector.
   * @param {object} [options]  Editor options + optional `format`.
   * @returns {RichEditor}
   */
  static fromTextarea(textarea, options = {}) {
    const ta = typeof textarea === 'string' ? document.querySelector(textarea) : textarea;
    if (!ta) throw new Error('RichEditor.fromTextarea: textarea not found');

    const format = options.format === 'markdown' ? 'markdown' : 'html';
    const read = (ed) => (format === 'markdown' ? ed.getMarkdown() : ed.getContent());
    const write = (ed, v) => (format === 'markdown' ? ed.setMarkdown(v || '') : ed.setHTML(v || ''));

    // Mount point right after the textarea; hide the original.
    const mount = document.createElement('div');
    ta.after(mount);
    ta.style.display = 'none';
    ta.setAttribute('aria-hidden', 'true');

    // Take over textarea.value so app writes flow into the editor and reads
    // reflect it. Keep the native descriptor to restore on destroy + to set the
    // real value (for form submission) without re-triggering our setter.
    const nativeDesc = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
    let raw = ta.value || '';
    let syncing = false; // guards editor→textarea writes from re-entering setValue

    const initial = raw;
    const editor = new RichEditor(mount, {
      width: '100%',
      ...options,
      content: options.content != null ? options.content
        : (format === 'markdown' ? markdownToHtml(initial) : initial),
    });

    Object.defineProperty(ta, 'value', {
      configurable: true,
      get() { return raw; },
      set(v) {
        raw = v == null ? '' : String(v);
        nativeDesc.set.call(ta, raw);   // keep the real textarea value for submits
        if (!syncing) write(editor, raw); // app write → update editor
      },
    });

    // editor edit → push to textarea + fire native events for app bindings.
    const onChange = () => {
      const next = read(editor);
      if (raw === next) return;
      raw = next;
      syncing = true;
      nativeDesc.set.call(ta, next);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.dispatchEvent(new Event('change', { bubbles: true }));
      syncing = false;
    };
    editor.on('change', onChange);
    onChange(); // normalise textarea to the editor's serialization up front.

    // Controller surface on the editor instance.
    editor.textarea = ta;
    editor.getValue = () => read(editor);
    editor.setValue = (v) => { write(editor, v); };
    const baseDestroy = editor.destroy.bind(editor);
    editor.destroy = () => {
      const last = read(editor);
      editor.off('change', onChange);
      baseDestroy();
      mount.remove();
      delete ta.value; // restore the prototype's value accessor
      nativeDesc.set.call(ta, last);
      ta.style.display = '';
      ta.removeAttribute('aria-hidden');
    };
    return editor;
  }
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