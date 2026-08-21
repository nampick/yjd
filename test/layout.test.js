import './dom-setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Editor from '../lib/core/editor.js';
import registry from '../lib/core/registry.js';
import Toolbar from '../lib/modules/toolbar.js';
import Sections from '../lib/modules/sections.js';
import Schema from '../lib/modules/schema.js';
import Variables from '../lib/modules/variables.js';
import Blocks from '../lib/modules/blocks.js';
import BlockHandles from '../lib/modules/block-handles.js';
import { htmlToEmail } from '../lib/email.js';

registry.register('modules/toolbar', Toolbar, true);
registry.register('modules/sections', Sections, true);
registry.register('modules/schema', Schema, true);
registry.register('modules/variables', Variables, true);
registry.register('modules/blocks', Blocks, true);
registry.register('modules/block-handles', BlockHandles, true);

function mount() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  return host;
}

/* ------------------------------ #84 sections ------------------------------ */

function secRig(opts = {}) {
  const ed = new Editor(mount(), {
    autoFocus: false,
    modules: ['toolbar', 'history', 'sections', 'block-handles'],
    ...opts,
  });
  return { ed, secs: ed.getModule('sections') };
}

test('sections: insert, style round-trip, implicit default section (#84)', () => {
  const { ed, secs } = secRig();
  ed.setContent('<p>plain block outside any section</p>');
  const sec = secs.insert({ background: '#f6f7f8', padding: 20, radius: 12 });
  assert.ok(sec.classList.contains('yjd-section'));
  assert.equal(sec.querySelectorAll(':scope > .yjd-col').length, 1);
  assert.equal(secs.styleOf(sec).padding, 20);

  const out = ed.getContent();
  assert.ok(out.includes('data-style'), 'style serialized');
  ed.setContent(out);
  const sec2 = ed.editor.querySelector('.yjd-section');
  assert.equal(secs.styleOf(sec2).background, '#f6f7f8', 'style survives round-trip');
  assert.ok(ed.editor.querySelector(':scope > p'), 'implicit default blocks unchanged');
});

test('sections: column split 1→3 and merge back (#84)', () => {
  const { ed, secs } = secRig();
  const sec = secs.insert({});
  sec.querySelector('.yjd-col').innerHTML = '<p>one</p><p>two</p>';
  secs.setColumns(sec, 3);
  assert.equal(sec.querySelectorAll(':scope > .yjd-col').length, 3);
  // Move a block into column 3, then merge back to 1 — nothing may be lost.
  const col3 = sec.querySelectorAll(':scope > .yjd-col')[2];
  col3.appendChild(sec.querySelector('.yjd-col p'));
  secs.setColumns(sec, 1);
  const col = sec.querySelector(':scope > .yjd-col');
  assert.equal(col.querySelectorAll('p').length, 2, 'blocks merged back, none lost');
});

test('sections: nested sections are unwrapped on load (#84)', () => {
  const { ed } = secRig();
  ed.setContent('<div class="yjd-section"><div class="yjd-col"><div class="yjd-section"><div class="yjd-col"><p>inner</p></div></div></div></div>');
  assert.equal(ed.editor.querySelectorAll('.yjd-section').length, 1, 'no nesting survives');
  assert.ok(ed.editor.querySelector('.yjd-section p'), 'inner content kept');
});

test('sections: block-handles sees blocks inside columns as draggable (#84)', () => {
  const { ed, secs } = secRig();
  ed.setContent('<p>root block</p>');
  const sec = secs.insert({});
  sec.querySelector('.yjd-col').innerHTML = '<p>col block</p>';
  const bh = ed.getModule('block-handles');
  const all = bh._allBlocks();
  const texts = all.map((b) => b.textContent.trim()).filter(Boolean);
  assert.ok(texts.includes('root block') && texts.includes('col block'),
    'both root and column blocks are draggable');
  assert.ok(all.includes(sec), 'the section itself drags as one unit');
});

test('sections: email export compiles bands and stacking columns (#84/#82)', () => {
  const html = '<div class="yjd-section" data-style=\'{"background":"#eef0ff","padding":24,"radius":8}\'>' +
    '<div class="yjd-col"><p>left</p></div><div class="yjd-col"><p>right</p></div></div>';
  const out = htmlToEmail(html, {});
  assert.ok(out.includes('background:#eef0ff') && out.includes('padding:24px'));
  assert.ok(out.includes('max-width:50%'), 'two columns split 50/50');
  assert.ok(out.includes('display:inline-block'), 'columns stack on narrow clients');
  assert.ok(!/yjd-section|yjd-col/.test(out), 'no editor classes leak');
});

