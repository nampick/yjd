import './dom-setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Editor from '../lib/core/editor.js';
import registry from '../lib/core/registry.js';
import Toolbar from '../lib/modules/toolbar.js';
import BlockToolbar from '../lib/modules/block-toolbar.js';

registry.register('modules/toolbar', Toolbar, true);
registry.register('modules/block-toolbar', BlockToolbar, true);

const CSS = readFileSync(new URL('../lib/styles.css', import.meta.url), 'utf8');
const BLOCK_TOOLBAR_SRC = readFileSync(new URL('../lib/modules/block-toolbar.js', import.meta.url), 'utf8');
const TABLE_TOOLBAR_SRC = readFileSync(new URL('../lib/modules/table-toolbar.js', import.meta.url), 'utf8');

/** All rules as { selector, body } (comments stripped, at-rule preludes skipped). */
function rules(css) {
  const out = [];
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(src))) out.push({ selector: m[1].trim().replace(/\s+/g, ' '), body: m[2] });
  return out;
}

// Floating surfaces: selection bubble, table toolbar, pickers, select popups,
// menus, popups.
const FLOATING = /block-toolbar|table-toolbar|color-picker|select-popup|picker-popup|-popup\b|yjd-slash-menu|yjd-mention-menu|rte-add-menu|yjd-find-replace|yjd-image-align-bar|yjd-table-profile|yjd-comment-pop|link-bar|yjd-toast/;

test('floating surfaces never paint with the editable area background (--rte-bg)', () => {
  const offenders = rules(CSS)
    .filter((r) => FLOATING.test(r.selector) && /var\(--rte-bg\b/.test(r.body))
    .map((r) => r.selector);
  assert.deepEqual(offenders, []);
});

test('the bubble / table toolbar / colour picker / select popups use --rte-popup-bg', () => {
  const POP = 'var(--rte-popup-bg, var(--rte-chrome, #fff))';
  for (const sel of ['.yjd-rich-editor .block-toolbar-container', '.yjd-rich-editor .table-toolbar-container',
    '.yjd-rich-editor .color-picker-popup', '.yjd-rich-editor .custom-select-popup']) {
    const hit = rules(CSS).find((r) => r.selector.split(',').map((s) => s.trim()).includes(sel) && /background:/.test(r.body));
    assert.ok(hit, `rule for ${sel}`);
    assert.ok(hit.body.includes(POP), `${sel} background uses --rte-popup-bg`);
  }
});

test('--rte-popup-bg has a solid default in light and dark themes', () => {
  const root = rules(CSS).find((r) => r.selector === ':root' && /--rte-popup-bg:/.test(r.body));
  assert.ok(root, ':root declares --rte-popup-bg');
  assert.match(root.body, /--rte-popup-bg:\s*#[0-9a-f]{6}/i);
  const dark = rules(CSS).find((r) => r.selector.includes('.yjd-rich-editor[data-theme="dark"]') && /--rte-popup-bg:/.test(r.body));
  assert.ok(dark, 'dark theme declares its own --rte-popup-bg');
  assert.match(dark.body, /--rte-popup-bg:\s*#[0-9a-f]{6}/i);
});

test('the frame background has a real fallback', () => {
  assert.doesNotMatch(CSS, /var\(--rte-bg, var\(--rte-bg\)\)/);
  const frame = rules(CSS).find((r) => r.selector === '.yjd-rich-editor' && /background:/.test(r.body));
  assert.match(frame.body, /background:\s*var\(--rte-bg, #fff\)/);
});

test('bubble and table-toolbar arrows use the popup background', () => {
  for (const src of [BLOCK_TOOLBAR_SRC, TABLE_TOOLBAR_SRC]) {
    assert.doesNotMatch(src, /solid var\(--rte-bg/);
  }
  const host = document.createElement('div');
  document.body.appendChild(host);
  const ed = new Editor(host, {
    autoFocus: false,
    modules: ['toolbar', 'block-toolbar'],
    toolbar: ['undo'],
    content: '<p>hello bubble</p>',
  });
  const bt = ed.getModule('block-toolbar');
  Object.defineProperty(bt.blockToolbar, 'offsetWidth', { value: 200, configurable: true });
  Object.defineProperty(bt.blockToolbar, 'offsetHeight', { value: 38, configurable: true });
  Object.defineProperty(ed.wrapper, 'offsetWidth', { value: 600, configurable: true });
  ed.wrapper.getBoundingClientRect = () => ({ top: 300, left: 40, bottom: 360, right: 640, width: 600, height: 60, x: 40, y: 300 });
  bt.ensureToolbarInViewport(300, 10, 28);
  const arrow = bt.blockToolbar.querySelector('.block-toolbar-arrow');
  assert.ok(arrow, 'arrow exists');
  const style = arrow.getAttribute('style') || '';
  assert.match(style, /--rte-popup-bg/);
  assert.doesNotMatch(style, /var\(--rte-bg/);
});
