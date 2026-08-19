import './dom-setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Editor from '../lib/core/editor.js';
import registry from '../lib/core/registry.js';
import Toolbar from '../lib/modules/toolbar.js';

// Register required modules for tests
registry.register('modules/toolbar', Toolbar, true);

function mount() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  return host;
}

test('setContent clears a stale placeholder (and restores it when emptied)', () => {
  const ed = new Editor(mount(), { placeholder: 'Type here' });
  ed.updatePlaceholderVisibility();
  assert.equal(ed.editor.classList.contains('placeholder-visible'), true);

  ed.setContent('<p>hello</p>');
  assert.equal(ed.editor.classList.contains('placeholder-visible'), false,
    'programmatic prefill must hide the placeholder');
  assert.equal(ed.editor.querySelector('.rte-placeholder'), null);

  ed.setContent('');
  assert.equal(ed.editor.classList.contains('placeholder-visible'), true);
});

test('autoFocus:false skips the mount-time focus grab', async () => {
  const ed = new Editor(mount(), { autoFocus: false });
  let calls = 0;
  ed.focus = () => { calls++; };
  await new Promise((r) => setTimeout(r, 150));
  assert.equal(calls, 0);
});

test('autoFocus defaults to true (mount focuses the editor)', async () => {
  const ed = new Editor(mount(), {});
  let calls = 0;
  ed.focus = () => { calls++; };
  await new Promise((r) => setTimeout(r, 150));
  assert.ok(calls >= 1);
});

test('ListPicker filters its types via options.types', async () => {
  const { default: ListPicker } = await import('../lib/ui/list-picker.js');
  const picker = new ListPicker({ types: ['bullet', 'ordered'] });
  await new Promise((r) => setTimeout(r, 0)); // createListTypeButtons is async
  const vals = [...picker.popup.querySelectorAll('[data-list-type]')].map((b) => b.dataset.listType);
  assert.deepEqual(vals, ['bullet', 'ordered']);
});

test('editor options.list.types reaches the list picker', async () => {
  const ed = new Editor(mount(), { list: { types: ['bullet'] } });
  const { default: List } = await import('../lib/formats/list.js');
  new List(); // format construction wires the picker for Editor.currentInstance
  await new Promise((r) => setTimeout(r, 0));
  const picker = ed.getPopupInstance('list');
  const vals = [...picker.popup.querySelectorAll('[data-list-type]')].map((b) => b.dataset.listType);
  assert.deepEqual(vals, ['bullet']);
});

test('more button starts hidden until reflow finds overflow', () => {
  const ed = new Editor(mount(), {});
  const tb = ed.getModule('toolbar');
  assert.equal(tb.moreBtn.style.display, 'none');
});

test("layout:'prompt' with toolbar:{overflow:false} still applies the prompt bar", () => {
  const ed = new Editor(mount(), {
    layout: 'prompt', toolbar: { overflow: false },
    prompt: { tools: ['bold'] }, submit: { onSubmit: () => {} },
  });
  const tb = ed.getModule('toolbar');
  assert.equal(tb._promptPreset, true, 'a plain toolbar object must not disable the prompt preset');
  assert.ok(tb.buttons.has('send'), 'send button present');
  assert.ok(tb.buttons.has('add'), '+ add button present');
  assert.ok(!tb.buttons.has('more'), 'no dead more button');
});

test("layout:'prompt' renders Send only when a submit handler is configured (#63)", () => {
  const bare = new Editor(mount(), { layout: 'prompt' });
  assert.ok(!bare.getModule('toolbar').buttons.has('send'),
    'no submit handler → no dead Send button');

  const withSubmit = new Editor(mount(), { layout: 'prompt', submit: { onSubmit: () => {} } });
  assert.ok(withSubmit.getModule('toolbar').buttons.has('send'));

  const withEnter = new Editor(mount(), { layout: 'prompt', submit: { onEnter: () => {} } });
  assert.ok(withEnter.getModule('toolbar').buttons.has('send'),
    'onEnter alone also submits, so it earns the button');
});

