# Changelog

All notable changes to `@oix1987/yjd` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and the project adheres to
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added — template & page building (#78–#85)
- **Merge-tag variable chips** (`variables`): declared `{token}` placeholders
  render as atomic chips with a trigger picker; hover shows the sample and
  `previewVariables(true)` swaps every chip for its sample read-only; content
  APIs round-trip raw tokens. (#78)
- **Custom atomic blocks** (`blocks`): registered `{{slot}}` tokens render as
  non-editable cards (icon · label · description, optional `$arg` input,
  optional host preview), insert from the slash menu, drag with the gutter,
  and serialize byte-for-byte. (#79)
- **AI placeholder safety + `ai.runDocument()`**: atoms encode to opaque
  sentinels around the model call (`ctx.placeholders` describes them); dropped
  placeholders follow `ai.placeholders: 'restore' | 'reject' | 'ask'`; whole-
  document rewrites stream through `streamInto()` with buffered sentinel
  decode and one-step undo. (#80)
- **Content schema** (`schema`): `require` (blocks/variables/button),
  `allowTags` (violating tags flatten gracefully on setContent), `maxLength`;
  live dismissable warning strip, `schema:violation` event,
  `editor.validate()`. (#81)
- **`getEmailHTML()`** — compile to email-client-safe HTML: every style
  inlined (zero classes / `<style>`), `<ol>` as numbered badge rows,
  blockquote/hr/pre/img/table hardened, CTAs as bulletproof table+VML,
  sections as bands with stacking columns; fragment or `{document:true}`;
  byte-stable. (#82)
- **Button block**: first-class CTA with inspector popover (label, URL,
  colors, radius, padding, align, full-width), `editor.insertButton()`,
  slash entry, lossless `data-props` round-trip. (#83)
- **Section & Columns**: minimal container model — sections with
  background/padding/radius and 1–3 equal columns, hover-pill inspector,
  cross-column block dragging, implicit default section (zero migration),
  email export stacks columns. (#84)
- **Content design tokens** (`theme: { colors, strict, mode }`): named
  swatches in every inspector, `strict` removes free-form color input,
  token-named values (`bgToken`) re-resolve through the current theme.
  The classic scheme strings (`theme: 'dark'`) keep working; the object
  form carries the scheme in `theme.mode`. (#85)

## [2.15.0] — 2026-08-20

### Added
- **Selection-bubble custom buttons.** `'block-toolbar'.buttons` accepts
  `{ id, title, icon | text, onClick(editor, selection) }` entries rendered
  with the built-in button chrome; the selection survives the click. (#74)
- **`showOnFocus` bubble mode** for input-like fields: the bubble appears on
  focus anchored at the caret, follows a collapsed caret instead of hiding,
  and hides on blur. (#75)
- **`'block-toolbar'.sheet`** filters the "⋮" overflow sheet — `true` (all),
  `false` (none), or an allow-list of `'highlight' | 'comment' | 'copy' |
  'clear-format'`; the ⋮ and its separator disappear when nothing remains. (#70)

### Fixed
- **Bubble no longer drifts on page scroll.** Positioning is now a pure
  wrapper-relative anchor with no `window.scrollY` terms (the bubble is an
  absolute child of the wrapper, so element-relative coordinates ride page
  scroll for free); the window-scroll reposition listener is gone. (#76)
- **Bubble shows in short, input-sized editors** — it overhangs the editor
  instead of hiding when there is no headroom, flipping below the anchor only
  when above would leave the viewport. This also lets the bubble **coexist
  with the top toolbar module**. (#73, #72)
- **Mention chips serialize their `data-token` through every text path** —
  `getText()` in rich and plainText modes, and the plainText `setContent`
  flatten. (#69)
- **AI diff-edit no longer silently degrades to a plain replace** when the
  selection endpoints sit on the editable root (e.g. `selectNodeContents(root)`
  before `editor.ai.run()`): endpoints now resolve into the block they point
  at. Multi-block selections still fall back by design. (#71)

### Fixed (merged from open PRs)
- **Block-handle gutter no longer blinks when the mouse crosses between
  blocks.** Inter-block margins belong to no block rect, so a vertical mouse
  path hid the ⠿/+ handles for the width of every margin and re-showed them in
  the next block — one blink per boundary. The gutter now snaps to the nearest
  block while the pointer is between two blocks (above the first / below the
  last block it still hides). (#65)
- **Portaled popups regained their popup styling.** The body-level portal
  (`popup:'fixed'`, or `'auto'` under a clipping ancestor) compounded both
  scope classes on one element, so every descendant-scoped popup rule —
  including the base-layer font enforcement that shields popup form controls
  from host-page CSS — silently stopped matching. Popups now mount in an inner
  `.rich-editor-popup-container` nested in the portal. Also, `.yjd-select-input`
  uses `min-height` instead of a fixed height, so environments that inflate
  fonts (host CSS, browser minimum font size, OS accessibility text sizing)
  grow the control instead of clipping its label. (#67)

## [2.14.0] — 2026-08-19

### Added
- **`plainText: true` — a first-class plain-text mode** for the chat/prompt/
  comment hosts the package targets. All formatting is off (format UI,
  ⌘B/I/U/K, markdown input rules, auto-linkify), paste is forced plain, and
  `getContent()` / `onChange` / the `submit` handler deliver newline-separated
  plain text; `setContent()` flattens any markup it receives. Mentions and the
  AI module keep working; `serializeAttachments` tails switch to the markdown
  shape. (#60)

### Fixed
- **TypeScript types resolve under `moduleResolution: "Bundler"`.** The
  `exports` map now carries a `types` condition for `.` and `./core`, so Vite
  and other Bundler-resolution consumers get `index.d.ts` instead of a silent
  `any` (TS7016). (#58)
- **A flat `toolbar` array is now a true allow-list.** Merely probing format
  active-state used to instantiate all 19 formats, mounting every picker popup
  (heading levels, font list, line heights, colour grids — 118 controls) into
  the DOM even for `toolbar: ['undo', 'redo']`. Formats whose control isn't in
  the toolbar are no longer instantiated at all. (#59)
- **`prompt.format: []` removes the format buttons.** `format` is the new
  preferred name (with `tools` kept as an alias); an explicit empty array now
  renders no Bold/Italic and no empty group chrome. (#62)
- **The prompt layout's Send button renders only when a `submit` handler
  (`onSubmit`/`onEnter`) is configured** — no more dead Send in prompt-styled
  fields that have nothing to submit. (#63)

### Changed
- **Default `width` is now `'100%'`** (was a fixed `800`px, which overflowed
  any narrower container — intermittently by viewport, thanks to the clamp).
  Pass `width: 800` to restore the old behaviour. (#61)

## [2.13.6] — 2026-08-11

### Changed
- **Relicensed ISC → MIT.** Functionally equivalent (permissive, commercial-OK)
  but passes enterprise OSS-review allowlists with less friction. Copyright is
  now a real, verifiable holder — `Nguyen Tuan Nam <nam@yjd.io>` — instead of a
  pseudonym, and `package.json` `author`/`license` match. Zero runtime deps
  unchanged, so consumers still inherit no third-party license obligations.

### Added
- **License banner in the bundles.** Every `dist/*.js` now carries a
  `/*! @oix1987/yjd | MIT License | © 2024 Nguyen Tuan Nam */` banner (terser
  preserves `/*!`), so a standalone-redeployed bundle carries the MIT notice —
  not only the npm tarball's `LICENSE`. `CONTRIBUTING.md` adds a DCO sign-off
  note so contributions stay unambiguously under MIT.

### Fixed
- **Comment-thread reply / composer buttons rendered oversized.** The 2.13.2
  un-layered popup-button guard (`.yjd-button-confirm`/`.yjd-button-cancel`)
  beat the layered compact rules on `.yjd-c-replybtn` / `.yjd-c-cbtn` (they
  reuse those classes), so the thread Reply button and the new-comment
  Cancel/Comment buttons showed popup-size padding (8px 15px) and 14px text next
  to the 26px input. Added an un-layered compact override so they stay tight.

## [2.13.5] — 2026-08-09

**Responsive & host-integration fixes.** Three layout problems that only showed
up at small sizes or when the editor is embedded in a real app.

### Fixed
- **Popovers no longer break inside host apps.** Toolbar popovers were placed
  `position: absolute` INSIDE the editor, so any host ancestor between the
  editor and `<body>` that clips (`overflow` ≠ `visible`) or re-roots
  (`transform`/`filter`/`perspective`/`contain`) would cut them off or bury them
  under host chrome — the #1 integration complaint. New `popup` option
  (`'auto'` default) portals popovers to `<body>` with `position: fixed` when
  such an ancestor is detected (or always with `popup: 'fixed'`), immune to host
  overflow/transform/stacking. Portaled popovers carry the editor's theme class
  + `--rte-*` tokens (identical styling), reposition on scroll/resize, and are
  cleaned up on `destroy()`. `popup: 'wrapper'` keeps the legacy placement.
- **Side panel squished content on narrow embedded editors.** The rail's
  collapse used a viewport `@media (max-width: 720px)`, so an editor narrow
  inside a WIDE viewport (a split pane, a preview card) kept the fixed 268px rail
  and crushed the content column to a mid-word-wrapping sliver. It now folds via
  a **container query** keyed to the EDITOR's own width (with an `@media`
  fallback for engines without container queries).
- **Expanded toolbar overflow wrapped into a ragged mess.** The reflow packed
  all overflowed tools into a single `flex-wrap` row, so groups wrapped
  unevenly and the vertical dividers stranded at wrapped-line starts. The
  reflow now packs the overflow into multiple non-wrapping rows (the layout the
  CSS was written for) — clean single-line rows separated by a hairline.

### Added
- `popup: 'auto' | 'fixed' | 'wrapper'` option (see above).
- `--rte-toolbar-group-gap` already shipped in 2.13.2; the container-query rail
  fold is new here.

## [2.13.4] — 2026-08-09

**Complete i18n coverage.** 2.13.3 shipped `options.strings`, but only the
toolbar tooltips, add-menu and a few popups routed through it. This wires
**every** remaining user-visible string in the library through `editor.t()`, so
an integrator can fully localise the editor.

### Added
- **`t()` now interpolates `{name}` placeholders** — a composite localises as
  one unit: `t('toolbar.hideNTools', 'Hide {n} more tools', { n })`. Modules get
  a safe `this.t()` (falls back to English if the editor lacks `t()`).
- **`--` (new namespaces)**: the slash menu (`slash.*`), side panel (`panel.*`),
  find & replace (`find.*`), AI bar (`ai.*`), block & table toolbars (`block.*`
  / `table.*`), block/resize handles, code tools (`code.*`), status bar
  (`status.*`), editor placeholder (`editor.placeholder`), the tag / import /
  emoji popups (`tag.*` / `import.*` / `emoji.*`), the link hover bar, and every
  format dropdown (`heading.*`, `size.*`, `case.*`, `spacing.*`, `lineHeight.*`,
  `align.*`, `list.*`, `color.*`) all resolve through `options.strings`.

### Fixed
- **Two tooltips overwrote their own translation on toggle**: the code-view and
  fullscreen buttons re-set an English `title` every time they toggled, clobbering
  a `toolbar.code-view` / `toolbar.fullscreen` value from `options.strings`. They
  now re-resolve through `t()`.
- The special toolbar buttons (Send / Add / More) and the list-picker tooltips —
  reported as missed by `options.strings` — now localise (they bypassed the
  central tooltip map).

### Security
- App-supplied strings injected into an `innerHTML` template (slash menu, AI bar)
  are HTML-escaped, so a translation can't inject markup.

### Notes
- Emoji **search** stays keyed on the English emoji names (localising the index
  is a separate, larger job); category labels and chrome do localise. Font-family
  names are proper nouns, left as-is.
- Size ceilings +2 KB for the added lookups.

## [2.13.3] — 2026-08-09

**Security-forward integration release.** Closes a class of URL/attribute
injection gaps found while acting on the 2.13.2 integration report (an
independent sink audit surfaced more of the same class), plus the report's
i18n, migration, and toolbar-spacing asks.

### Security
- **URL scheme validation across the serializers.** `markdownToHtml` now runs
  every emitted link `href` and media `src` through the same allowlist the DOM
  sanitizer uses (`isSafeUrl`): `javascript:` / `vbscript:` / `data:text/html`
  are dropped instead of passed through. `jsonToHtml` strips `on*` event-handler
  attributes and validates `href`/`src`. `htmlToMarkdown` drops unsafe URLs too,
  so the exported serializers are safe standalone **and** across an
  html↔markdown round-trip (previously they relied entirely on a downstream
  `sanitizeHtml`, which an integrator using the raw exports may not run).
- **File-attachment chip href** (`insertFileAttachment`) is scheme-checked. The
  no-upload-hook path embeds the file as a `data:` URL, so an attached `.html`
  file could otherwise become a clickable `data:text/html` chip in saved
  content. A new `isSafeUrl` option, `allowDataFile`, permits inert file data
  URIs (pdf, zip, office, text) while blocking script-capable document types
  (`text/html`, `xhtml`, `svg`, `xml`).
- **Attachment serialization** (`serializeAttachments`) validates `att.src`
  before emitting the `<img>`/`<a>`.
- Raw `<img>`/`<video>` insert fallbacks, and the `CodeView.setContent` /
  `restoreVersion` fallback `innerHTML` paths, now validate/sanitize as well
  (defense-in-depth on latent sinks).
- **Balanced parens in link URLs**: a URL like `…/Foo_(disambiguation)` is no
  longer truncated at the first `)`.

### Added
- **`options.strings` — localisation.** Every built-in UI string (toolbar
  tooltips, popup titles/buttons, add-menu labels, the "Uploading" chip)
  resolves through one option — a flat `{ key: string }` map or a
  `(key, fallback) => string` function — falling back to English. `editor.t()`
  is the same lookup for custom chrome. Keys are dot-namespaced
  (`toolbar.<fmt>`, `popup.*`, `addMenu.*`, `apply`, `cancel`, `uploading`).
- **`options.media.migrateDataUrls` — heal legacy base64 media.** Opt-in: on
  content load, re-upload any `data:` `<img>`/`<video>` through the matching
  hook (`video.upload`, falling back to `image.upload`) and swap the src in
  place. Emits `media:migrate` · `media:migrated` · `media:migrate-error`.
- **`--rte-toolbar-group-gap`** — a named token for the space between toolbar
  groups (falls back to `--rte-gap`, default unchanged), so apps can widen group
  separation with one variable.

### Docs
- `docs/THEMING.md` documents the group-gap token and why toolbar/edit-area
  padding is intentionally left out of the un-layered reset guard (dynamic,
  state-dependent `padding-*` longhands would be flattened for everyone) — with
  the recommended host-side workaround.

## [2.13.2] — 2026-08-09

**Integration-feedback release** — every actionable point from the first
production integration report against 2.13.1 (media pipeline symmetry, theming
contract, host-reset resilience), each verified in a real browser.

### Fixed
- **Image popup now honours `image.upload`** (the image half of 2.13.1's video
  fix): picking a file in the exported `ImagePopup` routes through
  `insertImageFile` (placeholder → upload hook → `<img>` URL) instead of always
  inlining a base64 data URL. Data-URL fallback kept for core builds / no hook.
  The library's own toolbar image button already used the hook path; this
  closes the popup component integrators wire themselves.
- **`markdownToHtml` classifies `![video](url)` by alt, not just extension**:
  an extension-less URL (signed/capability URLs, CDN ids) with alt `video` —
  exactly what `htmlToMarkdown` emits for videos — now renders as an inline
  `<video controls>` player instead of a broken `<img>`. Non-video alts on
  extension-less URLs stay images.
- **iOS IME send-button belt**: the editor re-runs the prompt send-state sync
  on `compositionend` and on `focus` — WebKit IME commits (e.g. Vietnamese
  keyboards) could land text through paths whose mutations arrived too late,
  leaving the send button disabled with text in the pill.
- **Popup chrome survives host CSS resets**: popup card/input/button padding
  moved into a small **un-layered structural guard** (values unchanged), so a
  host page's `* { padding: 0 }` — which outranks everything inside
  `@layer yjd` — can no longer collapse popups. All values are new tokens
  (`--rte-popup-pad`, `--rte-popup-pad-inline`, `--rte-popup-pad-lg`,
  `--rte-popup-pad-sm`, `--rte-input-pad`, `--rte-popup-btn-pad`,
  `--rte-popup-btn-pad-inline`, `--rte-popup-ctl-pad`).
- **Build: guard block minified separately** — csso's restructure pass is
  `@layer`-ignorant and silently merged the un-layered guard into an in-layer
  rule with the same selector list, deleting it. `generate-css.js` now minifies
  the layer and the guard independently and fails the build if the guard block
  ever disappears from the source.

### Changed
- **`--rte-video-max-h` default 360px → 480px**: the inserted-video display cap
  now matches typical read-view render caps, so a portrait clip looks the same
  while composing as when viewed. Override via `options.video.maxHeight` or the
  token, as before.

### Docs
- **State-override contract documented** (`docs/THEMING.md`): hover/active
  visuals are token-driven — redefine `--rte-*` tokens (scoped, unlayered, no
  `!important` needed) and the value flows through the library's own rules.
  Removing the state `!important`s outright was attempted and rejected with
  evidence: a 4,225-point computed-style matrix showed 642 regressions across
  6 rule families, so the plumbing stays and the tokens are the contract.
- Clarified that **the dist keeps `@layer yjd` intact** (a build gate enforces
  it) — dev/prod differences around `revert-layer` come from app-side bundlers
  that flatten layers, not from yjd.

## [2.13.1] — 2026-08-08

**Video pipeline fixes** — the three gaps that forced integrators to patch
video handling app-side (base64 popup inserts, videos vanishing from Markdown,
attachment videos never uploading) are closed upstream.

### Fixed
- **Video popup now honours `video.upload`**: picking a file in the toolbar
  video popup routes through `insertVideoFile` (placeholder → upload hook →
  inline player), the same single path drag-drop and paste already used —
  instead of always inlining a base64 data URL. Core builds without
  `applyEditorInput`, or no configured hook, keep the data-URL fallback.
- **Markdown serialization of video**: `htmlToMarkdown` serializes an inserted
  `<video>` (and the video feature's YouTube/Vimeo embed iframes) as
  `![video](src)` instead of silently dropping it; `markdownToHtml` renders
  `![…](url)` back as an inline `<video controls>` player for video-file URLs
  and as an embed iframe for YouTube/Vimeo URLs, so video content round-trips.
  Other iframes are still dropped; plain images are untouched.
- **Prompt attachments upload videos**: an attachment of kind `video` now runs
  the upload hook (prefers `video.upload`, falls back to `image.upload`) with
  the same pending → done/error chip states as images and files, and
  `getAttachments()` reports the uploaded URL as `src`. Previously videos were
  excluded from the built-in upload and immediately reported `status: 'done'`
  with no URL. Retry after a failed upload resolves the hook the same way.

## [2.13.0] — 2026-08-07

**Editor UI 2.0, part 2 — the full component pass.** Applies the redesign's
component layouts, redrawn glyphs, IBM Plex type, comment threads, code-block
language detection and drag-drop UX on top of the 2.12.0 token pass — then a
two-round manual QA sweep and a 300-case randomized browser fuzz (0 exceptions)
to get it ship-ready.

### Added
- **Comment threads (design section 09 — Review)**: comments grew from flat
  notes into threads. Replies (`addReply`), resolve/unresolve
  (`resolveComment` — clears the highlight but keeps the thread), an
  anchored **thread popover** on mark click (avatars, relative times, inline
  Reply composer; renders as a bottom sheet on touch), a **new-comment
  composer** on the selection (⌘⌥M or `openCommentComposer()`, quote
  header, ⌘⏎ submits / Esc discards), and a rail with **Open/Resolved
  filter chips**, reply counts, resolved rows with Undo, and **orphan
  detection** ("Anchor text was deleted") when the mark is edited away.
  Marks now carry the design's 2px warning underline. Size ceilings
  ESM/UMD 83→85 KB, Core 79→80 KB.
- **Code-block language detection**: with no `data-lang`, the header label is
  DETECTED from the block's content (14 languages, regex heuristics — exported
  as `detectLanguage`, test-covered). `data-filename` renders the design's
  "javascript · word-diff.js" form. The label/Copy line is now a full-width
  header strip inside the block (lang left, Copy right) with reserved top
  padding so it never overlaps code.
- **IBM Plex font stacks**: `--rte-ui`/`--rte-mono` now lead with IBM Plex
  Sans/Mono per the design (system stacks as fallback — the host app loads the
  webfont; the demo pulls it from Google Fonts). Every hardcoded Lato /
  system-ui / Consolas stack now routes through the tokens.
- **Popup drop zones**: the image and video popups accept file drops — while
  files are dragged over them the input group swaps for a dashed "Drop your
  video/image here" target that feeds the same path as the upload button.
- **`editor.showToast(message)`**: small transient status toast used by the
  unhandled-drop path, available to integrators.

- **Media bar delete**: the image/video align bar gains a divider + destructive
  delete button (one undoable step).
- **Live resize badge**: dragging a resize handle shows a "376 × 212" size chip
  pinned to the element's top-right corner; handles are now 8px accent-bordered
  squares per the design.
- **Link view bar**: clicking a link inside the editor now shows a floating
  bar — shortened href · edit · copy · unlink. Edit reopens the link popup
  prefilled and updates the element **in place** (no nested `<a>`); unlink
  unwraps in one undoable step.
- **Find & replace options**: "Whole word" and regex (`.*`) toggles join the
  match-case chip on their own options row; regex mode uses the term verbatim,
  whole-word wraps it in `\b` boundaries.
- **Emoji picker chrome (UI 2.0)**: search field (name-based), a "Frequently
  used" section backed by localStorage recents, and 7 category tabs replace the
  flat grid + OS-shortcut footer. A custom `emojis: []` option still renders as
  a single grid.
- **AI selection menu**: the actions render as a vertical menu — "EDIT
  SELECTION" mono header, per-action icons, and an "Ask AI…" input row with an
  accent sparkle and ↵ hint (was a wrapped row of text buttons).
- **Colour picker headers**: "Text colour" / "Background" / "Cell background"
  mono headers via the new `title` option.
- **Friendly breadcrumb**: the status bar now reads "H2 · Patch pipeline" in a
  heading and "Body › Paragraph" elsewhere, instead of the raw CSS selector
  path.
- **Table toolbar polish**: hairline dividers between button groups; the
  delete-table/row/column commands render in danger ink with a danger-weak
  hover wash.
- Stylesheet size budget raised 12 → 13 KB (brotli) for the new component
  chrome; JS bundles remain under their 75 KB ceilings.
- **Error-state UX (design "States" section)**: the link popup shows the
  input-error recipe (danger border/ring + "Enter a valid URL" + icon) for an
  invalid or unsafe URL instead of silently console.warning; attachment chips
  reflect upload status (indeterminate progress bar while pending, danger ring
  + "!" badge on failure, integrator-set statuses included); the default
  placeholder becomes the design's empty state ("Start writing, or press / to
  insert a block…").

- **Toolbar clusters match the design bar**: hairline dividers between groups
  using the design's exact recipe (1px × 20px centred line, 4px breathing room)
  on the primary row **and** every overflow row (the mobile swipe-row stays an
  uninterrupted strip); the colour/background buttons join the
  inline-formatting cluster, and a new **Quote** toolbar button (toggles
  blockquote ↔ paragraph) sits with list/link per the design. Alignment +
  indent buttons move to the overflow row like the design's Standard preset,
  and group spacing tightens to the design's 4px rhythm (reflow packer
  constants updated to match).

- **Phase A of the design-feature roadmap** (docs/UI2-FEATURE-ROADMAP.md):
  - **Inline `code` format** — toolbar button in the text cluster wraps the
    selection in `<code>` (toggles off by unwrapping the chip; never nests
    inside a `<pre>`).
  - **Code-block tools** — a floating chip bar over the code block at the
    caret: language label (from `data-lang`) + one-click **Copy**, exactly the
    design's code card header. New default module `code-block-tools`.
  - **"+" insert menu in the standard toolbar** — the design's single plus
    replaces the separate image/table buttons and opens the insert menu
    (image / file / video / table by default, `prompt.add`-style configurable).
  - **`print` / `download` commands** — `printContent()` renders the document
    with read-view styles in a hidden iframe and opens the print dialog;
    `downloadContent('html'|'md')` saves a styled HTML file or Markdown.
  - **Letter-spacing format** — Tight/Normal/Wide/Wider picker applying
    tracking to the selected block(s) (design's `letter-spacing` icon), in the
    overflow row's script cluster.
  - **Table header column** — `header-col` toggle in the table toolbar turns
    the first column into `<th>` cells (sibling of the header-row toggle).
  - **Loading skeleton CSS** — `.yjd-skeleton` (+`-bar`/`-chip`/`-body`/`-line`)
    mirrors the 44px chrome so mounting the editor causes zero layout shift.
  - **Date chip** — `insertDateChip()` / the `date` command inserts an inline
    chip with `data-date` (info-wash styling, non-editable).
  - Size ceilings raised for the feature set: all-in-one bundles 75 → 78 KB
    (actual ~75.2), stylesheet 13 → 14 KB (actual 13.63 after the callout/toggle blocks). Tree-shaken presets
    (Minimal ~17 KB) are unaffected — none of the new modules load unless used.
- **Phase C1 — block handles** (the design's editor-surface signature): hover a
  block to reveal the left-gutter pair — **⠿ drag to reorder** (accent drop
  indicator, one undo step) and **+** (inserts a paragraph below and opens the
  slash menu). New default module `block-handles`; reserves the design's left
  gutter (desktop pointers only), off in the prompt layout, and nothing extra
  ever serializes.
- **Phase B1 — Callout block**: `/callout` inserts a tinted note with a
  CSS-drawn leading icon; variants via `data-callout="info|success|warning|
  danger"` on the semantic tokens. Serializes as a plain
  `<div class="yjd-callout">` and renders identically in the read view.
- **Phase B2 — Toggle block**: `/toggle` inserts a native
  `<details class="yjd-toggle"><summary>` — the collapse state serializes and
  works in the read view for free; chevron rotates on open.

- **Design revision v2 sync** (the updated claude.ai/design spec):
  - **Toolbar recomposed**: sixteen primary tools (history · heading ·
    B I U S · colour + highlight · list + align · link/image/table); everything
    else folds into a **counted overflow** — the "⋯ +N" bordered toggle shows
    how many tools are behind it and stays pressed while open. The overflow is
    ONE horizontally-scrollable chrome-2 row with a mono "⌄ OVERFLOW" label
    (never a multi-row stack). Right cluster order: ⋯ +N · divider · Ask AI.
  - **Active state = ink fill**: pressed toolbar/bubble buttons now invert
    (ink background, paper glyph) instead of the accent wash; hover moves to
    `--rte-chrome-3`; toolbar glyphs render at 1.9 stroke (registry family
    stays 1.75 for menus/pickers).
  - **14 icons redrawn** to the revision (undo/redo corner-arrows, image,
    video, emoji, file, superscript/subscript, clear-format, capitalization,
    line-height, indents) + a dedicated `text-align` trigger glyph; titles
    carry shortcuts (Undo · ⌘Z, Bold · ⌘B, Link · ⌘K, …).
  - **Selects per the new spec**: toolbar triggers 13px/400 with fixed hug
    widths (heading 112px, font 106px, size 58px), no lead icons, pressed
    `.open` state while their popup is showing; popups use the 4px listbox
    shell with a mono group header, chrome-3 hover and accent-weak current.
  - **Colour picker rebuilt to the revision**: the classic 30-colour 6-column
    grid returns, with a bottom utility row — no-colour · white · black ·
    custom — plus a mono hex readout of the last pick; 236px shell,
    strong-border popover, accent ring on hover.
- **Real-browser QA fixes** (headed Chromium): letter-spacing picker had an
  unstyled bespoke popup class and lost the selection before applying — now
  reuses the styled shell and applies to blocks captured at open.

- **Side panel (the design's right rail)** — new opt-in module `side-panel`
  (`sidePanel: true`): **Outline** (live H1–H3 tree, click-to-scroll),
  **Comments** (selection-anchored `data-comment-id` marks + thread cards;
  `addComment()/removeComment()/get/setComments()` and
  `comment:add/remove/click` events) and **Versions** (manual snapshots via
  `saveVersion(label)`, one-click restore, `get/setVersions()`). The rail
  lives outside the content DOM; only the comment marks serialize.

### Changed
- **List & text-align pickers**: rebuilt as the design's labelled vertical
  menus — 186px pop with a mono header ("LIST TYPE" / "TEXT ALIGN") and
  12.5px rows (14px icon + label); the current value is an accent row. The
  old 34px icon tiles (whose ink-fill active rendered oversized and
  misaligned) are gone.
- **Bubble "⋮" more tools (design "Touch bubble · overflow menu")**: the
  selection bubble gains a trailing ⋮ that opens a 206px sheet — Highlight,
  Comment (⌘⌥M, shown when the side panel is on), Copy, and a
  danger-styled Clear formatting; 44px rows on touch. Size ceilings
  ESM/UMD 85→86 KB.
- **Form popups (design "Video popup" / "Import popup" / "Tag popup" cards)**:
  300px card, 14px padding, h3 titles (13.5px/600), 11.5px/500 labels, 30px
  inputs (13px), 30px upload button, 28px confirm/cancel buttons; disabled
  confirm buttons render the quiet chrome fill (`.button-disable`). The link
  popup's Apply matches at 28px.
- **Video popup states**: typing a URL hides the upload button (a URL and a
  file are mutually exclusive) and, for a recognised host/extension, shows an
  inline "Recognised host — validated again on insert" check; the file preview
  gets a bottom scrim so the white controls stay legible.
- **Import popup**: the bare file input is now a dashed drop/browse area that
  stays inert until a type is chosen ("Choose a type first…"), accepts drops,
  and renders the picked file as a compact row (icon tile, ellipsised name,
  `size · MIME` in mono, ✕ to clear). Unsupported combinations (PDF, Word,
  .xlsx/.xls) surface as an inline warning with Import held disabled — no more
  post-pick `alert()`.
- **Tag popup**: suggestions render as 24px pill chips.
- **Attachment tray (prompt layout)**: media with a preview renders as 48px
  tiles (16px close circle, play badge bottom-left on videos); files and
  context chips are 32px rows with a 20px icon tile. A pending upload shows a
  spinner ring in the icon's place; a failed one gets danger styling and an
  inline **retry** that re-runs the upload hook (replaces the old progress bar
  and "!" badge). The "+" add-menu gains a mono "Attach" header (186px, 12.5px
  rows).
- **Drag & drop (canvas)**: the drag-over state is now the design's 1.5px
  dashed accent frame with a "Drop to insert here" pill, plus a live **drop
  caret** (2px accent bar with a dot) tracking the pointer so the insertion
  point is visible before release. Dropping multiple files inserts **all**
  matching files (was: first only), and a drop nothing can handle shows a
  toast ("PDF files aren't enabled in this editor.") instead of failing
  silently.
- **Size ceilings**: ESM/UMD 78→82 KB, Core 78→79 KB, stylesheet 15→16 KB
  (brotli), covering the new popup states, drop UX and tray CSS.

### Fixed
- **Toolbar compressed by tall documents**: the wrapper's flex column let the
  chrome bars SHRINK when content overflowed — a long document squeezed the
  toolbar to a 15px sliver mid-edit. Chrome bars are now `flex-shrink: 0`
  (the content area is the scroll surface), and the bar is `position: sticky`
  in page-scrolling hosts so tools never scroll away (prompt layout's
  bottom bar opts out).
- **Sticky `styleWithCSS` (found by 300-case fuzz QA)**: applying any text or
  background colour flipped the document-wide execCommand styleWithCSS flag on
  and never back, so every LATER bold/italic serialized as
  `<span style="font-weight: bold">` instead of `<b>/<i>`. Both colour paths
  now reset the flag (regression-pinned in test/style-with-css.test.js).

- **QA sweep, round 2**: the demo composer's onSubmit destructured a
  `{ content }` payload that doesn't exist — the handler receives
  `(content, editor)` — so Send threw and never cleared (demo-only bug).
  Enter on a TRAILING empty list item now exits the list into a paragraph
  (Notion/Docs convention) instead of minting empty items; the Versions
  rail's "Current" row counts the LIVE document instead of the stale
  snapshot number.
- **QA sweep (5 findings)**: (1) a highlight applied while the live selection
  had collapsed silently armed a placeholder instead of colouring the text —
  the picker now recovers the last real selection first. (2) Bold no longer
  reports active inside a plain heading (queryCommandState mistakes the
  heading's computed weight for a bold mark; a real b/strong/inline-weight
  ancestor is now required). (3) **Tab nests list items** (Shift+Tab
  outdents) instead of tabbing focus out of the editor; table-cell Tab
  navigation is untouched. (4) The character counter recovers after the HTML
  source view: exit strips the source view's pretty-print whitespace from
  the document and the counter now counts the VISIBLE text (innerText).
  (5) The overflow tool row WRAPS on desktop instead of clipping its last
  tools behind a hidden-scrollbar row; touch keeps the single swipe row.
  UMD 86→87 KB, Core 80→81 KB.
- **Active submenu rows ignore hover**: a stale ink-fill pin flipped active
  picker rows (align/list) to a black tile on hover, and the select popup's
  current option lost its accent wash under a higher-specificity hover rule.
  Active/current rows now pin their accent state through hover, matching the
  toolbar's active-ignores-hover behaviour.
- **Toolbar no longer greys out on first load**: tools disabled themselves
  whenever the selection was outside the document — including before the
  first click, which made the editor look broken at rest. The bar now stays
  enabled (clicking a tool focuses the editor and applies at the caret);
  read-only and code view keep their own disable paths.
- **App-wide token sweep (audit-driven)**: one audit pass normalised every
  hardcoded style that duplicated or fought a token. Buttons: AI panel
  Accept/Retry/Discard and the word-diff Accept/Reject now run the spec's
  12px/500 · 28px · radius-sm (were `font:inherit` / 600 12.5px with 8px
  radii); legacy confirm/cancel drop `#181616`/`#2A2727`/700-weight for
  accent/ink/500; the stacked 36px input/button generation collapses to
  `--rte-ctl`/28px. Radii: every `6.9px`/`3.456px`/`3.46px` Figma artifact
  and bare 4/6/8/10px on component chrome now uses `--rte-radius-*`. Colors:
  bare hex duplicating tokens (`#fdecec`, `#111827`, accent rgba washes,
  `#ddd` table cell borders and the white popover arrow in JS inline styles)
  route through their tokens with fallbacks. Base-layer defaults drop from
  14px to the spec's 12/12.5px. Theming: portaled surfaces (AI bar, slash
  menu, toast) now copy the full token set — including `--rte-accent-ink-on`
  and `--rte-t` — so wrapper-scoped themes reach them; select-button's inert
  inline font overrides removed.
- **Selection chrome no longer stacks**: selecting text used to pop BOTH the
  formatting bubble and the AI "Edit selection" menu on top of each other.
  Per the design, selection now shows only the bubble, which leads with a
  "✦ AI" accent entry (shown when a model is wired) that opens the AI menu
  pinned at the selection. Auto-open is still available via
  `ai.openOnSelect: true`.
- **List picker sync**: the picker's active row now recognises checklists
  (its stale duplicate of getListType flagged `ul.checklist` as Bullet while
  the toolbar icon said Checklist).
- **Font weights (post-font-fix sweep)**: popup text now defaults to 400 —
  500 is opted in per control. Select options run the design's 12.5px/400
  (current row 500), find & replace actions 11.5px/500, Ask AI pill
  12.5px/500. Previously the popup reset forced 14px/500 over everything,
  which the never-matching toolbar selector had been masking.
- **Enter inside a code block**: browsers split every line into its OWN
  `<pre>` — multi-line code was impossible and language detection never had
  enough signal. Enter now inserts a newline in the same block; Enter on an
  empty trailing line exits into a fresh paragraph (test-covered).
- **Toolbar fonts never applied**: the font reset targeted `.toolbar-container`
  but the DOM class is `.rich-editor-toolbar-container` — toolbar buttons had
  rendered in the browser's default font (Arial) all along. Size ceilings
  ESM/UMD 82→83 KB for the detector + font pass.
- **Ask AI first open**: with no caret in the document, the panel anchored to
  the EDITOR BOX and dropped below the whole document on the first click. It
  now opens right-aligned under the toolbar pill. A first-open positioning
  regression suite (test/popup-position.test.js) covers the AI bar, the
  video/image/tag/import popovers and the shared position helper.
- **More-toggle dots**: the ⋯ glyph's `[fill="currentColor"]` circles were
  painted paper by the ink-fill active recipe — invisible on the toggle's
  LIGHT pressed chrome. Re-inked while open.
- **Stuck pressed select**: re-showing a shared select against a different
  trigger left the previous trigger's `.open` chrome behind.
- **Block handles**: the ⠿/+ gutter now centres on the block's FIRST LINE
  (an H1's tall line box left it floating above the text) and no longer
  vanishes while the pointer crosses the gutter band on the way to the
  buttons (blocks are resolved by row when the target isn't inside one).
  Buttons grew to 22px with 16px glyphs.
- **Toolbar selects size to content**: heading / font-family / text-size
  triggers use auto width, so "X-Large" or a long font name widens the
  trigger instead of truncating to "X…".
- The overflow row's mono "⌄ OVERFLOW" label is gone — the second row now
  starts flush with its first control.
- Import popup no longer closes when clearing the picked file (the ✕ detached
  from the DOM before the click-outside handler ran).
- The popup upload button can hide again (`display` was pinned by an
  `!important` in a legacy rule); its idle look follows the design (solid
  border, chrome fill, grey icon — was dashed accent).
- **62 icons redrawn** to match the design spec exactly (bold, italic, color,
  ai sparkle, undo/redo, all alignment, list, table-operation and picker
  glyphs) — every registry entry now byte-matches the design's icon set.
- **Toolbar layout (UI 2.0)**: undo/redo lead the row on the left (no longer a
  pinned right cluster); when a model is wired, the AI trigger renders as a
  right-aligned **"Ask AI" accent pill** that never overflows into the hidden
  panel (it reuses the pinned-group reservation in `reflow()`).
- **Slash menu**: "Blocks" section header, bordered 26px icon tiles, per-block
  glyphs (H1/H2/H3, paragraph, blockquote, code-block) and markdown shortcut
  chips (`#`, `-`, `>`, ` ``` `, `---`, …) on the right of each row; active row
  uses the quiet chrome wash with an accent-tinted tile.
- **Colour picker**: curated 8×3 UI 2.0 palette (neutral ramp, saturated hues,
  soft washes) replaces the legacy web palette; "No colour" and "Custom…" are
  full-width menu rows under a hairline (white/black now live in the grid).
- **Table size picker**: 16px cells with accent-weak highlight and a mono
  "3 × 4" size label.
- **Find & replace**: the match-case toggle renders as a chip (accent when on).
- **Floating block/table bars**: 28px buttons per the bubble-metrics spec.
- **Mention menu**: two-line rows — name plus an optional handle/description
  line (`item.handle` / `item.hint` / `item.description`), 22px avatars.

- **Dark mode: native white buttons in find & replace.** A legacy
  `background: 0 0` let Chromium paint the UA's native button face (white) on
  the dark panel — Replace/Replace all now set `appearance: none` plus token
  backgrounds explicitly.

## [2.12.0] — 2026-08-06

**Editor UI 2.0** — a full visual redesign of every surface, from the
[YJD Editor Redesign](https://yjd.io) design spec. Same markup, same API — the
change is (almost) entirely tokens, so existing `--rte-*` overrides keep
working and custom themes inherit the new structure for free.

### Changed
- **New token palette (light + dark + auto).** Calmer neutral greys
  (`#15171c` ink on `#ffffff`, hairline `#e3e5ea` borders), a new indigo accent
  (`#5b5bd6` / dark `#7c7cf0`), and a refreshed content palette (near-black
  `#14161a` code blocks, quiet `2px` hairline blockquotes with no accent fill,
  `#2f5fd4` links). Dark mode is deeper (`#101216` surface, `#15181d` chrome).
- **Tighter geometry.** Radius scale is now 10 / 8 / 6 px (frame / popups /
  controls) plus a new 4px `--rte-radius-xs` for chips; controls are **30px**
  tall (was 32px) via the new `--rte-ctl` token, giving the classic 44px chrome
  bar. Softer, larger shadows (`--rte-shadow-lg` added for modal surfaces).
- **Popover recipe.** Every floating surface — dropdowns, pickers, bubble/table
  toolbars, slash & mention menus, find/replace, AI bar — now uses the same
  recipe: 1px `--rte-border-strong` frame, 8px radius, `--rte-shadow`.
- **Icon family at 1.75 stroke.** All ~64 registry glyphs render at
  `stroke-width: 1.75` (was 2) for a lighter, more even weight; a few core
  glyphs (upload, theme, horizontal-rule) were redrawn to match the family.
- **Status bar** is now 11px monospace (`--rte-mono`) on `--rte-chrome-2`, with
  tabular numerals for the word count.
- **Mobile swipe-row toolbar** grows controls to a 44px touch target
  (`--rte-ctl: 44px` under `hover:none`+`pointer:coarse`).
- **Text selection** uses the new `--rte-sel` accent wash (`::selection`).

### Added
- **Semantic state tokens** — `--rte-success`, `--rte-warning`, `--rte-info`,
  `--rte-danger-weak` (+ `-weak` washes for all), themed in all four palette
  blocks. Tag chips, import states and AI word-diff marks now use them, so they
  finally flip with dark mode.
- **New tokens**: `--rte-bg-2`, `--rte-chrome-3`, `--rte-hairline`,
  `--rte-ink-2`, `--rte-faint`, `--rte-sel`, `--rte-radius-xs`,
  `--rte-shadow-lg`, `--rte-ctl` (control height / density knob: 26 compact ·
  30 default · 34 roomy · 44 touch), `--rte-gap`, `--rte-ui`, `--rte-mono`.
- **Extra icon pack** (`lib/ui/icons-extra.js`, opt-in, tree-shakeable): 40 new
  glyphs in the same family for custom chrome — `save`, `share`, `history`,
  `download`, `print`, `unlink`, `heading-2/3`, `paragraph`, `blockquote`,
  `code-block`, `callout`, `toggle`, `columns`, `drag-handle`, `duplicate`,
  `delete`, `rewrite`, `regenerate`, `diff-view`, `replace`, `preview`,
  `settings`, `mention`, `comment`, `date`, `attachment`, `saved`, `error`,
  `info`, `offline`, `locked`, `presence`, `help` and more. Import
  `registerExtraIcons()` to add all (or a named subset) to the registry.

### Docs
- `docs/THEMING.md` rewritten for the new palette: full token tables (light +
  dark values), the metrics tokens, and the retired "not yet tokenised"
  exceptions list (semantic states are tokens now).

## [2.11.6] — 2026-07-24

### Added
- **Paste a video file** — pasting a video from the clipboard now inserts an
  inline `<video controls>` player, the same path as drag-and-drop (honouring
  `video.upload` / `maxHeight` / `maxSize`). An image in the same paste still wins,
  so a mixed clipboard never double-inserts.

### Changed
- **Close buttons use the shared `close` glyph.** The remove/close affordances on
  the attachment chip and the image/video popups drew a text `×` while a `close`
  icon already existed in the registry — they now use it, so they follow
  `--rte-icon-size` like every other icon (sized 0.65× to sit in the small button).
  Completes the icon normalization started in 2.11.4.

## [2.11.5] — 2026-07-24

### Fixed
- **Tall videos blew out the frame.** An inserted/dropped video only capped its
  width, so a portrait (9:16) or tall clip stretched the whole editor. Inline
  videos now cap their height on insert — default **360px** via the new
  `--rte-video-max-h` token, overridable with `video.maxHeight` / `video.maxWidth`
  (mirrors `image.maxHeight/maxWidth`) or the token at `:root`. Aspect ratio is
  preserved; the resize handles clear the cap inline once the user drags a size,
  so enlarging past the cap still works.

## [2.11.4] — 2026-07-24

### Added
- **One icon-size scale + custom icons.** Every UI glyph (toolbar, `+` add-menu,
  attachment chips, popups) now renders through a single `--rte-icon-size` token
  (default 16px) instead of drifting per-surface (was 16/17/20/22px). Set it with
  the new `iconSize` option (number → px, or any CSS length), at `:root`, or on
  `.yjd-rich-editor`. Override or add glyphs with the new `icons` option
  (`{ name: '<svg …>' }`), the exported `registerIcons`, or the static
  `RichEditor.registerIcons` — the icon registry is global.
- **Drag-and-drop video.** Dropping a video file onto the editor now inserts an
  inline `<video controls>` player (parallel to images), honouring a new
  `video.upload` hook (with `accept` / `maxSize`) and emitting
  `video:upload` / `video:uploaded` / `video:error`. Without the hook it inlines a
  data URL. A Minimal `/core` build without the input-path add-on falls back to the
  prior behaviour.

### Changed
- The two popup upload buttons (image + video) now draw the shared `upload` glyph
  from the icon registry instead of a duplicated inline SVG, so they track
  `--rte-icon-size` like every other icon.

## [2.11.3] — 2026-07-24

### Added
- **Video attachment preview** — in the prompt layout, a video added via the
  `+` menu now shows its first frame (a real `<video>` preview) with a play
  badge, instead of just an icon and the file name. The preview uses a
  lightweight object URL that is revoked on remove/clear, so large clips don't
  bloat memory. `getAttachments()` is unchanged (a not-yet-uploaded video still
  reports `src: undefined`).

### Fixed
- **Video upload in the standard editor was silently blocked** — uploaded clips
  arrive as `data:video/*` URLs, which `Video.create` rejected via `isSafeUrl`
  (only `data:image/*` was allowed), so nothing was inserted (just a console
  warning). `isSafeUrl` now accepts inert `data:video/*` and `data:audio/*`
  media (opt-in via `allowDataAV`), `sanitizeHtml` preserves such `src` on
  `<video>` / `<audio>` / `<source>` (so uploaded clips survive a save/reload
  round-trip while non-media tags still reject them), and `Video.create` opts
  in. Uploaded videos now insert as an inline `<video controls>` player.

## [2.11.2] — 2026-07-23

### Fixed
- **`@context` chip double `@`** — the prompt-composer context chip renders a
  fixed `@` icon, so passing a natural `@file.md` label (the display form) to
  `editor.addContext({ label })` rendered as `@@file.md`. The renderer now
  strips a single leading `@` from the label. `getContext()` still returns the
  label exactly as passed. Found via a live QA pass on `yjd.io/examples/ai`.

## [2.11.1] — 2026-07-23

### Fixed
- **AI diff-edit across paragraphs** — a selection spanning multiple blocks no
  longer leaves a stray `<span>` floating between paragraphs; multi-block edits
  fall back to a plain replace (the inline word diff stays within one block).
- **streamMarkdown block nesting** — the stream target now sits at block level,
  so headings / lists / code blocks in the reply are siblings instead of being
  nested illegally inside a `<p>` (which browsers auto-broke). Found via a
  cross-browser QA pass (Chromium + WebKit).

## [2.11.0] — 2026-07-23

### Changed
- **AI diff-edit polish** — a `del`+`ins` replacement is now one hunk: toggling
  either word flips both, so you switch cleanly between the new word and the
  original (fixes a missing space when a kept deletion sat next to its addition).
  **Enter** accepts the open diff, **Esc** rejects it.
- **streamMarkdown** shows a blinking caret while the reply "types".

## [2.10.0] — 2026-07-23

### Added
- **AI authorship marks** — `ai.trackAuthorship` tags AI-written content with
  `class="yjd-ai-mark" data-ai`. `editor.showAiMarks(on)` highlights it,
  `getAiRanges()` reads it, `stripAiMarks()` removes it before saving. Applies to
  diff-edit and `streamMarkdown()` output.
- **Slash → AI** — with the slash-menu module, `/` now offers **Ask AI…** (when
  `ai.complete` is set): it selects the current block and opens the ask bar, so
  the edit lands as a diff.
- **On-device AI recipe** — README shows a `complete` hook backed by
  `@huggingface/transformers` (WebGPU), for a fully local, privacy-first editor.

## [2.9.0] — 2026-07-23

### Added
- **Streaming Markdown renderer** — `editor.streamMarkdown()` renders an LLM
  response token-by-token as formatted HTML, partial-safe (an open `**bold` or
  code fence renders cleanly). `commit()` finalizes, `cancel()` undoes. New
  `balancePartialMarkdown()` in `lib/serialize.js`. Turns yjd into a live
  AI-output surface.
- **Prompt token/cost meter** — `prompt.tokens` shows a live `~N tokens` (and
  optional cost) next to the send button; customise the estimate/label/price.
- **Prompt context chips** — `editor.addContext({ label, value })` adds an
  `@file`/`@selection`-style reference chip to the tray; read with
  `editor.getContext()`. Fires `context:add`.

## [2.8.0] — 2026-07-23

### Added
- **AI diff-edit** — accepting an AI edit of selected text now lands as an inline
  word-level diff (green additions, struck-through removals) with per-word
  keep/drop (click a word) and a floating **Accept / Reject** bar, instead of a
  blind replace. On by default; `ai.diff:false` restores the old behaviour. New
  `lib/utils/word-diff.js` (LCS word diff). Fires the same `ai:accept` /
  `ai:discard` events.

## [2.7.6] — 2026-07-22

### Added
- CI/CD via GitHub Actions: unit tests + build + size-limit + a Chromium/WebKit
  browser smoke on every PR; `npm publish --provenance` + the GitHub Release on
  a pushed tag. README now shows npm / CI / downloads / license badges.

## [2.7.5] — 2026-07-22

### Docs
- Add integration guides for Vue 2 (Options API), Angular (standalone component)
  and AngularJS 1.x (directive), alongside the existing React and Vue 3 pages —
  each an on-brand site page (`/site/vue2`, `/site/angular`, `/site/angularjs`)
  with a live editor, plus runnable `/examples/vue2` and `/examples/angularjs`
  demos. Home, docs and README link them all. No code changes.

## [2.7.4] — 2026-07-22

### Docs
- Add a "React & Vue" section to the README (hook wrapper + `v-model` component,
  SSR notes). Dedicated integration landing pages ship on the site
  (`/site/react`, `/site/vue`) with a live editor, plus runnable `/examples/`
  demos, all linked from the home and docs. No code changes.

## [2.7.3] — 2026-07-22

### Docs
- Refresh the npm package description (adds the chat/prompt layout + WYSIWYG) and
  replace the stale "New in 2.3" README section with "New in 2.7". No code changes.

## [2.7.2] — 2026-07-22

### Docs
- Add this CHANGELOG (shipped in the package) and link it from the README.
  No code changes.

## [2.7.1] — 2026-07-21

### Fixed
- `prompt.serializeAttachments` now flows into the `Editor.fromTextarea` bridge,
  not only the submit handler's content arg — a `<textarea>`-backed composer that
  posts `ta.value` / `getMarkdown()` gets the attachments too. The default
  serializer is format-aware (markdown → `![](src)`, html → `<img>`/`<a>`), and
  adding/removing an attachment re-syncs the value immediately.

### Added
- `editor.clearAttachments()` empties the attachment tray on its own; `clear()`
  now also empties the tray so it resets the whole composer (text + attachments).

## [2.7.0] — 2026-07-21

Prompt-layout DX pass from real-app integration feedback.

### Fixed
- `layout:'prompt'` is no longer silently disabled by a plain `toolbar` object
  (e.g. `{ overflow:false }`) — the prompt bar applies unless an explicit toolbar
  array / `'full'` / `'compact'` / `toolbar1`/`toolbar2` is given (warns when
  opted out).
- The prompt bar no longer leaves a hidden, focusable dead `.more-btn` in the DOM
  when overflow is disabled.
- Bar buttons (send / +add / format) keep the editor's focus on `mousedown` as
  well as `pointerdown`, so the iOS soft keyboard no longer drops after a send.

### Added
- `submit.enterToSend: 'auto' | 'always' | 'never'` — decouple Enter-to-send from
  the send button.
- Per-trigger mention `serialize(item) → string` — emit a custom token
  (e.g. bare `'#' + id`) with no regex post-processing.
- Attachment tray: `attachment:add` / `attachment:remove` events (live item),
  `prompt.deferUpload`, `att.status` (`'pending' | 'done' | 'error'`) and
  `att.meta` on `getAttachments()`, and `prompt.serializeAttachments`
  (`true` | function) to fold attachments into the submitted content.

## [2.6.0] — 2026-07-21

### Fixed
- In the prompt layout, plain Enter now continues a structural block (list item,
  blockquote, code block) instead of submitting — mirroring chat inputs like
  Claude/ChatGPT. A new list item is created with Enter; Enter on an empty item
  exits the list. Enter still submits from a normal paragraph (desktop) and
  inserts a newline on touch devices.

## [2.5.1] — 2026-07-21

### Fixed
- Toolbar UX: horizontal scroll limited to touch devices; the "More" row wraps
  and stays bordered; history pinned beside the More button; line-height select
  width; fullscreen overlay.
- Popover positioning: keep-below behaviour and container-relative placement so
  popovers are never clipped.
- Media upload no longer reports a false "invalid URL".
- Input/select ellipsis for long values.

## [2.5.0] — 2026-07-20

Fixes from integrating yjd into a real app (the 2.4 upgrade suggestions).

### Fixed
- `setContent()` now updates placeholder visibility, so a programmatic prefill
  is no longer hidden behind a stale placeholder (P0).
- Checklists round-trip through Markdown (`- [x]` / `- [ ]`) without loss (P0).

### Added / Changed
- API and token-hygiene improvements, and theming via `--rte-*` design tokens.

---

Earlier releases (v2.4.0 and prior) predate this changelog; see the Git tag
history for details.

[2.15.0]: https://github.com/nampick/yjd/releases/tag/v2.15.0
[2.14.0]: https://github.com/nampick/yjd/releases/tag/v2.14.0
[2.13.6]: https://github.com/nampick/yjd/releases/tag/v2.13.6
[2.13.5]: https://github.com/nampick/yjd/releases/tag/v2.13.5
[2.13.4]: https://github.com/nampick/yjd/releases/tag/v2.13.4
[2.13.3]: https://github.com/nampick/yjd/releases/tag/v2.13.3
[2.13.2]: https://github.com/nampick/yjd/releases/tag/v2.13.2
[2.13.1]: https://github.com/nampick/yjd/releases/tag/v2.13.1
[2.13.0]: https://github.com/nampick/yjd/releases/tag/v2.13.0
[2.12.0]: https://github.com/nampick/yjd/releases/tag/v2.12.0
[2.11.6]: https://github.com/nampick/yjd/releases/tag/v2.11.6
[2.11.5]: https://github.com/nampick/yjd/releases/tag/v2.11.5
[2.11.4]: https://github.com/nampick/yjd/releases/tag/v2.11.4
[2.11.3]: https://github.com/nampick/yjd/releases/tag/v2.11.3
[2.11.2]: https://github.com/nampick/yjd/releases/tag/v2.11.2
[2.11.1]: https://github.com/nampick/yjd/releases/tag/v2.11.1
[2.11.0]: https://github.com/nampick/yjd/releases/tag/v2.11.0
[2.10.0]: https://github.com/nampick/yjd/releases/tag/v2.10.0
[2.9.0]: https://github.com/nampick/yjd/releases/tag/v2.9.0
[2.8.0]: https://github.com/nampick/yjd/releases/tag/v2.8.0
[2.7.6]: https://github.com/nampick/yjd/releases/tag/v2.7.6
[2.7.5]: https://github.com/nampick/yjd/releases/tag/v2.7.5
[2.7.4]: https://github.com/nampick/yjd/releases/tag/v2.7.4
[2.7.3]: https://github.com/nampick/yjd/releases/tag/v2.7.3
[2.7.2]: https://github.com/nampick/yjd/releases/tag/v2.7.2
[2.7.1]: https://github.com/nampick/yjd/releases/tag/v2.7.1
[2.7.0]: https://github.com/nampick/yjd/releases/tag/v2.7.0
[2.6.0]: https://github.com/nampick/yjd/releases/tag/v2.6.0
[2.5.1]: https://github.com/nampick/yjd/releases/tag/v2.5.1
[2.5.0]: https://github.com/nampick/yjd/releases/tag/v2.5.0
