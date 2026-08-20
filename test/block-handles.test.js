import './dom-setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Editor from '../lib/core/editor.js';
import registry from '../lib/core/registry.js';
import Toolbar from '../lib/modules/toolbar.js';
import BlockHandles from '../lib/modules/block-handles.js';

registry.register('modules/toolbar', Toolbar, true);
registry.register('modules/block-handles', BlockHandles, true);

function mount() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  return host;
}

// jsdom has no layout, so stub the block rects: p1 spans y 0–50, p2 spans
// y 66–116 — a 16px margin between them, like the default paragraph gap.
function rig() {
  const ed = new Editor(mount(), {
    autoFocus: false,
    modules: ['toolbar', 'block-handles'],
    content: '<p>one</p><p>two</p>',
  });
  const handles = ed.getModule('block-handles');
  const [p1, p2] = ed.editor.querySelectorAll('p');
  p1.getBoundingClientRect = () => ({ top: 0, bottom: 50, left: 0, right: 600, width: 600, height: 50 });
  p2.getBoundingClientRect = () => ({ top: 66, bottom: 116, left: 0, right: 600, width: 600, height: 50 });
  return { ed, handles, p1, p2 };
}

test('pointer inside a block resolves to that block', () => {
  const { handles, p1, p2 } = rig();
  assert.equal(handles._blockAtY(25), p1);
  assert.equal(handles._blockAtY(100), p2);
});

test('pointer in the margin BETWEEN blocks snaps to the nearest one (#65)', () => {
  const { handles, p1, p2 } = rig();
  // 16px gap: 50–66. Nearer p1 until the midpoint (58), then p2.
  assert.equal(handles._blockAtY(54), p1, 'upper half of the gap → block above');
  assert.equal(handles._blockAtY(62), p2, 'lower half of the gap → block below');
});

test('pointer above the first / below the last block still resolves to none', () => {
  const { handles } = rig();
  assert.equal(handles._blockAtY(-10), null);
  assert.equal(handles._blockAtY(300), null);
});
