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
  const ed = new Editor(mount(), { layout: 'prompt', toolbar: { overflow: false }, prompt: { tools: ['bold'] } });
  const tb = ed.getModule('toolbar');
  assert.equal(tb._promptPreset, true, 'a plain toolbar object must not disable the prompt preset');
  assert.ok(tb.buttons.has('send'), 'send button present');
  assert.ok(tb.buttons.has('add'), '+ add button present');
  assert.ok(!tb.buttons.has('more'), 'no dead more button');
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
