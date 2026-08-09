# Theming & Design Tokens

The editor's entire visual surface is driven by **CSS custom properties** (design
tokens) named `--rte-*`. Every colour, radius, shadow and timing comes from a
token, so an app can restyle the editor — including full dark mode — by
overriding tokens, without touching component CSS.

> **Rule for contributors:** never hardcode a colour/radius/shadow in component
> CSS or inline styles. Reference a token (`var(--rte-…)`). Add a new token (to
> **all** theme blocks) if none fits. Hardcoded values don't switch with the
> theme and reintroduce the class of dark-mode bugs this system exists to
> prevent.

## Where tokens are defined

`lib/styles.css` defines the palette in four blocks (keep them in sync):

| Block | Selector | Purpose |
|-------|----------|---------|
| Light (default) | `:root` | Base palette, inherited everywhere |
| Dark | `[data-theme="dark"]`, `.yjd-theme-dark` | Forced dark |
| Light (explicit) | `[data-theme="light"]` | Forces light even inside a dark ancestor |
| Auto | `@media (prefers-color-scheme: dark) [data-theme="auto"]` | Follows the OS |

## Token reference

### Palette

| Token | Light | Dark | Use for |
|-------|-------|------|---------|
| `--rte-bg` | `#ffffff` | `#101216` | Editor / popup / input surfaces |
| `--rte-bg-2` | `#fafbfc` | `#14171b` | Page-level canvas behind the editor |
| `--rte-chrome` | `#fcfcfd` | `#15181d` | Toolbar |
| `--rte-chrome-2` | `#f3f4f6` | `#1c2027` | Hover surfaces, status bar |
| `--rte-chrome-3` | `#eceef1` | `#232830` | Pressed/tertiary chrome |
| `--rte-border` | `#e3e5ea` | `#262b33` | Default borders/dividers |
| `--rte-border-strong` | `#ced2d9` | `#353b45` | Emphasised borders, popover frames |
| `--rte-hairline` | `#eceef1` | `#1f242b` | Sub-dividers inside surfaces |
| `--rte-ink` | `#15171c` | `#e8eaee` | Primary text & icons |
| `--rte-ink-2` | `#3c424d` | `#c2c8d1` | Body copy (softer than headings) |
| `--rte-muted` | `#6d7480` | `#949ca8` | Secondary/placeholder text |
| `--rte-faint` | `#98a0ac` | `#6f7783` | Tertiary text, kbd hints |
| `--rte-accent` | `#5b5bd6` | `#7c7cf0` | Brand accent |
| `--rte-accent-ink` | `#4a49cf` | `#a8a8ff` | Accent text/icon (active state) |
| `--rte-accent-weak` | `#eeeefc` | `#1e2040` | Accent wash (active background) |
| `--rte-accent-ink-on` | `#ffffff` | `#0d0e14` | Text/icon **on** an accent fill |
| `--rte-accent-ring` | `rgba(91,91,214,.24)` | `rgba(124,124,240,.34)` | Focus ring around accent |
| `--rte-focus` | `var(--rte-accent, …)` | `var(--rte-accent, …)` | Focus/selection outlines |
| `--rte-sel` | `rgba(91,91,214,.16)` | `rgba(124,124,240,.26)` | Text selection wash |
| `--rte-danger` | `#d0343a` | `#f0666b` | Destructive actions |
| `--rte-danger-weak` | `#fdecec` | `#2c1a1c` | Destructive wash |
| `--rte-success` | `#0f8a5f` | `#3fbc8b` | Success states |
| `--rte-success-weak` | `#e7f5ef` | `#12261f` | Success wash |
| `--rte-warning` | `#a86500` | `#e0a247` | Warning states |
| `--rte-warning-weak` | `#fdf3e0` | `#2a2015` | Warning wash |
| `--rte-info` | `#1f6fdc` | `#68a6f5` | Info states, `#` tags |
| `--rte-info-weak` | `#ebf3fd` | `#141f2e` | Info wash |
| `--rte-link` | `#2f5fd4` | `#8ab4ff` | Links |

> `--rte-focus` now **defaults to `var(--rte-accent, …)`** instead of a fixed
> blue. Set `--rte-accent` and focus rings/outlines match it for free — set
> `--rte-focus` explicitly only if you want it to diverge from the accent.

### Content (editor body + read-view)

| Token | Light | Dark | Use for |
|-------|-------|------|---------|
| `--rte-code-bg` | `#f2f3f5` | `#1c2027` | Inline `code` background |
| `--rte-code-ink` | `inherit` | `#e8eaee` | Inline `code` text |
| `--rte-code-block-bg` | `#14161a` | `#0a0c0f` | `pre` code block background |
| `--rte-code-block-ink` | `#e6e8ec` | `#dfe2e8` | `pre` code block text |
| `--rte-quote-border` | `#ced2d9` | `#3a4150` | Blockquote bar |
| `--rte-quote-bg` | `#fafbfc` | `#161a1f` | Blockquote background |
| `--rte-quote-ink` | `#4b515c` | `#b6bdc8` | Blockquote text |
| `--rte-table-border` | `#dfe2e7` | `#2b313a` | Table cell borders |

### Shape, depth & metrics

