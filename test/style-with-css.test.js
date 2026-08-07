// Regression: QA fuzz (2026-08-07) — applying a colour set the DOCUMENT-WIDE
// execCommand styleWithCSS flag and never reset it, so every LATER bold/italic
// serialized as <span style="font-weight: bold"> instead of <b>. The colour
// paths must switch styleWithCSS back off after their backColor/foreColor.
import './dom-setup.js';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Background from '../lib/formats/background.js';
import Color from '../lib/formats/color.js';
import Editor from '../lib/core/editor.js';

function mountWithSelection() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const ed = new Editor(host, {});
  ed.setContent('<p>colour probe text</p>');
  const tn = ed.editor.querySelector('p').firstChild;
  const r = document.createRange();
  r.setStart(tn, 0);
  r.setEnd(tn, 6);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(r);
  return ed;
}

/** styleWithCSS calls surrounding a colour command, in order. */
function styleFlagSequence(afterIndex = 0) {
  return globalThis.__execCalls
    .slice(afterIndex)
    .filter(([cmd]) => cmd === 'styleWithCSS')
    .map(([, , val]) => val);
}

beforeEach(() => {
  document.body.innerHTML = '';
  globalThis.__execCalls.length = 0;
});

test('background colour resets styleWithCSS after backColor', () => {
  const ed = mountWithSelection();
  Background.applyBackgroundToCurrentSelection('#ffff00', ed.instanceId);
  const calls = globalThis.__execCalls.map(([c]) => c);
  assert.ok(calls.includes('backColor'), 'backColor ran');
  const flags = styleFlagSequence();
  assert.equal(flags[flags.length - 1], false,
    'styleWithCSS must end OFF — leaving it on turns later bold into <span style>');
});

test('text colour resets styleWithCSS after foreColor', () => {
  const ed = mountWithSelection();
  Color.applyColorToCurrentSelection('#ff0000', ed.instanceId);
  const calls = globalThis.__execCalls.map(([c]) => c);
  assert.ok(calls.includes('foreColor'), 'foreColor ran');
  const flags = styleFlagSequence();
  assert.equal(flags[flags.length - 1], false,
    'styleWithCSS must end OFF after foreColor');
});
