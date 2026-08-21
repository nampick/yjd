import './dom-setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Editor from '../lib/core/editor.js';
import registry from '../lib/core/registry.js';
import Toolbar from '../lib/modules/toolbar.js';
import Variables from '../lib/modules/variables.js';
import Blocks from '../lib/modules/blocks.js';
import Ai from '../lib/modules/ai.js';

registry.register('modules/toolbar', Toolbar, true);
registry.register('modules/variables', Variables, true);
registry.register('modules/blocks', Blocks, true);
registry.register('modules/ai', Ai, true);

function mount() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  return host;
}

const VARS = {
  trigger: '{',
  items: {
    shopName: { label: 'Shop name', sample: 'acme-store' },
    month: { label: 'Month', sample: 'August' },
  },
};

const BLOCKS = {
  stats: { label: 'Stats grid', icon: '📊', description: 'Views · clicks', token: '{{stats}}' },
  cta: { label: 'Button', icon: '🔘', token: '{{cta:$arg}}', arg: { label: 'Button label', default: 'Open the app' } },
};

/* ------------------------------ #78 variables ------------------------------ */

test('variables: setContent upgrades declared tokens; getContent round-trips (#78)', () => {
  const ed = new Editor(mount(), { autoFocus: false, variables: VARS });
  ed.setContent('<p>Hi {shopName}, your {month} report — {unknown} stays.</p>');

  const chips = ed.editor.querySelectorAll('.yjd-var');
  assert.equal(chips.length, 2, 'two declared tokens became chips');
  assert.equal(chips[0].getAttribute('data-token'), '{shopName}');
  assert.equal(chips[0].getAttribute('contenteditable'), 'false', 'chips are atomic');
  assert.ok(!ed.editor.textContent.includes('{unknown') === false, 'undeclared token stays text');

  const out = ed.getContent();
  assert.ok(out.includes('{shopName}') && out.includes('{month}'), 'raw tokens serialized');
  assert.ok(!out.includes('yjd-var'), 'no chip markup in serialized content');

  // Round-trip stability
  ed.setContent(out);
  assert.equal(ed.getContent(), out, 'setContent(getContent()) is stable');
});

test('variables: getText and preview mode (#78)', () => {
  const ed = new Editor(mount(), { autoFocus: false, variables: VARS });
  ed.setContent('<p>Hi {shopName}!</p>');
  assert.equal(ed.getText(), 'Hi {shopName}!');

  ed.previewVariables(true);
  const chip = ed.editor.querySelector('.yjd-var');
  assert.equal(chip.textContent, 'acme-store', 'preview shows the sample');
  assert.equal(ed.editor.getAttribute('contenteditable'), 'false', 'edit-locked in preview');

  ed.previewVariables(false);
  assert.equal(chip.textContent, '{shopName}', 'token restored');
  assert.equal(ed.editor.getAttribute('contenteditable'), 'true');
});

/* ------------------------------ #79 blocks ------------------------------ */

test('blocks: token paragraphs upgrade to cards and round-trip byte-for-byte (#79)', () => {
  const ed = new Editor(mount(), { autoFocus: false, blocks: BLOCKS });
  ed.setContent('<p>Intro</p><p>{{stats}}</p><p>{{cta:Try now}}</p><p>{{nope}}</p>');

  const cards = ed.editor.querySelectorAll('.yjd-slot');
  assert.equal(cards.length, 2, 'registered tokens became cards; {{nope}} did not');
  assert.equal(cards[0].getAttribute('data-token'), '{{stats}}');
  assert.equal(cards[1].getAttribute('data-token'), '{{cta:Try now}}', 'arg captured');
  assert.equal(cards[1].querySelector('.yjd-slot-arg-input').value, 'Try now');

  const out = ed.getContent();
  assert.ok(out.includes('<p>{{stats}}</p>'), 'card serializes to its token paragraph');
  assert.ok(out.includes('{{cta:Try now}}'), 'arg serialized byte-for-byte');
  assert.ok(out.includes('{{nope}}'), 'unregistered token untouched');
  assert.ok(!out.includes('yjd-slot'), 'no card chrome in output');

  ed.setContent(out);
  assert.equal(ed.getContent(), out, 'round-trip stable');
});

test('blocks: arg input edits update the serialized token (#79)', () => {
  const ed = new Editor(mount(), { autoFocus: false, blocks: BLOCKS });
  ed.setContent('<p>{{cta:Open the app}}</p>');
  const input = ed.editor.querySelector('.yjd-slot-arg-input');
  input.value = 'Finish setup';
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.ok(ed.getContent().includes('{{cta:Finish setup}}'));
});

