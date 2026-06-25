/**
 * Preset: BUBBLE — no top toolbar.
 * Formatting happens through the floating "bubble" bar that appears when you
 * select text (Medium style), plus the slash menu for block types. Built from
 * /core (tree-shaken). Note: it does NOT load the `toolbar` module.
 */
import {
  Editor, registry, StylesLoader,
  Bold, Italic, Underline, Strike, Heading, List, FontFamily,
  History, BlockToolbar, SlashMenu
} from '../../core.js';

StylesLoader.loadStyles();
[
  ['formats/bold', Bold], ['formats/italic', Italic], ['formats/underline', Underline],
  ['formats/strike', Strike], ['formats/heading', Heading], ['formats/list', List],
  ['formats/font-family', FontFamily],
  ['modules/history', History], ['modules/block-toolbar', BlockToolbar],
  ['modules/slash-menu', SlashMenu]
].forEach(([k, v]) => registry.register(k, v));

export function create(selector, options = {}) {
  return new Editor(selector, {
    height: 280,
    placeholder: 'Select text to format, or type / for blocks…',
    // No `toolbar` module → no top toolbar. The bubble bar handles inline format.
    modules: ['history', 'block-toolbar', 'slash-menu'],
    formats: ['bold', 'italic', 'underline', 'strike', 'heading', 'list', 'font-family'],
    // Configure the bubble bar buttons (safe set — these don't need a popup anchor).
    'block-toolbar': { buttons: ['bold', 'italic', 'underline', 'strike', 'code', 'font-family'] },
    ...options
  });
}
