import './dom-setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Editor from '../lib/core/editor.js';

const CSS = readFileSync(new URL('../lib/styles.css', import.meta.url), 'utf8');

function mount() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  return host;
}

/** Body of the first `@media (max-width: 849px)` block. */
function mobileBlock(css) {
  const start = css.indexOf('@media (max-width: 849px)');
  assert.ok(start !== -1, 'responsive block present');
  let depth = 0;
  for (let i = css.indexOf('{', start); i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return css.slice(start, i + 1);
  }
  throw new Error('unterminated media block');
}

test('#86: minHeight lands on the wrapper as --rte-area-min-height', () => {
  const ed = new Editor(mount(), { height: 'auto', minHeight: 52 });
  assert.equal(ed.wrapper.style.getPropertyValue('--rte-area-min-height'), '52px');
  assert.equal(ed.wrapper.style.minHeight, '52px');
});

test('#86: fixed height and maxHeight are exposed as area variables', () => {
  const ed = new Editor(mount(), { height: 320, maxHeight: '60vh' });
  assert.equal(ed.wrapper.style.getPropertyValue('--rte-area-min-height'), '320px');
  assert.equal(ed.wrapper.style.getPropertyValue('--rte-area-max-height'), '60vh');
});

test('#86: the responsive area rule reads the variables with :where() specificity', () => {
  const block = mobileBlock(CSS);
  const rule = block.match(/:where\(\.yjd-rich-editor\) \.rich-editor-area \{([^}]*)\}/);
  assert.ok(rule, 'responsive area rule uses :where(.yjd-rich-editor)');
  assert.match(rule[1], /min-height:\s*var\(--rte-area-min-height,\s*150px\)/);
  assert.match(rule[1], /font-size:\s*var\(--rte-area-font-size,\s*16px\)/);
  // No .rich-editor-area rule in the block keeps the specific frame class.
  assert.doesNotMatch(block, /(^|[\s,])\.yjd-rich-editor \.rich-editor-area/m);
});
