/**
 * Email-safe HTML compiler (#82) — turns yjd's clean semantic HTML into the
 * kind of HTML email clients actually render: every style inlined, no classes,
 * no <style> blocks, <ol> as numbered table rows, CTAs as bulletproof
 * table+VML buttons.
 *
 *   import { htmlToEmail, applyEmailMethods } from '@oix1987/yjd/lib/email.js';
 *   const html = editor.getEmailHTML({ width: 600, theme: { accent: '#25d366' } });
 *
 * Pure transform over serialized HTML (browser DOM, zero dependencies,
 * tree-shakeable). Output is a fragment by default; `{ document: true }` wraps
 * it in a minimal centered card document.
 */

const DEFAULT_THEME = {
  ink: '#14181d',       // headings
  body: '#404750',      // body copy
  accent: '#6d5efc',    // CTA background
  link: '#4f46e5',      // links
  muted: '#6d7480',     // secondary text
  border: '#e5e8ec',    // rules/quote bars
  font: "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
};

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Compile a serialized yjd HTML string to email-client-safe HTML. */
export function htmlToEmail(html, opts = {}) {
  const theme = { ...DEFAULT_THEME, ...(opts.theme || {}) };
  theme.colors = opts.colors || (opts.theme && opts.theme.colors) || {};
  const width = opts.width || 600;
  const root = document.createElement('div');
  root.innerHTML = html || '';

  const out = [...root.childNodes].map((n) => nodeToEmail(n, theme)).join('');
  if (!opts.document) return out;
  return (
    '<!doctype html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    `<body style="margin:0;padding:0;background:#f2f4f6;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f6;"><tr><td align="center" style="padding:24px 12px;">` +
    `<table role="presentation" width="${width}" cellpadding="0" cellspacing="0" style="width:${width}px;max-width:100%;background:#ffffff;border-radius:12px;"><tr><td style="padding:32px;">` +
    out +
    '</td></tr></table></td></tr></table></body></html>'
  );
}

/* ------------------------------ block rules ------------------------------ */

