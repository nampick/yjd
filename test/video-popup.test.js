import './dom-setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import VideoPopup from '../lib/ui/video-popup.js';

// jsdom has no FileReader in the node global scope — shim enough for previews.
globalThis.FileReader = class {
  readAsDataURL() {
    setTimeout(() => this.onload({ target: { result: 'data:video/mp4;base64,QQ==' } }), 0);
  }
};

function makeEditor(extra = {}) {
  return { options: {}, focus() {}, ...extra };
}

test('popup file insert routes through editor.insertVideoFile, not raw base64', async () => {
  let routed = null;
  let rawInserted = null;
  const ed = makeEditor({
    options: { video: { upload: async () => 'https://cdn.example.com/v.mp4' } },
    insertVideoFile(f) { routed = f; },
  });
  const vp = new VideoPopup({ editor: ed, onVideoInsert: (src) => { rawInserted = src; } });
  const file = { name: 'clip.mp4', type: 'video/mp4' };
  vp.selectedVideoFile = file;
  vp.selectedVideoSrc = 'data:video/mp4;base64,AAAA';
  await vp.insertVideo();
  assert.equal(routed && routed.name, 'clip.mp4', 'the original File must reach insertVideoFile');
  assert.equal(rawInserted, null, 'the base64 data URL must not be inserted directly');
});

test('popup file insert falls back to data-URL insert when insertVideoFile is unavailable', async () => {
  let rawInserted = null;
  const vp = new VideoPopup({ editor: makeEditor(), onVideoInsert: (src) => { rawInserted = src; } });
  vp.selectedVideoFile = { name: 'clip.mp4', type: 'video/mp4' };
  vp.selectedVideoSrc = 'data:video/mp4;base64,AAAA';
  await vp.insertVideo();
  assert.equal(rawInserted, 'data:video/mp4;base64,AAAA', 'core builds keep the old base64 path');
});

test('handleFileSelect keeps the original File for the upload path', async () => {
  const vp = new VideoPopup({ editor: makeEditor({ insertVideoFile() {} }) });
  const file = { name: 'clip.mp4', type: 'video/mp4' };
  await vp.handleFileSelect({ target: { files: [file] } });
  assert.equal(vp.selectedVideoFile, file, 'the File must be retained, not just its data URL');
});
