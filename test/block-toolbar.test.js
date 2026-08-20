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

test('bubble sheet is filtered by options.sheet; ⋮ disappears when empty (#70)', () => {
  const mk = (sheet) => {
    const ed = new Editor(mount(), {
      autoFocus: false, modules: ['history', 'block-toolbar'],
      'block-toolbar': { buttons: ['bold', 'italic'], sheet },
      content: '<p>x</p>',
    });
    return ed.getModule('block-toolbar').blockToolbar;
  };
  const all = mk(true);
  assert.ok(all.querySelector('.block-toolbar-more'), 'default keeps the ⋮');
  assert.equal(all.querySelectorAll('.block-toolbar-item').length, 4, 'all sheet entries');

  const none = mk(false);
  assert.equal(none.querySelector('.block-toolbar-more'), null, 'sheet:false drops the ⋮');
  assert.equal(none.querySelector('.block-toolbar-sheet'), null, 'no sheet element');
  const seps = [...none.querySelectorAll('.block-toolbar-sep')];
  assert.ok(!seps.length || seps.every((s) => s.nextElementSibling),
    'no separator dangles at the end of the bubble');

  const some = mk(['copy']);
  assert.equal(some.querySelectorAll('.block-toolbar-item').length, 1, 'array filters entries');
  assert.equal(some.querySelectorAll('.block-toolbar-sheet-sep').length, 0,
    'separators between removed groups are dropped');
});

test('custom bubble buttons render with bubble chrome and receive (editor, selection) (#74)', () => {
  let got = null;
  const ed = new Editor(mount(), {
    autoFocus: false, modules: ['history', 'block-toolbar'],
    'block-toolbar': {
      buttons: ['bold', { id: 'emoji', title: 'Emoji', text: '😀', onClick: (e, s) => { got = { e, s }; } }],
    },
    content: '<p>x</p>',
  });
  const bt = ed.getModule('block-toolbar');
  const btn = bt.blockToolbar.querySelector('[data-command=emoji]');
  assert.ok(btn, 'custom button rendered');
  assert.ok(btn.classList.contains('block-toolbar-btn'), 'same chrome as built-ins');
  btn.click();
  assert.equal(got.e, ed, 'onClick receives the editor');
  assert.ok(got.s, 'onClick receives the selection');
});

test('showOnFocus: bubble appears on focus and survives a collapsed caret (#75)', () => {
  const ed = new Editor(mount(), {
    autoFocus: false, modules: ['history', 'block-toolbar'],
    'block-toolbar': { showOnFocus: true, buttons: ['bold'] },
    content: '<p>hello</p>',
  });
  const bt = ed.getModule('block-toolbar');
  Object.defineProperty(bt.blockToolbar, 'offsetWidth', { value: 120, configurable: true });
  Object.defineProperty(bt.blockToolbar, 'offsetHeight', { value: 38, configurable: true });

  // jsdom never reports a contenteditable as document.activeElement, so pin
  // the focus predicate; the real behaviour is covered by the browser QA run.
  bt._editorFocused = () => true;

  ed.editor.dispatchEvent(new window.FocusEvent('focusin', { bubbles: true }));
  assert.equal(bt.isVisible, true, 'focus shows the bubble');

  // Collapse the selection inside the editor — the bubble must stay.
  const r = document.createRange();
  r.setStart(ed.editor.querySelector('p').firstChild, 2);
  r.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges(); sel.addRange(r);
  ed.editor.focus();
  bt.handleSelectionChange();
  assert.equal(bt.isVisible, true, 'collapsed caret keeps the bubble in focus mode');

  // Blur to an unrelated element hides it.
  const outside = document.createElement('button');
  document.body.appendChild(outside);
  ed.editor.dispatchEvent(new window.FocusEvent('focusout', { bubbles: true, relatedTarget: outside }));
  assert.equal(bt.isVisible, false, 'blur hides the bubble');
});
