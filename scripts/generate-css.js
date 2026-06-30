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
// Minify so the inlined CSS string isn't shipped with comments/whitespace
// (terser only minifies JS, not the CSS inside the string literal).
const minified = minify(raw).css;

// Wrap EVERYTHING in a cascade layer. Unlayered author CSS always beats layered
// CSS regardless of specificity, so an app can override any --rte-* token (or
// any rule) — e.g. `:root { --rte-bg: #111 }` — and win with zero !important and
// no specificity battles. This is the theming contract: "your CSS always wins".
const css = `@layer yjd {\n${minified}\n}`;

// (1) JS module — used by the all-in-one build (StylesLoader injects it).
const banner = '// AUTO-GENERATED from lib/styles.css by scripts/generate-css.js — do not edit directly.\n';
writeFileSync(jsOut, `${banner}export default ${JSON.stringify(css)};\n`, 'utf8');

// (2) Standalone minified stylesheet — for tree-shaken /core consumers who
//     prefer to <link> the CSS once (keeps it out of the JS bundle, cached).
writeFileSync(minOut, css, 'utf8');

console.log(`Generated styles.css.js + styles.min.css — CSS minified ${raw.length} -> ${css.length} bytes`);
