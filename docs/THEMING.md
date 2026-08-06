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
