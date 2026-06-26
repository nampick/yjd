# yjd

**Rich text, without the weight.** A dependency-free, tree-shakeable rich text editor for the web. Compose it from a `/core` entry and ship **16 KB**, not the whole library.

🔗 **[yjd.io](https://yjd.io)** · [Live playground](https://yjd.io/demos/) · [Docs](https://yjd.io/site/docs.html)

```js
import RichEditor from '@oix1987/yjd';
new RichEditor('#editor', { placeholder: 'Start writing…' });
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
<script> new RichEditor('#editor'); </script>
```

## Quick start (all-in-one)

The default build registers everything and injects its CSS:

```js
import RichEditor from '@oix1987/yjd';

const editor = new RichEditor('#editor', {
  placeholder: 'Start writing…',
  onChange: (html) => console.log(html),
});
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

**Modules** — `toolbar` · `history` · `slash-menu` · `block-toolbar` (bubble bar) · `table-toolbar` · `find-replace` · `code-view` · `resize-handles`

## Methods

`getHTML()` · `getText()` · `insertHTML(html)` · `insertText(t)` · `clear()` · `isEmpty()` · `focus()` · `setReadOnly(bool)` · `undo()` · `redo()`

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
