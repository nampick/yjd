# yjd

**Rich text, without the weight.** A dependency-free, tree-shakeable rich text editor for the web. Compose it from a `/core` entry and ship **16 KB**, not the whole library.

🔗 **[yjd.io](https://yjd.io)** · [Live playground](https://yjd.io/demos/) · [Docs](https://yjd.io/site/docs.html)

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

## Bundle size (gzipped JS)

Every preset is built from the same `/core` entry — pick a profile, tree-shake the rest.

| Preset | Includes | Size |
|---|---|---|
| Minimal | bold · italic · underline · link | **~16 KB** |
| Bubble | floating bar, no toolbar + slash menu | **~21 KB** |
| Basic | + strike · headings · lists · align | **~25 KB** |
| Standard | + colour · image · table · find · code view | **~38 KB** |
| Full | everything (CSS inlined) | **~54 KB** |

> For comparison, Quill 2 is ~60 KB. The stylesheet (~8 KB gzip) ships once and is cached, kept out of the JS.

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

## Options

| Option | Type | Description |
|---|---|---|
| `placeholder` | string | Empty-state text. |
| `content` | string | Initial HTML. |
| `width` / `maxWidth` | number｜string | Number = px; string (e.g. `'100%'`) = responsive. |
| `height` / `maxHeight` | number | Editor body height in px. |
| `onChange` | fn(html) | Called on every content change. |
| `toolbar1` / `toolbar2` | array | Toolbar groups: `{ group, items: [] }`. |
| `formats` / `modules` | string[] | Which registered features to activate. |
| `features` | object | `{ wordCount, breadcrumb, … }` — toggle the status bar. |
| `maxLength` | number | Hard character limit. |

## Formats & modules

**Formats** — `bold` · `italic` · `underline` · `strike` · `subscript` · `superscript` · `color` · `background` · `link` · `heading` · `font-family` · `text-size` · `line-height` · `capitalization` · `text-align` · `list` · `indent-increase` · `indent-decrease` · `image` · `video` · `table` · `emoji` · `tag`

**Modules** — `toolbar` · `history` · `slash-menu` · `mention` · `block-toolbar` (bubble bar) · `table-toolbar` · `find-replace` · `code-view` · `resize-handles`

## Methods

`getHTML()` · `getText()` · `insertHTML(html)` · `insertText(t)` · `clear()` · `isEmpty()` · `focus()` · `setReadOnly(bool)` · `undo()` · `redo()`

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

### fromTextarea

Enhance an existing form field; `textarea.value` stays in sync and fires native
`input`/`change` events, so server-side submits and validation keep working.

```js
yjd.fromTextarea('#body', { format: 'markdown' }); // or 'html' (default)
```

### renderStatic

Render stored HTML into a read-only view that matches the editor exactly (sanitized,
tagged `.yjd-content`) — no editor instance needed. Load the stylesheet on the page.

```js
import { renderStatic } from '@oix1987/yjd';
renderStatic(post.body_html, document.querySelector('#post'));
```

## Styling

Theme via CSS custom properties:

```css
.yjd-rich-editor {
  --rte-accent: #6d5efc;   /* primary */
  --rte-ink:    #20242f;   /* text */
  --rte-radius: 14px;
  --rte-border: #e9e9f1;
}
```

## Development

```bash
npm install
npm run build        # dist/ (UMD + ESM) + bundled /core; regenerates CSS
npm test             # unit tests (sanitize, exec-command)
npm run build:demos  # preset demo bundles

# Static site (landing + docs + playground) for Cloudflare Pages
npm run build:pages  # build + assemble ./public
```

### Deploy to Cloudflare Pages (yjd.io)

- **Build command:** `npm run build:pages`
- **Output directory:** `public`
- Add `yjd.io` as a custom domain in the Pages project.

## License

ISC