function nodeToEmail(node, theme) {
  if (node.nodeType === 3) {
    const t = node.textContent;
    return t.trim() ? `<p style="${pStyle(theme)}">${esc(t)}</p>` : '';
  }
  if (node.nodeType !== 1) return '';
  const tag = node.tagName;

  // Sections (#84) compile to full-width bands; columns to side-by-side cells
  // that stack on narrow clients (fixed % widths + inline-block fallback).
  if (node.classList && node.classList.contains('yjd-section')) return sectionToEmail(node, theme);

  // CTA button (#83): bulletproof table + VML from its data-props.
  const btn = node.matches && node.matches('a.yjd-button, [data-yjd-button]')
    ? node : (node.querySelector ? node.querySelector('a.yjd-button, [data-yjd-button]') : null);
  if (btn && (node === btn || onlyContains(node, btn))) return buttonToEmail(node, btn, theme);

  switch (tag) {
    case 'H1': return `<h1 style="margin:0 0 16px;color:${theme.ink};font-family:${theme.font};font-size:24px;line-height:32px;font-weight:700;">${inline(node, theme)}</h1>`;
    case 'H2': return `<h2 style="margin:24px 0 12px;color:${theme.ink};font-family:${theme.font};font-size:20px;line-height:28px;font-weight:700;">${inline(node, theme)}</h2>`;
    case 'H3': case 'H4': case 'H5': case 'H6':
      return `<h3 style="margin:20px 0 10px;color:${theme.ink};font-family:${theme.font};font-size:17px;line-height:24px;font-weight:600;">${inline(node, theme)}</h3>`;
    case 'P': case 'DIV': {
      const c = inline(node, theme);
      return c.trim() ? `<p style="${pStyle(theme)}">${c}</p>` : '';
    }
    case 'UL': {
      const items = [...node.children].filter((li) => li.tagName === 'LI')
        .map((li) => `<li style="margin:0 0 8px;">${inline(li, theme)}</li>`).join('');
      return `<ul style="margin:0 0 16px;padding:0 0 0 22px;color:${theme.body};font-family:${theme.font};font-size:15px;line-height:24px;">${items}</ul>`;
    }
    case 'OL': return olToEmail(node, theme);
    case 'BLOCKQUOTE':
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tr>` +
        `<td width="3" style="background:${theme.accent};border-radius:2px;"></td>` +
        `<td style="padding:2px 0 2px 14px;color:${theme.muted};font-family:${theme.font};font-size:15px;line-height:24px;">${inline(node, theme)}</td>` +
        `</tr></table>`;
    case 'PRE':
      return `<pre style="margin:0 0 16px;padding:14px 16px;background:#f6f7f8;border-radius:8px;color:${theme.ink};font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;line-height:20px;white-space:pre-wrap;">${esc(node.textContent.replace(/\n$/, ''))}</pre>`;
    case 'HR': return `<div style="border-top:1px solid ${theme.border};margin:24px 0;"></div>`;
    case 'IMG': return imgToEmail(node);
    case 'FIGURE': return [...node.childNodes].map((n) => nodeToEmail(n, theme)).join('');
    case 'TABLE': return tableToEmail(node, theme);
    case 'BR': return '';
    default: {
      const c = inline(node, theme);
      return c.trim() ? `<p style="${pStyle(theme)}">${c}</p>` : '';
    }
  }
}

const pStyle = (theme) =>
  `margin:0 0 16px;color:${theme.body};font-family:${theme.font};font-size:15px;line-height:24px;`;

function onlyContains(node, el) {
  return (node.textContent || '').trim() === (el.textContent || '').trim();
}

/* ------------------------------ inline rules ------------------------------ */

function inline(el, theme) {
  let out = '';
  el.childNodes.forEach((n) => {
    if (n.nodeType === 3) { out += esc(n.textContent); return; }
    if (n.nodeType !== 1) return;
    const inner = inline(n, theme);
    switch (n.tagName) {
      case 'STRONG': case 'B': out += `<strong style="font-weight:700;">${inner}</strong>`; break;
      case 'EM': case 'I': out += `<em>${inner}</em>`; break;
      case 'U': out += `<u>${inner}</u>`; break;
      case 'S': case 'STRIKE': case 'DEL': out += `<s>${inner}</s>`; break;
      case 'CODE': out += `<code style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;background:#f2f4f6;border-radius:4px;padding:1px 5px;">${inner}</code>`; break;
      case 'A': {
        const href = n.getAttribute('href') || '#';
        out += `<a href="${esc(href)}" style="color:${theme.link};text-decoration:underline;">${inner}</a>`;
        break;
      }
      case 'BR': out += '<br>'; break;
      case 'SPAN': out += inner; break;
      case 'IMG': out += imgToEmail(n); break;
      default: out += inner;
    }
  });
  return out;
}

/* ------------------------------ structures ------------------------------ */

// <ol> → numbered table rows: the only way steps render consistently across
// Gmail/Outlook/Apple Mail (native <ol> numbering breaks in several clients).
function olToEmail(node, theme) {
  const items = [...node.children].filter((li) => li.tagName === 'LI');
  const rows = items.map((li, i) =>
    `<tr>` +
    `<td width="28" valign="top" style="padding:0 0 12px;">` +
    `<div style="width:22px;height:22px;border-radius:11px;background:${theme.accent};color:#ffffff;font-family:${theme.font};font-size:12px;line-height:22px;text-align:center;font-weight:700;">${i + 1}</div>` +
    `</td>` +
    `<td valign="top" style="padding:1px 0 12px 8px;color:${theme.body};font-family:${theme.font};font-size:15px;line-height:24px;">${inline(li, theme)}</td>` +
    `</tr>`).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">${rows}</table>`;
}

function imgToEmail(node) {
  const src = node.getAttribute('src') || '';
  const alt = node.getAttribute('alt') || '';
  const w = node.getAttribute('width') || (node.style && parseInt(node.style.width, 10)) || '';
  const wAttr = w ? ` width="${parseInt(w, 10)}"` : '';
  return `<img src="${esc(src)}" alt="${esc(alt)}"${wAttr} style="max-width:100%;height:auto;display:block;border:0;border-radius:8px;margin:0 0 16px;">`;
}

