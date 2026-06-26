/**
 * Preset: BASIC — blog / notes.
 * Adds strike, headings, lists, text-align + slash menu and the floating
 * selection toolbar. Built from /core (tree-shaken).
 */
import {
  Editor, registry,
  Bold, Italic, Underline, Strike, Link, Heading, List, TextAlign, FontFamily,
  Toolbar, History, SlashMenu, BlockToolbar
} from '../../core.js';

[
  ['formats/bold', Bold], ['formats/italic', Italic], ['formats/underline', Underline],
  ['formats/strike', Strike], ['formats/link', Link], ['formats/heading', Heading],
  ['formats/list', List], ['formats/text-align', TextAlign], ['formats/font-family', FontFamily],
  ['modules/toolbar', Toolbar], ['modules/history', History],
  ['modules/slash-menu', SlashMenu], ['modules/block-toolbar', BlockToolbar]
].forEach(([k, v]) => registry.register(k, v));

export function create(selector, options = {}) {
  return new Editor(selector, {
    height: 280,
    placeholder: 'Write your post… (type / for commands)',
    toolbar1: [
      { group: 'history', items: ['undo', 'redo'] },
      { group: 'paragraph', items: ['heading'] },
      { group: 'text-format', items: ['bold', 'italic', 'underline', 'strike'] },
      { group: 'link', items: ['link'] },
      { group: 'paragraph-ops', items: ['list', 'text-align'] }
    ],
    formats: ['bold', 'italic', 'underline', 'strike', 'heading', 'list', 'text-align', 'font-family', 'link'],
    modules: ['toolbar', 'history', 'slash-menu', 'block-toolbar'],
    ...options
  });
}
