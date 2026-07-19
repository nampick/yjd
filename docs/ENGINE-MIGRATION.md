# Engine migration plan — toward a document-model editor

> Status: **proposal** (not yet executed). This is a large, multi-week
> initiative that replaces the editing core. It is intentionally kept separate
> from the incremental UI/UX/perf work already merged.

## Why

Today the editor edits the DOM directly through `contentEditable` +
`document.execCommand`, and smooths over the gaps with ~70 `setTimeout` calls.
That approach has hard ceilings the recent fixes cannot remove:

- **Unpredictable caret/selection** after formatting (execCommand quirks).
- **Coarse undo** — history snapshots full `innerHTML` strings.
- **Browser-dependent formatting** (execCommand is deprecated and inconsistent).
- **No path to collaboration / structured content** (no canonical document model).

Editors that feel "smooth like Notion/Google Docs" (Tiptap, Lexical, Quill 2)
all share one trait: a **document model decoupled from the DOM**. State changes
are transactions applied to the model; the DOM is a render target. Caret, undo,
and formatting become deterministic.

## Options

| Engine | Pros | Cons |
|---|---|---|
| **Tiptap (ProseMirror)** | Mature, schema-based, great plugins, strong selection/undo, collab via Yjs | Larger API surface; ProseMirror learning curve |
| **Lexical (Meta)** | Lightweight core, fast, good a11y, extensible nodes | Younger ecosystem; fewer ready-made features |
| **Quill 2** | Drop-in, Delta model, simple API | Less flexible schema; theming constraints |

**Recommendation: Tiptap/ProseMirror** — best balance of predictable behavior,
extensibility (our many formats map to nodes/marks), and a clear collaboration
story (Yjs) if needed later.

## Compatibility strategy (don't break the published API)

Keep the public surface stable so `@oix1987/yjd` consumers don't churn:

- Preserve `new RichEditor(selector, options)`, `getContent`/`setContent`,
  `on`/`off`, `getText`, `isEmpty`, `setReadOnly`, `focus`, `destroy`.
- `getContent()` keeps returning HTML (serialize the model → HTML).
- Re-implement the toolbar/popovers/design **as-is** on top of the new core
  (the UI layer is already token-driven and reusable).
- Map current formats → ProseMirror marks/nodes:
  marks: bold, italic, underline, strike, sub/sup, color, background, link,
  font-family, text-size, code · nodes: paragraph, heading, blockquote,
  code_block, bullet/ordered list, table, image, video, hr, tag.

## Phased approach

1. **Spike (1 wk):** Tiptap core on a branch behind a flag; render into the
   existing wrapper; prove bold/heading/list/undo/caret behavior.
2. **Schema + serialization (1–2 wk):** all marks/nodes; HTML in/out parity with
   current `getContent`/`setContent`; sanitize on parse (reuse `sanitize.js`).
3. **Toolbar/commands bridge (1–2 wk):** route toolbar + slash + shortcuts to
   editor commands; keep the current UI/design.
4. **Feature parity (2–3 wk):** tables, media, find/replace, code view, import,
   resize, autosave, RTL, maxLength.
5. **A11y + perf pass, e2e tests, docs (1 wk).**
6. **Cutover:** swap default engine; keep the legacy engine one minor version
   behind a flag for rollback.

**Estimate:** ~6–9 weeks for one engineer; ~58 KB-gzip bundle likely grows
(budget it; ProseMirror core + table + lists ≈ comparable to today once tree-shaken).

## Risks

- Bundle size growth → set a per-build budget and tree-shake.
- HTML round-trip fidelity for legacy content → golden-file tests.
- Behavior changes users relied on (execCommand side effects) → changelog.

## Decision needed

This should not be done silently. Confirm: target engine (Tiptap vs Lexical),
acceptable bundle budget, and whether collaboration (Yjs) is in scope — then the
spike in phase 1 can start on a dedicated branch.

---

## `/core` optional-method installers

The tree-shakeable `/core` `Editor` omits some methods so a Minimal build stays
small (~17 KB). The default/UMD/all-in-one build wires them for you — this only
affects hand-rolled `/core` builds. Opt in once, per group:

```js
import { Editor, applySerializeMethods, applyEditorCommands, applyEditorInput } from '@oix1987/yjd/core';

applySerializeMethods(Editor); // getJSON/setJSON · getMarkdown/setMarkdown · fromTextarea({format:'markdown'})
applyEditorCommands(Editor);   // toggleFullscreen · setDirection/toggleTextDirection · clearFormatting
applyEditorInput(Editor);      // insertImageFile (image toolbar/drop/paste) · file attachments · auto-linkify · markdown shortcuts
```

Symptoms when an installer is missing: the image toolbar button / drop / paste
does nothing (a console warning points here), `getMarkdown()`/`getJSON()` are
`undefined`, or full-screen / text-direction toolbar buttons no-op.
