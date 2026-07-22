/**
 * Generate the "yjd vs <editor>" comparison pages + the hub, from
 * site/compare.data.mjs. Run: `npm run build:compare`.
 *
 *   site/vs/<slug>.html   → /site/vs/<slug>   (one per competitor)
 *   site/compare.html      → /site/compare      (hub)
 *
 * Fair-comparison pages targeting "<editor> alternative" / "yjd vs <editor>"
 * search intent, on the existing yjd.io design system.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, YJD, ROWS, COMPETITORS } from '../site/compare.data.mjs';

const SITE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'site');
mkdirSync(join(SITE_DIR, 'vs'), { recursive: true });

const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' rx='4' fill='%236d5efc'/%3E%3Ctext x='8' y='12' font-family='monospace' font-size='10' font-weight='700' fill='white' text-anchor='middle'%3Ey%3C/text%3E%3C/svg%3E";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const head = ({ title, description, canonical, jsonld }) => `  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
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
  <link rel="stylesheet" href="/site/frameworks.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <script type="application/ld+json">${JSON.stringify(jsonld)}</script>`;

const nav = `  <header class="nav"><div class="wrap nav-in">
    <a class="logo" href="/site/index.html"><span class="mark">y</span> yjd <small>.io</small></a>
    <nav class="nav-links">
      <a class="hide-sm" href="/site/index.html">Home</a>
      <a href="/site/docs.html">Docs</a>
      <a href="/demos/index.html">Playground</a>
      <a class="nav-cta" href="https://github.com/nampick/yjd">GitHub ↗</a>
    </nav>
  </div></header>`;

const footer = `  <footer><div class="wrap foot-in">
    <div class="logo" style="font-size:17px"><span class="mark" style="width:24px;height:24px;font-size:13px">y</span> yjd<small>.io</small></div>
    <div style="display:flex;gap:20px"><a href="/site/index.html">Home</a><a href="/site/compare.html">Compare</a><a href="/site/docs.html">Docs</a><a href="https://github.com/nampick/yjd">GitHub</a></div>
  </div></footer>`;

const liveEditor = `  <script type="module">
    import yjd from '/dist/rich-editor.esm.js';
    new yjd('#live', { width: '100%', placeholder: 'Type here…',
      content: '<p>This is <b>yjd</b> — a ~17 KB editor. Type in it 👋</p><ul><li>zero dependencies</li><li>any framework</li></ul>',
      toolbar1: [
        { group: 'text-format', items: ['bold', 'italic', 'underline'] },
        { group: 'paragraph', items: ['heading'] },
        { group: 'link', items: ['link'] },
        { group: 'paragraph-ops', items: ['list'] },
      ],
    });
  <\/script>`;

function fmt(key, val) {
  if (key === 'types') {
    if (/^yes/i.test(val)) return '<span class="yes">✓</span> Yes';
    if (/community/i.test(val)) return '<span class="partial">~</span> Community';
  }
  return esc(val);
}
function tableRows(col) {
  return ROWS.map(([label, key]) =>
    `        <tr><th>${esc(label)}</th><td class="yjd">${fmt(key, YJD[key])}</td><td>${fmt(key, col[key])}</td></tr>`
  ).join('\n');
}

function competitorPage(c) {
  const canonical = `${SITE}/site/vs/${c.slug}`;
  const jsonld = {
    '@context': 'https://schema.org', '@type': 'WebPage',
    name: c.seoTitle, description: c.seoDescription, url: canonical,
    isPartOf: { '@type': 'WebSite', name: 'yjd', url: SITE },
    breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Compare', item: `${SITE}/site/compare` },
      { '@type': 'ListItem', position: 2, name: `yjd vs ${c.name}`, item: canonical },
    ] },
  };
  const others = COMPETITORS.filter((x) => x.slug !== c.slug)
    .map((x) => `<a href="/site/vs/${x.slug}.html" style="color:var(--violet-ink);font-weight:600">vs ${esc(x.name)}</a>`).join(' · ');
  return `<!DOCTYPE html>
<html lang="en">
<head>
${head({ title: c.seoTitle, description: c.seoDescription, canonical, jsonld })}
</head>
<body>
${nav}
  <main class="wrap">
    <div class="ph">
      <div class="kicker">Comparison</div>
      <h1>yjd vs ${esc(c.name)}</h1>
      <p class="lede">${esc(c.intro)}</p>
      <div class="cta-row">
        <a class="btn btn-primary" href="/site/docs.html">Get started with yjd</a>
        <a class="btn" href="/demos/index.html">Playground</a>
        <a class="btn" href="${esc(c.url)}" rel="nofollow noopener">${esc(c.name)} ↗</a>
      </div>
    </div>

    <section>
      <h2>At a glance</h2>
      <div class="cmp-wrap">
        <table class="cmp">
          <thead><tr><th></th><th class="yjd">yjd</th><th>${esc(c.name)}</th></tr></thead>
          <tbody>
${tableRows(c.col)}
          </tbody>
        </table>
      </div>
      <p class="cmp-legend">Facts, not a scorecard — both are capable editors. Sizes are approximate and vary with configuration/plugins; figures for ${esc(c.name)} come from its public docs (<a href="${esc(c.url)}" rel="nofollow noopener">${esc(c.url)}</a>). The trade-offs are below.</p>
    </section>

    <section>
      <h2>Which should you pick?</h2>
      <div class="cmp-cols">
        <div class="cmp-col">
          <h3>Choose ${esc(c.name)} when</h3>
          <ul>${c.theyWin.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
          <p class="disclaimer">${esc(c.whenThem)}</p>
        </div>
        <div class="cmp-col yjd">
          <h3>Choose yjd when</h3>
          <ul>${c.yjdWins.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
          <p class="disclaimer">${esc(c.whenYjd)}</p>
        </div>
      </div>
    </section>

    <section>
      <div class="split">
        <div>
          <h2>Try yjd</h2>
          <p class="sec-lead">A real editor, ~17 KB, zero dependencies. Install: <code>npm i @oix1987/yjd</code>. It runs in <a href="/site/react.html" style="color:var(--violet-ink);font-weight:600">React</a>, <a href="/site/vue.html" style="color:var(--violet-ink);font-weight:600">Vue</a>, <a href="/site/angular.html" style="color:var(--violet-ink);font-weight:600">Angular</a> and vanilla.</p>
          <p class="sec-lead">More comparisons: ${others}</p>
        </div>
        <div>
          <div class="live-card">
            <div class="bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="tag">yjd — live</span></div>
            <div id="live"></div>
          </div>
        </div>
      </div>
    </section>
  </main>
${footer}
${liveEditor}
</body>
</html>
`;
}

function hubPage() {
  const canonical = `${SITE}/site/compare`;
  const jsonld = {
    '@context': 'https://schema.org', '@type': 'CollectionPage',
    name: 'yjd vs popular rich text editors', description: 'Fair comparisons of yjd against Tiptap, Quill, TinyMCE, CKEditor, Slate and Lexical.',
    url: canonical, hasPart: COMPETITORS.map((c) => ({ '@type': 'WebPage', name: c.seoTitle, url: `${SITE}/site/vs/${c.slug}` })),
  };
  const rows = COMPETITORS.map((c) => `        <tr><th><a href="/site/vs/${c.slug}.html" style="color:var(--violet-ink);font-weight:600">yjd vs ${esc(c.name)}</a></th><td>${esc(c.col.size)}</td><td>${esc(c.col.license)}</td><td>${esc(c.col.bestFor)}</td></tr>`).join('\n');
  const cards = COMPETITORS.map((c) => `      <a class="card" href="/site/vs/${c.slug}.html">
        <div class="card-top"><h2>vs ${esc(c.name)}</h2></div>
        <p>${esc(c.whenYjd)}</p>
        <span class="go">Compare →</span>
      </a>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
${head({
    title: 'yjd vs popular rich text editors — alternatives compared',
    description: 'Fair comparisons of yjd against Tiptap, Quill, TinyMCE, CKEditor, Slate and Lexical — size, dependencies, frameworks, license and when each fits.',
    canonical, jsonld,
  })}
  <link rel="stylesheet" href="/demos/playground.css">
</head>
<body>
${nav}
  <main class="wrap">
    <div class="ph">
      <div class="kicker">Comparisons</div>
      <h1>yjd vs the popular rich text editors</h1>
      <p class="lede">How yjd — a dependency-free, tree-shakeable ~17 KB editor — compares to the well-known options. Fair takes: each page says when the other tool is the better call.</p>
    </div>
    <section>
      <div class="cmp-wrap">
        <table class="cmp">
          <thead><tr><th>Comparison</th><th>Their size (approx)</th><th>License</th><th>Best for</th></tr></thead>
          <tbody>
${rows}
          </tbody>
        </table>
      </div>
      <p class="disclaimer">yjd: ~17 KB min → ~75 KB full (gzip), zero deps, ISC. Sizes above are approximate and configuration-dependent.</p>
    </section>
    <section>
      <div class="cards">
${cards}
      </div>
    </section>
  </main>
${footer}
</body>
</html>
`;
}

for (const c of COMPETITORS) writeFileSync(join(SITE_DIR, 'vs', `${c.slug}.html`), competitorPage(c));
writeFileSync(join(SITE_DIR, 'compare.html'), hubPage());
console.log(`Generated site/compare.html + ${COMPETITORS.length} vs-pages: ${COMPETITORS.map((c) => c.slug).join(', ')}`);
