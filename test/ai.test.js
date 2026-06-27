import './dom-setup.js';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Ai from '../lib/modules/ai.js';
import Editor from '../lib/core/editor.js';

// A minimal stand-in for the editor — the AI module only touches these.
function makeEditor(ai) {
  const root = document.createElement('div');
  const editable = document.createElement('div');
  root.appendChild(editable);
  document.body.appendChild(root);
  const events = {};
  return {
    options: { ai },
    wrapper: root,
    root,
    editor: editable,
    replaced: null,
    on(ev, fn) { (events[ev] = events[ev] || []).push(fn); },
    emit(ev, d) { (events[ev] || []).forEach((f) => f(d)); },
    getText() { return editable.textContent || ''; },
    insertText(t) { editable.textContent += t; },
    replaceSelection(t) { this.replaced = t; },
    focus() {},
  };
}

beforeEach(() => { document.body.innerHTML = ''; });

test('AI module is inert without a complete hook', () => {
  const ed = makeEditor({});
  const ai = new Ai(ed, {});
  assert.equal(ai.enabled, false);
  assert.equal(ed.ai, undefined);
  assert.equal(document.querySelector('.yjd-ai-bar'), null);
});

test('AI module builds the toolbar and default actions when enabled', () => {
  const ed = makeEditor({ complete: async () => 'x' });
  const ai = new Ai(ed, {});
  assert.equal(ai.enabled, true);
  assert.equal(ed.ai, ai);
  const bar = document.querySelector('.yjd-ai-bar');
  assert.ok(bar, 'toolbar portaled to body');
  assert.equal(bar.querySelectorAll('.yjd-ai-act').length, 6);
});

test('custom actions replace the defaults', () => {
  const ed = makeEditor({ complete: async () => 'x', actions: [{ id: 'tr', label: 'Translate', prompt: 'p' }] });
  new Ai(ed, {});
  assert.equal(document.querySelectorAll('.yjd-ai-act').length, 1);
});

test('run() calls the hook, emits lifecycle events, returns the result', async () => {
  const seen = [];
  const ed = makeEditor({
    complete: async (ctx) => { seen.push(ctx.action, ctx.text); return 'Bonjour'; },
  });
  ed.on('ai:start', (d) => seen.push('start:' + d.action));
  ed.on('ai:done', (d) => seen.push('done:' + d.result));
  const ai = new Ai(ed, {});
  const out = await ai.run('Translate to French', { text: 'Hello' });
  assert.equal(out, 'Bonjour');
  assert.equal(ai.lastResult, 'Bonjour');
  assert.deepEqual(seen, ['start:ask', 'ask', 'Hello', 'done:Bonjour']);
});

test('run() joins streamed chunks when the hook returns nothing', async () => {
  const ed = makeEditor({
    complete: async (ctx, onToken) => { onToken('Hel'); onToken('lo'); },
  });
  const ai = new Ai(ed, {});
  const out = await ai.run({ id: 'improve', label: 'Improve', prompt: 'p' }, { text: 't' });
  assert.equal(out, 'Hello');
});

test('a superseded run() does not clobber the newer result (stale-response guard)', async () => {
  let resolveOld;
  const oldPending = new Promise((r) => { resolveOld = r; });
  let call = 0;
  const ed = makeEditor({ complete: () => { call++; return call === 1 ? oldPending : 'NEW'; } });
  const done = [];
  ed.on('ai:done', (d) => done.push(d.result));
  const ai = new Ai(ed, {});
  const r1 = ai.run('first', { text: 't' });   // pends on oldPending
  const r2 = await ai.run('second', { text: 't' }); // supersedes, resolves NEW
  resolveOld('OLD');                                 // the stale one finally resolves
  const old = await r1;
  assert.equal(r2, 'NEW');
  assert.equal(old, '');                 // superseded request returns empty
  assert.equal(ai.lastResult, 'NEW');    // NOT overwritten by the stale OLD
  assert.deepEqual(done, ['NEW']);       // only the winner emits ai:done
});

test('closeBar emits ai:discard only when a request was actually shown', () => {
  const events = [];
  const ed = makeEditor({ complete: async () => 'x' });
  ed.on('ai:discard', () => events.push('discard'));
  const ai = new Ai(ed, {});
  ai.barOpen = true;            // opened from a selection, nothing generated
  ai.closeBar();
  assert.deepEqual(events, [], 'deselect without a result must not emit discard');
  ai.barOpen = true; ai._panelShown = true;   // a result/in-flight request existed
  ai.closeBar();
  assert.deepEqual(events, ['discard']);
});

test('run() surfaces errors via ai:error without throwing', async () => {
  let err = null;
  const ed = makeEditor({ complete: async () => { throw new Error('boom'); } });
  ed.on('ai:error', (d) => { err = d.error; });
  const ai = new Ai(ed, {});
  const out = await ai.run('x', { text: 't' });
  assert.equal(out, '');
  assert.equal(err.message, 'boom');
});

test('destroy() removes the portaled toolbar and the editor handle', () => {
  const ed = makeEditor({ complete: async () => 'x' });
  const ai = new Ai(ed, {});
  ai.destroy();
  assert.equal(document.querySelector('.yjd-ai-bar'), null);
  assert.equal(ed.ai, undefined);
});

/* ---- Editor selection primitives (routing only — no full editor boot) ---- */

test('getSelection() returns null when nothing is selected', () => {
  const div = document.createElement('div');
  const out = Editor.prototype.getSelection.call({ editor: div });
  assert.equal(out, null);
});

test('replaceSelection(asText) routes to insertText', () => {
  globalThis.__execCalls.length = 0;
  const div = document.createElement('div');
  Editor.prototype.replaceSelection.call(
    { getModule: () => null, focus() {}, onContentChange() {}, editor: div },
    'hello world',
    { asText: true }
  );
  const call = globalThis.__execCalls.at(-1);
  assert.deepEqual(call, ['insertText', false, 'hello world']);
});

test('replaceSelection(html) sanitizes and routes to insertHTML', () => {
  globalThis.__execCalls.length = 0;
  const div = document.createElement('div');
  Editor.prototype.replaceSelection.call(
    { getModule: () => null, focus() {}, onContentChange() {}, editor: div },
    '<b>hi</b><script>evil()</script>'
  );
  const call = globalThis.__execCalls.at(-1);
  assert.equal(call[0], 'insertHTML');
  assert.ok(!/script/i.test(call[2]), 'script stripped before insert');
  assert.ok(/<b>hi<\/b>/.test(call[2]));
});
