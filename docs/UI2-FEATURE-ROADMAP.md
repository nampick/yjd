# UI 2.0 — Feature roadmap from the design spec

The "YJD Editor Redesign" spec draws a number of features the library doesn't
have yet. This is the evaluated backlog: what they are, what they're worth,
what they cost, and the order to build them. (The UI 2.0 *visual* redesign —
tokens, components, icons, layouts — already shipped on `feat/ui2-components`.)

Effort: **S** < ½ day · **M** 1–2 days · **L** 3+ days.
Value: how much it moves the product for typical integrators.

## Phase A — Quick wins (one release)

| # | Feature (design source) | Value | Effort | Notes |
|---|---|---|---|---|
| A1 | **Inline `code` format** (toolbar bar, content samples) | High | S | `InlineFormat` → `<code>`; toolbar button in the text cluster (the design bar has it); `` `x` `` markdown shortcut. Tokens already style `code`. |
| A2 | **Code-block chrome** (Components · code card) | High | S | Language label + Copy button on `pre` blocks (header row like the design's `javascript · word-diff.js`). |
| A3 | **Insert "+" in the standard toolbar** (design bar) | Med | S/M | Reuse the prompt layout's `AddMenu` (already generic) for image/file/video/table + app items. |
| A4 | **Print / Download commands** (History & document icons: `print`, `download`, `share`) | Med | S | `print` = render `.yjd-content` to a print window; `download` = export HTML/MD via existing `getHTML()/getMarkdown()`. Icons already shipped in icons-extra. |
| A5 | **Letter-spacing format** (`letter-spacing` icon) | Low | S | Mirrors line-height (inline style + picker). |
| A6 | **Table header-column toggle** (`header-col` icon) | Med | S | Sibling of the existing header-row toggle in table-toolbar. |
| A7 | **Skeleton CSS** (States · Loading card) | Med | S | Ship `.yjd-skeleton` classes (44px chrome bar + shimmer lines) so apps mount with zero layout shift — the demo hand-rolls this today. |
| A8 | **Date chip** (`date` icon) | Low | S | Insert an inline date chip (mention-style span). Lowest priority in A. |

## Phase B — New block formats

| # | Feature | Value | Effort | Notes |
|---|---|---|---|---|
| B1 | **Callout block** (editor surface + `callout` icon) | High | M | `<div data-callout="info…">` + icon + tint per semantic token (info/success/warning/danger already tokenized). Own serializer so `getHTML()`/markdown round-trips. Slash-menu entry. |
| B2 | **Toggle block** (`toggle` icon) | High | M | Native `<details><summary>` — collapse state survives serialization for free. Slash-menu entry. |
| B3 | **Audio** (`audio` icon) | Med | S/M | Upload + `<audio controls>`, mirrors the video format (cap width, resize handles n/a). |
| B4 | **Page break** (`page-break` icon) | Low | S | `<hr data-page-break>` + `break-after: page` in print CSS. |
| B5 | **Embed block** (`embed` icon) | Med | M | URL → sanitized `<iframe>`; must be allowlist-driven (`embed.allow: [hosts]`) — do NOT ship an open iframe. |
| B6 | **Columns / layout** (`columns`, `layout` icons) | Med | L | 2-col grid blocks; caret navigation + serialization complexity. Defer until B1/B2 have proven the block-format plumbing. |
| B7 | **Math/LaTeX** (`math` icon, formula sample) | Low | L | Needs a renderer — if ever, BYO hook like `ai.complete` (`math.render`). Park it. |

## Phase C — Block UX (the design's editor-surface signature)

| # | Feature | Value | Effort | Notes |
|---|---|---|---|---|
| C1 | **Drag-handle + plus gutter** (editor surface: ⠿ and + at the block start) | Very high | L | Hover a block → left-gutter ⠿ (drag to reorder, one undo step) and + (opens the insert menu at that block). The single most visible UX in the mock; `drag-handle` icon already shipped. |
| C2 | **Outline API** (sidebar's Outline tab) | Med | S | `getOutline()` → `[{level, text, id, el}]` + `outline:change` event. The sidebar UI itself stays app-level; the API makes it a 20-line integration. |

## Phase D — Collaboration hooks (BYO, like `ai.complete`)

| # | Feature | Value | Effort | Notes |
|---|---|---|---|---|
| D1 | **Comment marks** (comment icon, Comments tab, bubble comment button) | High | M/L | Range marks `data-comment-id` + `comments.add/remove/get` API + `comment:add/click` events. Thread UI stays app-level (like the design's sidebar). |
| D2 | **Presence rendering** (States · Presence, remote carets with name flags) | Med | M | Render-only API: `setRemoteCursors([{id,name,color,range}])` draws the colour caret + name flag (fades ~2s) and selection washes. Sync transport is the app's job. |
| D3 | **Save/versions hooks** (save icon, Versions tab) | Med | S/M | `save` toolbar command + `onSave(content)` hook + `getSnapshot()/restoreSnapshot()` on the history module. Version list UI stays app-level. |

## Already shipped (design ⇄ lib parity — no work needed)

Ghost text (Tab-accept autocomplete), AI word-diff review, AI authorship marks
(`trackAuthorship`/`showAiMarks`), prompt token meter, context chips,
attachment tray + upload states, checklists, find & replace (case/word/regex),
fullscreen, read-only `renderStatic`, slash menu, mention, link view bar,
media resize + size badge + delete.

## Out of scope for the library (app-level in the mock)

The right sidebar (Outline/Comments/Versions panels), real CRDT sync, token
pricing math, the tokens/icons gallery pages, offline queue banner, document
error pages.

## Suggested order

**A (one release) → C1 (the flagship UX) → B1 + B2 (callout/toggle) → D1 →
B3/B4 + C2 + D3 → D2 → B5 → B6.**

Rationale: A is cheap credibility (the toolbar finally does everything it
draws); C1 is the feature people screenshot; B1/B2 are the most-requested
block types in every Notion-like editor; D unlocks the collab story without
taking on sync. Each phase is releasable on its own — version bumps only on
explicit order.
