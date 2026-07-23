# Contributing to yjd

The editor library. The website (yjd.io) is a separate repo,
[`nampick/yjd-site`](https://github.com/nampick/yjd-site).

## Setup

```bash
npm install     # Node 20+
```

## Layout

| Path | What |
|---|---|
| `lib/` | Editor source (formats, modules, core). The published library. |
| `dist/` | Built bundles (UMD + ESM + `/core`). Git-ignored; built on demand + at publish. |
| `index.d.ts` | TypeScript types (hand-maintained — update on any API change). |
| `test/` | `node:test` unit tests (`*.test.js`, jsdom). |
| `scripts/` | `generate-css.js`, `release.mjs`, `gh-release.mjs`. |

## Build & test

```bash
npm run build   # dist/ (UMD + ESM + /core); runs generate:css first
npm test        # unit tests — must stay green
npm run size    # size-limit — bundles must stay under budget (brotli)
```

CI (`.github/workflows/ci.yml`) runs `test`, `build`, and `size` on every PR.

## Release

Never bump `package.json` alone. In short:

```bash
# 1. bump package.json version, add a CHANGELOG entry (+ link ref),
#    update README / index.d.ts as needed
# 2. gates + build + test + size:
npm run release -- 2.7.7
# 3. branch → PR → merge to master → tag v2.7.7 → push the tag
```

Pushing the tag runs `.github/workflows/release.yml`: `npm publish --provenance`
(needs the `NPM_TOKEN` secret — a classic **Automation** token that bypasses 2FA)
+ a GitHub Release from the CHANGELOG.

To refresh the live site after a release, bump `@oix1987/yjd` in the
`yjd-site` repo.

## Pull requests

- Keep `npm test` and `npm run size` green (CI enforces it).
- Update `index.d.ts` and `CHANGELOG.md` for any API change.
