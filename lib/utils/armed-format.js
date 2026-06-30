/**
 * Collapsed-caret colour/highlight arming.
 *
 * On a collapsed caret, document.execCommand('foreColor'/'backColor') corrupts
 * the browser's pending typing-style state: any bold/italic/underline/strike
 * the user just armed is silently dropped, so the next typed character gets the
 * colour but loses the other formats. (queryCommandState even lies about it
 * afterwards, so re-arming via execCommand can't recover it.)
 *
 * Instead we materialise the armed state as real DOM: a
 *   <b><i><span style="color:…">​</span></i></b>
 * placeholder (wrappers added only for the formats that are actually armed),
 * with the caret placed inside the inner span. Real keyboard input then
 * inherits every format from the DOM context — no fragile pending state — and
 * the editor's zero-width cleanup strips the ​ once a real character lands.
 *
 * This mirrors how font-family/text-size arm a collapsed caret.
 */
import { queryFormatState } from './exec-command.js';

const ZWSP = String.fromCharCode(0x200B);

// execCommand format name -> wrapper tag for the armed inline formats.
const ARMABLE = [
  ['bold', 'b'],
  ['italic', 'i'],
  ['underline', 'u'],
  ['strikeThrough', 's'],
];

/**
 * Insert a colour/highlight placeholder carrying the currently-armed inline
 * formats, and leave the caret inside it so typing inherits all of them.
 *
 * @param {Selection} selection - the live selection (must be collapsed)
 * @param {'color'|'backgroundColor'} prop - which CSS property to set
 * @param {string} value - colour value (or 'inherit' to reset)
 */
export function insertArmedColorSpan(selection, prop, value) {
  if (!selection || !selection.rangeCount) return;
  const range = selection.getRangeAt(0);

  // If the caret already sits in a lone-ZWSP placeholder span (e.g. colour was
  // just armed and the user now adds a highlight before typing), set the new
  // property on that span instead of nesting a second placeholder — otherwise
  // we'd get redundant wrappers and a stray ZWSP.
  let host = range.startContainer;
  if (host && host.nodeType === Node.TEXT_NODE) host = host.parentNode;
  const placeholder = host && host.closest ? host.closest('span') : null;
  if (placeholder && placeholder.textContent === ZWSP) {
    placeholder.style[prop] = value;
    const zw = placeholder.firstChild;
    const caret = document.createRange();
    caret.setStart(zw, zw.length);
    caret.collapse(true);
    selection.removeAllRanges();
    selection.addRange(caret);
    return;
  }

  // Capture armed formats BEFORE mutating anything — queryCommandState is
  // reliable here (it only becomes unreliable once foreColor has run).
  const armedTags = ARMABLE.filter(([cmd]) => queryFormatState(cmd)).map(([, tag]) => tag);

  const span = document.createElement('span');
  span.style[prop] = value;
  span.appendChild(document.createTextNode(ZWSP));

  // Wrap the span in real elements for each armed format (innermost = span).
  let outer = span;
  for (const tag of armedTags) {
    const wrap = document.createElement(tag);
    wrap.appendChild(outer);
    outer = wrap;
  }

  range.deleteContents();
  range.insertNode(outer);

  // An empty block holds a lone <br> placeholder; now that it has real content,
  // drop that trailing <br> so it doesn't serialise as a stray line break.
  const next = outer.nextSibling;
  if (next && next.nodeName === 'BR' && outer.parentNode.lastChild === next) {
    next.remove();
  }

  // Place the caret just after the ZWSP, inside the colour span. Re-setting the
  // selection here also clears any lingering pending typing styles, so the
  // typed character inherits formatting purely from the DOM wrappers.
  const zwspNode = span.firstChild;
  const caret = document.createRange();
  caret.setStart(zwspNode, zwspNode.length);
  caret.collapse(true);
  selection.removeAllRanges();
  selection.addRange(caret);
}

export default { insertArmedColorSpan };
