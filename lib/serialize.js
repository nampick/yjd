/**
 * Serialization for yjd content — HTML <-> Markdown and HTML <-> JSON.
 *
 * Targeted at the HTML yjd emits (headings, inline marks, lists, links,
 * images, blockquote, code, tables, hr, and mention tokens). Browser-only
 * (uses the DOM). Zero dependencies.
 *
 *   import { htmlToMarkdown, markdownToHtml, domToJson, jsonToHtml } from '.../serialize.js'
 */

import { isSafeUrl } from './utils/sanitize.js';

// One URL capture that tolerates a single level of balanced parens, so a real
// link like ...Foo_(disambiguation) isn't truncated at the inner ')'. Used for
// links, images and mentions alike. (A bare [^)]+ cut the URL at the first ')'.)
const URL_CAP = '((?:[^()]|\\([^()]*\\))*)';

// markdownToHtml / jsonToHtml build HTML STRINGS that an integrator may inject
// without a downstream sanitize (both are public standalone exports). So the
// serializer must be self-safe: every emitted href/src goes through the same
// scheme allowlist the DOM sanitizer uses — one source of truth, no drift. An
// unsafe URL yields '' so the caller drops the attribute (or the element).
function safeUrl(url, opts) {
  return isSafeUrl(url, opts) ? String(url).trim() : '';
}

/* ============================ HTML -> Markdown ============================ */

export function htmlToMarkdown(html) {
  const root = document.createElement('div');
  root.innerHTML = html || '';
  const md = blocksToMd(root, 0).replace(/\n{3,}/g, '\n\n').trim();
  // Empty content → '' (not '\n'), so an app's dirty-check baseline stays stable.
  return md ? md + '\n' : '';
}

function blocksToMd(parent, depth) {
  let out = '';
  parent.childNodes.forEach((node) => { out += nodeBlock(node, depth); });
  return out;
}

function nodeBlock(node, depth) {
  if (node.nodeType === 3) {
    const t = node.textContent.replace(/\s+/g, ' ');
    return t.trim() ? t + '\n\n' : '';
  }
  if (node.nodeType !== 1) return '';
  const tag = node.tagName;
  switch (tag) {
    case 'H1': case 'H2': case 'H3': case 'H4': case 'H5': case 'H6':
      return '#'.repeat(+tag[1]) + ' ' + inline(node) + '\n\n';
    case 'P': case 'DIV': {
      const c = inline(node);
      return c.trim() ? c + '\n\n' : '';
    }
    case 'BLOCKQUOTE':
      return inline(node).split('\n').map((l) => '> ' + l).join('\n') + '\n\n';
    case 'PRE':
      return '```\n' + node.textContent.replace(/\n$/, '') + '\n```\n\n';
    case 'UL': return listToMd(node, depth, false, node.classList && node.classList.contains('checklist')) + '\n';
    case 'OL': return listToMd(node, depth, true) + '\n';
    case 'HR': return '---\n\n';
    case 'TABLE': return tableToMd(node) + '\n';
    case 'FIGURE': return blocksToMd(node, depth);
    case 'IMG': return imgToMd(node) + '\n\n';
    case 'VIDEO': return videoToMd(node) + '\n\n';
    case 'IFRAME': { const m = iframeToMd(node); return m ? m + '\n\n' : ''; }
    case 'BR': return '\n';
    default:
      return inline(node) + '\n\n';
  }
}

function listToMd(node, depth, ordered, checklist) {
  let out = '', i = 1;
  node.childNodes.forEach((li) => {
    if (li.nodeType !== 1 || li.tagName !== 'LI') return;
    // GFM task list: ul.checklist > li[data-checked] <-> "- [x] " / "- [ ] "
    const box = checklist ? (li.getAttribute('data-checked') === 'true' ? '[x] ' : '[ ] ') : '';
    const marker = (ordered ? (i++) + '. ' : '- ') + box;
    const pad = '  '.repeat(depth);
    let text = '', nested = '';
    li.childNodes.forEach((ch) => {
      if (ch.nodeType === 1 && (ch.tagName === 'UL' || ch.tagName === 'OL')) {
        nested += listToMd(ch, depth + 1, ch.tagName === 'OL',
          ch.tagName === 'UL' && ch.classList.contains('checklist'));
      } else {
        text += inlineNode(ch);
      }
    });
    out += pad + marker + text.trim() + '\n' + nested;
  });
  return out;
}

