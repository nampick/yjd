# Changelog

All notable changes to `@oix1987/yjd` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and the project adheres to
[Semantic Versioning](https://semver.org/).

## [Unreleased]

**Editor UI 2.0, part 2 — component & icon pass.** Applies the redesign's
component layouts and redrawn glyphs on top of the 2.12.0 token pass.

### Changed
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

### Added
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

### Fixed
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
