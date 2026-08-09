/**
 * Generate lib/styles.css.js from lib/styles.css.
 *
 * styles.css remains the human-edited source of truth. This produces a JS
 * module that exports the CSS as a string so it can be `import`ed directly
 * (works with native ESM in the browser AND when bundled by Rollup), removing
 * the need for a runtime fetch (which broke npm/CDN usage).
 *
 * Run via `npm run generate:css` (also runs automatically before build).
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { minify } from 'csso';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cssPath = join(__dirname, '..', 'lib', 'styles.css');
const jsOut = join(__dirname, '..', 'lib', 'styles.css.js');
const minOut = join(__dirname, '..', 'lib', 'styles.min.css');

const raw = readFileSync(cssPath, 'utf8');

// styles.css is already wrapped in `@layer yjd { … }` at the source, so the
// theming contract ("unlayered app CSS always wins, no !important / specificity
// battles") holds for EVERY shipped artifact — including the raw styles.css if a
// consumer links it directly. Here we only minify (the @layer is preserved).
//
// The un-layered structural guard at the end of styles.css MUST be minified
// separately: csso's restructure pass is @layer-ignorant and will merge a
// guard rule into an in-layer rule with the identical selector list —
// silently deleting the guard (observed with the popup-shell padding rule).
const GUARD_MARK = '/* ── Un-layered structural guard';
const guardAt = raw.indexOf(GUARD_MARK);
if (guardAt === -1) {
  throw new Error('generate-css: expected the "Un-layered structural guard" block in styles.css — popup chrome would collapse under host resets without it.');
}
const css = minify(raw.slice(0, guardAt)).css + minify(raw.slice(guardAt)).css;

// Safety net: fail loudly if the source ever loses its layer wrapper, so we
// never ship un-layered CSS that would silently break the override contract.
if (!css.includes('@layer yjd')) {
  throw new Error('generate-css: expected styles.css to be wrapped in "@layer yjd" — the theming contract would break without it.');
}

// (1) JS module — used by the all-in-one build (StylesLoader injects it).
const banner = '// AUTO-GENERATED from lib/styles.css by scripts/generate-css.js — do not edit directly.\n';
writeFileSync(jsOut, `${banner}export default ${JSON.stringify(css)};\n`, 'utf8');

// (2) Standalone minified stylesheet — for tree-shaken /core consumers who
//     prefer to <link> the CSS once (keeps it out of the JS bundle, cached).
writeFileSync(minOut, css, 'utf8');

console.log(`Generated styles.css.js + styles.min.css — CSS minified ${raw.length} -> ${css.length} bytes`);