test('blocks + variables appear in the slash menu (#78/#79)', async () => {
  const { default: SlashMenu } = await import('../lib/modules/slash-menu.js');
  registry.register('modules/slash-menu', SlashMenu, true);
  const ed = new Editor(mount(), {
    autoFocus: false, variables: VARS, blocks: BLOCKS,
    modules: ['toolbar', 'history', 'slash-menu', 'variables', 'blocks'],
  });
  const sm = ed.getModule('slash-menu');
  const ids = sm.commands.map((c) => c.id);
  assert.ok(ids.includes('block:stats') && ids.includes('block:cta'), 'block entries listed');
  assert.ok(ids.includes('variable'), 'variable picker entry listed');
  const stats = sm.commands.find((c) => c.id === 'block:stats');
  assert.equal(stats.iconText, '📊', 'emoji icon carried through');
  stats.run();
  assert.ok(ed.editor.querySelector('.yjd-slot[data-slot=stats]'), 'slash insert works');
});

/* ------------------------------ #80 AI safety ------------------------------ */

function aiRig(extra = {}) {
  const ed = new Editor(mount(), {
    autoFocus: false, variables: VARS, blocks: BLOCKS,
    ai: { complete: async () => 'x', ...extra },
  });
  return { ed, ai: ed.getModule('ai') };
}

test('AI: placeholders encode to sentinels and ctx lists them (#80)', async () => {
  let ctxSeen = null;
  const { ed, ai } = aiRig({
    complete: async (ctx) => { ctxSeen = ctx; return ctx.text; },
  });
  ed.setContent('<p>Hello {shopName} in {month}</p>');
  const r = document.createRange();
  r.selectNodeContents(ed.editor.querySelector('p'));
  const sel = window.getSelection();
  sel.removeAllRanges(); sel.addRange(r);
  ai.savedRange = r.cloneRange();

  const result = await ai.run('improve');
  assert.ok(ctxSeen.text.includes('⟦v1⟧') && ctxSeen.text.includes('⟦v2⟧'),
    'chips became sentinels in ctx.text');
  assert.equal(ctxSeen.placeholders.length, 2);
  assert.equal(ctxSeen.placeholders[0].name, 'shopName');
  assert.ok(result.includes('{shopName}') && result.includes('{month}'),
    'sentinels decoded back to tokens in the result');
});

test('AI: restore policy re-appends dropped placeholders (#80)', async () => {
  const { ed, ai } = aiRig({ complete: async () => 'Rewritten without any tokens.' });
  ed.setContent('<p>Hello {shopName}</p>');
  const r = document.createRange();
  r.selectNodeContents(ed.editor.querySelector('p'));
  ai.savedRange = r.cloneRange();
  const result = await ai.run('improve');
  assert.ok(result.includes('{shopName}'), 'dropped token re-appended (restore default)');
});

test('AI: reject policy discards the run (#80)', async () => {
  const { ed, ai } = aiRig({ complete: async () => 'No tokens here.', placeholders: 'reject' });
  ed.setContent('<p>Hello {shopName}</p>');
  const r = document.createRange();
  r.selectNodeContents(ed.editor.querySelector('p'));
  ai.savedRange = r.cloneRange();
  let rejected = null;
  ed.on('ai:rejected', (d) => { rejected = d; });
  const result = await ai.run('improve');
  assert.equal(result, '', 'run rejected');
  assert.deepEqual(rejected.missing, ['{shopName}']);
});

test('AI: runDocument streams a whole-document rewrite and re-chips atoms (#80)', async () => {
  const { ed, ai } = aiRig({
    complete: async (ctx, onToken) => {
      assert.equal(ctx.action, 'document');
      const out = 'New intro. ' + ctx.text; // keeps the sentinels
      for (const w of out.split(/(?<= )/)) onToken(w);
    },
  });
  ed.setContent('<p>Hello {shopName}</p>');
  // jsdom's execCommand is a no-op recorder, so streamInto can't mutate the
  // DOM here — emulate the sink and let commit land the streamed text. The
  // real DOM path is covered by the browser QA run.
  const appended = [];
  ed.streamInto = () => ({
    append: (t) => appended.push(t),
    commit: () => {
      ed.editor.innerHTML = '<p>' + appended.join('').replace(/\n/g, '</p><p>') + '</p>';
    },
    cancel: () => {},
  });
  const result = await ai.runDocument({ prompt: 'shorter' });
  assert.ok(result.includes('{shopName}'), 'placeholder survived the rewrite');
  assert.ok(appended.join('').includes('New intro.'), 'response streamed into the sink');
  assert.ok(!appended.join('').includes('⟦'), 'no sentinel ever streams into the document');
  assert.ok(ed.getText().includes('New intro.'), 'document replaced on commit');
  assert.ok(ed.editor.querySelector('.yjd-var[data-var=shopName]'),
    'token re-chipped after the rewrite');
});
