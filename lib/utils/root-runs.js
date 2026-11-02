/**
 * Root-level "bare run" normalization.
 *
 * Content such as `<p>Hi</p>{{list}}<p>Bye</p>` leaves text (and inline
 * elements) directly under the editable root. Every block-oriented command
 * (lists, insertBlock, alignment, …) collects `root.children` — elements only —
 * so a bare run is invisible to them and ends up on the wrong side of whatever
 * they insert or move. These helpers wrap each such run in its own `<p>`, in
 * document order, so the root only ever holds blocks.
 */

// Elements that stand on their own at the root and end a run. Anything else
// (text, <strong>, <a>, <span>, <img>, <br>, unknown tags…) is phrasing content
// that belongs inside a paragraph.
const BOUNDARY_TAGS = new Set([
  'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'DETAILS', 'DIALOG', 'DD', 'DIV',
  'DL', 'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'H1', 'H2',
  'H3', 'H4', 'H5', 'H6', 'HEADER', 'HGROUP', 'HR', 'LI', 'MAIN', 'NAV', 'OL',
  'P', 'PRE', 'SECTION', 'TABLE', 'UL', 'SUMMARY',
  // Embeds/media placed at the root by the editor itself stay unwrapped.
  'VIDEO', 'AUDIO', 'IFRAME', 'EMBED', 'OBJECT', 'CANVAS',
  // Non-rendered elements never join a paragraph.
  'STYLE', 'SCRIPT', 'TEMPLATE', 'LINK', 'META'
]);

/** True when `node` ends a root-level run (a block or embed element). */
export function isRootBoundary(node) {
  return !!node && node.nodeType === 1 && BOUNDARY_TAGS.has(node.tagName);
}

function isWhitespaceText(node) {
  return node.nodeType === 3 && node.textContent.replace(/​/g, '').trim() === '';
}

/**
 * Group the root's child nodes into consecutive runs of non-boundary nodes.
 * @param {Node} root
 * @returns {Node[][]}
 */
export function collectRootRuns(root) {
  const runs = [];
  let run = null;
  Array.from(root.childNodes).forEach((n) => {
    if (isRootBoundary(n)) { run = null; return; }
    if (!run) { run = []; runs.push(run); }
    run.push(n);
  });
  return runs;
}

/**
 * Wrap a list of adjacent root-level nodes in a new `<p>` placed where the run
 * starts. Returns the paragraph.
 * @param {Node[]} run
 * @returns {HTMLParagraphElement}
 */
export function wrapRun(run) {
  const first = run[0];
  const doc = first.ownerDocument;
  const p = doc.createElement('p');
  first.parentNode.insertBefore(p, first);
  run.forEach((n) => p.appendChild(n));
  return p;
}

/**
 * Normalize `root` in place: each root-level run that carries content becomes
 * its own `<p>` (document order preserved), whitespace-only runs (formatting
 * whitespace between blocks) are dropped. Never moves a block element.
 *
 * @param {Node} root - editable root, or a parsed body
 * @param {Object} [opts]
 * @param {(run: Node[]) => boolean} [opts.filter] - only touch runs it accepts
 * @returns {HTMLParagraphElement[]} the paragraphs created
 */
export function wrapRootRuns(root, opts = {}) {
  const created = [];
  collectRootRuns(root).forEach((run) => {
    if (opts.filter && !opts.filter(run)) return;
    const meaningful = run.some((n) => {
      if (n.nodeType === 3) return !isWhitespaceText(n);
      return n.nodeType === 1;
    });
    if (!meaningful) {
      // Only whitespace text / comments: drop the text, leave comments alone.
      run.forEach((n) => { if (n.nodeType === 3) n.remove(); });
      return;
    }
    // A run made only of <br>s (and whitespace) is an empty line, not content.
    const onlyBreaks = run.every((n) => (n.nodeType === 1 ? n.tagName === 'BR' : n.nodeType !== 3 || isWhitespaceText(n)));
    if (onlyBreaks) return;
    // Trim formatting whitespace at the edges of the run so the paragraph does
    // not start/end with the newline that separated it from its neighbours.
    while (run.length && run[0].nodeType === 3 && isWhitespaceText(run[0])) run.shift().remove();
    while (run.length && run[run.length - 1].nodeType === 3 && isWhitespaceText(run[run.length - 1])) run.pop().remove();
    if (!run.length) return;
    const first = run[0];
    const last = run[run.length - 1];
    if (first.nodeType === 3) first.textContent = first.textContent.replace(/^[ \t\r\n\f]+/, '');
    if (last.nodeType === 3) last.textContent = last.textContent.replace(/[ \t\r\n\f]+$/, '');
    created.push(wrapRun(run));
  });
  return created;
}

/**
 * True when the root holds a bare run with real content (what wrapRootRuns
 * would wrap).
 * @param {Node} root
 */
export function hasBareRootRuns(root) {
  return collectRootRuns(root).some((run) => run.some((n) => (
    n.nodeType === 3 ? !isWhitespaceText(n) : n.nodeType === 1 && n.tagName !== 'BR'
  )));
}

