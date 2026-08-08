import './dom-setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { htmlToMarkdown, markdownToHtml, balancePartialMarkdown } from '../lib/serialize.js';

test('balancePartialMarkdown closes an open inline marker so it renders', () => {
  assert.equal(balancePartialMarkdown('this is **bol'), 'this is **bol**');
  assert.ok(markdownToHtml(balancePartialMarkdown('this is **bol')).includes('<b>bol</b>'));
  assert.ok(markdownToHtml(balancePartialMarkdown('a partial `cod')).includes('<code>cod</code>'));
});

test('balancePartialMarkdown closes an open code fence', () => {
  const out = balancePartialMarkdown('```js\nconst x = 1');
  assert.ok(out.endsWith('```'));
  assert.ok(markdownToHtml(out).includes('<pre>'));
});

test('balancePartialMarkdown leaves complete markdown untouched', () => {
  assert.equal(balancePartialMarkdown('done **bold** here'), 'done **bold** here');
});

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

test('htmlToMarkdown serializes an inserted <video> to ![video](src)', () => {
  const html = '<video class="inserted-video" src="https://cdn.example.com/clip.mp4" controls></video>';
  assert.equal(htmlToMarkdown(html), '![video](https://cdn.example.com/clip.mp4)\n');
});

test('htmlToMarkdown serializes a YouTube embed iframe to ![video](embedUrl)', () => {
  const html = '<iframe class="inserted-video youtube-video" src="https://www.youtube.com/embed/abc123DEF45"></iframe>';
  assert.equal(htmlToMarkdown(html), '![video](https://www.youtube.com/embed/abc123DEF45)\n');
});

test('htmlToMarkdown keeps a video inline within a paragraph', () => {
  const html = '<p>see <video class="inserted-video" src="https://cdn.example.com/clip.mp4"></video> here</p>';
  assert.ok(htmlToMarkdown(html).includes('![video](https://cdn.example.com/clip.mp4)'));
});

test('htmlToMarkdown drops a non-video iframe (unchanged behavior)', () => {
  assert.equal(htmlToMarkdown('<iframe src="https://evil.example.com/x"></iframe>'), '');
});

test('markdownToHtml renders ![video](….mp4) as a <video> player, not <img>', () => {
  const out = markdownToHtml('![video](https://cdn.example.com/clip.mp4)');
  assert.ok(out.includes('<video'), 'should emit a <video> element');
  assert.ok(out.includes('src="https://cdn.example.com/clip.mp4"'));
  assert.ok(!out.includes('<img'), 'must not fall back to <img>');
});

test('markdownToHtml renders a YouTube URL in image syntax as an embed iframe', () => {
  const out = markdownToHtml('![video](https://www.youtube.com/watch?v=abc123DEF45)');
  assert.ok(out.includes('<iframe'), 'should emit an iframe embed');
  assert.ok(out.includes('youtube.com/embed/abc123DEF45'));
});

test('markdownToHtml still renders plain images as <img>', () => {
  const out = markdownToHtml('![photo](https://cdn.example.com/pic.png)');
  assert.ok(out.includes('<img'));
  assert.ok(!out.includes('<video'));
});

test('video round-trips markdown -> html -> markdown', () => {
  const md = '![video](https://cdn.example.com/clip.mp4)\n';
  assert.equal(htmlToMarkdown(markdownToHtml(md)), md);
});
