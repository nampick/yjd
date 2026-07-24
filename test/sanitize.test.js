import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSafeUrl, sanitizeUrl } from '../lib/utils/sanitize.js';

test('isSafeUrl allows http/https/relative/mailto/tel', () => {
  assert.equal(isSafeUrl('https://example.com'), true);
  assert.equal(isSafeUrl('http://example.com/path?q=1'), true);
  assert.equal(isSafeUrl('/relative/path'), true);
  assert.equal(isSafeUrl('page.html'), true);
  assert.equal(isSafeUrl('#anchor'), true);
  assert.equal(isSafeUrl('mailto:a@b.com'), true);
  assert.equal(isSafeUrl('tel:+123456'), true);
});

test('isSafeUrl blocks dangerous schemes', () => {
  assert.equal(isSafeUrl('javascript:alert(1)'), false);
  assert.equal(isSafeUrl('JavaScript:alert(1)'), false);
  assert.equal(isSafeUrl('  javascript:alert(1)'), false);
  assert.equal(isSafeUrl('java\tscript:alert(1)'), false);
  assert.equal(isSafeUrl('java\nscript:alert(1)'), false);
  assert.equal(isSafeUrl('vbscript:msgbox(1)'), false);
  assert.equal(isSafeUrl('data:text/html,<script>alert(1)</script>'), false);
});

test('isSafeUrl handles data: image URIs per options', () => {
  // Disallowed by default
  assert.equal(isSafeUrl('data:image/png;base64,iVBOR'), false);
  // Allowed when allowDataImage is set (raster only)
  assert.equal(isSafeUrl('data:image/png;base64,iVBOR', { allowDataImage: true }), true);
  assert.equal(isSafeUrl('data:image/jpeg;base64,/9j/', { allowDataImage: true }), true);
  // SVG data URIs stay blocked (can carry script)
  assert.equal(isSafeUrl('data:image/svg+xml,<svg onload=alert(1)>', { allowDataImage: true }), false);
});

test('isSafeUrl handles data: audio/video URIs per options', () => {
  // Disallowed by default (uploaded videos become data:video/* URLs)
  assert.equal(isSafeUrl('data:video/webm;base64,AAAA'), false);
  assert.equal(isSafeUrl('data:video/mp4;base64,AAAA'), false);
  // Allowed when allowDataAV is set (inert media, no script execution)
  assert.equal(isSafeUrl('data:video/webm;base64,AAAA', { allowDataAV: true }), true);
  assert.equal(isSafeUrl('data:audio/mpeg;base64,AAAA', { allowDataAV: true }), true);
  // allowDataAV must NOT open the door to scriptable data URIs
  assert.equal(isSafeUrl('data:text/html,<script>alert(1)</script>', { allowDataAV: true }), false);
  assert.equal(isSafeUrl('data:image/svg+xml,<svg onload=alert(1)>', { allowDataAV: true }), false);
});

test('isSafeUrl rejects non-strings and empty values', () => {
  assert.equal(isSafeUrl(''), false);
  assert.equal(isSafeUrl('   '), false);
  assert.equal(isSafeUrl(null), false);
  assert.equal(isSafeUrl(undefined), false);
  assert.equal(isSafeUrl(123), false);
});

test('sanitizeUrl returns safe URL or empty string', () => {
  assert.equal(sanitizeUrl('https://example.com'), 'https://example.com');
  assert.equal(sanitizeUrl('  https://example.com  '), 'https://example.com');
  assert.equal(sanitizeUrl('javascript:alert(1)'), '');
});
