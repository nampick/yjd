/**
 * Generate one crawlable page per playground preset + a hub index, from the
 * single source of truth in demos/presets.data.mjs. Run: `npm run build:demo-pages`.
 *
 * Output (all committed, and copied to public/ by build-site.js):
 *   demos/index.html        ← hub: a card grid linking to every preset page
 *   demos/<slug>.html        ← one interactive playground per preset, with
 *                              unique <title>/description/canonical/OG + an
 *                              intro paragraph and <a> links to the siblings.
 *
 * Each preset page is a real URL with its own metadata and copy, so search
 * engines index "minimal rich text editor", "bubble menu editor", etc. on their
 * own — instead of one SPA where only the first tab is visible to crawlers.
 */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRESETS, CDN, SITE } from '../demos/presets.data.mjs';

const DEMOS = join(dirname(fileURLToPath(import.meta.url)), '..', 'demos');
const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' rx='4' fill='%236d5efc'/%3E%3Ctext x='8' y='12' font-family='monospace' font-size='10' font-weight='700' fill='white' text-anchor='middle'%3Ey%3C/text%3E%3C/svg%3E";

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const head = ({ title, description, canonical, ogImage }) => `  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)} | yjd</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${canonical}">
  <link rel="sitemap" type="application/xml" href="/sitemap.xml">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="yjd">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <link rel="icon" href="${FAVICON}">
  <link rel="stylesheet" href="/lib/styles.min.css">
  <link rel="stylesheet" href="/demos/playground.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">`;

const nav = `  <header class="nav"><div class="wrap nav-in">
    <a class="logo" href="/site/index.html"><span class="mark">y</span> yjd <small>.io</small></a>
    <nav class="nav-links">
      <a class="hide-sm" href="/site/index.html">Home</a>
      <a href="/site/docs.html">Docs</a>
      <a href="/demos/index.html" aria-current="page">Playground</a>
      <a class="nav-cta" href="https://github.com/nampick/yjd">GitHub ↗</a>
    </nav>
  </div></header>`;

const footer = `  <footer><div class="wrap foot-in">
    <div class="logo" style="font-size:17px"><span class="mark" style="width:24px;height:24px;font-size:13px">y</span> yjd<small>.io</small></div>
    <div style="display:flex;gap:20px"><a href="/site/index.html">Home</a><a href="/site/docs.html">Docs</a><a href="https://github.com/nampick/yjd">GitHub</a></div>
  </div></footer>`;

// The preset-nav rendered as real <a> links (crawlable), current one marked.
const presetNav = (activeSlug) => `    <nav class="tabs" aria-label="Presets">
${PRESETS.map((p) => `      <a class="tab" href="/demos/${p.slug}.html"${p.slug === activeSlug ? ' aria-current="page"' : ''}>${p.title} <span class="kb">${esc(p.badge.replace(' JS', ''))}</span></a>`).join('\n')}
    </nav>`;

