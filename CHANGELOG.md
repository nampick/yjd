# Changelog

All notable changes to `@oix1987/yjd` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and the project adheres to
[Semantic Versioning](https://semver.org/).

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