test("prompt.format (and []) controls the format buttons (#62)", () => {
  const none = new Editor(mount(), { layout: 'prompt', prompt: { format: [] } });
  const tbN = none.getModule('toolbar');
  assert.ok(!tbN.buttons.has('bold') && !tbN.buttons.has('italic'),
    'format: [] must remove the default Bold/Italic');
  assert.equal(tbN.container.querySelector('.toolbar-group-fmt'), null,
    'no empty fmt group left in the DOM');

  const some = new Editor(mount(), { layout: 'prompt', prompt: { format: ['underline'] } });
  const tbS = some.getModule('toolbar');
  assert.ok(tbS.buttons.has('underline') && !tbS.buttons.has('bold'));

  // Historical name keeps working.
  const legacy = new Editor(mount(), { layout: 'prompt', prompt: { tools: [] } });
  assert.ok(!legacy.getModule('toolbar').buttons.has('bold'), 'tools: [] also means none');
});

test('submit.enterToSend controls whether Enter submits', () => {
  const fire = (ed) => ed.editor.dispatchEvent(
    new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));

  let never = 0;
  const edN = new Editor(mount(), { submit: { enterToSend: 'never', onSubmit: () => { never++; } } });
  edN.setContent('<p>hi</p>');
  fire(edN);
  assert.equal(never, 0, "'never' → Enter must not submit");
  edN.submitContent();
  assert.equal(never, 1, 'the send path still submits under enterToSend:never');

  let always = 0;
  const edA = new Editor(mount(), { submit: { enterToSend: 'always', onSubmit: () => { always++; } } });
  edA.setContent('<p>hi</p>');
  fire(edA);
  assert.equal(always, 1, "'always' → Enter submits");
});

test('serializeAttachments folds into submit content (format-aware tails)', () => {
  const ed = new Editor(mount(), { prompt: { serializeAttachments: true } });
  ed.getAttachments = () => [{ kind: 'image', file: { name: 'a.png' }, src: 'http://x/a.png' }];
  assert.equal(ed._serializeAttachmentsTail('markdown'), '\n\n![a.png](http://x/a.png)');
  assert.ok(ed._serializeAttachmentsTail('html').includes('<img src="http://x/a.png" alt="a.png">'));

  let submitted = '';
  ed.options.submit = { onSubmit: (html) => { submitted = html; } };
  ed.setContent('<p>hi</p>');
  ed.submitContent();
  assert.ok(submitted.includes('<img src="http://x/a.png"'), 'onSubmit content carries the attachment');
});

test('fromTextarea value includes serialized attachments', () => {
  const ta = document.createElement('textarea');
  document.body.appendChild(ta);
  const ed = Editor.fromTextarea(ta, { format: 'html', prompt: { serializeAttachments: true } });
  ed.getAttachments = () => [{ kind: 'file', file: { name: 'doc.pdf' }, src: 'http://x/doc.pdf' }];
  ed.setContent('<p>see</p>');
  assert.ok(ed.getValue().includes('<a href="http://x/doc.pdf">doc.pdf</a>'),
    'the synced textarea value carries the attachment');
});

test('toolbar overflow:false disables the more split', () => {
  const ed = new Editor(mount(), { toolbar: { overflow: false } });
  const tb = ed.getModule('toolbar');
  assert.equal(tb._overflowDisabled, true);
  tb.reflow(); // must no-op safely with no more button
  // The "more" button is not created at all (no hidden, focusable dead node).
  assert.ok(!tb.moreBtn);
  assert.equal(ed.wrapper.querySelectorAll('.more-btn').length, 0);
  assert.equal(tb.toolbar2.style.display, 'none');
});

test('iconSize sets the --rte-icon-size token on the wrapper (number → px)', () => {
  const ed = new Editor(mount(), { iconSize: 20 });
  assert.equal(ed.wrapper.style.getPropertyValue('--rte-icon-size'), '20px');
});

test('iconSize passes a string value verbatim', () => {
  const ed = new Editor(mount(), { iconSize: '1.25rem' });
  assert.equal(ed.wrapper.style.getPropertyValue('--rte-icon-size'), '1.25rem');
});

test('no iconSize leaves the token unset (CSS default applies)', () => {
  const ed = new Editor(mount(), {});
  assert.equal(ed.wrapper.style.getPropertyValue('--rte-icon-size'), '');
});

