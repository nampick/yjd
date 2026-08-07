// First-open popover positioning.
//
// Regression suite for "the popover shows in the wrong place on the FIRST
// click": before layout has ever run, popup dimensions read 0/none and naive
// positioning drops the popover at a stale or fallback location. Every popover
// must (a) anchor to its trigger on the very first show and (b) produce the
// SAME position when hidden and re-shown with identical geometry.
import './dom-setup.js';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { calculatePopupPosition, setPopupPosition } from '../lib/utils/popup-helper.js';
import VideoPopup from '../lib/ui/video-popup.js';
import ImagePopup from '../lib/ui/image-popup.js';
import TagPopup from '../lib/ui/tag-popup.js';
import ImportPopup from '../lib/ui/import-popup.js';
import Ai from '../lib/modules/ai.js';

const rect = (left, top, width, height) => ({
  left, top, width, height,
  right: left + width, bottom: top + height,
  x: left, y: top,
  toJSON() { return this; }
});

/** A trigger button with a fixed, layout-independent geometry. */
function makeAnchor(x = 500, y = 100, w = 60, h = 30) {
  const el = document.createElement('button');
  document.body.appendChild(el);
  el.getBoundingClientRect = () => rect(x, y, w, h);
  return el;
}

beforeEach(() => { document.body.innerHTML = ''; });

/* ---------------- calculatePopupPosition (shared helper) ---------------- */

test('helper: first call anchors below the trigger', () => {
  const anchor = makeAnchor(500, 100, 60, 30);
  const popup = document.createElement('div');
  document.body.appendChild(popup);
  const pos = calculatePopupPosition(anchor, popup, { offsetY: 5, offsetX: 0 });
  assert.equal(pos.left, 500);
  assert.equal(pos.top, 135); // anchor.bottom (130) + offsetY
});

test('helper: identical geometry gives an identical position on re-show', () => {
  const anchor = makeAnchor(300, 40, 80, 30);
  const popup = document.createElement('div');
  document.body.appendChild(popup);
  const first = calculatePopupPosition(anchor, popup, { offsetY: 5 });
  setPopupPosition(popup, first);
  const second = calculatePopupPosition(anchor, popup, { offsetY: 5 });
  assert.deepEqual(second, first);
});

test('helper: clamps to the right viewport edge instead of overflowing', () => {
  // Popup dimensions fall back to 300x200 when nothing is measurable, so an
  // anchor hard against the right edge must pull the popup back inside.
  const anchor = makeAnchor(window.innerWidth - 20, 100, 20, 30);
  const popup = document.createElement('div');
  document.body.appendChild(popup);
  const pos = calculatePopupPosition(anchor, popup, { offsetY: 5 });
  assert.ok(pos.left + 300 <= window.innerWidth, `left ${pos.left} overflows`);
});

/* ------------------- form popovers (video/image/tag/import) ------------- */

const POPUPS = [
  ['video', () => new VideoPopup({}), (p) => p.popup],
  ['image', () => new ImagePopup({}), (p) => p.popup],
  ['tag', () => new TagPopup({}), (p) => p.popup],
  ['import', () => new ImportPopup({}), (p) => p.popup]
];

for (const [name, make, getEl] of POPUPS) {
  test(`${name} popup: first show() lands on the trigger`, () => {
    const anchor = makeAnchor(400, 60, 30, 30);
    const instance = make();
    const el = getEl(instance);
    instance.show(anchor);
    const left = parseFloat(el.style.left);
    const top = parseFloat(el.style.top);
    // Below the trigger (anchor.bottom + 5) and horizontally on it.
    assert.equal(top, 95, `${name}: top`);
    assert.equal(left, 400, `${name}: left`);
  });

  test(`${name} popup: hide + re-show gives the same position`, () => {
    const anchor = makeAnchor(400, 60, 30, 30);
    const instance = make();
    const el = getEl(instance);
    instance.show(anchor);
    const first = [el.style.left, el.style.top];
    instance.hide();
    instance.show(anchor);
    assert.deepEqual([el.style.left, el.style.top], first, name);
  });
}

/* ----------------------------- Ask AI bar ------------------------------- */

function makeAiEditor() {
  const wrapper = document.createElement('div');
  const editable = document.createElement('div');
  const pill = document.createElement('button');
  pill.className = 'ai-btn';
  wrapper.appendChild(pill);
  wrapper.appendChild(editable);
  document.body.appendChild(wrapper);
  // The pill sits top-right of the toolbar; the editor box spans far below.
  pill.getBoundingClientRect = () => rect(840, 18, 90, 30);
  editable.getBoundingClientRect = () => rect(100, 60, 800, 700);
  const events = {};
  return {
    options: { ai: { complete: async () => '' } },
    wrapper,
    root: wrapper,
    editor: editable,
    on(ev, fn) { (events[ev] = events[ev] || []).push(fn); },
    emit(ev, d) { (events[ev] || []).forEach((f) => f(d)); },
    getText() { return ''; },
    focus() {}
  };
}

test('ask AI: first open with no caret anchors to the toolbar pill, not the editor box', () => {
  const editor = makeAiEditor();
  const ai = new Ai(editor, editor.options.ai);
  ai.openFromToolbar();
  const top = parseFloat(ai.bar.style.top);
  const left = parseFloat(ai.bar.style.left);
  // Under the pill: pill.bottom (48) + 8. The old editor-box fallback put it
  // at editor.bottom (760) + 8 — assert we are nowhere near that.
  assert.equal(top, 56, 'anchored under the pill');
  assert.ok(top < 200, 'must not fall to the editor box bottom');
  // Right-aligned to the pill (bar width is 0 under jsdom → left == pill.right).
  assert.equal(left, 930);
});

test('ask AI: reopen with unchanged geometry gives the same position', () => {
  const editor = makeAiEditor();
  const ai = new Ai(editor, editor.options.ai);
  ai.openFromToolbar();
  const first = [ai.bar.style.left, ai.bar.style.top];
  ai.closeBar();
  ai.openFromToolbar();
  assert.deepEqual([ai.bar.style.left, ai.bar.style.top], first);
});
