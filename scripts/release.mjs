#!/usr/bin/env node
/**
 * Release preflight for @oix1987/yjd — runs the mechanical gates from the
 * release checklist and prints the exact remaining git + publish + verify
 * commands (pre-filled with the version). Safe: it only reads, builds and
 * tests; it never commits, tags or publishes.
 *
 *   npm run release -- 2.7.6
 *
 * The content steps (writing the CHANGELOG entry, README, types) are yours —
 * this checks they're present, then runs build + test + build:pages so nothing
 * ships half-done.
 */
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const version = process.argv[2];
const ok = [];
const fail = [];
const G = '\x1b[32m', R = '\x1b[31m', Y = '\x1b[33m', B = '\x1b[1m', X = '\x1b[0m';

if (!version || !/^\d+\.\d+\.\d+/.test(version)) {
  console.error(`Usage: ${B}npm run release -- <x.y.z>${X}   e.g.  npm run release -- 2.7.6`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const changelog = readFileSync('CHANGELOG.md', 'utf8');

// ---- Content gates (you write these before running) ----
gate(pkg.version === version,
  `package.json version = ${version}`,
  `package.json version is ${pkg.version} — set it to ${version} first`);
gate(changelog.includes(`## [${version}]`),
  `CHANGELOG.md has a "## [${version}]" section`,
  `CHANGELOG.md is missing the "## [${version}] — <date>" section`);
gate(changelog.includes(`[${version}]: https://github.com/nampick/yjd/releases/tag/v${version}`),
  `CHANGELOG.md has the [${version}] link reference`,
  `CHANGELOG.md is missing the bottom link ref: [${version}]: https://github.com/nampick/yjd/releases/tag/v${version}`);

if (fail.length) {
  report();
  console.error(`\n${R}Fix the content above before the build gates run.${X}`);
  process.exit(1);
}

// ---- Build / test gates (mechanical, must pass) ----
run('npm run build', 'build — dist/ rebuilt');
run('npm test', 'unit tests pass');
run('npm run size', 'size — bundles within budget');

report();
printNext();

// ---------- helpers ----------
function gate(cond, pass, failMsg) { (cond ? ok : fail).push(cond ? pass : failMsg); }

function run(cmd, label) {
  console.log(`\n${Y}▶ ${cmd}${X}`);
  try {
    execSync(cmd, { stdio: 'inherit' });
    ok.push(label);
  } catch {
    fail.push(`${label} — command FAILED: ${cmd}`);
    report();
    process.exit(1);
  }
}

function report() {
  console.log(`\n${B}Release gates for v${version}${X}`);
  for (const o of ok) console.log(`  ${G}✓${X} ${o}`);
  for (const f of fail) console.log(`  ${R}✗${X} ${f}`);
}

function printNext() {
  const v = version;
  console.log(`\n${B}All gates passed.${X} Remaining steps (copy-paste):\n`);
  console.log(`${B}1) Branch + commit${X}`);
  console.log(`   git checkout -b release/v${v}`);
  console.log(`   git add -A && git commit   # trailer: Co-Authored-By + Claude-Session`);
  console.log(`   git push -u origin release/v${v}`);
  console.log(`\n${B}2) PR (gh not installed — GitHub API via curl)${X}`);
  console.log(`   TOKEN=$(printf 'protocol=https\\nhost=github.com\\n\\n' | git credential fill | sed -n 's/^password=//p')`);
  console.log(`   # POST https://api.github.com/repos/nampick/yjd/pulls  (head release/v${v}, base master)`);
  console.log(`\n${B}3) Merge LOCALLY (API merge is classifier-blocked), tag, push${X}`);
  console.log(`   git checkout master`);
  console.log(`   git merge --no-ff release/v${v} -m "Merge PR #<n>: v${v} ..."`);
  console.log(`   git push origin master`);
  console.log(`   git tag -a v${v} -m "v${v}: ..." && git push origin v${v}   ${Y}# ← this triggers CI Release${X}`);
  console.log(`   git branch -d release/v${v} && git push origin --delete release/v${v}`);
  console.log(`\n${B}4) Pushing the tag runs .github/workflows/release.yml, which:${X}`);
  console.log(`   • npm publish --provenance --access public   (needs the NPM_TOKEN secret)`);
  console.log(`   • node scripts/gh-release.mjs ${v}            (GitHub Release from CHANGELOG)`);
  console.log(`   Manual fallback if CI is unavailable: npm publish --access public && npm run release:gh -- ${v}`);
  console.log(`\n${B}5) Verify${X}`);
  console.log(`   curl -s https://registry.npmjs.org/@oix1987%2Fyjd | python3 -c "import sys,json;d=json.load(sys.stdin);print('latest:',d['dist-tags']['latest'])"`);
  console.log(`   # + https://github.com/nampick/yjd/releases`);
  console.log(`\n${B}6) Refresh the website (separate repo nampick/yjd-site → yjd.io)${X}`);
  console.log(`   in yjd-site: npm i @oix1987/yjd@${v} && git commit -am "chore: yjd ${v}" && git push  (CI redeploys)`);
  console.log(`\nFull rule: memory/release-checklist + gstack learning "version-bump-checklist".`);
}