test('options.icons overrides a built-in glyph globally', async () => {
  const { IconUtils } = await import('../lib/ui/icons.js');
  new Editor(mount(), { icons: { bold: '<svg id="custom-bold"></svg>' } });
  assert.equal(IconUtils.getIcon('bold'), '<svg id="custom-bold"></svg>');
});

test('Editor.registerIcons registers without constructing an editor', async () => {
  const { IconUtils } = await import('../lib/ui/icons.js');
  Editor.registerIcons({ 'my-glyph': '<svg id="mg"></svg>' });
  assert.equal(IconUtils.getIcon('my-glyph'), '<svg id="mg"></svg>');
});

test('upload icon is registered in the core set', async () => {
  const { IconUtils } = await import('../lib/ui/icons.js');
  assert.ok(IconUtils.getIcon('upload').includes('<svg'), 'upload glyph present');
});

test('insertVideoFile rejects a non-video file (no throw, emits nothing bad)', async () => {
  const { applyEditorInput } = await import('../lib/core/editor-input.js');
  applyEditorInput(Editor);
  const ed = new Editor(mount(), {});
  let events = [];
  ed.on('video:error', (d) => events.push(d.reason));
  ed.insertVideoFile({ name: 'a.txt', type: 'text/plain', size: 10 });
  assert.deepEqual(events, [], 'a non-video is ignored, not an error');
});

test('insertVideoFile emits video:error on oversize', async () => {
  const { applyEditorInput } = await import('../lib/core/editor-input.js');
  applyEditorInput(Editor);
  const ed = new Editor(mount(), { video: { maxSize: 100 } });
  let reasons = [];
  ed.on('video:error', (d) => reasons.push(d.reason));
  ed.insertVideoFile({ name: 'big.mp4', type: 'video/mp4', size: 5000 });
  assert.deepEqual(reasons, ['size']);
});

test('insertVideoFile emits video:error when accept excludes the type', async () => {
  const { applyEditorInput } = await import('../lib/core/editor-input.js');
  applyEditorInput(Editor);
  const ed = new Editor(mount(), { video: { accept: 'video/mp4' } });
  let reasons = [];
  ed.on('video:error', (d) => reasons.push(d.reason));
  ed.insertVideoFile({ name: 'clip.webm', type: 'video/webm', size: 10 });
  assert.deepEqual(reasons, ['type']);
});

test('insertVideoFile with an upload hook emits video:upload and calls the hook', async () => {
  const { applyEditorInput } = await import('../lib/core/editor-input.js');
  applyEditorInput(Editor);
  let uploaded = null;
  const ed = new Editor(mount(), { video: { upload: (f) => { uploaded = f.name; return 'https://cdn/x.mp4'; } } });
  let started = false;
  ed.on('video:upload', () => { started = true; });
  ed.insertVideoFile({ name: 'clip.mp4', type: 'video/mp4', size: 10 });
  assert.equal(started, true, 'video:upload fired');
  assert.equal(uploaded, 'clip.mp4', 'the upload hook received the file');
});

test('video.maxHeight/maxWidth set the --rte-video-max-* tokens on the wrapper', () => {
  const ed = new Editor(mount(), { video: { maxHeight: 300, maxWidth: '80%' } });
  assert.equal(ed.wrapper.style.getPropertyValue('--rte-video-max-h'), '300px');
  assert.equal(ed.wrapper.style.getPropertyValue('--rte-video-max-w'), '80%');
});

test('no video caps leaves the tokens unset (CSS 360px default applies)', () => {
  const ed = new Editor(mount(), {});
  assert.equal(ed.wrapper.style.getPropertyValue('--rte-video-max-h'), '');
});

test('paste of a video file routes to insertVideoFile', async () => {
  const { applyEditorInput } = await import('../lib/core/editor-input.js');
  applyEditorInput(Editor);
  const ed = new Editor(mount(), {});
  let got = null;
  ed.insertVideoFile = (f) => { got = f.name; };
  const fakeFile = { name: 'pasted.mp4', type: 'video/mp4', size: 10 };
  let prevented = false;
  ed.handlePaste({
    clipboardData: {
      items: [{ kind: 'file', type: 'video/mp4', getAsFile: () => fakeFile }],
      getData: () => ''
    },
    preventDefault: () => { prevented = true; }
  });
  assert.equal(got, 'pasted.mp4', 'the pasted video reached insertVideoFile');
  assert.equal(prevented, true, 'default paste was prevented');
});

