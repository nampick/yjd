// Enter inside a code block must stay in the SAME <pre> — browsers otherwise
// split each line into its own <pre>, which breaks multi-line code and the
// header's language detection. An empty trailing line + Enter exits the block.
import './dom-setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Editor from '../lib/core/editor.js';
import registry from '../lib/core/registry.js';
import Toolbar from '../lib/modules/toolbar.js';

registry.register('modules/toolbar', Toolbar, true);

function mountWithPre(content) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const ed = new Editor(host, {});
  ed.setContent('<pre></pre>');
  const pre = ed.editor.querySelector('pre');
  pre.textContent = content;
  return { ed, pre };
}

function caretAt(node, offset) {
  const sel = window.getSelection();
  const r = document.createRange();
  r.setStart(node, offset);
  r.collapse(true);
  sel.removeAllRanges();
  sel.addRange(r);
}

function pressEnter(ed) {
  const e = new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
  ed.editor.dispatchEvent(e);
  return e;
}

test('Enter mid-code inserts a newline in the same pre (no block split)', () => {
  const { ed, pre } = mountWithPre('const a = 1;');
  caretAt(pre.firstChild, pre.firstChild.data.length);
  const e = pressEnter(ed);
  assert.equal(e.defaultPrevented, true, 'must take over Enter inside pre');
  assert.equal(ed.editor.querySelectorAll('pre').length, 1);
  assert.ok(pre.textContent.includes('\n'), 'newline inserted in the same block');
});

test('Enter on an empty trailing line exits into a fresh paragraph', () => {
  const { ed, pre } = mountWithPre('const a = 1;\n');
  // Caret at the very end — the current line is empty.
  caretAt(pre.firstChild, pre.firstChild.data.length);
  pressEnter(ed);
  assert.equal(ed.editor.querySelectorAll('pre').length, 1);
  assert.equal(pre.textContent, 'const a = 1;', 'trailing blank line removed');
  const p = pre.nextElementSibling;
  assert.ok(p && p.tagName === 'P', 'paragraph created after the block');
  const sel = window.getSelection();
  assert.ok(p.contains(sel.anchorNode) || sel.anchorNode === p, 'caret left the block');
});

test('Enter in a normal paragraph is untouched', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const ed = new Editor(host, {});
  ed.setContent('<p>hello</p>');
  const p = ed.editor.querySelector('p');
  caretAt(p.firstChild, 5);
  const e = pressEnter(ed);
  assert.equal(e.defaultPrevented, false, 'paragraph Enter stays browser-default');
});
