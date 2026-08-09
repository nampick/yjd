import './dom-setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import ImagePopup from '../lib/ui/image-popup.js';

// jsdom has no FileReader in the node global scope — shim enough for previews.
globalThis.FileReader = class {
  readAsDataURL() {
    setTimeout(() => this.onload({ target: { result: 'data:image/png;base64,QQ==' } }), 0);
  }
};

function makeEditor(extra = {}) {
  return { options: {}, focus() {}, ...extra };
}

test('popup file insert routes through editor.insertImageFile, not raw base64', async () => {
  let routed = null;
  let rawInserted = null;
  const ed = makeEditor({
    options: { image: { upload: async () => 'https://cdn.example.com/pic.png' } },
    insertImageFile(f) { routed = f; },
  });
  const ip = new ImagePopup({ editor: ed, onImageInsert: (src) => { rawInserted = src; } });
  const file = { name: 'pic.png', type: 'image/png' };
  ip.selectedImageFile = file;
  ip.selectedImageSrc = 'data:image/png;base64,AAAA';
  await ip.insertImage();
  assert.equal(routed && routed.name, 'pic.png', 'the original File must reach insertImageFile');
  assert.equal(rawInserted, null, 'the base64 data URL must not be inserted directly');
});

test('popup file insert falls back to data-URL insert when insertImageFile is unavailable', async () => {
  let rawInserted = null;
  const ip = new ImagePopup({ editor: makeEditor(), onImageInsert: (src) => { rawInserted = src; } });
  ip.selectedImageFile = { name: 'pic.png', type: 'image/png' };
  ip.selectedImageSrc = 'data:image/png;base64,AAAA';
  await ip.insertImage();
  assert.equal(rawInserted, 'data:image/png;base64,AAAA', 'core builds keep the old base64 path');
});

test('handleFileSelect keeps the original File for the upload path', async () => {
  const ip = new ImagePopup({ editor: makeEditor({ insertImageFile() {} }) });
  const file = { name: 'pic.png', type: 'image/png' };
  await ip.handleFileSelect({ target: { files: [file] } });
  assert.equal(ip.selectedImageFile, file, 'the File must be retained, not just its data URL');
});