test('paste still prefers an image when both image and video are present', async () => {
  const { applyEditorInput } = await import('../lib/core/editor-input.js');
  applyEditorInput(Editor);
  const ed = new Editor(mount(), {});
  let calls = [];
  ed.insertImageFile = () => calls.push('image');
  ed.insertVideoFile = () => calls.push('video');
  ed.handlePaste({
    clipboardData: {
      items: [
        { kind: 'file', type: 'video/mp4', getAsFile: () => ({ name: 'v.mp4', type: 'video/mp4' }) },
        { kind: 'file', type: 'image/png', getAsFile: () => ({ name: 'i.png', type: 'image/png' }) }
      ],
      getData: () => ''
    },
    preventDefault: () => {}
  });
  assert.deepEqual(calls, ['image'], 'image wins, video not double-inserted');
});

test('compositionend re-syncs the prompt send state (iOS IME belt)', () => {
  const ed = new Editor(mount(), { autoFocus: false });
  let calls = 0;
  ed._syncPromptSendState = () => { calls++; };
  ed.editor.dispatchEvent(new window.Event('compositionend', { bubbles: true }));
  assert.ok(calls >= 1, 'compositionend must re-run the send-state sync');
});

test('focus re-syncs the prompt send state (iOS IME belt)', async () => {
  const ed = new Editor(mount(), { autoFocus: false });
  let calls = 0;
  ed._syncPromptSendState = () => { calls++; };
  ed.editor.dispatchEvent(new window.Event('focus'));
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(calls >= 1, 'focus must re-run the send-state sync');
});

test('serializeAttachments drops a javascript: src (html + markdown)', () => {
  const ed = new Editor(mount(), { prompt: { serializeAttachments: true } });
  ed.getAttachments = () => [{ kind: 'image', file: { name: 'a.png' }, src: 'javascript:alert(1)' }];
  const html = ed._serializeAttachmentsTail('html');
  assert.ok(!/javascript:/i.test(html), 'unsafe src must not reach attachment HTML');
  const ed2 = new Editor(mount(), { prompt: { serializeAttachments: true } });
  ed2.getAttachments = () => [{ kind: 'file', file: { name: 'x' }, src: 'javascript:alert(1)' }];
  const md = ed2._serializeAttachmentsTail('markdown');
  assert.ok(!/\]\(javascript:/i.test(md), 'unsafe src must not reach attachment markdown link');
});

test('serializeAttachments keeps safe and data:image srcs', () => {
  const ed = new Editor(mount(), { prompt: { serializeAttachments: true } });
  ed.getAttachments = () => [{ kind: 'image', file: { name: 'a.png' }, src: 'data:image/png;base64,QQ==' }];
  assert.ok(ed._serializeAttachmentsTail('html').includes('data:image/png'), 'inline image data URL is preserved');
});

test('insertFileAttachment (no upload hook) drops a data:text/html chip href', async () => {
  const ed = new Editor(mount(), {});
  globalThis.__execCalls.length = 0;
  // Fake a FileReader that yields a data:text/html URL (attacker attaches .html)
  const RealFR = globalThis.FileReader;
  globalThis.FileReader = class {
    readAsDataURL() { setTimeout(() => this.onload({ target: { result: 'data:text/html;base64,PHNjcmlwdD4=' } }), 0); }
  };
  ed.insertFileAttachment({ name: 'evil.html', type: 'text/html', size: 10 });
  await new Promise((r) => setTimeout(r, 20));
  globalThis.FileReader = RealFR;
  const html = globalThis.__execCalls.filter((c) => c[0] === 'insertHTML').map((c) => c[2]).join('');
  assert.ok(!/data:text\/html/i.test(html), 'a data:text/html file must not become a clickable chip href');
});

