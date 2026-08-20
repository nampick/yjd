import './dom-setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Editor from '../lib/core/editor.js';
import registry from '../lib/core/registry.js';
import Toolbar from '../lib/modules/toolbar.js';
import BlockToolbar from '../lib/modules/block-toolbar.js';

registry.register('modules/toolbar', Toolbar, true);
registry.register('modules/block-toolbar', BlockToolbar, true);

function mount() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  return host;
}

// jsdom has no layout: stub the bubble's size and the wrapper's rect.
function rig({ wrapperTop = 300, wrapperH = 60 } = {}) {
  const ed = new Editor(mount(), {
    autoFocus: false,
    modules: ['toolbar', 'history', 'block-toolbar'],
    toolbar: ['undo', 'redo'],
    content: '<p>hello bubble</p>',
  });
  const bt = ed.getModule('block-toolbar');
  Object.defineProperty(bt.blockToolbar, 'offsetWidth', { value: 200, configurable: true });
  Object.defineProperty(bt.blockToolbar, 'offsetHeight', { value: 38, configurable: true });
  Object.defineProperty(ed.wrapper, 'offsetWidth', { value: 600, configurable: true });
  ed.wrapper.getBoundingClientRect = () => ({
    top: wrapperTop, left: 40, bottom: wrapperTop + wrapperH, right: 640,
    width: 600, height: wrapperH, x: 40, y: wrapperTop,
  });
  return { ed, bt };
}

test('bubble coexists with the toolbar module and never hides for lack of room (#72, #73)', () => {
  // Input-sized wrapper (60px): the bubble must OVERHANG above, not hide.
  const { bt } = rig({ wrapperH: 60 });
  bt.showAt(300, 10, 28);
  assert.equal(bt.isVisible, true, 'bubble stays visible in a short editor');
  const top = parseFloat(bt.blockToolbar.style.top);
  assert.ok(top < 0, `expected overhang above the editor, got top=${top}`);
});

test('bubble flips below the anchor when above would leave the viewport (#73)', () => {
  const { bt } = rig({ wrapperTop: 10 }); // editor at the very top of the page
  bt.showAt(300, 4, 22);
  assert.equal(bt.isVisible, true);
  const top = parseFloat(bt.blockToolbar.style.top);
  assert.ok(top >= 22, `expected below-anchor placement, got top=${top}`);
});

test('bubble coordinates are scroll-independent (#76)', () => {
  const { bt } = rig();
  bt.showAt(300, 40, 58);
  const at = { top: bt.blockToolbar.style.top, left: bt.blockToolbar.style.left };
  // Simulate a page scroll: viewport-relative wrapper rect moves, wrapper-relative
  // anchor does not — reposition with the same anchor must be a no-op.
  const r = bt.editor.wrapper.getBoundingClientRect;
  bt.editor.wrapper.getBoundingClientRect = () => ({ ...r(), top: 50, y: 50, bottom: 50 + 60 });
  bt.showAt(300, 40, 58);
  assert.deepEqual({ top: bt.blockToolbar.style.top, left: bt.blockToolbar.style.left }, at,
    'same wrapper-relative anchor → same position, regardless of page scroll');
});

test('horizontal clamping keeps the bubble inside the wrapper', () => {
  const { bt } = rig();
  bt.showAt(5, 40, 58);   // anchor near the left edge
  assert.equal(bt.blockToolbar.style.left, '2px');
  bt.showAt(595, 40, 58); // near the right edge
  assert.equal(bt.blockToolbar.style.left, (600 - 200 - 2) + 'px');
});
