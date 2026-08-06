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
  // Starter document so the side panel's Outline tab has something to show.
  content: '<h1>Streaming diffs in the editor core</h1>' +
    '<p>The core applies AI edits as a <b>word-level diff</b> with ' +
    '<a href="https://yjd.io/docs">a link</a> and <code>exec()</code> inline code.</p>' +
    '<h2>Patch pipeline</h2><p>Every operation lands through the same command pipeline.</p>' +
    '<h3>Word tokenizer</h3><p>Keep whitespace runs so the caret can be remapped.</p>' +
    '<h2>Benchmarks</h2><p>Cost per patch is O(nm) in the worst case.</p>',
  theme: 'light',
  // UI 2.0 right rail: Outline · Comments · Versions.
  sidePanel: true,
  // Demo AI hook so the "Ask AI" pill and selection actions render like the
  // design. Echoes a canned rewrite after a short delay — BYO model in a real
  // app (see docs/THEMING.md and the ai option in index.d.ts).
  ai: {
    complete: async ({ action, prompt, text }) => {
      await new Promise((r) => setTimeout(r, 600));
      if (action === 'autocomplete') return ' — and the diff replays in order.';
      return `${text ? text.trim() : ''}${text ? ' ' : ''}(rewritten by the demo AI: ${action || prompt || 'ask'})`;
    }
  },
  onChange: (content) => {
    // Update the output container with new content
    contentContainer.innerHTML = content;
  }
});

// Demo data for the rail: a version snapshot + a comment on the first bold run.
editor.saveVersion();
const boldEl = document.querySelector('#editor-container .rich-editor-area b');
if (boldEl && editor.addComment) {
  const r = document.createRange();
  r.selectNodeContents(boldEl);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(r);
  editor.addComment('Can we cap this at 5k tokens per block?', 'Linh');
  sel.removeAllRanges();
}

// Remove the loading skeleton once the editor has mounted.
document.getElementById('editor-loading')?.remove();