function presetPage(p) {
  const canonical = `${SITE}/demos/${p.slug}`;
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${p.seoTitle} | yjd`,
    description: p.seoDescription,
    url: canonical,
    isPartOf: { '@type': 'WebSite', name: 'yjd', url: SITE },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Playground', item: `${SITE}/demos/` },
        { '@type': 'ListItem', position: 2, name: p.title, item: canonical },
      ],
    },
  };
  return `<!DOCTYPE html>
<html lang="en">
<head>
${head({ title: p.seoTitle, description: p.seoDescription, canonical })}
  <script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body>
${nav}

  <main class="wrap">
    <div class="ph">
      <div class="kicker">Playground · ${esc(p.title)}</div>
      <h1>${esc(p.seoTitle)}</h1>
      <p class="intro">${p.intro}</p>
    </div>

${presetNav(p.slug)}
    <p class="tab-desc">${esc(p.desc)}</p>

    <div class="hint">💡 <span>The code shown imports from the CDN for copy-paste; here it runs against a pre-loaded core. Edit anything and hit Run.</span></div>

    <div class="stage">
      <div class="pane code-pane">
        <div class="code-bar">
          <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
          <span class="fname">${esc(p.id)}.js</span>
          <span class="spacer"></span>
          <button class="btn-ghost" id="btn-copy">⧉ Copy</button>
          <button class="btn-ghost" id="btn-reset">↺ Reset</button>
          <button class="btn-run" id="btn-run">▶ Run</button>
        </div>
        <textarea class="code" id="code" spellcheck="false">${esc(p.code)}</textarea>
        <div class="code-status ok" id="status" role="status"></div>
      </div>
      <div class="pane preview-pane">
        <div class="preview-head"><span class="lbl">Live preview</span><span class="size">${esc(p.badge)}</span></div>
        <div id="yjd-stage"></div>
      </div>
    </div>
  </main>

${footer}

  <script type="module">
    import * as YJD from '/dist/core.esm.js';
    const NAMES = Object.keys(YJD), VALUES = Object.values(YJD);
    const MOUNT_ID = 'yjd-stage';
    const codeEl = document.getElementById('code');
    const statusEl = document.getElementById('status');
    const mount = document.getElementById(MOUNT_ID);
    const ORIGINAL = ${JSON.stringify(p.code)};

    function run() {
      mount.innerHTML = '';
      try {
        const body = codeEl.value
          .replace(/import[\\s\\S]*?from\\s*['"][^'"]+['"];?/g, '')
          .replace(/['"]#editor['"]/g, "'#" + MOUNT_ID + "'");
        new Function(...NAMES, body)(...VALUES);
        statusEl.className = 'code-status ok';
        statusEl.textContent = '✓ built ${esc(p.title.toLowerCase())}';
      } catch (err) {
        statusEl.className = 'code-status err';
        statusEl.textContent = '✗ ' + err.message;
      }
    }
    document.getElementById('btn-run').addEventListener('click', run);
    document.getElementById('btn-reset').addEventListener('click', () => { codeEl.value = ORIGINAL; run(); });
    document.getElementById('btn-copy').addEventListener('click', (e) => {
      navigator.clipboard?.writeText(codeEl.value);
      const b = e.currentTarget; b.textContent = '✓ Copied'; setTimeout(() => b.textContent = '⧉ Copy', 1200);
    });
    codeEl.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') { e.preventDefault(); const s = codeEl.selectionStart; codeEl.value = codeEl.value.slice(0, s) + '  ' + codeEl.value.slice(codeEl.selectionEnd); codeEl.selectionStart = codeEl.selectionEnd = s + 2; }
    });
    run();
  <\/script>
</body>
</html>
`;
}

function hubPage() {
  const canonical = `${SITE}/demos/`;
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'yjd Playground — live rich text editor demos',
    description: 'Live, editable demos of every yjd preset — from a 17 KB comment box to a full CMS editor, an AI-style chat input, and a social post composer.',
    url: canonical,
    hasPart: PRESETS.map((p) => ({ '@type': 'WebPage', name: p.seoTitle, url: `${SITE}/demos/${p.slug}` })),
  };
  const cards = PRESETS.map((p) => `      <a class="card" href="/demos/${p.slug}.html">
        <div class="card-top"><h2>${esc(p.title)}</h2><span class="kb">${esc(p.badge.replace(' JS', ''))}</span></div>
        <p>${esc(p.desc)}</p>
        <span class="go">Open demo →</span>
      </a>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
${head({
    title: 'Playground — live rich text editor demos',
    description: 'Live, editable demos of every yjd preset: a 17 KB comment box, a bubble-menu editor, an AI-style chat input, blog, full CMS, and a social post composer.',
    canonical,
  })}
  <script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body>
${nav}

  <main class="wrap">
    <div class="ph">
      <div class="kicker">Playground</div>
      <h1>Try yjd, live</h1>
      <p>Pick a preset below to open its own interactive demo — edit the config, press <strong>Run</strong>, and watch the editor rebuild. Same tree-shakeable <span class="mono">/core</span> entry every time.</p>
    </div>

    <div class="cards">
${cards}
    </div>
  </main>

${footer}
</body>
</html>
`;
}

// Write the hub + every preset page.
writeFileSync(join(DEMOS, 'index.html'), hubPage());
for (const p of PRESETS) writeFileSync(join(DEMOS, `${p.slug}.html`), presetPage(p));

console.log(`Generated demos/index.html (hub) + ${PRESETS.length} preset pages: ${PRESETS.map((p) => p.slug).join(', ')}`);
