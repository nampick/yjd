import './dom-setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Editor from '../lib/core/editor.js';
import registry from '../lib/core/registry.js';
import Toolbar from '../lib/modules/toolbar.js';
import List from '../lib/formats/list.js';
import TextAlign from '../lib/formats/text-align.js';

registry.register('modules/toolbar', Toolbar, true);
registry.register('formats/list', List, true);
registry.register('formats/text-align', TextAlign, true);

function mount() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  return host;
}

const TOOLBAR = { toolbar: ['list', 'text-align'] };

function buttons(ed) {
  const tb = ed.getModule('toolbar');
  return { list: tb.getButton('list'), align: tb.getButton('text-align') };
}

test('#87: list and align titles go through options.strings', () => {
  const ed = new Editor(mount(), {
    ...TOOLBAR,
    strings: { 'list.bullet': 'Liste à puces', 'align.center': 'Centrer' }
  });
  const { list, align } = buttons(ed);
  assert.ok(list && align, 'toolbar has list + align buttons');

  List.updateToolbarButtonIcon('bullet', ed.instanceId);
  TextAlign.updateToolbarButtonIcon('center', ed.instanceId);
  assert.equal(list.title, 'Liste à puces');
  assert.equal(align.title, 'Centrer');
});

test('#87: English titles without strings', () => {
  const ed = new Editor(mount(), { ...TOOLBAR });
  const { list, align } = buttons(ed);
  List.updateToolbarButtonIcon('ordered', ed.instanceId);
  TextAlign.updateToolbarButtonIcon('right', ed.instanceId);
  assert.equal(list.title, 'Numbered List');
  assert.equal(align.title, 'Align Right');
});

test('#87: initial generic titles use list.head / align.head before any click', () => {
  const ed = new Editor(mount(), {
    ...TOOLBAR,
    strings: { 'list.head': 'Listes', 'align.head': 'Alignement' }
  });
  const { list, align } = buttons(ed);
  assert.equal(list.title, 'Listes');
  assert.equal(align.title, 'Alignement');
  assert.equal(list.getAttribute('aria-label'), 'Listes');
  assert.equal(align.getAttribute('aria-label'), 'Alignement');

  // Format construction path (lazy, on first use) keeps the translated title.
  list.title = align.title = '';
  List.createForEditor(ed.instanceId);
  TextAlign.createForEditor(ed.instanceId);
  assert.equal(list.title, 'Listes');
  assert.equal(align.title, 'Alignement');
});
