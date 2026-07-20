import './dom-setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Editor from '../lib/core/editor.js';

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
