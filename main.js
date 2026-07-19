// Load the pre-bundled build (one request) instead of the raw source modules
// (~57 files) — the unbundled waterfall was the load lag, especially over a
// tunnel / mobile network.
import RichEditor from './dist/rich-editor.esm.js';

const contentContainer = document.getElementById('content-container');
// Render editor output with the library's read-view class so headings, links,
// code, quotes, tables etc. are styled exactly like inside the editor (the
// editor's own rules are scoped to .rich-editor-area and don't apply to a bare
// container). Same idea as the renderStatic() helper.
contentContainer.classList.add('yjd-content');

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