| Token | Value | Use for |
|-------|-------|---------|
| `--rte-radius` | `10px` | Outer frame radius |
| `--rte-radius-inner` | `calc(var(--rte-radius) - 1px)` | Chrome bars (concentric with the 1px border) |
| `--rte-radius-md` / `--rte-radius-sm` / `--rte-radius-xs` | `8px` / `6px` / `4px` | Popups / controls / chips |
| `--rte-shadow-sm` / `--rte-shadow` / `--rte-shadow-lg` | … | Small / elevated / modal shadows |
| `--rte-t` | `140ms cubic-bezier(.4,0,.2,1)` | Standard transition |
| `--rte-ctl` | `30px` (`44px` on touch) | Control height — buttons, selects, inputs. One density knob: `26px` compact, `34px` roomy |
| `--rte-gap` | `6px` | Standard gap between controls |
| `--rte-ui` | system stack | Chrome font (toolbar, menus, popups). Content keeps `font-family: inherit` |
| `--rte-mono` | `ui-monospace, …` | Status bar, kbd hints |
| `--rte-icon-size` | `16px` | Every UI glyph |

## Overriding tokens (theme your app)

Override at `:root`, on any ancestor, or on the editor wrapper — your value wins
(the defaults live on `:root`, not on `.yjd-rich-editor`, so ancestor/`:root`
overrides are never blocked):

```css
:root {
  --rte-accent: #10b981;      /* green brand */
  --rte-radius: 8px;
}
/* Or scope to one editor */
.yjd-rich-editor.my-editor { --rte-bg: #0b0b10; }
```

Switch built-in themes at runtime via the `theme` option / `setTheme()`:
`'inherit'` (default, follows the nearest ancestor `[data-theme]`), `'light'`,
`'dark'`, `'auto'`.

## Stacking context

`.yjd-rich-editor` sets `isolation: isolate` — the editor gets its own
stacking context, so its internal `z-index`es (toolbars, dropdowns, resize
handles) never compete with the host page's overlays/modals, and never leak
above them either. If your app previously lowered the toolbar's `z-index` or
wrapped the editor in its own stacking-context hack to keep it under a modal,
you can delete that workaround — isolation now does it for you.

## Known exceptions (not tokenised)

- Colour-picker swatches (`lib/ui/color-picker.js`) are a deliberate fixed
  palette — **not** theme tokens.

(Semantic state colours — success / warning / info / danger, each with a
`-weak` wash — became real tokens in the UI 2.0 redesign and are used by tag
chips, import states and AI diff marks. Use them instead of literals.)

## Verifying a change

After editing `lib/styles.css`, run `npm run generate:css` (regenerates
`styles.css.js` + `styles.min.css`) then `npm run build`, and check the editor
in **both** light and dark (`data-theme="dark"`) — a hardcoded colour shows up
as text/surface that fails to flip.

## Overriding hover/active state visuals (the supported path)

Every hover/`.active` state rule in the shipped CSS reads its colour from a
`--rte-*` token (`--rte-chrome-2`, `--rte-chrome-3`, `--rte-accent-weak`,
`--rte-ink`, …). Some of those rules also carry `!important` — that is internal
cascade plumbing, and per the CSS spec a **layered `!important` beats an
unlayered one**, so fighting these rules with your own `!important` CSS will
lose. Don't fight them; feed them:

```css
/* App CSS (unlayered) — retune the hover wash for toolbar buttons only. */
.my-app .yjd-rich-editor .rich-editor-toolbar-btn:hover { --rte-chrome-2: #ffe8d6; }

/* Or retune a state globally. */
.my-app .yjd-rich-editor { --rte-accent-weak: #e6f7f1; }
```

Custom-property definitions are normal declarations that your unlayered CSS
always wins, and the library's `!important` rule then *computes from your
value*. Scoped redefinition (as above) gives per-state, per-component control
without touching a single library selector.

## @layer facts worth knowing

- **The dist keeps `@layer yjd` intact** — the build only minifies; it never
  flattens layers (there's a build gate that fails if the wrapper disappears).
  If dev and prod behave differently around layers in *your* app, look at your
  own bundler/PostCSS pipeline — some flatten `@layer`, which silently breaks
  `revert-layer` in app CSS (it falls through to the UA default).
- Popup box-model (card/input/button padding) sits in a small **un-layered
  guard block** at the end of the stylesheet so a global reset like
  `* { padding: 0 }` can't collapse popup chrome. Tune it via
  `--rte-popup-pad`, `--rte-popup-pad-inline`, `--rte-popup-pad-lg`,
  `--rte-popup-pad-sm`, `--rte-input-pad`, `--rte-popup-btn-pad`,
  `--rte-popup-btn-pad-inline`, `--rte-popup-ctl-pad`.
- **Toolbar/edit-area padding is NOT in the un-layered guard** — unlike the
  popups, those containers carry *dynamic, state-dependent* padding (a left
  gutter while block handles are active, a taller top strip inside code blocks,
  a different box in the prompt layout), several of it set with `padding-*`
  longhands. A single un-layered `padding` shorthand would flatten those states
  for everyone, so it's deliberately left out. If your host CSS ships a blanket
  `* { padding: 0 }`, scope it away from the editor
  (`:not(.yjd-rich-editor *)`) or set `.rich-editor-area` / the toolbar rows
  explicitly — those are the only surfaces the popup guard doesn't cover.

## Toolbar group spacing

The gap **between toolbar groups** is one token: `--rte-toolbar-group-gap`
(falls back to the generic `--rte-gap`, default `6px`). Widen it to make the
format / insert / list groups read as distinct clusters:

```css
.my-app .yjd-rich-editor { --rte-toolbar-group-gap: 16px; }
```
