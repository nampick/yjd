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

test('toolbar overflow:false disables the more split', () => {
  const ed = new Editor(mount(), { toolbar: { overflow: false } });
  const tb = ed.getModule('toolbar');
  assert.equal(tb._overflowDisabled, true);
  tb.reflow();
  assert.equal(tb.moreBtn.style.display, 'none');
  assert.equal(tb.toolbar2.style.display, 'none');
});
