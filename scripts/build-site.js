/**
 * Assemble a clean static site into ./public for Cloudflare Pages.
 *
 * Run AFTER `npm run build` (needs dist/ + lib/styles.min.css). Produces:
 *   public/
 *     index.html          ← the landing (copied from site/index.html)
 *     site/index.html, site/docs.html
 *     demos/index.html    ← the playground
 *     dist/*.js(.map)     ← bundled editor + core
 *     lib/styles.min.css  ← the shared stylesheet the pages link
 *
 * All pages use absolute paths (/dist, /lib, /demos, /site) so they resolve
 * from the public/ root. The landing is duplicated at the root so yjd.io/
 * shows it directly — no redirect needed.
 */
import { rmSync, mkdirSync, cpSync, copyFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const out = 'public';
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'site'), { recursive: true });
mkdirSync(join(out, 'demos'), { recursive: true });
mkdirSync(join(out, 'dist'), { recursive: true });
mkdirSync(join(out, 'lib'), { recursive: true });

// pages
copyFileSync('site/index.html', join(out, 'index.html'));      // landing at root
copyFileSync('site/index.html', join(out, 'site/index.html'));
copyFileSync('site/docs.html', join(out, 'site/docs.html'));
copyFileSync('demos/index.html', join(out, 'demos/index.html'));

// editor bundles (js + sourcemaps)
for (const f of readdirSync('dist')) {
  if (f.endsWith('.js') || f.endsWith('.js.map')) {
    copyFileSync(join('dist', f), join(out, 'dist', f));
  }
}

// shared stylesheet the pages <link>
copyFileSync('lib/styles.min.css', join(out, 'lib/styles.min.css'));

console.log('Built ./public for Cloudflare Pages (landing + docs + playground + bundles).');
