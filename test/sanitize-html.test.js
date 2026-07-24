import './dom-setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeHtml, sanitizeNode } from '../lib/utils/sanitize.js';

test('sanitizeHtml strips scripts and event handlers', () => {
  const out = sanitizeHtml('<p onclick="x()">hi</p><script>evil()</script>');
  assert.ok(!/script/i.test(out), 'script removed');
  assert.ok(!/onclick/i.test(out), 'onclick removed');
  assert.ok(/hi/.test(out), 'text kept');
});

test('sanitizeHtml drops javascript: links but keeps safe ones', () => {
  const out = sanitizeHtml('<a href="javascript:evil()">x</a><a href="https://ok.com">y</a>');
  assert.ok(!/javascript:/i.test(out));
  assert.ok(/https:\/\/ok\.com/.test(out));
});

test('sanitizeHtml removes untrusted iframes, keeps YouTube embed', () => {
  const out = sanitizeHtml(
    '<iframe src="https://evil.com"></iframe>' +
    '<iframe src="https://www.youtube.com/embed/abc"></iframe>'
  );
  assert.ok(!/evil\.com/.test(out));
  assert.ok(/youtube\.com\/embed\/abc/.test(out));
});

test('sanitizeHtml strips onerror from images', () => {
  const out = sanitizeHtml('<img src="x.png" onerror="evil()">');
  assert.ok(!/onerror/i.test(out));
  assert.ok(/src="x\.png"/.test(out));
});

test('sanitizeHtml keeps data:video src on <video> (uploaded clips survive round-trip)', () => {
  const out = sanitizeHtml('<video src="data:video/webm;base64,AAAA" controls></video>');
  assert.ok(/data:video\/webm/.test(out), 'video data URL preserved');
});

test('sanitizeHtml still strips data:video src from non-media tags', () => {
  const out = sanitizeHtml('<a href="data:video/webm;base64,AAAA">x</a>');
  assert.ok(!/data:video/.test(out), 'data:video not allowed on <a>');
});

test('sanitizeNode cleans an in-place subtree', () => {
  const div = document.createElement('div');
  div.innerHTML = '<b onclick="x()">bold</b>';
  sanitizeNode(div);
  assert.ok(!/onclick/i.test(div.innerHTML));
});