function tableToMd(node) {
  const rows = [...node.querySelectorAll('tr')];
  if (!rows.length) return '';
  const cells = (r) => [...r.children].map((c) => inline(c).replace(/\|/g, '\\|').trim());
  const head = cells(rows[0]);
  let out = '| ' + head.join(' | ') + ' |\n| ' + head.map(() => '---').join(' | ') + ' |\n';
  rows.slice(1).forEach((r) => { out += '| ' + cells(r).join(' | ') + ' |\n'; });
  return out;
}

function imgToMd(node) {
  const src = safeUrl(node.getAttribute('src') || '', { allowDataImage: true });
  return src ? `![${node.getAttribute('alt') || ''}](${src})` : '';
}

function videoToMd(node) {
  const src = safeUrl(node.getAttribute('src') || '', { allowDataAV: true });
  return src ? `![video](${src})` : '';
}

// Only the video feature's trusted embeds (YouTube/Vimeo) round-trip; any other
// iframe keeps the old behavior (dropped).
function iframeToMd(node) {
  const src = node.getAttribute('src') || '';
  return /youtube\.com\/embed\/|youtu\.be\/|player\.vimeo\.com\/video\//.test(src)
    ? `![video](${src})` : '';
}

function inline(node) {
  let out = '';
  node.childNodes.forEach((ch) => { out += inlineNode(ch); });
  return out;
}