test('insertFileAttachment (no upload hook) keeps an inert data:application/pdf chip href', async () => {
  const ed = new Editor(mount(), {});
  globalThis.__execCalls.length = 0;
  const RealFR = globalThis.FileReader;
  globalThis.FileReader = class {
    readAsDataURL() { setTimeout(() => this.onload({ target: { result: 'data:application/pdf;base64,JVBER' } }), 0); }
  };
  ed.insertFileAttachment({ name: 'doc.pdf', type: 'application/pdf', size: 10 });
  await new Promise((r) => setTimeout(r, 20));
  globalThis.FileReader = RealFR;
  const html = globalThis.__execCalls.filter((c) => c[0] === 'insertHTML').map((c) => c[2]).join('');
  assert.ok(/data:application\/pdf/i.test(html), 'an inert file embed is preserved');
});

test('t() resolves options.strings from a map, with English fallback', () => {
  const ed = new Editor(mount(), { strings: { 'popup.insertLink': 'Chèn liên kết', 'apply': 'Áp dụng' } });
  assert.equal(ed.t('popup.insertLink', 'Insert link'), 'Chèn liên kết');
  assert.equal(ed.t('apply', 'Apply'), 'Áp dụng');
  assert.equal(ed.t('missing.key', 'Fallback'), 'Fallback', 'unknown key falls back to English');
});

test('t() resolves options.strings from a function, with fallback on nullish', () => {
  const ed = new Editor(mount(), { strings: (key, fb) => (key === 'apply' ? 'OK' : null) });
  assert.equal(ed.t('apply', 'Apply'), 'OK');
  assert.equal(ed.t('cancel', 'Cancel'), 'Cancel', 'nullish return uses the fallback');
});

test('t() returns the fallback when no strings option is set', () => {
  const ed = new Editor(mount(), {});
  assert.equal(ed.t('anything', 'Default'), 'Default');
});

test('options.strings localizes toolbar tooltips end-to-end', () => {
  const ed = new Editor(mount(), { strings: { 'toolbar.bold': 'Đậm', 'toolbar.link': 'Liên kết' } });
  const tb = ed.getModule('toolbar');
  const box = document.createElement('div');
  const bold = tb.addButton(box, 'bold');
  assert.equal(bold.title, 'Đậm', 'bold tooltip localized');
  assert.equal(bold.getAttribute('aria-label'), 'Đậm');
  const link = tb.addButton(box, 'link');
  assert.equal(link.title, 'Liên kết');
  // An unmapped key keeps the English default (with its shortcut hint).
  const italic = tb.addButton(box, 'italic');
  assert.ok(italic.title.startsWith('Italic'), 'unmapped tooltip stays English');
});

test('media.migrateDataUrls re-uploads a data: image via image.upload and swaps src', async () => {
  const uploaded = [];
  const ed = new Editor(mount(), {
    media: { migrateDataUrls: true },
    image: { upload: async (f) => { uploaded.push(f); return 'https://cdn.test/hosted.png'; } },
  });
  ed.setContent('<p><img src="data:image/png;base64,iVBORw0KGgo="></p>');
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(uploaded.length, 1, 'the upload hook ran for the data: image');
  assert.ok(uploaded[0] instanceof (globalThis.File || Object), 'hook received a File');
  const img = ed.editor.querySelector('img');
  assert.equal(img.getAttribute('src'), 'https://cdn.test/hosted.png', 'src swapped to the hosted URL');
});

test('media.migrateDataUrls is a no-op without the opt-in', async () => {
  const uploaded = [];
  const ed = new Editor(mount(), { image: { upload: async (f) => { uploaded.push(f); return 'x'; } } });
  ed.setContent('<p><img src="data:image/png;base64,iVBORw0KGgo="></p>');
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(uploaded.length, 0, 'no migration without media.migrateDataUrls');
  assert.ok(/^data:/.test(ed.editor.querySelector('img').getAttribute('src')), 'data URL left untouched');
});

test('media.migrateDataUrls leaves the data URL on upload failure', async () => {
  const ed = new Editor(mount(), {
    media: { migrateDataUrls: true },
    image: { upload: async () => { throw new Error('boom'); } },
  });
  let err = null;
  ed.on('media:migrate-error', (e) => { err = e; });
  ed.setContent('<p><img src="data:image/png;base64,iVBORw0KGgo="></p>');
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(err, 'a migrate-error event fired');
  assert.ok(/^data:/.test(ed.editor.querySelector('img').getAttribute('src')), 'src stays the data URL on failure');
});

