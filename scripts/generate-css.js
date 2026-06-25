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
const outPath = join(__dirname, '..', 'lib', 'styles.css.js');

const raw = readFileSync(cssPath, 'utf8');
// Minify so the inlined CSS string isn't shipped with comments/whitespace
// (terser only minifies JS, not the CSS inside the string literal).
const css = minify(raw).css;

const banner = '// AUTO-GENERATED from lib/styles.css by scripts/generate-css.js — do not edit directly.\n';
const out = `${banner}export default ${JSON.stringify(css)};\n`;

writeFileSync(outPath, out, 'utf8');
console.log(`Generated ${outPath} — CSS minified ${raw.length} -> ${css.length} bytes`);
