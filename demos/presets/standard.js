/**
 * Preset: STANDARD — CMS / docs.
 * Basic + colour, alignment, indent, image, table, find & replace, code view,
 * resize handles, table toolbar. Built from /core (tree-shaken).
 */
import {
  Editor, registry, StylesLoader,
  Bold, Italic, Underline, Strike, Link, Heading, List, TextAlign, FontFamily,
  Color, Background, Image, Table, IndentIncrease, IndentDecrease, TextSize,
  Toolbar, History, SlashMenu, BlockToolbar, TableToolbar, FindReplace, CodeView, ResizeHandles
} from '../../core.js';

StylesLoader.loadStyles();
[
  ['formats/bold', Bold], ['formats/italic', Italic], ['formats/underline', Underline],
  ['formats/strike', Strike], ['formats/link', Link], ['formats/heading', Heading],
  ['formats/list', List], ['formats/text-align', TextAlign], ['formats/font-family', FontFamily],
  ['formats/color', Color], ['formats/background', Background], ['formats/image', Image],
  ['formats/table', Table], ['formats/text-size', TextSize],
  ['formats/indent-increase', IndentIncrease], ['formats/indent-decrease', IndentDecrease],
  ['modules/toolbar', Toolbar], ['modules/history', History], ['modules/slash-menu', SlashMenu],
  ['modules/block-toolbar', BlockToolbar], ['modules/table-toolbar', TableToolbar],
  ['modules/find-replace', FindReplace], ['modules/code-view', CodeView],
  ['modules/resize-handles', ResizeHandles]
].forEach(([k, v]) => registry.register(k, v));

export function create(selector, options = {}) {
  return new Editor(selector, {
    height: 360,
    placeholder: 'Start writing… (type / for commands)',
    toolbar1: [
      { group: 'text-format', items: ['bold', 'italic', 'underline', 'strike'] },
      { group: 'colors', items: ['color', 'background'] },
      { group: 'paragraph', items: ['heading'] },
      { group: 'text-size', items: ['text-size'] },
      { group: 'align', items: ['text-align'] },
      { group: 'indent', items: ['indent-increase', 'indent-decrease'] },
      { group: 'link', items: ['link'] },
      { group: 'insert', items: ['image', 'table'] },
      { group: 'tools', items: ['find', 'code-view'] }
    ],
    formats: ['bold', 'italic', 'underline', 'strike', 'color', 'background', 'heading',
      'text-size', 'text-align', 'indent-increase', 'indent-decrease', 'link', 'image', 'table'],
    modules: ['toolbar', 'history', 'slash-menu', 'block-toolbar', 'table-toolbar',
      'find-replace', 'code-view', 'resize-handles'],
    ...options
  });
}