test('options.strings localizes the special toolbar buttons (Send / Add / More)', () => {
  const ed = new Editor(mount(), {
    layout: 'prompt',
    submit: { onSubmit: () => {} }, // Send renders only with a submit handler (#63)
    strings: { 'toolbar.send': 'Gửi', 'toolbar.add': 'Thêm' },
  });
  const tb = ed.getModule('toolbar');
  const send = tb.buttons.get('send');
  assert.equal(send.title, 'Gửi', 'send tooltip localized');
  assert.equal(send.getAttribute('aria-label'), 'Gửi');
  const add = tb.buttons.get('add');
  assert.equal(add.title, 'Thêm', 'add tooltip localized');

  const ed2 = new Editor(mount(), { strings: { 'toolbar.more': 'Thêm công cụ' } });
  const more = ed2.getModule('toolbar').moreBtn;
  assert.equal(more.title, 'Thêm công cụ', 'more tooltip localized');
});

test('options.strings localizes list-picker titles', async () => {
  const { default: ListPicker } = await import('../lib/ui/list-picker.js');
  const fakeEd = { t: (k, fb) => (k === 'list.bullet' ? 'Danh sách chấm' : fb) };
  const picker = new ListPicker({ editor: fakeEd });
  await new Promise((r) => setTimeout(r, 0));
  const bullet = picker.popup.querySelector('[data-list-type="bullet"]');
  assert.ok(bullet, 'bullet option exists');
  assert.equal(bullet.title, 'Danh sách chấm', 'list option tooltip localized');
});

test('options.strings reaches deep chrome: slash-menu, statusbar, placeholder', () => {
  const ed = new Editor(mount(), {
    strings: { 'slash.h1': 'Tiêu đề 1', 'editor.placeholder': 'Bắt đầu viết…', 'status.body': 'Thân bài' },
  });
  // placeholder localized on the editor element
  assert.equal(ed.editor.getAttribute('data-placeholder'), 'Bắt đầu viết…');
  // slash-menu command labels resolve through strings
  const slash = ed.getModule('slash-menu');
  if (slash && slash.commands) {
    const h1 = slash.commands.find((c) => c.id === 'h1');
    if (h1) assert.equal(h1.label, 'Tiêu đề 1', 'slash h1 label localized');
  }
});

test('t() interpolates {n} params for composites', () => {
  const ed = new Editor(mount(), { strings: { 'x.count': '{n} mục' } });
  assert.equal(ed.t('x.count', '{n} items', { n: 3 }), '3 mục');
  assert.equal(ed.t('x.missing', '{n} left', { n: 5 }), '5 left', 'fallback also interpolates');
});

test('popup strategy: explicit fixed/wrapper honoured; auto defaults to wrapper without a clipping ancestor', () => {
  const w = new Editor(mount(), { popup: 'wrapper' });
  assert.equal(w._popupStrategy(), 'wrapper');
  const f = new Editor(mount(), { popup: 'fixed' });
  assert.equal(f._popupStrategy(), 'fixed');
  assert.ok(f.getPopupContainer().classList.contains('yjd-popup-portal'), 'fixed uses a body portal root');
  // auto with a plain (non-clipping) mount → wrapper
  const a = new Editor(mount(), {});
  assert.equal(a._popupStrategy(), 'wrapper');
  assert.ok(a.getPopupContainer().classList.contains('rich-editor-popup-container'));
});

test('popup:fixed portal root carries the editor theme class + is removed on destroy', () => {
  const ed = new Editor(mount(), { popup: 'fixed' });
  const root = ed.getPopupContainer();
  assert.ok(root.classList.contains('yjd-rich-editor'), 'portal carries theme class so scoped CSS applies');
  assert.ok(document.body.contains(root));
  ed.destroy();
  assert.ok(!document.body.contains(root), 'portal removed on destroy');
});