/* ------------------------------ #81 schema ------------------------------ */

const SCHEMA_OPTS = {
  variables: { trigger: '{', items: { shopName: { label: 'Shop name' } } },
  blocks: { cta: { label: 'Button', token: '{{cta}}' } },
  schema: {
    require: ['block:cta', 'variable:shopName'],
    allowTags: ['h1', 'h2', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'br', 'blockquote', 'hr', 'div', 'span'],
    maxLength: 100,
  },
};

test('schema: validate() reports missing requirements and clears when satisfied (#81)', () => {
  const ed = new Editor(mount(), { autoFocus: false, ...SCHEMA_OPTS });
  ed.setContent('<p>no atoms here</p>');
  let r = ed.validate();
  assert.equal(r.valid, false);
  assert.deepEqual(r.violations.map((v) => v.rule), ['require', 'require']);

  ed.setContent('<p>Hi {shopName}</p><p>{{cta}}</p>');
  r = ed.validate();
  assert.equal(r.valid, true, JSON.stringify(r.violations));
});

test('schema: disallowed tags are flattened on setContent (#81)', () => {
  const ed = new Editor(mount(), { autoFocus: false, ...SCHEMA_OPTS });
  ed.setContent('<p>Hi {shopName}</p><p>{{cta}}</p><table><tr><td>cell text</td></tr></table>');
  assert.equal(ed.editor.querySelector('table'), null, 'table did not enter the document');
  assert.ok(ed.getText().includes('cell text'), 'its text degraded gracefully');
  assert.equal(ed.validate().valid, true);
});

test('schema: maxLength violation (#81)', () => {
  const ed = new Editor(mount(), { autoFocus: false, ...SCHEMA_OPTS });
  ed.setContent('<p>Hi {shopName}</p><p>{{cta}}</p><p>' + 'x'.repeat(200) + '</p>');
  const r = ed.validate();
  assert.equal(r.valid, false);
  assert.ok(r.violations.some((v) => v.rule === 'maxLength'));
});

test('schema: warning strip renders on violation and clears (#81)', async () => {
  const ed = new Editor(mount(), { autoFocus: false, ...SCHEMA_OPTS });
  ed.setContent('<p>missing everything</p>');
  const schema = ed.getModule('schema');
  schema._check();
  assert.ok(ed.wrapper.querySelector('.yjd-schema-warn'), 'strip rendered');
  assert.ok(ed.wrapper.querySelector('.yjd-schema-warn-msg').textContent.includes('Button'));

  ed.setContent('<p>Hi {shopName}</p><p>{{cta}}</p>');
  schema._check();
  assert.equal(ed.wrapper.querySelector('.yjd-schema-warn'), null, 'strip cleared');
});

/* ------------------------------ #85 tokens ------------------------------ */

test('theme tokens: bgToken re-resolves after a re-brand (#85)', async () => {
  const { default: ButtonBlock } = await import('../lib/modules/button-block.js');
  registry.register('modules/button', ButtonBlock, true);
  const mk = (brand) => new Editor(mount(), {
    autoFocus: false, modules: ['toolbar', 'history', 'button'],
    theme: { colors: { brand } },
  });
  const ed1 = mk('#25d366');
  const wrap = ed1.insertButton({ label: 'Go', href: 'https://x.test' });
  const a = wrap.querySelector('a.yjd-button');
  const props = JSON.parse(a.getAttribute('data-props'));
  props.bgToken = 'brand';
  a.setAttribute('data-props', JSON.stringify(props));
  const saved = ed1.getContent();

  const ed2 = mk('#ff5533'); // re-branded host
  ed2.setContent(saved);
  const a2 = ed2.editor.querySelector('a.yjd-button');
  assert.equal(JSON.parse(a2.getAttribute('data-props')).bg, '#ff5533',
    'token name re-resolves through the new theme');
  const email = htmlToEmail(ed2.getContent(), { colors: { brand: '#ff5533' } });
  assert.ok(email.includes('#ff5533'), 'email compile resolves the token');
});
