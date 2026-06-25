/**
 * Tree-shakeable entry point.
 *
 * Unlike the default entry (./index.js) — which registers every format/module
 * and injects the stylesheet on import (convenient, but pulls the whole editor)
 * — this entry only RE-EXPORTS classes with no side effects. A bundler can drop
 * anything you don't import.
 *
 * Usage (only what you need ends up in your bundle):
 *
 *   import { Editor, registry, StylesLoader, Bold, Italic, Toolbar, History }
 *     from '@oix1987/yjd/core';
 *   StylesLoader.loadStyles();
 *   registry.register('formats/bold', Bold);
 *   registry.register('formats/italic', Italic);
 *   registry.register('modules/toolbar', Toolbar);
 *   registry.register('modules/history', History);
 *   const editor = new Editor('#app', {
 *     formats: ['bold', 'italic'],
 *     modules: ['toolbar', 'history'],
 *   });
 */

// Core
export { default as Editor } from './lib/core/editor.js';
export { default as Module } from './lib/core/module.js';
export { Format, InlineFormat, BlockFormat } from './lib/core/format.js';
export { default as registry } from './lib/core/registry.js';
export { default as StylesLoader } from './lib/styles-loader.js';

// Formats
export { default as Bold } from './lib/formats/bold.js';
export { default as Italic } from './lib/formats/italic.js';
export { default as Underline } from './lib/formats/underline.js';
export { default as Strike } from './lib/formats/strike.js';
export { default as Subscript } from './lib/formats/subscript.js';
export { default as Superscript } from './lib/formats/superscript.js';
export { default as Color } from './lib/formats/color.js';
export { default as Background } from './lib/formats/background.js';
export { default as Link } from './lib/formats/link.js';
export { default as Table } from './lib/formats/table.js';
export { default as Heading } from './lib/formats/heading.js';
export { default as FontFamily } from './lib/formats/font-family.js';
export { default as LineHeight } from './lib/formats/line-height.js';
export { default as Capitalization } from './lib/formats/capitalization.js';
export { default as TextAlign } from './lib/formats/text-align.js';
export { default as List } from './lib/formats/list.js';
export { default as Indent, IndentIncrease, IndentDecrease } from './lib/formats/indent.js';
export { default as Emoji } from './lib/formats/emoji.js';
export { default as Image } from './lib/formats/image.js';
export { default as Video } from './lib/formats/video.js';
export { default as Tag } from './lib/formats/tag.js';
export { default as TextSize } from './lib/formats/text-size.js';
export { default as Import } from './lib/formats/import.js';

// Modules
export { default as Toolbar } from './lib/modules/toolbar.js';
export { default as History } from './lib/modules/history.js';
export { default as BlockToolbar } from './lib/modules/block-toolbar.js';
export { default as TableToolbar } from './lib/modules/table-toolbar.js';
export { default as CodeView } from './lib/modules/code-view.js';
export { default as FindReplace } from './lib/modules/find-replace.js';
export { default as SlashMenu } from './lib/modules/slash-menu.js';
export { default as ResizeHandles } from './lib/modules/resize-handles.js';

// UI
export { default as IconUtils } from './lib/ui/icons.js';
export { default as ColorPicker } from './lib/ui/color-picker.js';
export { default as LinkPopup } from './lib/ui/link-popup.js';
export { default as TablePopup } from './lib/ui/table-popup.js';
export { default as TextAlignPicker } from './lib/ui/text-align-picker.js';
export { default as ListPicker } from './lib/ui/list-picker.js';
export { default as EmojiPicker } from './lib/ui/emoji-picker.js';
export { default as ImagePopup } from './lib/ui/image-popup.js';
export { default as VideoPopup } from './lib/ui/video-popup.js';
export { default as TagPopup } from './lib/ui/tag-popup.js';
export { default as createCustomButton } from './lib/ui/select-button.js';
