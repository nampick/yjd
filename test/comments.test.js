// Comment threads (design section 09 — Review): replies, resolve/unresolve
// with mark removal, orphan survival, and the serializable thread model.
import './dom-setup.js';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import SidePanel from '../lib/modules/side-panel.js';

function makeEditor() {
  const wrapper = document.createElement('div');
  const area = document.createElement('div');
  area.className = 'rich-editor-area';
  area.innerHTML = '<p>The export pipeline writes HTML first then re-parses it.</p>';
  wrapper.appendChild(area);
  document.body.appendChild(wrapper);
  const events = {};
  const ed = {
    options: { sidePanel: true },
    wrapper,
    editor: area,
    on(ev, fn) { (events[ev] = events[ev] || []).push(fn); },
    emit(ev, d) { (events[ev] || []).forEach((f) => f(d)); },
    getModule() { return null; },
    onContentChange() {},
    _events: events
  };
  return ed;
}

function selectText(area, from, to) {
  const tn = area.querySelector('p').firstChild;
  const r = document.createRange();
  r.setStart(tn, from);
  r.setEnd(tn, to);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(r);
}

beforeEach(() => { document.body.innerHTML = ''; });

test('addComment wraps the selection and stores a thread with empty replies', () => {
  const ed = makeEditor();
  const panel = new SidePanel(ed, {});
  selectText(ed.editor, 4, 10);
  const id = panel.addComment('First note', 'Linh');
  assert.ok(id);
  const mark = ed.editor.querySelector(`[data-comment-id="${id}"]`);
  assert.ok(mark, 'mark wraps the range');
  const c = panel.comments[0];
  assert.deepEqual([c.author, c.body, c.resolved, c.replies.length], ['Linh', 'First note', false, 0]);
});

test('addReply appends to the thread and emits comment:reply', () => {
  const ed = makeEditor();
  const panel = new SidePanel(ed, {});
  selectText(ed.editor, 4, 10);
  const id = panel.addComment('Q?', 'Linh');
  let event = null;
  ed.on('comment:reply', (d) => { event = d; });
  const r = panel.addReply(id, 'A.', 'Duc');
  assert.equal(r.body, 'A.');
  assert.equal(panel.comments[0].replies.length, 1);
  assert.equal(event.id, id);
  assert.equal(panel.addReply(id, '   '), null, 'blank replies rejected');
});

test('resolve clears the highlight but keeps the thread; unresolve restores state', () => {
  const ed = makeEditor();
  const panel = new SidePanel(ed, {});
  selectText(ed.editor, 4, 10);
  const id = panel.addComment('Fix this', 'Mai');
  panel.resolveComment(id, 'Duc');
  assert.equal(ed.editor.querySelector(`[data-comment-id="${id}"]`), null, 'mark unwrapped');
  assert.equal(panel.comments[0].resolved, true);
  assert.equal(panel.comments[0].resolvedBy, 'Duc');
  assert.ok(ed.editor.textContent.includes('export pipeline'), 'text survives unwrap');
  panel.unresolveComment(id);
  assert.equal(panel.comments[0].resolved, false);
});

test('a thread whose mark is deleted renders as orphaned, not dropped', () => {
  const ed = makeEditor();
  const panel = new SidePanel(ed, {});
  selectText(ed.editor, 4, 10);
  const id = panel.addComment('Anchored', 'Linh');
  ed.editor.querySelector(`[data-comment-id="${id}"]`).remove();
  panel.activeTab = 'comments';
  panel._renderBody();
  assert.equal(panel.comments.length, 1, 'thread survives');
  assert.ok(panel.body.querySelector('.yjd-c-orphan'), 'orphan notice rendered');
});

test('getComments/setComments round-trip the full thread model', () => {
  const ed = makeEditor();
  const panel = new SidePanel(ed, {});
  selectText(ed.editor, 4, 10);
  const id = panel.addComment('Persist me', 'Linh');
  panel.addReply(id, 'Reply', 'Duc');
  const dump = ed.getComments();
  const ed2 = makeEditor();
  const panel2 = new SidePanel(ed2, {});
  ed2.setComments(dump);
  assert.equal(panel2.comments[0].replies.length, 1);
  assert.equal(panel2.comments[0].body, 'Persist me');
});
