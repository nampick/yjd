import './dom-setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { htmlToMarkdown, markdownToHtml } from '../lib/serialize.js';

test('htmlToMarkdown serializes checklist as GFM task list', () => {
  const html = '<ul class="checklist"><li data-checked="true">Done</li><li data-checked="false">Todo</li></ul>';
  assert.equal(htmlToMarkdown(html), '- [x] Done\n- [ ] Todo\n');
});

test('htmlToMarkdown keeps plain bullets untouched', () => {
  assert.equal(htmlToMarkdown('<ul><li>item</li></ul>'), '- item\n');
});

test('htmlToMarkdown uses a custom mention data-token verbatim', () => {
  const html = '<p><span class="mention" data-id="t-42" data-trigger="#" data-token="#t-42">#Fix bug</span></p>';
  assert.ok(htmlToMarkdown(html).includes('#t-42'));
  assert.ok(!htmlToMarkdown(html).includes('](')); // not the default [Name](id) form
});

test('htmlToMarkdown falls back to trigger[Name](id) without a data-token', () => {
  const html = '<p><span class="mention" data-id="7" data-trigger="@">@Duc Le</span></p>';
  assert.ok(htmlToMarkdown(html).includes('@[Duc Le](7)'));
});

test('htmlToMarkdown handles nested checklist', () => {
  const html = '<ul class="checklist"><li data-checked="false">Parent' +
    '<ul class="checklist"><li data-checked="true">Child</li></ul></li></ul>';
  assert.equal(htmlToMarkdown(html), '- [ ] Parent\n  - [x] Child\n');
});

test('markdownToHtml parses GFM task list into ul.checklist', () => {
  assert.equal(
    markdownToHtml('- [x] Done\n- [ ] Todo'),
    '<ul class="checklist"><li data-checked="true">Done</li><li data-checked="false">Todo</li></ul>'
  );
});

test('markdownToHtml keeps plain bullets as plain ul', () => {
  assert.equal(markdownToHtml('- item'), '<ul><li>item</li></ul>');
});

test('checklist round-trips markdown -> html -> markdown', () => {
  const md = '- [x] Done\n- [ ] Todo\n';
  assert.equal(htmlToMarkdown(markdownToHtml(md)), md);
});
