import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wordDiff, tokenize } from '../lib/utils/word-diff.js';

// Reconstruct the original / rewrite from a diff to prove correctness.
const orig = (d) => d.filter((r) => r.t !== '+').map((r) => r.s).join('');
const next = (d) => d.filter((r) => r.t !== '-').map((r) => r.s).join('');

test('tokenize keeps words and whitespace as separate tokens', () => {
  assert.deepEqual(tokenize('the quick  fox'), ['the', ' ', 'quick', '  ', 'fox']);
  assert.deepEqual(tokenize(''), []);
});

test('identical text is all "="', () => {
  const d = wordDiff('hello world', 'hello world');
  assert.deepEqual(d, [{ t: '=', s: 'hello world' }]);
});

test('a word swap yields -/+ around unchanged context', () => {
  const d = wordDiff('the quick fox', 'the slow fox');
  assert.equal(orig(d), 'the quick fox');
  assert.equal(next(d), 'the slow fox');
  assert.ok(d.some((r) => r.t === '-' && r.s === 'quick'));
  assert.ok(d.some((r) => r.t === '+' && r.s === 'slow'));
});

test('insertion and deletion round-trip', () => {
  const a = 'keep this part';
  const b = 'keep an added part';
  const d = wordDiff(a, b);
  assert.equal(orig(d), a);
  assert.equal(next(d), b);
});

test('pure append is a single trailing +', () => {
  const d = wordDiff('one two', 'one two three');
  assert.equal(orig(d), 'one two');
  assert.equal(next(d), 'one two three');
  assert.equal(d[d.length - 1].t, '+');
});

test('empty original → everything added', () => {
  const d = wordDiff('', 'brand new');
  assert.deepEqual(d, [{ t: '+', s: 'brand new' }]);
});