function tableToEmail(node, theme) {
  const rows = [...node.querySelectorAll('tr')].map((tr) => {
    const cells = [...tr.children].map((c) =>
      `<td style="padding:8px 10px;border:1px solid ${theme.border};color:${theme.body};font-family:${theme.font};font-size:14px;line-height:22px;">${inline(c, theme)}</td>`).join('');
    return `<tr>${cells}</tr>`;
  }).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border-collapse:collapse;">${rows}</table>`;
}

// Bulletproof CTA: table for everyone + VML roundrect for Outlook.
function buttonToEmail(wrapper, btn, theme) {
  let props = {};
  try { props = JSON.parse(btn.getAttribute('data-props') || '{}'); } catch (e) { /* defaults */ }
  const named = theme.colors || {};
  const bg = (props.bgToken && named[props.bgToken]) || props.bg || theme.accent;
  const color = (props.colorToken && named[props.colorToken]) || props.color || '#ffffff';
  const radius = props.radius != null ? props.radius : 10;
  const pad = props.padding != null ? props.padding : 12;
  const align = props.align || (wrapper.getAttribute && wrapper.getAttribute('data-align')) || 'center';
  const href = btn.getAttribute('href') || '#';
  const label = (btn.textContent || 'Open').trim();
  const height = pad * 2 + 20;
  const full = !!props.full;
  const wAttr = full ? ' width="100%"' : '';

  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tr><td align="${align}">` +
    `<!--[if mso]>` +
    `<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${esc(href)}" style="height:${height}px;v-text-anchor:middle;${full ? 'width:100%;' : `width:${Math.max(120, label.length * 9 + pad * 2)}px;`}" arcsize="${Math.min(50, Math.round((radius / height) * 100))}%" stroke="f" fillcolor="${bg}">` +
    `<w:anchorlock/><center style="color:${color};font-family:${theme.font};font-size:15px;font-weight:600;">${esc(label)}</center></v:roundrect><![endif]-->` +
    `<!--[if !mso]><!--><table role="presentation"${wAttr} cellpadding="0" cellspacing="0"><tr>` +
    `<td align="center" style="background:${bg};border-radius:${radius}px;">` +
    `<a href="${esc(href)}" style="display:block;padding:${pad}px ${pad * 2}px;color:${color};font-family:${theme.font};font-size:15px;line-height:20px;font-weight:600;text-decoration:none;">${esc(label)}</a>` +
    `</td></tr></table><!--<![endif]-->` +
    `</td></tr></table>`
  );
}

// Section band (#84): background/padding as a full-width table; 1–3 columns
// as percentage cells that stack on narrow screens via inline-block hybrid.
function sectionToEmail(node, theme) {
  let style = {};
  try { style = JSON.parse(node.getAttribute('data-style') || '{}'); } catch (e) { /* defaults */ }
  const bg = style.background || 'transparent';
  const pad = style.padding != null ? style.padding : 16;
  const radius = style.radius != null ? style.radius : 0;
  const cols = [...node.children].filter((c) => c.classList && c.classList.contains('yjd-col'));
  const pct = cols.length ? Math.floor(100 / cols.length) : 100;
  const cells = (cols.length ? cols : [node]).map((col) =>
    `<div style="display:inline-block;width:100%;max-width:${pct}%;vertical-align:top;box-sizing:border-box;padding:0 6px;">` +
    [...col.childNodes].map((n) => nodeToEmail(n, theme)).join('') +
    `</div>`).join('');
  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tr>` +
    `<td style="background:${bg};border-radius:${radius}px;padding:${pad}px;">` +
    `<div style="font-size:0;">${cells}</div>` +
    `</td></tr></table>`
  );
}

/** Attach getEmailHTML() to an Editor class (all-in-one build does this). */
export function applyEmailMethods(EditorClass) {
  EditorClass.prototype.getEmailHTML = function getEmailHTML(opts = {}) {
    // Resolve declared theme tokens (#85) so `data-color="brand"` values and
    // omitted opts fall back to the editor's own theme at compile time.
    const t = this.options.theme && this.options.theme.colors ? this.options.theme.colors : {};
    const theme = { ...(t.brand ? { accent: t.brand } : {}), ...(t.ink ? { ink: t.ink } : {}), ...(opts.theme || {}) };
    return htmlToEmail(this.getContent(), { ...opts, theme, colors: { ...t, ...(opts.colors || {}) } });
  };
}
