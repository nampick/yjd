# yjd-swift v0.1 — Design

**Status:** approved (design), not yet implemented
**Date:** 2026-08-17
**Repo:** new public repo `nampick/yjd-swift` (this repo stays library-only)

## Goal

A public Swift Package giving iOS developers a **native** rich text editor whose
HTML is interchangeable with `@oix1987/yjd` on the web. Native means real
`UITextView` text editing — not a `WKWebView` wrapping the JS bundle.

## Non-goals for v0.1

Tables, images/video, mentions, AI, comment threads, side panel, Markdown
import/export, macOS, iPad-specific affordances (Pencil, pointer). The README
states plainly: *a feature subset of yjd 2.13, not parity.*

## Honest framing

None of the 25k lines of JS in this repo is reusable. Only the *specification*
carries over: the emitted HTML subset, the command names, and the typing rules.
yjd-swift is a second editor sharing a wire format, and it will be maintained as
such.

## Architecture

One SPM package, three targets:

| Target | Depends on | Responsibility |
|---|---|---|
| `YjdCore` | **no UIKit** | Document model, format rules, HTML parse/serialize, list numbering, attribute mapping |
| `YjdUI` | UIKit + Core | `YjdTextStorage`, `YjdTextView`, toolbar, keyboard accessory, command execution |
| `YjdSwiftUI` | YjdUI | `YjdEditor` (`UIViewRepresentable`) with `@Binding var html: String` |

`YjdCore` avoids UIKit so its tests run on the macOS host without a simulator,
and so a future macOS/AppKit target is an addition rather than a teardown.

Platform floor: iOS 16, TextKit 2.

## Document model (`YjdCore`)

```swift
struct Document          { var blocks: [Block] }
struct Block             { var kind: BlockKind; var indent: Int; var runs: [InlineRun] }
enum   BlockKind         { case paragraph, heading(Int), bullet, ordered, quote, code(language: String?) }
struct InlineRun         { var text: String; var marks: Marks; var link: URL? }
struct Marks: OptionSet  { /* bold, italic, underline, strike, code */ }
```

Nested lists are represented by a flat `indent: Int`, not a nested tree. That
matches how the user manipulates them (Tab / Shift-Tab) and how renumbering
works; the `<ul><li><ul>` nesting is reconstructed only at serialize time.

### Source of truth

While editing, **`NSTextStorage` is the source of truth and `Document` is a
projection** computed on `getHTML()` / applied on `setHTML(_:)`.

Rationale: every reason to go native — autocorrect, dictation, system undo, and
Vietnamese IME (Telex/VNI marked-text ranges) — writes directly into the text
storage. Making `Document` authoritative and re-rendering would break exactly
those behaviours. Block kind and indent live on the attributed string as custom
paragraph attributes `.yjdBlockKind` and `.yjdIndent`.

## Web interop

The contract is an **HTML string**, not JSON. yjd's `getJSON()` is a DOM mirror
(`tag` / `attrs` / `text` / `content`, see `lib/serialize.js:316`); reproducing
it in Swift would rebuild a DOM and buy nothing.

`YjdCore` parses and emits exactly the subset yjd produces:
`p, h1–h3, ul, ol, li, blockquote, pre > code, strong, em, u, s, code, a`.

Unknown input is downgraded by a documented table, published in the README:

| Input | Becomes |
|---|---|
| `h4`–`h6` | `h3` |
| `div`, `section` | `p` |
| `table` | one paragraph per cell, row order |
| `img`, `video`, `iframe` | dropped (v0.1) |
| any other element | unwrapped, children kept |

## Commands and typing rules

`YjdCore` defines `EditorCommand`; `YjdUI` executes it against `NSTextStorage`.

- Inline: `toggleMark(.bold / .italic / .underline / .strike / .code)`,
  `setLink(URL)`, `removeLink`
- Block: `setBlock(BlockKind)`, `toggleList(.bullet / .ordered)`, `indent`, `outdent`

| Key | Context | Behaviour |
|---|---|---|
| Enter | inside a list item | new item at the same indent |
| Enter | empty list item | outdent; at indent 0 becomes a paragraph |
| Enter | inside a code block | newline, stays in the block |
| Enter Enter | at the end of a code block | exits into a new paragraph (matches yjd web) |
| Backspace | at the start of a non-paragraph block | downgrade to paragraph, keep content |
| Tab / ⇧Tab | inside a list | indent / outdent, max 5 levels |

Input rules, on by default and switchable off:
`# `, `## `, `### `, `- `, `1. `, `> `, and a triple backtick.

Undo uses the text view's own `undoManager`, one undo group per command.

## Public API

Named to mirror the JS library so the web docs transfer:

```swift
editor.getHTML()            // String
editor.setHTML(_ html: String)
editor.getText()            // String
editor.isEmpty              // Bool
editor.focus()
// delegate: yjdEditorDidChange(_:)

// SwiftUI
YjdEditor(html: $html, placeholder: "Start writing…")
```

Theming via a `YjdTheme` struct mapping the meaningful `--rte-*` tokens (accent,
text, code background, quote bar), defaulting to the yjd 2.13 indigo.

## Testing — keeping the two implementations from drifting

This, not TextKit, decides whether the project survives six months.

1. **Shared fixture corpus** — ~40 `fixtures/*.html` files, each the HTML yjd web
   actually emits, generated by a script that runs the JS serializer over
   authored sample documents and committed into the Swift repo.
2. **Idempotent round-trip test** (`YjdCore`, macOS host, no simulator):
   `parse → serialize` must equal the fixture byte for byte. This is the
   compatibility contract.
3. **Table-driven command tests** (`YjdUI`, iOS simulator, since `NSTextStorage`
   is UIKit here): `(input HTML, selected range, command) → expected HTML`.
4. **Vietnamese IME tests**: simulate `setMarkedText` while typing Telex inside a
   list and inside a code block — the most fragile area of any hand-written
   native editor, and invisible to English-only testing.
5. **No image snapshot tests** in v0.1: expensive and flaky.

## Risks

- **List markers on iOS.** Whether `NSTextList` / `NSParagraphStyle.textLists` is
  usable on iOS 16 must be verified in week 1. If not, markers are drawn manually
  in a `NSTextLayoutManager` delegate — plan for the manual path.
- **Code block backgrounds** spanning multiple lines need custom drawing; budget
  for it rather than assuming a background attribute suffices.
- **Feature drift.** Every yjd web release that changes emitted HTML must
  regenerate the fixture corpus, or the round-trip test silently encodes stale
  output.

## Milestones

| Milestone | Content |
|---|---|
| M1 | `YjdCore`: model, HTML parse/serialize, fixture round-trip green |
| M2 | `YjdTextStorage` + `YjdTextView`: inline marks, headings, quote |
| M3 | Lists: markers, indent/outdent, renumbering, Enter/Backspace rules |
| M4 | Code blocks, input rules, undo grouping |
| M5 | Toolbar + `YjdSwiftUI` wrapper, theming |
| M6 | IME tests, README with the downgrade table, tag `0.1.0` |

Estimate: 6–8 weeks of focused work.
