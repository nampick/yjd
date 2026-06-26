// Load the pre-bundled build (one request) instead of the raw source modules
// (~57 files) — the unbundled waterfall was the load lag, especially over a
// tunnel / mobile network.
import RichEditor from './dist/rich-editor.esm.js';

const contentContainer = document.getElementById('content-container');

const editor = new RichEditor('#editor-container', {
  content: "",
  theme: 'light',
  onChange: (content) => {
    // Update the output container with new content
    contentContainer.innerHTML = content;
  }
});

// Remove the loading skeleton once the editor has mounted.
document.getElementById('editor-loading')?.remove();
