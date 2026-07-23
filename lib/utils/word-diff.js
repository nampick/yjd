/**
 * Word-level diff (LCS) for AI diff-edit. Given the original text and the AI's
 * rewrite, returns a flat list of runs the UI renders as kept / removed / added
 * words, so the user reviews and accepts changes hunk-by-hunk instead of a
 * blind replace.
 *
 *   wordDiff('the quick fox', 'the slow brown fox')
 *   → [{t:'=', s:'the '}, {t:'-', s:'quick'}, {t:'+', s:'slow brown'}, {t:'=', s:' fox'}]
 *
 * `t`: '=' unchanged · '-' removed (from original) · '+' added (from rewrite).
 */

/** Split into word + whitespace tokens so diffs land on word boundaries. */
export function tokenize(s) {
  return String(s == null ? '' : s).match(/\s+|[^\s]+/g) || [];
}

export function wordDiff(a, b) {
  const A = tokenize(a);
  const B = tokenize(b);
  const n = A.length, m = B.length;

  // LCS length table (bottom-up). O(n*m) — fine for selection-sized text.
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out = [];
  const push = (t, s) => {
    const last = out[out.length - 1];
    if (last && last.t === t) last.s += s; // merge adjacent runs of the same kind
    else out.push({ t, s });
  };

  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { push('=', A[i]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { push('-', A[i]); i++; }
    else { push('+', B[j]); j++; }
  }
  while (i < n) push('-', A[i++]);
  while (j < m) push('+', B[j++]);
  return out;
}
