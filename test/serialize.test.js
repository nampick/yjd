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
