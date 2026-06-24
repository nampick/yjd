/**
 * Sanitize utilities - dependency-free XSS protection helpers.
 *
 * These functions provide a defense-in-depth layer for the few places where
 * the editor turns user-supplied strings into live DOM (links, images, video,
 * HTML import, code view). They are intentionally conservative: anything that
 * is not provably safe is rejected.
 */

// URL schemes that are safe to use as navigable links / resource sources.
const SAFE_URL_SCHEMES = ['http:', 'https:', 'mailto:', 'tel:', 'ftp:'];

// Trusted iframe embed prefixes (used by the video feature).
const TRUSTED_IFRAME_PREFIXES = [
  'https://www.youtube.com/embed/',
  'https://www.youtube-nocookie.com/embed/',
  'https://player.vimeo.com/video/'
];

/**
 * Determine whether a URL is safe to assign to href/src.
 *
 * Relative URLs, anchors and path-only references (no scheme) are considered
 * safe. URLs with an explicit scheme are only allowed if the scheme is in the
 * whitelist. `javascript:`, `vbscript:`, `data:text/html`, etc. are rejected.
 *
 * @param {string} url - URL to validate
 * @param {object} [options]
 * @param {boolean} [options.allowDataImage] - allow `data:image/*` (except SVG)
 * @returns {boolean}
 */
export function isSafeUrl(url, { allowDataImage = false } = {}) {
  if (typeof url !== 'string') return false;

  const trimmed = url.trim();
  if (trimmed === '') return false;

  // Strip control/whitespace characters that are commonly used to smuggle
  // schemes past naive validators (e.g. "java\tscript:alert(1)").
  const stripped = trimmed.replace(/[\u0000-\u0020\u007F-\u009F]/g, '');

  // Detect a leading scheme. If there is none it is a relative URL → safe.
  const schemeMatch = stripped.match(/^([a-z][a-z0-9+.-]*):/i);
  if (!schemeMatch) {
    return true;
  }

  const scheme = schemeMatch[1].toLowerCase() + ':';

  if (scheme === 'data:') {
    if (!allowDataImage) return false;
    // Allow raster image data URIs only. SVG can carry script, so it is denied.
    return /^data:image\//i.test(stripped) && !/^data:image\/svg/i.test(stripped);
  }

  return SAFE_URL_SCHEMES.includes(scheme);
}

/**
 * Return the URL if it is safe, otherwise an empty string.
 * @param {string} url
 * @param {object} [options] - same options as isSafeUrl
 * @returns {string}
 */
export function sanitizeUrl(url, options) {
  return isSafeUrl(url, options) ? url.trim() : '';
}

// Tags that are never allowed in sanitized HTML.
const FORBIDDEN_TAGS = new Set([
  'SCRIPT', 'STYLE', 'OBJECT', 'EMBED', 'LINK', 'META', 'BASE',
  'FORM', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT', 'OPTION', 'NOSCRIPT'
]);

/**
 * Clean a single element node in place: drop event-handler attributes,
 * unsafe href/src URLs and dangerous inline styles.
 * @param {Element} el
 */
function cleanElement(el) {
  const attrs = Array.from(el.attributes);
  for (const attr of attrs) {
    const name = attr.name.toLowerCase();
    const value = attr.value;

    // Strip all inline event handlers (onclick, onerror, onload, ...).
    if (name.startsWith('on')) {
      el.removeAttribute(attr.name);
      continue;
    }

    // Validate URL-bearing attributes.
    if (name === 'href' || name === 'src' || name === 'xlink:href') {
      const allowDataImage = el.tagName === 'IMG';
      if (!isSafeUrl(value, { allowDataImage })) {
        el.removeAttribute(attr.name);
      }
      continue;
    }

    // Reject styles that can execute script (legacy IE expression / url(javascript:)).
    if (name === 'style' && /expression\s*\(|javascript:/i.test(value)) {
      el.removeAttribute(attr.name);
    }
  }
}

/**
 * Sanitize an HTML string and return safe HTML.
 *
 * Parsing is done with DOMParser so that no scripts execute and no network
 * resources load during sanitization (the parsed document is inert).
 *
 * @param {string} html - untrusted HTML
 * @returns {string} sanitized HTML
 */
export function sanitizeHtml(html) {
  if (typeof html !== 'string' || html === '') return '';

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const elements = Array.from(doc.body.querySelectorAll('*'));

  for (const el of elements) {
    const tag = el.tagName;

    if (FORBIDDEN_TAGS.has(tag)) {
      el.remove();
      continue;
    }

    // Iframes are only allowed when pointing at a trusted embed host.
    if (tag === 'IFRAME') {
      const src = el.getAttribute('src') || '';
      const trusted = TRUSTED_IFRAME_PREFIXES.some(prefix => src.startsWith(prefix));
      if (!trusted) {
        el.remove();
        continue;
      }
    }

    cleanElement(el);
  }

  return doc.body.innerHTML;
}

/**
 * Sanitize an already-parsed DOM subtree in place (event handlers + unsafe URLs).
 * Use when content is built via the DOM rather than from an HTML string.
 * @param {Element} root
 */
export function sanitizeNode(root) {
  if (!root) return;
  const elements = Array.from(root.querySelectorAll('*'));
  for (const el of elements) {
    if (FORBIDDEN_TAGS.has(el.tagName)) {
      el.remove();
      continue;
    }
    cleanElement(el);
  }
}

export default { isSafeUrl, sanitizeUrl, sanitizeHtml, sanitizeNode };
