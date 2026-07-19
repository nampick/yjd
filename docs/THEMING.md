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
| `--rte-bg` | `#ffffff` | `#1b1d24` | Editor / popup / input surfaces |
| `--rte-chrome` | `#fbfbfd` | `#23252f` | Toolbar / status bar |
| `--rte-chrome-2` | `#f2f2f7` | `#2d313d` | Hover surfaces, secondary chrome |
| `--rte-border` | `#e9e9f1` | `#353944` | Default borders/dividers |
| `--rte-border-strong` | `#dadae6` | `#434857` | Emphasised borders |
| `--rte-ink` | `#20242f` | `#e8e9ef` | Primary text & icons |
| `--rte-muted` | `#767c8e` | `#9aa0b4` | Secondary/placeholder text |
| `--rte-accent` | `#6d5efc` | `#8b7ff0` | Brand accent |
| `--rte-accent-ink` | `#5a48ee` | `#b3a8ff` | Accent text/icon (active state) |
| `--rte-accent-weak` | `#efedff` | `#2c2942` | Accent wash (active background) |
| `--rte-accent-ink-on` | `#ffffff` | `#ffffff` | Text/icon **on** an accent fill |
| `--rte-accent-ring` | `rgba(109,94,252,.28)` | `rgba(139,127,240,.40)` | Focus ring around accent |
| `--rte-focus` | `#3b82f6` | `#5b9bff` | Focus/selection outlines |
| `--rte-danger` | `#e5484d` | `#f2686c` | Destructive actions |
| `--rte-link` | `#2563eb` | `#8ab4ff` | Links |

### Content (editor body + read-view)

| Token | Light | Dark | Use for |
|-------|-------|------|---------|
| `--rte-code-bg` | `#f1f2f3` | `#2d313d` | Inline `code` background |
| `--rte-code-ink` | `inherit` | `#e8e9ef` | Inline `code` text |
| `--rte-code-block-bg` | `#20242f` | `#14161d` | `pre` code block background |
| `--rte-code-block-ink` | `#ececf5` | `#e3e4ec` | `pre` code block text |
| `--rte-quote-border` | `#d1d5db` | `#8b7ff0` | Blockquote bar |
| `--rte-quote-bg` | `#f9fafb` | `#262433` | Blockquote background |
| `--rte-quote-ink` | `#555555` | `#c7cad6` | Blockquote text |
| `--rte-table-border` | `#d1d5db` | `#434857` | Table cell borders |

### Shape & depth

| Token | Value | Use for |
|-------|-------|---------|
| `--rte-radius` | `14px` | Outer frame radius |
| `--rte-radius-inner` | `calc(var(--rte-radius) - 1px)` | Chrome bars (concentric with the 1px border) |
| `--rte-radius-md` / `--rte-radius-sm` | `11px` / `8px` | Popups / controls |
| `--rte-shadow-sm` / `--rte-shadow` | … | Small / elevated shadows |
| `--rte-t` | `140ms cubic-bezier(.4,0,.2,1)` | Standard transition |

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

## Known exceptions (not yet tokenised)

A small set of **semantic state** colours are still literal because there is no
matching token yet. If you touch these, prefer adding a semantic token
(`--rte-success` / `--rte-warning` / `--rte-info`) to all theme blocks:

- Success / warning / info tints on upload chips & AI states (greens `#dcfce7`,
  ambers `#fef3c7`/`#f59e0b`, blues `#dbeafe`/`#eff6ff`).
- The block toolbar's active colour (`#136fdf` / `#cccccc`) predates the accent
  system and is intentionally left; unifying it with `--rte-accent-ink` /
  `--rte-accent-weak` is a recommended follow-up.
- Colour-picker swatches (`lib/ui/color-picker.js`) are a deliberate fixed
  palette — **not** theme tokens.

## Verifying a change

After editing `lib/styles.css`, run `npm run generate:css` (regenerates
`styles.css.js` + `styles.min.css`) then `npm run build`, and check the editor
in **both** light and dark (`data-theme="dark"`) — a hardcoded colour shows up
as text/surface that fails to flip.
