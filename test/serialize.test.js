import './dom-setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { htmlToMarkdown, markdownToHtml, balancePartialMarkdown, domToJson, jsonToHtml } from '../lib/serialize.js';

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

test('markdownToHtml classifies an extension-less URL with alt "video" as a <video>', () => {
  const out = markdownToHtml('![video](https://x.test/files/abc123)');
  assert.ok(out.includes('<video'), 'alt video must be the tie-breaker for extension-less URLs');
  assert.ok(!out.includes('<img'));
});

test('markdownToHtml keeps an extension-less URL with a non-video alt as <img>', () => {
  const out = markdownToHtml('![photo](https://x.test/files/abc123)');
  assert.ok(out.includes('<img'));
  assert.ok(!out.includes('<video'));
});

test('extension-less video round-trips html -> markdown -> html as a player', () => {
  const html = '<video class="inserted-video" src="https://x.test/files/abc123" controls></video>';
  const md = htmlToMarkdown(html);
  assert.equal(md, '![video](https://x.test/files/abc123)\n');
  assert.ok(markdownToHtml(md).includes('<video'), 'yjd must re-render its own serializer output as a player');
});

/* ── URL-scheme safety in the standalone serializers (defense-in-depth) ────── */

test('markdownToHtml drops a javascript: link href (no downstream sanitize)', () => {
  const out = markdownToHtml('[x](javascript:alert(1))');
  assert.ok(!/href="javascript:/i.test(out), 'javascript: href must not be emitted');
  assert.ok(out.includes('x'), 'link text is preserved');
});

test('markdownToHtml drops vbscript: and data:text/html link hrefs', () => {
  assert.ok(!/href="vbscript:/i.test(markdownToHtml('[x](vbscript:msgbox(1))')));
  assert.ok(!/href="data:text\/html/i.test(markdownToHtml('[x](data:text/html;base64,PHN2Zz4=)')));
});

test('markdownToHtml keeps safe link schemes (http/https/mailto/tel/relative)', () => {
  for (const u of ['https://a.test/p', 'http://a.test', 'mailto:a@b.test', 'tel:+1', '/rel/path', '#anchor']) {
    assert.ok(markdownToHtml(`[x](${u})`).includes(`href="${u}"`), `${u} should survive`);
  }
});

test('markdownToHtml preserves balanced parens inside a link URL', () => {
  const u = 'https://en.wikipedia.org/wiki/Foo_(disambiguation)';
  const out = markdownToHtml(`[wiki](${u})`);
  assert.ok(out.includes(`href="${u}"`), 'the full URL including () must be captured');
});

test('markdownToHtml drops a javascript: media src', () => {
  const out = markdownToHtml('![video](javascript:alert(1))');
  assert.ok(!/javascript:/i.test(out), 'unsafe media src must not be emitted');
});

test('markdownToHtml keeps a data:image on an image and a data:video on a video', () => {
  assert.ok(markdownToHtml('![x](data:image/png;base64,QQ==)').includes('data:image/png'));
  assert.ok(markdownToHtml('![video](data:video/mp4;base64,QQ==)').includes('data:video/mp4'));
});

test('markdownToHtml rejects a data:text/html smuggled as an image', () => {
  const out = markdownToHtml('![x](data:text/html;base64,PHNjcmlwdD4=)');
  assert.ok(!/data:text\/html/i.test(out), 'data:text/html must never reach an <img> src');
});

test('jsonToHtml strips event-handler attributes', () => {
  const html = jsonToHtml({ content: [{ tag: 'img', attrs: { src: 'https://a.test/p.png', onerror: 'alert(1)' } }] });
  assert.ok(!/onerror/i.test(html), 'on* handlers must be dropped');
  assert.ok(html.includes('https://a.test/p.png'));
});

test('jsonToHtml validates href/src schemes', () => {
  const a = jsonToHtml({ content: [{ tag: 'a', attrs: { href: 'javascript:alert(1)' }, content: [{ text: 'x' }] }] });
  assert.ok(!/javascript:/i.test(a), 'unsafe href must be dropped from json → html');
  const img = jsonToHtml({ content: [{ tag: 'img', attrs: { src: 'https://a.test/p.png' } }] });
  assert.ok(img.includes('src="https://a.test/p.png"'), 'safe src survives');
});

test('domToJson → jsonToHtml round-trip keeps a safe link intact', () => {
  const html = '<p><a href="https://a.test/p">x</a></p>';
  assert.ok(jsonToHtml(domToJson(html)).includes('href="https://a.test/p"'));
});

test('htmlToMarkdown drops a javascript: link (clean output for a foreign renderer)', () => {
  const md = htmlToMarkdown('<p><a href="javascript:alert(1)">x</a></p>');
  assert.ok(!/javascript:/i.test(md), 'unsafe href must not survive into markdown');
  assert.ok(md.includes('x'), 'the link text is kept as plain text');
});

test('htmlToMarkdown drops an unsafe img/video src', () => {
  assert.equal(htmlToMarkdown('<img src="javascript:alert(1)">').trim(), '');
  assert.equal(htmlToMarkdown('<video class="inserted-video" src="vbscript:x"></video>').trim(), '');
});

test('htmlToMarkdown drops an unsafe file-chip href but keeps the name', () => {
  const md = htmlToMarkdown('<p><a class="yjd-file-chip" href="data:text/html;base64,PA==" data-name="evil.html"><span class="yjd-file-name">evil.html</span></a></p>');
  assert.ok(!/data:text\/html/i.test(md), 'scriptable data URL must not survive');
  assert.ok(md.includes('evil.html'), 'the file name is kept');
});

test('htmlToMarkdown keeps safe links/images/file-chips intact', () => {
  assert.ok(htmlToMarkdown('<p><a href="https://a.test">x</a></p>').includes('[x](https://a.test)'));
  assert.ok(htmlToMarkdown('<img src="https://a.test/p.png" alt="p">').includes('![p](https://a.test/p.png)'));
  assert.ok(htmlToMarkdown('<p><a class="yjd-file-chip" href="https://a.test/f.pdf" data-name="f.pdf"><span class="yjd-file-name">f.pdf</span></a></p>').includes('](https://a.test/f.pdf)'));
});
