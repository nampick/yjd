import './dom-setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import PromptAttachments from '../lib/ui/prompt-attachments.js';

// jsdom doesn't implement object URLs — shim them so video previews work.
let created = [];
let revoked = [];
globalThis.URL.createObjectURL = (file) => {
  const url = `blob:mock/${created.length}`;
  created.push({ url, file });
  return url;
};
globalThis.URL.revokeObjectURL = (url) => { revoked.push(url); };

function makeEditor() {
  const wrapper = document.createElement('div');
  const bar = document.createElement('div');
  bar.className = 'rich-editor-toolbar-container';
  wrapper.appendChild(bar);
  document.body.appendChild(wrapper);
  return {
    wrapper,
    options: {},
    _events: [],
    emit(name, payload) { this._events.push([name, payload]); },
    _syncPromptSendState() {},
  };
}

test('video attachment renders an inline <video> preview, not just a filename', async () => {
  created = []; revoked = [];
  const pa = new PromptAttachments(makeEditor());
  await pa.add({ name: 'clip.mp4', type: 'video/mp4' }, 'video');

  const chip = pa.tray.querySelector('.rte-attach-video');
  assert.ok(chip, 'a video chip should be rendered');
  const video = chip.querySelector('video');
  assert.ok(video, 'the chip should contain a <video> element');
  assert.equal(video.getAttribute('src'), 'blob:mock/0', 'video should use the object-URL preview');
  assert.equal(created.length, 1, 'exactly one object URL created for the preview');
});

test('removing a video attachment revokes its preview object URL', async () => {
  created = []; revoked = [];
  const pa = new PromptAttachments(makeEditor());
  await pa.add({ name: 'clip.mp4', type: 'video/mp4' }, 'video');
  const id = pa.items[0].id;
  pa.remove(id);
  assert.deepEqual(revoked, ['blob:mock/0'], 'the preview URL should be revoked on remove');
});

test('getAll() still reports undefined src for a not-yet-uploaded video (preview URL is not leaked as the value)', async () => {
  created = []; revoked = [];
  const pa = new PromptAttachments(makeEditor());
  await pa.add({ name: 'clip.mp4', type: 'video/mp4' }, 'video');
  const all = pa.getAll();
  assert.equal(all.length, 1);
  assert.equal(all[0].src, undefined, 'preview object URL must not become the returned src');
});
