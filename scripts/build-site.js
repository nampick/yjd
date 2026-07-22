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
import { rmSync, mkdirSync, cpSync, copyFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PRESETS } from '../demos/presets.data.mjs';

const out = 'public';
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'site'), { recursive: true });
mkdirSync(join(out, 'demos'), { recursive: true });
mkdirSync(join(out, 'examples'), { recursive: true });
mkdirSync(join(out, 'dist'), { recursive: true });
mkdirSync(join(out, 'lib'), { recursive: true });

// pages
copyFileSync('site/index.html', join(out, 'index.html'));      // landing at root
// Every static page in site/ (landing, docs, react/vue integration) + its CSS.
for (const f of readdirSync('site')) {
  if (f.endsWith('.html') || f.endsWith('.css')) {
    copyFileSync(join('site', f), join(out, 'site', f));
  }
}
// Framework integration demos (mount yjd inside React/Vue). Linked from the
// site/react.html and site/vue.html pages.
for (const f of readdirSync('examples')) {
  if (f.endsWith('.html')) copyFileSync(join('examples', f), join(out, 'examples', f));
}
// All demo pages (hub index + one per preset + integration) and the shared
// playground stylesheet. Copying the whole set keeps this in step with
// scripts/build-demo-pages.js without re-listing every slug here.
for (const f of readdirSync('demos')) {
  if (f.endsWith('.html') || f === 'playground.css') {
    copyFileSync(join('demos', f), join(out, 'demos', f));
  }
}

// editor bundles (js + sourcemaps)
for (const f of readdirSync('dist')) {
  if (f.endsWith('.js') || f.endsWith('.js.map')) {
    copyFileSync(join('dist', f), join(out, 'dist', f));
  }
}

// shared stylesheet the pages <link>
copyFileSync('lib/styles.min.css', join(out, 'lib/styles.min.css'));

// SEO: sitemap.xml + robots.txt (Cloudflare Pages serves .html at clean URLs).
const SITE = 'https://yjd.io';
const pages = [
  { loc: '/', priority: '1.0' },
  { loc: '/site/docs', priority: '0.8' },
  // Framework integration landing pages (SEO: "React/Vue rich text editor").
  { loc: '/site/react', priority: '0.8' },
  { loc: '/site/vue', priority: '0.8' },
  { loc: '/demos/', priority: '0.7' },
  // One entry per preset demo page (generated from the same source of truth).
  ...PRESETS.map((p) => ({ loc: `/demos/${p.slug}`, priority: '0.7' })),
  { loc: '/demos/integration', priority: '0.6' },
  { loc: '/examples/react.html', priority: '0.5' },
  { loc: '/examples/vue.html', priority: '0.5' },
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url>\n    <loc>${SITE}${p.loc}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`).join('\n')}
</urlset>
`;
writeFileSync(join(out, 'sitemap.xml'), sitemap);
writeFileSync(join(out, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log('Built ./public for Cloudflare Pages (landing + docs + playground + bundles + sitemap).');
