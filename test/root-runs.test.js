import './dom-setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Editor from '../lib/core/editor.js';
import List from '../lib/formats/list.js';

function mount() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  return host;
}

function selectAll(root) {
  const r = document.createRange();
  r.selectNodeContents(root);
  const s = window.getSelection();
  s.removeAllRanges();
  s.addRange(r);
}

function caretAt(node, offset) {
  const r = document.createRange();
  r.setStart(node, offset);
  r.collapse(true);
  const s = window.getSelection();
  s.removeAllRanges();
  s.addRange(r);
}

const CASES = [
  ['<p>Hi</p>{{list}}{{cta:Open the app}}<p>Bye</p>',
    '<p>Hi</p><p>{{list}}{{cta:Open the app}}</p><p>Bye</p>'],
  ['lead <strong>bold</strong><p>A</p>mid <a href="https://example.com">link</a> {{x}}<h2>H</h2>tail',
    '<p>lead <strong>bold</strong></p><p>A</p><p>mid <a href="https://example.com">link</a> {{x}}</p><h2>H</h2><p>tail</p>'],
  ['<p>A</p>\n  \n<p>B</p> {{only}} ',
    '<p>A</p><p>B</p><p>{{only}}</p>'],
  ['{{a}}<ul><li>x</li></ul>{{b}}',
    '<p>{{a}}</p><ul><li>x</li></ul><p>{{b}}</p>'],
];

test('root runs: setContent wraps each bare root run in its own <p>, in order', () => {
  const ed = new Editor(mount(), {});
  for (const [src, want] of CASES) {
    ed.setContent(src);
    assert.equal(ed.getHTML(), want, `setContent(${JSON.stringify(src)})`);
    // Round-trip is stable.
    ed.setContent(ed.getContent());
    assert.equal(ed.getHTML(), want, 'setContent(getContent()) must be stable');
  }
});

test('root runs: constructor content option wraps bare root runs in order', () => {
  for (const [src, want] of CASES) {
    const ed = new Editor(mount(), { content: src });
    assert.equal(ed.getHTML(), want, `content: ${JSON.stringify(src)}`);
  }
});

test('root runs: block-only HTML is left byte-for-byte unchanged', () => {
  const ed = new Editor(mount(), {});
  const html = '<p>A</p>\n<p class="x">B <b>c</b></p>';
  ed.setContent(html);
  assert.equal(ed.getHTML(), html);
});

test('root runs: Ctrl+A list conversion keeps a bare root run in place (no reorder)', () => {
  const ed = new Editor(mount(), {});
  // Bypass the load normalization to model a run created by editing.
  ed.editor.innerHTML = '<p>Hi</p>{{list}}{{cta:Open the app}}<p>Bye</p>';
  selectAll(ed.editor);
  List.applyListToCurrentSelection('bullet', ed.instanceId);
  assert.equal(
    ed.editor.innerHTML.replace(/ style="[^"]*"/, ''),
    '<ul><li>Hi</li><li>{{list}}{{cta:Open the app}}</li><li>Bye</li></ul>'
  );
});

test('root runs: insertBlock with the caret in a bare root run inserts right after the run', () => {
  const ed = new Editor(mount(), {});
  ed.editor.innerHTML = '<p>Hi</p>{{list}} <b>x</b><p>Bye</p>';
  caretAt(ed.editor.childNodes[1], 3);
  ed.insertBlock(document.createElement('hr'));
  assert.equal(ed.editor.innerHTML, '<p>Hi</p>{{list}} <b>x</b><hr><p>Bye</p>');
});
