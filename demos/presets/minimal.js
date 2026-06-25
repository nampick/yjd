/**
 * Preset: MINIMAL — comment / chat box.
 * Formats: bold, italic, underline, link. Modules: toolbar, history.
 * Built from the tree-shakeable /core entry — only these features ship.
 */
import {
  Editor, registry, StylesLoader,
  Bold, Italic, Underline, Link,
  Toolbar, History
} from '../../core.js';

StylesLoader.loadStyles();
registry.register('formats/bold', Bold);
registry.register('formats/italic', Italic);
registry.register('formats/underline', Underline);
registry.register('formats/link', Link);
registry.register('modules/toolbar', Toolbar);
registry.register('modules/history', History);

export function create(selector, options = {}) {
  return new Editor(selector, {
    height: 150,
    placeholder: 'Write a comment…',
    toolbar1: [
      { group: 'text-format', items: ['bold', 'italic', 'underline'] },
      { group: 'link', items: ['link'] }
    ],
    formats: ['bold', 'italic', 'underline', 'link'],
    modules: ['toolbar', 'history'],
    ...options
  });
}
