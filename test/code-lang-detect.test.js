// Language detection for the code-block header label (UI 2.0).
// detectLanguage is heuristic — these fixtures pin the common cases and the
// "don't guess" fallbacks.
import './dom-setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectLanguage } from '../lib/modules/code-block-tools.js';

const CASES = [
  ['javascript', 'const A = tokenize(a);\nexport function wordDiff(a, b) {\n  return lcs(A, B).map(op => ({ type: op.k }));\n}'],
  ['typescript', 'export interface Op { type: string; }\nconst run = (ops: Op[]): void => {\n  console.log(ops);\n};'],
  ['python', 'import os\n\ndef word_diff(a, b):\n    ops = lcs(a, b)\n    print(ops)'],
  ['html', '<!doctype html>\n<div class="frame"><p>Hello</p></div>'],
  ['css', '.toolbar {\n  display: flex;\n  gap: 8px;\n}\n.btn:hover { background: #eee; }'],
  ['json', '{\n  "name": "@oix1987/yjd",\n  "version": "2.11.6",\n  "sideEffects": ["./index.js"]\n}'],
  ['sql', 'SELECT id, name FROM users WHERE active = 1 ORDER BY name;'],
  ['bash', 'echo "building"\ncd dist\ncurl -s https://example.com | grep ok'],
  ['go', 'package main\n\nfunc main() {\n\tx := tokenize(a)\n\tfmt.Println(x)\n}'],
  ['rust', 'fn word_diff(a: &str) -> Vec<Op> {\n    let mut ops = vec![];\n    println!("{}", a);\n    ops\n}'],
  ['java', 'public class Diff {\n  public static void main(String[] args) {\n    System.out.println("ok");\n  }\n}'],
  ['c', '#include <stdio.h>\nint main(void) { printf("ok\\n"); return 0; }'],
  ['php', '<?php\necho word_diff($a, $b);'],
  ['yaml', 'name: build\non-push: true\njobs: test']
];

for (const [lang, source] of CASES) {
  test(`detects ${lang}`, () => {
    assert.equal(detectLanguage(source), lang);
  });
}

test('returns empty for prose', () => {
  assert.equal(detectLanguage('This is just a sentence about diffs and carets.'), '');
});

test('returns empty for short/ambiguous input', () => {
  assert.equal(detectLanguage('x = 1'), '');
  assert.equal(detectLanguage(''), '');
  assert.equal(detectLanguage(null), '');
});