function inlineNode(node) {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1) return '';
  const tag = node.tagName;
  if (node.classList && node.classList.contains('mention')) {
    // An explicit per-trigger token (mention serialize(item)) wins verbatim.
    const custom = node.getAttribute('data-token');
    if (custom != null) return custom;
    const id = node.getAttribute('data-id') || '';
    const name = (node.textContent || '').replace(/^[@#]/, '');
    // Prefer the authoritative trigger stored on the token; fall back to the
    // first rendered char, then '@', so an empty token never yields "undefined".
    const trig = node.getAttribute('data-trigger') || (node.textContent || '@')[0] || '@';
    return `${trig}[${name}](${id})`;
  }
  if (node.classList && node.classList.contains('yjd-file-chip')) {
    const url = safeUrl(node.getAttribute('href') || '', { allowDataFile: true });
    const nameEl = node.querySelector ? node.querySelector('.yjd-file-name') : null;
    const name = node.getAttribute('data-name') || (nameEl && nameEl.textContent) || 'file';
    const size = node.getAttribute('data-size') || '';
    const label = size ? `${name} (${size})` : name;
    // Drop the link (keep the label as text) when the href isn't safe, so the
    // emitted markdown never carries a scriptable URL to another renderer.
    return url ? `[${label}](${url})` : label;
  }
  switch (tag) {
    case 'B': case 'STRONG': return '**' + inline(node) + '**';
    case 'I': case 'EM': return '*' + inline(node) + '*';
    case 'S': case 'STRIKE': case 'DEL': return '~~' + inline(node) + '~~';
    case 'U': return '<u>' + inline(node) + '</u>';
    case 'CODE': return '`' + node.textContent + '`';
    case 'A': { const h = safeUrl(node.getAttribute('href') || ''); return h ? '[' + inline(node) + '](' + h + ')' : inline(node); }
    case 'IMG': return imgToMd(node);
    case 'VIDEO': return videoToMd(node);
    case 'IFRAME': return iframeToMd(node);
    case 'BR': return '  \n';
    default: return inline(node); // spans (colour/font) → keep text only
  }
}

/* ============================ Markdown -> HTML ============================ */

/**
 * Make a PARTIAL markdown string safe to render mid-stream. Streaming an LLM
 * response often cuts off inside a token (`**bol`, an open code fence, a
 * half-typed marker) — rendering that raw shows stray `**` or breaks. This
 * closes an odd code fence and drops a dangling trailing emphasis/code marker so
 * the in-progress text renders cleanly. Use for the live view; render the final
 * (complete) markdown as-is.
 */
export function balancePartialMarkdown(md) {
  let s = String(md == null ? '' : md);
  // An open fenced code block: close it and stop (its body is literal).
  if (((s.match(/```/g) || []).length) % 2 === 1) return s + '\n```';
  // Close unclosed inline markers so an in-progress **bold / `code renders.
  for (const m of ['**', '~~', '`']) {
    const re = new RegExp(m.replace(/[*`]/g, '\\$&'), 'g');
    if (((s.match(re) || []).length) % 2 === 1) s += m;
  }
  return s;
}

export function markdownToHtml(md) {
  const lines = (md || '').replace(/\r\n/g, '\n').split('\n');
  let html = '', i = 0;
  const isList = (l) => /^\s*([-*+]|\d+\.)\s+/.test(l);
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*$/.test(line)) { i++; continue; }
    if (/^---+$/.test(line.trim())) { html += '<hr>'; i++; continue; }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { html += `<h${h[1].length}>${inlineMd(h[2])}</h${h[1].length}>`; i++; continue; }
    if (/^```/.test(line)) {
      i++; let code = '';
      while (i < lines.length && !/^```/.test(lines[i])) { code += lines[i] + '\n'; i++; }
      i++; html += '<pre>' + escapeHtml(code.replace(/\n$/, '')) + '</pre>'; continue;
    }
    if (/^>\s?/.test(line)) {
      const q = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { q.push(lines[i].replace(/^>\s?/, '')); i++; }
      html += '<blockquote>' + inlineMd(q.join(' ')) + '</blockquote>'; continue;
    }
    if (/^\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const r = parseTable(lines, i); html += r.html; i = r.next; continue;
    }
    if (isList(line)) { const r = parseList(lines, i, 0); html += r.html; i = r.next; continue; }
    const para = [line]; i++;
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,6}\s|>|```)/.test(lines[i]) &&
           !/^---+$/.test(lines[i].trim()) && !isList(lines[i])) { para.push(lines[i]); i++; }
    html += '<p>' + inlineMd(para.join('\n').trim()) + '</p>';
  }
  return html;
}

function indentOf(l) { return (l.match(/^(\s*)/)[1] || '').length; }

function parseList(lines, start, baseIndent) {
  const ordered = /^\s*\d+\./.test(lines[start]);
  let i = start, items = '', task = false;
  while (i < lines.length) {
    const l = lines[i];
    if (/^\s*$/.test(l)) { i++; continue; }
    const ind = indentOf(l);
    const m = l.match(/^\s*([-*+]|\d+\.)\s+(.*)$/);
    if (!m || ind < baseIndent) break;
    if (ind > baseIndent) { // nested list belongs to previous <li>
      const r = parseList(lines, i, ind);
      items = items.replace(/<\/li>$/, r.html + '</li>');
      i = r.next; continue;
    }
    let content = m[2], attrs = '';
    if (!ordered) {
      // GFM task item: "- [x] text" / "- [ ] text"
      const t = content.match(/^\[([ xX])\]\s?(.*)$/);
      if (t) { task = true; attrs = ` data-checked="${t[1] === ' ' ? 'false' : 'true'}"`; content = t[2]; }
    }
    items += '<li' + attrs + '>' + inlineMd(content) + '</li>';
    i++;
  }
  const open = ordered ? '<ol>' : (task ? '<ul class="checklist">' : '<ul>');
  return { html: open + items + (ordered ? '</ol>' : '</ul>'), next: i };
}

function parseTable(lines, start) {
  const row = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  const head = row(lines[start]);
  let i = start + 2, body = '';
  while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) {
    body += '<tr>' + row(lines[i]).map((c) => `<td>${inlineMd(c)}</td>`).join('') + '</tr>';
    i++;
  }
  const thead = '<tr>' + head.map((c) => `<td><b>${inlineMd(c)}</b></td>`).join('') + '</tr>';
  return { html: `<table class="rich-editor-table"><tbody>${thead}${body}</tbody></table>`, next: i };
}

function inlineMd(s) {
  // images, mentions, links, then marks. Order matters.
  return s
    .replace(new RegExp('!\\[([^\\]]*)\\]\\(' + URL_CAP + '\\)', 'g'), (_, a, src) => mediaMd(a, src))
    .replace(new RegExp('([@#])\\[([^\\]]+)\\]\\(' + URL_CAP + '\\)', 'g'), (_, t, name, id) => `<span class="mention" data-id="${attr(id)}">${t}${escapeHtml(name)}</span>`)
    .replace(new RegExp('\\[([^\\]]+)\\]\\(' + URL_CAP + '\\)', 'g'), (_, t, href) => linkMd(t, href))
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<i>$2</i>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')
    .replace(/`([^`]+)`/g, (_, c) => '<code>' + escapeHtml(c) + '</code>')
    .replace(/\n/g, '<br>');
}

// A safe link, or — when the scheme is rejected — the bare text (matching the
// DOM sanitizer, which strips a dangerous href; here we drop the now-inert
// anchor entirely rather than emit an unclickable <a>).
function linkMd(text, href) {
  const url = safeUrl(href);
  return url
    ? `<a href="${attr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`
    : escapeHtml(text);
}

// Image syntax carries all media: a YouTube/Vimeo URL becomes an embed iframe,
// a video-file URL becomes a <video> player, anything else stays an <img>.
// Alt "video" is the tie-breaker for extension-less URLs (signed/capability
// URLs, CDN ids) — it's the alt this file's own serializer commits to for
// videos, so yjd output always round-trips back to a player. Every emitted src
// is scheme-checked (video/audio + raster-image data URIs allowed, like the
// DOM sanitizer); an unsafe URL drops the element rather than emit it.
function mediaMd(alt, src) {
  const yt = src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `<iframe class="inserted-video youtube-video" src="https://www.youtube.com/embed/${yt[1]}" width="560" height="315" frameborder="0" allowfullscreen contenteditable="false"></iframe>`;
  if (/player\.vimeo\.com\/video\//.test(src)) {
    const u = safeUrl(src);
    return u ? `<iframe class="inserted-video" src="${attr(u)}" width="560" height="315" frameborder="0" allowfullscreen contenteditable="false"></iframe>` : '';
  }
  if (/\.(mp4|webm|ogg|mov|avi|mkv)(?:[?#]|$)/i.test(src) || alt.trim().toLowerCase() === 'video') {
    const u = safeUrl(src, { allowDataAV: true });
    return u ? `<video class="inserted-video" src="${attr(u)}" controls style="max-width:100%;height:auto" contenteditable="false"></video>` : '';
  }
  const u = safeUrl(src, { allowDataImage: true });
  return u ? `<img class="inserted-image" src="${attr(u)}" alt="${attr(alt)}" style="max-width:100%;height:auto">` : '';
}

function escapeHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function attr(s) { return String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

/* ============================== HTML <-> JSON ============================= */

export function domToJson(html) {
  const root = document.createElement('div');
  root.innerHTML = html || '';
  return { type: 'doc', content: [...root.childNodes].map(nodeToJson).filter(Boolean) };
}

function nodeToJson(node) {
  if (node.nodeType === 3) {
    const text = node.textContent;
    return text ? { text } : null;
  }
  if (node.nodeType !== 1) return null;
  const obj = { tag: node.tagName.toLowerCase() };
  if (node.attributes.length) {
    obj.attrs = {};
    for (const a of node.attributes) obj.attrs[a.name] = a.value;
  }
  const kids = [...node.childNodes].map(nodeToJson).filter(Boolean);
  if (kids.length) obj.content = kids;
  return obj;
}

export function jsonToHtml(json) {
  const nodes = json && json.content ? json.content : (Array.isArray(json) ? json : []);
  return nodes.map(jsonNodeToHtml).join('');
}

// jsonToHtml is a public standalone export too, so it applies the same attribute
// hygiene the DOM sanitizer does: drop on* event handlers, and scheme-check any
// href/src/xlink:href (raster-image / AV data URIs allowed by tag) so a hostile
// JSON doc can't smuggle `javascript:` or an inline handler into emitted HTML.
const URL_ATTRS = new Set(['href', 'src', 'xlink:href']);

function jsonAttrs(tag, attrs) {
  if (!attrs) return '';
  const allowDataImage = tag === 'img';
  const allowDataAV = tag === 'video' || tag === 'audio' || tag === 'source';
  let out = '';
  for (const [k, v] of Object.entries(attrs)) {
    const key = k.toLowerCase();
    if (key.startsWith('on')) continue; // event handlers never survive
    if (URL_ATTRS.has(key) && !isSafeUrl(v, { allowDataImage, allowDataAV })) continue;
    out += ` ${k}="${attr(v)}"`;
  }
  return out;
}

function jsonNodeToHtml(n) {
  if (n == null) return '';
  if (n.text != null) return escapeHtml(n.text);
  if (!n.tag) return '';
  const attrs = jsonAttrs(n.tag, n.attrs);
  const inner = (n.content || []).map(jsonNodeToHtml).join('');
  const VOID = new Set(['img', 'hr', 'br', 'input']);
  if (VOID.has(n.tag)) return `<${n.tag}${attrs}>`;
  return `<${n.tag}${attrs}>${inner}</${n.tag}>`;
}
