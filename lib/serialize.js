/**
 * Serialization for yjd content — HTML <-> Markdown and HTML <-> JSON.
 *
 * Targeted at the HTML yjd emits (headings, inline marks, lists, links,
 * images, blockquote, code, tables, hr, and mention tokens). Browser-only
 * (uses the DOM). Zero dependencies.
 *
 *   import { htmlToMarkdown, markdownToHtml, domToJson, jsonToHtml } from '.../serialize.js'
 */

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
    case 'UL': return listToMd(node, depth, false) + '\n';
    case 'OL': return listToMd(node, depth, true) + '\n';
    case 'HR': return '---\n\n';
    case 'TABLE': return tableToMd(node) + '\n';
    case 'FIGURE': return blocksToMd(node, depth);
    case 'IMG': return imgToMd(node) + '\n\n';
    case 'BR': return '\n';
    default:
      return inline(node) + '\n\n';
  }
}

function listToMd(node, depth, ordered) {
  let out = '', i = 1;
  node.childNodes.forEach((li) => {
    if (li.nodeType !== 1 || li.tagName !== 'LI') return;
    const marker = ordered ? (i++) + '. ' : '- ';
    const pad = '  '.repeat(depth);
    let text = '', nested = '';
    li.childNodes.forEach((ch) => {
      if (ch.nodeType === 1 && (ch.tagName === 'UL' || ch.tagName === 'OL')) {
        nested += listToMd(ch, depth + 1, ch.tagName === 'OL');
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
  return `![${node.getAttribute('alt') || ''}](${node.getAttribute('src') || ''})`;
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
    const id = node.getAttribute('data-id') || '';
    const name = (node.textContent || '').replace(/^[@#]/, '');
    // Prefer the authoritative trigger stored on the token; fall back to the
    // first rendered char, then '@', so an empty token never yields "undefined".
    const trig = node.getAttribute('data-trigger') || (node.textContent || '@')[0] || '@';
    return `${trig}[${name}](${id})`;
  }
  if (node.classList && node.classList.contains('yjd-file-chip')) {
    const url = node.getAttribute('href') || '';
    const nameEl = node.querySelector ? node.querySelector('.yjd-file-name') : null;
    const name = node.getAttribute('data-name') || (nameEl && nameEl.textContent) || 'file';
    const size = node.getAttribute('data-size') || '';
    return `[${size ? `${name} (${size})` : name}](${url})`;
  }
  switch (tag) {
    case 'B': case 'STRONG': return '**' + inline(node) + '**';
    case 'I': case 'EM': return '*' + inline(node) + '*';
    case 'S': case 'STRIKE': case 'DEL': return '~~' + inline(node) + '~~';
    case 'U': return '<u>' + inline(node) + '</u>';
    case 'CODE': return '`' + node.textContent + '`';
    case 'A': return '[' + inline(node) + '](' + (node.getAttribute('href') || '') + ')';
    case 'IMG': return imgToMd(node);
    case 'BR': return '  \n';
    default: return inline(node); // spans (colour/font) → keep text only
  }
}

/* ============================ Markdown -> HTML ============================ */

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
  let i = start, html = '<' + (ordered ? 'ol' : 'ul') + '>';
  while (i < lines.length) {
    const l = lines[i];
    if (/^\s*$/.test(l)) { i++; continue; }
    const ind = indentOf(l);
    const m = l.match(/^\s*([-*+]|\d+\.)\s+(.*)$/);
    if (!m || ind < baseIndent) break;
    if (ind > baseIndent) { // nested list belongs to previous <li>
      const r = parseList(lines, i, ind);
      html = html.replace(/<\/li>$/, r.html + '</li>');
      i = r.next; continue;
    }
    html += '<li>' + inlineMd(m[2]) + '</li>';
    i++;
  }
  return { html: html + '</' + (ordered ? 'ol' : 'ul') + '>', next: i };
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
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, a, src) => `<img class="inserted-image" src="${attr(src)}" alt="${attr(a)}" style="max-width:100%;height:auto">`)
    .replace(/([@#])\[([^\]]+)\]\(([^)]+)\)/g, (_, t, name, id) => `<span class="mention" data-id="${attr(id)}">${t}${escapeHtml(name)}</span>`)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, href) => `<a href="${attr(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t)}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<i>$2</i>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')
    .replace(/`([^`]+)`/g, (_, c) => '<code>' + escapeHtml(c) + '</code>')
    .replace(/\n/g, '<br>');
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

function jsonNodeToHtml(n) {
  if (n == null) return '';
  if (n.text != null) return escapeHtml(n.text);
  if (!n.tag) return '';
  const attrs = n.attrs
    ? Object.entries(n.attrs).map(([k, v]) => ` ${k}="${attr(v)}"`).join('')
    : '';
  const inner = (n.content || []).map(jsonNodeToHtml).join('');
  const VOID = new Set(['img', 'hr', 'br', 'input']);
  if (VOID.has(n.tag)) return `<${n.tag}${attrs}>`;
  return `<${n.tag}${attrs}>${inner}</${n.tag}>`;
}
