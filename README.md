# yjd

[![npm](https://img.shields.io/npm/v/@oix1987/yjd?color=6d5efc)](https://www.npmjs.com/package/@oix1987/yjd) [![CI](https://github.com/nampick/yjd/actions/workflows/ci.yml/badge.svg)](https://github.com/nampick/yjd/actions/workflows/ci.yml) [![npm downloads](https://img.shields.io/npm/dm/@oix1987/yjd?color=6d5efc)](https://www.npmjs.com/package/@oix1987/yjd) [![license](https://img.shields.io/npm/l/@oix1987/yjd)](./LICENSE)

**Rich text, without the weight.** A dependency-free, tree-shakeable rich text editor for the web. Compose it from a `/core` entry and ship **17 KB**, not the whole library.

🔗 **[yjd.io](https://yjd.io)** · [Live playground](https://yjd.io/demos/) · [Docs](https://yjd.io/site/docs.html) · [Changelog](./CHANGELOG.md)

```js
import yjd from '@oix1987/yjd';
new yjd('#editor', { placeholder: 'Start writing…' });
```

---

## Why yjd

- **Tree-shakeable core** — register only the formats/modules you use; the rest is dropped.
- **Zero runtime dependencies** — plain DOM, ESM + UMD builds.
- **Framework-agnostic** — drop it into React, Vue, Svelte, or a static page.
- **Responsive** — toolbar fills the width on desktop, a single swipe-row on mobile.
- **XSS-safe paste** — sanitises pasted HTML (scripts/handlers/unsafe URLs stripped; only trusted embeds survive).
- **Accessible** — keyboard navigable, WCAG-AA contrast (Lighthouse a11y 100).

## New in 2.7

- **Prompt / chat layout** — `layout:'prompt'` turns the editor into a chat-style
  composer: a rounded pill with a bottom action bar (`+ add · tools · send`),
  auto-growing height, and a soft-keyboard-aware Enter (sends on desktop, newlines
  on mobile). See [Prompt / chat layout](#prompt--chat-layout).
- **Attachment tray** — images/files/videos attach as removable thumbnails that
  travel with the message. Read them via `getAttachments()` (with upload `status`
  and a `meta` bag), react to `attachment:add` / `attachment:remove`, or fold them
  into the content with `prompt.serializeAttachments` — which also flows into the
  `fromTextarea` value.
- **Smarter Enter** — inside a list, blockquote or code block, Enter continues the
  block instead of submitting; `submit.enterToSend` (`'auto' | 'always' | 'never'`)
  decouples Enter-to-send from the send button.
- **Per-trigger mention tokens** — `mention` `serialize(item)` emits the exact
  token you store (e.g. a bare `#id`).

Earlier highlights (2.3): interactive checklists, full-screen mode, image align &
live resize, richer tables (merge/split, header row, cell styling), auto-linkify,
and fully tokenised `--rte-*` theming. Full history in the [changelog](./CHANGELOG.md).

## Bundle size (gzipped JS)

Every preset is built from the same `/core` entry — pick a profile, tree-shake the rest.

| Preset | Includes | Size |
|---|---|---|
| Minimal | bold · italic · underline · link | **~17 KB** |
| Bubble | + strike · headings · lists · font · bubble bar | **~23 KB** |
| Basic | + strike · headings · lists · align | **~28 KB** |
| Standard | + colour · image · table · find · code view · resize | **~46 KB** |
| + AI assistant | any preset + `ai` module (BYO model, no SDK bundled) | **+~2 KB** |
| Full (all-in-one) | everything, CSS inlined | **~75 KB** |

> All figures are measured gzip (gzip -9). Tree-shake from the `/core` entry to land
> near the top of the table; the all-in-one default (`import yjd from '@oix1987/yjd'`)
> is the ~75 KB row because it registers every format/module and inlines the CSS.
> Icons and the optional Editor methods (see below) tree-shake per feature, so a
> Minimal build ships ~5 icons, not all 64. The standalone stylesheet is ~11 KB gzip
> — link it once (and skip `StylesLoader`) to keep it out of the JS.

## Install

```bash
npm i @oix1987/yjd
```

Or via CDN (all-in-one UMD):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@oix1987/yjd/lib/styles.min.css">
<script src="https://cdn.jsdelivr.net/npm/@oix1987/yjd"></script>
<script> new yjd('#editor'); </script>
```

## Quick start (all-in-one)

The default build registers everything and injects its CSS:

```js
import yjd from '@oix1987/yjd';   // `RichEditor` is kept as an alias

const editor = new yjd('#editor', {
  placeholder: 'Start writing…',
  onChange: (html) => console.log(html),
});
```

Via `<script>` (UMD) the global is `yjd` (and `window.RichEditor` still works):

```html
<script src="https://unpkg.com/@oix1987/yjd"></script>
<script>const editor = new yjd('#editor');</script>
```

## React, Vue & Angular

yjd has no framework baked in — the constructor takes a DOM element, so you wrap
it in a small component. Guides with a live editor:
**[React](https://yjd.io/site/react)** ·
**[Vue 3](https://yjd.io/site/vue)** ·
**[Vue 2](https://yjd.io/site/vue2)** ·
**[Angular](https://yjd.io/site/angular)** ·
**[AngularJS](https://yjd.io/site/angularjs)**. Runnable demos:
[React](https://yjd.io/examples/react.html) ·
[Vue 3](https://yjd.io/examples/vue.html) ·
[Vue 2](https://yjd.io/examples/vue2.html) ·
[AngularJS](https://yjd.io/examples/angularjs.html).

The React and Vue 3 wrappers are below; Vue 2 (Options API), Angular (standalone
component with `[(value)]`) and AngularJS (an `ng-model` directive) are on their
pages above.

**React** — a hook wrapper (StrictMode-safe; `destroy()` on cleanup, `setContent`
only when the value differs so typing never resets the caret):

```jsx
import { useEffect, useRef } from 'react';
import yjd from '@oix1987/yjd';
import '@oix1987/yjd/styles.css';

export function Editor({ value, onChange, placeholder }) {
  const host = useRef(null), ed = useRef(null);
  useEffect(() => {
    ed.current = new yjd(host.current, { content: value ?? '', placeholder,
      onChange: (html) => onChange?.(html) });
    return () => ed.current.destroy();
  }, []);
  useEffect(() => {
    const e = ed.current;
    if (e && value != null && value !== e.getContent()) e.setContent(value);
  }, [value]);
  return <div ref={host} />;
}
```

**Vue 3** — a composition-API component with `v-model`:

```vue
<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import yjd from '@oix1987/yjd';
import '@oix1987/yjd/styles.css';

const props = defineProps({ modelValue: String, placeholder: String });
const emit = defineEmits(['update:modelValue']);
const host = ref(null); let ed;
onMounted(() => { ed = new yjd(host.value, { content: props.modelValue ?? '',
  placeholder: props.placeholder, onChange: (h) => emit('update:modelValue', h) }); });
onBeforeUnmount(() => ed?.destroy());
watch(() => props.modelValue, (v) => {
  if (ed && v != null && v !== ed.getContent()) ed.setContent(v);
});
</script>
<template><div ref="host" /></template>
```

> **SSR (Next.js / Nuxt):** the editor touches the DOM, so mount it client-side —
> React `useEffect` already does; for a whole page use `dynamic(() => import('./Editor'), { ssr: false })`, and in Nuxt wrap the component in `<client-only>`.

## Tree-shakeable core

For the smallest bundle, import from `@oix1987/yjd/core` (side-effect-free) and register only what you need. Link the stylesheet once.

```js
import { Editor, registry, Bold, Italic, Underline, Link, Toolbar, History }
  from '@oix1987/yjd/core';

registry.register('formats/bold', Bold);
registry.register('formats/italic', Italic);
registry.register('formats/underline', Underline);
registry.register('formats/link', Link);
registry.register('modules/toolbar', Toolbar);
registry.register('modules/history', History);

new Editor('#editor', {
  formats: ['bold', 'italic', 'underline', 'link'],
  modules: ['toolbar', 'history'],
});
```

```html
<link rel="stylesheet" href="@oix1987/yjd/lib/styles.min.css">
```

### Lightweight comment box (~26 KB)

`Editor.fromTextarea`, `renderStatic` and the Markdown/JSON helpers all live in
`/core`, so a comment box pulls only the formats/modules you register — not the
whole editor. Link the stylesheet (don't import `StylesLoader`) to keep CSS out
of the JS.

```js
import { Editor, registry, Bold, Italic, Link, List, Image, Mention, Toolbar, History }
  from '@oix1987/yjd/core';

[['formats/bold', Bold], ['formats/italic', Italic], ['formats/link', Link],
 ['formats/list', List], ['formats/image', Image],
 ['modules/mention', Mention], ['modules/toolbar', Toolbar], ['modules/history', History]]
  .forEach(([k, v]) => registry.register(k, v));

const ed = Editor.fromTextarea('#comment', {
  format: 'markdown',
  toolbar1: [{ group: 'insert', items: ['bold', 'italic', 'link', 'list', 'image', 'emoji'] }],
  mention: { source: (q) => fetchUsers(q) },
  submit: { onEnter: (html) => post(html) },
});
```

## Options

| Option | Type | Description |
|---|---|---|
| `placeholder` | string | Empty-state text. |
| `content` | string | Initial HTML. |
| `width` / `maxWidth` | number｜string | Number = px; string (e.g. `'100%'`) = responsive. |
| `height` | number｜`'auto'` | px, or `'auto'` to grow with content (no cap). |
| `minHeight` / `maxHeight` | number | Explicit bounds (override the height defaults). |
| `theme` | `'inherit'`｜`'light'`｜`'dark'`｜`'auto'` | `'inherit'` (default) follows ancestor `[data-theme]`. |
| `onChange` | fn(html) | Called on every content change. |
| `autoFocus` | boolean | Focus the editor after mount (default `true`). Set `false` for editors rendered on page load — avoids scroll-jump and mobile keyboard pop. |
| `list.types` | string[] | Restrict the list picker, e.g. `list: { types: ['bullet', 'ordered'] }`. Valid: `checklist`, `bullet`, `ordered`, `roman`, `alpha`. |
| `toolbar1` / `toolbar2` | array | Toolbar groups: `{ group, items: [] }`. |
| `formats` / `modules` | string[] | Which registered features to activate. |
| `features` | object | `{ wordCount, breadcrumb, … }` — toggle the status bar. |
| `maxLength` | number | Hard character limit. |

## Formats & modules

**Formats** — `bold` · `italic` · `underline` · `strike` · `subscript` · `superscript` · `color` · `background` · `link` · `heading` · `font-family` · `text-size` · `line-height` · `capitalization` · `text-align` · `list` · `indent-increase` · `indent-decrease` · `image` · `video` · `table` · `emoji` · `tag`

**Modules** — `toolbar` · `history` · `slash-menu` · `mention` · `ai` (BYO-model assistant) · `block-toolbar` (bubble bar) · `table-toolbar` · `find-replace` · `code-view` · `resize-handles`

> `list` includes an interactive **checklist** variant; `table-toolbar` adds cell
> **merge/split**, **header-row** toggle and per-cell **background/alignment**;
> `resize-handles` drives image **resize + alignment**. Full-screen mode and
> auto-linkify ship with the default toolbar/build.

## Methods

`getHTML()` · `getText()` · `insertHTML(html)` · `insertText(t)` · `clear()` · `isEmpty()` · `focus()` · `setReadOnly(bool)` · `undo()` · `redo()`

### Optional methods (tree-shaken from `/core`)

The default build (`import yjd from '@oix1987/yjd'`) ships everything below — **no
setup needed**. They're split out only so a hand-tree-shaken **`/core`** build can
drop the ones it doesn't use (that's how a Minimal build lands at ~17 KB). If you
build from `/core` and want these, opt in once, per group:

```js
import { Editor, applySerializeMethods, applyEditorCommands, applyEditorInput } from '@oix1987/yjd/core';

applySerializeMethods(Editor); // getJSON/setJSON · getMarkdown/setMarkdown · fromTextarea({format:'markdown'})
applyEditorCommands(Editor);   // toggleFullscreen · text direction · clearFormatting
applyEditorInput(Editor);      // image & file insert (drop/paste/picker) · auto-linkify · markdown shortcuts
```

> These affect **only** hand-rolled `/core` builds. Every preset/CDN/all-in-one
> import is unchanged and fully backward compatible.

## Integration API

Drop yjd into an existing app — upload images to your storage, tag people, store
content in whatever format you already use, and progressively enhance `<textarea>`s.

### Export / import (HTML · JSON · Markdown)

```js
editor.getHTML();      editor.setHTML(html);
editor.getJSON();      editor.setJSON(json);     // { type: 'doc', content: [...] }
editor.getMarkdown();  editor.setMarkdown(md);   // mention ids survive round-trips
```

Also exported standalone: `htmlToMarkdown`, `markdownToHtml`, `domToJson`, `jsonToHtml`.

### Image upload hook

Provide `image.upload` to send files to your server/CDN instead of inlining base64.
Applies to every insert path — toolbar, paste, and drag-drop. A placeholder shows
while uploading; the `src` is swapped on success, or the image is removed on failure.

```js
new yjd('#editor', {
  image: {
    upload: async (file) => (await api.upload(file)).url,   // return the URL
    accept: 'image/png,image/jpeg,image/webp',
    maxSize: 8 * 1024 * 1024,
  },
});
// events: editor.on('image:upload'|'image:uploaded'|'image:error', cb)
```

Omit `upload` to keep the base64 fallback.

### File attachments

Like `image`, but for any file. Uploads via `file.upload` and inserts a **file chip**
(icon + name + size) that serializes to a Markdown link `[name (size)](url)`. Works
from the toolbar (`file` button), paste, and drag-drop.

```js
new yjd('#editor', {
  toolbar1: [{ group: 'insert', items: ['image', 'file'] }],   // add the paperclip
  file: {
    upload: async (f) => ({ url: (await api.upload(f)).url, name: f.name }),
    accept: '.pdf,.zip,.docx',
    maxSize: 25 * 1024 * 1024,
  },
});
// events: editor.on('file:upload' | 'file:uploaded' | 'file:error', cb)
```

Cap how big inserted images *display* (so a large upload doesn't blow out the
frame) with `image.maxHeight` / `image.maxWidth` (px or any CSS length):

```js
new yjd('#editor', { image: { upload, maxHeight: '60vh' } });
```

### Enter-to-submit (comment boxes)

```js
new yjd('#comment', {
  submit: {
    onEnter: (html, editor) => post(html),   // Enter sends; Shift+Enter = newline
  },
});
```

When a mention/slash/emoji popup is open, Enter is left for the popup (it picks the
item, doesn't submit). Check it yourself with `editor.isMenuOpen()`.

### Prompt / chat layout

`layout: 'prompt'` turns the editor into a chat-style input: a rounded pill with
the toolbar as a bottom action bar — `[ + add ]  [ format tools ]  …  [ send ]` —
that grows with its content (`height:'auto'`). Enter and the send button both call
your `submit` handler.

> **Leave `toolbar` unset** with `layout:'prompt'` (or pass `toolbar:'prompt'`).
> Passing an explicit toolbar **array** or `toolbar1/toolbar2` opts out of the
> prompt bar and renders that layout instead. A plain `{ overflow, exclude }`
> object keeps the prompt bar (its flags are ignored — configure tools via
> `prompt.tools`). Bar buttons never steal focus, so the mobile soft keyboard
> stays up across sends.

```js
new yjd('#prompt', {
  layout: 'prompt',
  placeholder: 'Message…',
  submit: { onSubmit: (html, editor) => send(html) },  // Enter + send button
});
```

Defaults are mobile-first: **"+" adds an image** straight away (opens the file
picker — no popover), plus **bold / italic** and the send button. Configure more:

```js
prompt: {
  add:   ['image', 'file', 'video', 'table'],  // 2+ items → "+" opens a popover menu
  tools: ['bold', 'italic', 'link'],           // format buttons next to "+"
}
```

`prompt.add` accepts built-in keys (`image` · `file` · `video` · `table`),
`'separator'`, or custom items `{ label, icon?, onSelect(editor) }`. On mobile (or
with a single item) `+` adds an image directly; on desktop with two or more items
it opens a popover menu (portaled so it's never clipped, loaded lazily).

**Attachments.** In the prompt layout, `image` / `file` / `video` attach as
chat-style thumbnails with a remove button — above the bar, not inserted into the
message text. Read them in your submit handler and clear happens automatically:

```js
submit: {
  onSubmit: (html, ed) => send(html, ed.getAttachments()),
}
```

`table` still inserts inline. `getAttachments()` returns
`{ id, kind, file, src, status, meta }` per item — `src` is the upload-hook URL
when `image.upload` is set (otherwise the image data URL); `status` is
`'pending' | 'done' | 'error'`; `meta` is an open bag you can fill.

For apps with their own attachment model, drive the tray by events instead:

```js
prompt: {
  deferUpload: true,              // skip the built-in upload hook on add
  serializeAttachments: true,     // or (att) => `![](${att.src})` — append to submit content
}
editor.on('attachment:add', (att) => {          // att is the live item
  uploadToMyServer(att.file).then((r) => {       // write results back onto it
    att.src = r.url; att.meta = r; att.status = 'done';
  });
});
editor.on('attachment:remove', (att) => cancelUpload(att.id));
```

`serializeAttachments` appends attachments to the content (`true` = default
`<img>`/`<a>` HTML — or Markdown `![](src)` when the store is markdown; a function
returns a custom string per attachment). It flows into **both** the submit
handler's content arg **and** `Editor.fromTextarea`'s synced `ta.value` /
`getMarkdown()` (in the textarea's format), so a `<textarea>`-backed form that
posts `ta.value` gets the attachments without a manual flush. Adding/removing an
attachment re-syncs the value immediately. Call `editor.clearAttachments()` (or
`editor.clear()`, which also empties the tray) to reset after posting.

**For AI chat inputs**, the prompt bar can show a live **token/cost meter** and
carry **context chips** (`@file` / `@selection` references):

```js
prompt: { tokens: { costPer1k: 0.01 } }   // "~1.2k tokens · $0.012" by the send button

editor.addContext({ label: '@report.md', value: fileId });  // a removable chip in the tray
submit: { onSubmit: (html, ed) => send(html, ed.getContext()) }  // [{ id, label, value }]
```

### @mention / #task

```js
new yjd('#editor', {
  mention: {
    trigger: '@',
    source: async (q) => fetchUsers(q),         // [{ id, name, avatar_url }]
    renderItem: (u) => `<img src="${u.avatar_url}"> ${u.name}`,
    triggers: [{ char: '#', source: (q) => fetchTasks(q) }],   // optional extra
  },
});
editor.on('mention:select', (item) => { /* … */ });
```

Inserts a token that serializes with its id:
`<span class="mention" data-id="u_123">@Ann</span>` → Markdown `@[Ann](u_123)`.
Pass `serialize(item) → string` (per trigger, or on the primary config) to control
the exact token — e.g. `{ char: '#', source, serialize: (t) => '#' + t.id }` stores
a bare `#id` with no regex post-processing. If a `source` item has no `avatar_url`,
pass `icon` (inline SVG) for special entries like “@all”. Menus are portaled to
`<body>` but inherit the editor's `--rte-*` theme.

Both Enter-to-send and the send button run `submit`; use `submit.enterToSend`
(`'auto'` · `'always'` · `'never'`) to decouple them — e.g. `'never'` keeps the
send button while making Enter a newline everywhere. Format tools with popovers
(`list`, `emoji`, `link`, `heading`, …) work in the prompt bar too — their
popovers open above it and are portaled so they're never clipped.

### AI assistant (bring your own model)

Turn yjd into a "write-with-AI" surface **without bundling any model**. Like
`mention.source`, you supply a `complete` hook that calls whatever LLM you like
(Claude, your own endpoint, anything). The module is **inert until you do**, and
**tree-shakes to 0** when unused — so the AI code never reaches users who don't
opt in.

```js
new yjd('#editor', {
  ai: {
    // REQUIRED. Resolve to the generated text. Stream by calling onToken with
    // each chunk; if you only stream, return undefined and chunks are joined.
    complete: async ({ action, prompt, text, signal }, onToken) => {
      const res = await fetch('/api/ai', {
        method: 'POST', signal,
        body: JSON.stringify({ action, prompt, text }),
      });
      return (await res.json()).text;
    },
    autocomplete: true,   // optional: inline ghost-text, Tab to accept
    diff: true,           // default: accept AI edits as an inline word diff
  },
});
```

**What the user gets:**

- **Selection toolbar** — select text and a floating bar offers *Improve · Fix
  spelling & grammar · Shorten · Lengthen · Simplify · Summarize* plus a free-form
  **Ask AI…** box. The result is previewed with **Accept / Retry / Discard** — the
  user always stays in control (nothing overwrites their text until they accept).
- **Diff-edit** (on by default) — when you Accept an edit of selected text, the
  change lands as an inline **word-level diff** (green additions, struck-through
  removals). Click any word to keep/drop it, then **Accept** or **Reject** the
  whole thing. Set `ai.diff:false` for the old replace-on-accept behaviour.
- **Ghost-text autocomplete** (opt-in) — a greyed inline suggestion as they type;
  **Tab** accepts, any other key dismisses. Debounced and request-cancelling, so it
  never blocks typing.

Customise the actions, or drive it programmatically:

```js
ai: { complete, actions: [{ id: 'tr', label: 'Translate → FR', prompt: 'Translate to French.' }] }

editor.ai.run('Make this sound friendlier');   // run on the current selection
editor.on('ai:accept', ({ result }) => {});     // ai:start · ai:done · ai:error · ai:accept · ai:discard
```

Building your own agent UI? The same primitives are public:

```js
editor.getSelection();                 // { text, html, isEmpty, range }
editor.replaceSelection(text, { asText: true });   // sanitized, undo-aware
const s = editor.streamInto();         // token-by-token plain-text sink
s.append('Hel'); s.append('lo'); s.commit();       // or s.cancel() to undo the stream

// Render an LLM reply as it streams, formatted + partial-safe (needs the
// serialize methods / all-in-one build):
const md = editor.streamMarkdown();
for await (const chunk of res) md.append(chunk);   // **bold**, ```code```, lists…
md.commit();                                       // finalize the formatted output
```

Nothing the selection toolbar renders lives in the editable DOM, so
`getContent()` / `getJSON()` / `onChange` stay clean. Menus portal to `<body>`
but inherit the editor's `--rte-*` theme.

**More AI-era hooks:**

```js
ai: { trackAuthorship: true }          // tag AI-written spans (data-ai)
editor.showAiMarks(true);              // highlight them · getAiRanges() · stripAiMarks()

// Slash → AI: with the slash-menu module, "/" offers "Ask AI…" — it selects the
// current block and opens the ask bar, so the edit lands as a diff.
```

**On-device (privacy-first).** `complete` is just a function, so you can run the
model in the browser — no server, nothing leaves the device:

```js
import { pipeline } from '@huggingface/transformers';   // WebGPU
const gen = await pipeline('text-generation', 'onnx-community/Qwen2.5-0.5B-Instruct');
new yjd('#editor', {
  ai: {
    complete: async ({ prompt, text }, onToken) => {
      const out = await gen(`${prompt}\n\n${text}`, { max_new_tokens: 200 });
      return out[0].generated_text;
    },
  },
});
```

### Toolbar presets

```js
toolbar: 'full'                    // the default set
toolbar: 'compact'                 // bold/italic/underline · link · list · image · emoji
toolbar: { exclude: ['table','video','color'] }   // defaults minus these
toolbar: { overflow: false }       // never split into a "⋯" second row; wraps instead
toolbar1: [{ group, items: [...] }]               // or full custom groups
```

### fromTextarea (two-way + controller)

Enhance an existing form field. Binding is **two-way**: editor edits update
`textarea.value` (firing native `input`/`change`), and `textarea.value = …` from app
code updates the editor. The returned editor carries a controller.

```js
const ed = yjd.fromTextarea('#body', { format: 'markdown' }); // or 'html'
ed.setValue(md);   // load content
ed.getValue();     // current content (per format)
ed.destroy();      // remove editor, restore textarea + last value
```

### renderStatic

Render stored HTML into a read-only view that matches the editor exactly (sanitized,
tagged `.yjd-content`) — no editor instance needed. Load the stylesheet on the page.

```js
import { renderStatic } from '@oix1987/yjd';
renderStatic(post.body_html, document.querySelector('#post'));
```

### Events & API notes

- **Events** (via `editor.on(name, cb)` / `editor.off(name, cb)`): `change`,
  `image:upload` · `image:uploaded` · `image:error`, `file:upload` · `file:uploaded`
  · `file:error`, `mention:select`, `ai:start` · `ai:done` · `ai:accept` · `ai:discard`
  · `ai:error`, `content:overflow` (when `maxContentSize` exceeded).
- `editor.editor` is the public contentEditable element (attach your own listeners).
- **Markdown dialect** — GFM-ish: headings `#`–`######`, `**bold**`, `*italic*`,
  `~~strike~~`, `` `code` ``, fenced ``` ``` ```, `>` quotes, `-`/`1.` lists,
  pipe tables, `![alt](src)` images, `[text](url)` links, mentions `@[Name](id)` /
  `#[Name](id)`, file chips `[name (size)](url)`. Checklists round-trip as GFM task
  lists — `- [x]` / `- [ ]`.

## Styling & theming

The whole UI — editor, toolbar, popups, and the body-portaled mention/slash menus —
is driven by `--rte-*` CSS custom properties. For the full token reference and
recipes, see **[docs/THEMING.md](docs/THEMING.md)**.

**Match your app** — override any token at `:root` (or any ancestor, or
`.yjd-rich-editor`); the editor follows your colours, no dark class needed. All
of yjd's CSS lives in an `@layer yjd` cascade layer, so **any unlayered rule of
yours always wins** — even `:root { --rte-bg: … }` against the built-in dark
theme — with **no `!important` and no specificity battles**:

```css
:root {
  --rte-accent: #e0488b;   /* brand */
  --rte-bg:     #fffdf7;   /* surface */
  --rte-ink:    #2a2320;   /* text */
  --rte-border: #ece4d6;
  --rte-radius: 10px;
}
```

> **Token reference** — surfaces: `--rte-bg` (editor/popups), `--rte-chrome`
> (toolbar/statusbar), `--rte-chrome-2` (hovers, code). Text: `--rte-ink`,
> `--rte-muted`. Lines: `--rte-border`, `--rte-border-strong`. Accent:
> `--rte-accent`, `--rte-accent-ink` (text on light), `--rte-accent-weak`
> (tints/active), `--rte-accent-ink-on` (text on an accent fill), `--rte-accent-ring`
> (focus). State: `--rte-danger`. Content: `--rte-link`, `--rte-code-bg`/`-ink`,
> `--rte-code-block-bg`/`-ink`, `--rte-quote-bg`/`-border`/`-ink`, `--rte-table-border`.
> Shape/depth: `--rte-radius`(`-md`/`-sm`), `--rte-shadow`(`-sm`).

**Dark mode** — built in. By default `theme: 'inherit'` follows the nearest
ancestor `[data-theme]`, so toggling **one** attribute on `<html>` themes every
editor *and* `renderStatic` read-view with zero per-editor config:

```html
<html data-theme="dark">   <!-- your app's theme switch — editors follow it -->
```

```js
new yjd('#editor');                      // theme:'inherit' (default) → follows <html>
new yjd('#editor', { theme: 'dark' });   // force: 'light' | 'dark' | 'auto' (OS) | 'inherit'
editor.setTheme('dark');                 // at runtime; editor.getTheme() reads it
```

CSS-only alternatives: `yjd-theme-dark` class, or `data-theme="dark"` on the
element / any ancestor. A forced `theme:'light'` editor stays light even inside a
dark page.

## Development

```bash
npm install
npm run build     # dist/ (UMD + ESM) + bundled /core; regenerates CSS
npm test          # unit tests (node:test + jsdom)
npm run size      # size-limit — bundles stay within budget
```

Releasing: `npm run release -- <x.y.z>` runs the gates and prints the git → tag
→ publish steps. Pushing the tag runs `.github/workflows/release.yml` (npm
publish with provenance + GitHub Release). See [CONTRIBUTING.md](./CONTRIBUTING.md).

The website (landing, docs, playground, comparisons at **[yjd.io](https://yjd.io)**)
lives in a separate repo, **[`nampick/yjd-site`](https://github.com/nampick/yjd-site)**,
which consumes this package.

## License

ISC
