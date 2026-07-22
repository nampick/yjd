#!/usr/bin/env node
/**
 * Create (or update) a GitHub Release for a tag, with the body taken from the
 * matching CHANGELOG.md section. A git tag is NOT a GitHub Release — this fills
 * the Releases page. Idempotent: updates the release if it already exists.
 *
 *   node scripts/gh-release.mjs 2.7.6
 *
 * The tag vX.Y.Z must already be pushed. Token comes from `git credential fill`.
 */
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+/.test(version)) {
  console.error('Usage: node scripts/gh-release.mjs <x.y.z>');
  process.exit(1);
}
const tag = `v${version}`;
const REPO = 'nampick/yjd';

// --- token from the git credential helper ---
const token = execSync("printf 'protocol=https\\nhost=github.com\\n\\n' | git credential fill | sed -n 's/^password=//p'")
  .toString().trim();
if (!token) { console.error('No GitHub token from git credential fill.'); process.exit(1); }

// --- release notes = the CHANGELOG section for this version ---
const cl = readFileSync('CHANGELOG.md', 'utf8').split('\n');
const start = cl.findIndex((l) => l.startsWith(`## [${version}]`));
if (start === -1) { console.error(`CHANGELOG.md has no "## [${version}]" section.`); process.exit(1); }
let end = cl.findIndex((l, i) => i > start && l.startsWith('## ['));
if (end === -1) end = cl.findIndex((l, i) => i > start && /^\[[\d.]+\]:/.test(l)); // stop at link refs
if (end === -1) end = cl.length;
const titleLine = cl[start].replace(/^##\s*/, '');            // "[2.7.6] — 2026-…"
const body = cl.slice(start + 1, end).join('\n').trim() || titleLine;

async function api(method, path, payload) {
  const res = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    method,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'yjd-release',
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : {} };
}

const data = { tag_name: tag, name: tag, body };

// exists? → update, else create
const found = await api('GET', `/releases/tags/${tag}`);
if (found.status === 200) {
  const upd = await api('PATCH', `/releases/${found.json.id}`, data);
  console.log(upd.status < 300 ? `Updated release ${tag}: ${upd.json.html_url}` : `ERR ${upd.status}: ${JSON.stringify(upd.json).slice(0, 200)}`);
  process.exit(upd.status < 300 ? 0 : 1);
} else {
  const cre = await api('POST', '/releases', data);
  console.log(cre.status < 300 ? `Created release ${tag}: ${cre.json.html_url}` : `ERR ${cre.status}: ${JSON.stringify(cre.json).slice(0, 200)}`);
  process.exit(cre.status < 300 ? 0 : 1);
}