test('default width is 100% — the editor fills its container (#61)', () => {
  const ed = new Editor(mount(), {});
  assert.equal(ed.wrapper.style.width, '100%',
    'unset width must fill the container, not fix 800px');
  const fixed = new Editor(mount(), { width: 640 });
  assert.equal(fixed.wrapper.style.width, '640px', 'explicit numeric width still honoured');
});

test('a flat toolbar array is an allow-list — no picker popups for absent controls (#59)', () => {
  const ed = new Editor(mount(), { toolbar: ['undo', 'redo'] });
  // Select some text so updateToolbarButtonStates takes the active-state path.
  ed.setContent('<p>hello</p>');
  const range = document.createRange();
  range.selectNodeContents(ed.editor.querySelector('p'));
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  ed.updateToolbarButtonStates();

  assert.equal(ed.wrapper.querySelectorAll(
    '.heading-select-popup, .font-family-select-popup, .line-height-select-popup, ' +
    '.color-picker-popup, .list-picker-popup, .text-size-select-popup').length, 0,
  'formats outside the toolbar must not mount their pickers into the DOM');
  assert.equal(ed._fmtCache ? ed._fmtCache.size : 0, 0,
    'no format instances created for controls that are not in the toolbar');
});

test('plainText: content APIs deliver text, markup is flattened (#60)', () => {
  const out = [];
  const ed = new Editor(mount(), {
    plainText: true, autoFocus: false,
    onChange: (c) => out.push(c),
  });
  assert.equal(ed.options.pasteAsPlainText, true, 'plainText forces plain paste');

  ed.setContent('<p>Hi <strong>bold</strong> and <em>italic</em> <a href="http://x">link</a></p>');
  assert.equal(ed.editor.querySelectorAll('strong, em, a').length, 0,
    'markup handed to setContent must not survive');
  assert.equal(ed.getContent(), 'Hi bold and italic link', 'getContent() returns text');
  assert.equal(out[out.length - 1], 'Hi bold and italic link', 'onChange delivers text');

  ed.setContent('one\ntwo');
  assert.equal(ed.getContent(), 'one\ntwo', 'text input round-trips line breaks');
  assert.equal(ed.editor.querySelectorAll('p').length, 2, 'each line is its own paragraph');
});

test('plainText: formatting is inert and no format UI renders (#60)', () => {
  const ed = new Editor(mount(), { plainText: true, autoFocus: false });
  const tb = ed.getModule('toolbar');
  assert.deepEqual([...tb.buttons.keys()].filter((k) => k !== 'more'), ['undo', 'redo'],
    'default plainText toolbar is history only');

  ed.setContent('hello');
  const range = document.createRange();
  range.selectNodeContents(ed.editor.querySelector('p'));
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  ed.toggleFormat('bold');
  assert.equal(ed.editor.querySelector('strong, b'), null, 'toggleFormat is a no-op');

  const prompt = new Editor(mount(), {
    plainText: true, layout: 'prompt', autoFocus: false,
    submit: { onSubmit: () => {} },
  });
  const ptb = prompt.getModule('toolbar');
  assert.ok(!ptb.buttons.has('bold') && !ptb.buttons.has('italic'),
    'prompt bar renders no format buttons in plainText mode');
  assert.ok(ptb.buttons.has('send'), 'send still renders with a submit handler');
});

test('plainText: submit handler receives text (#60)', () => {
  let got = null;
  const ed = new Editor(mount(), {
    plainText: true, autoFocus: false,
    submit: { onSubmit: (c) => { got = c; } },
  });
  ed.setContent('line one\nline two');
  ed.submitContent();
  assert.equal(got, 'line one\nline two');
});

test('plainText: inline markup flattens onto one line, blocks split lines (#60)', () => {
  const ed = new Editor(mount(), { plainText: true, autoFocus: false });
  ed.setContent('hello <b>world</b>');
  assert.equal(ed.getContent(), 'hello world', 'inline tags stay on the line');
  ed.setContent('<h1>Title</h1><p>Body with <a href="http://x">a link</a></p>');
  assert.equal(ed.getContent(), 'Title\nBody with a link');
  ed.setContent('<ul><li>one</li><li>two</li></ul>');
  assert.equal(ed.getContent(), 'one\ntwo', 'list items become lines');
});
