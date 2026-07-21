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
