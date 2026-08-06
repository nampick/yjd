import { registerIcons, S } from './icons.js';

/**
 * Extra icons — the Editor UI 2.0 additions to the icon family.
 *
 * These are NOT registered automatically: this module is opt-in so a minimal
 * build ships zero unused glyphs. Import it (or call `registerExtraIcons()`)
 * when your integration renders custom chrome — block handles, share/save
 * buttons, presence rows, AI diff controls — and wants it to match the
 * built-in set (24×24, 1.75 stroke, round caps/joins, `currentColor`).
 *
 *   import { registerExtraIcons } from '@oix1987/yjd/lib/ui/icons-extra.js';
 *   registerExtraIcons();          // all of them
 *   registerExtraIcons(['save']);  // or just the ones you need
 */
export const extraIcons = {
  // --- History & document ---
  history: S('<path d="M3 3v5h5"/><path d="M3.05 13a9 9 0 1 0 2.1-6.4L3 8"/><path d="M12 7v5l3 2"/>'),
  save: S('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>'),
  print: S('<path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7" rx="1"/>'),
  download: S('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>'),
  share: S('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4"/><path d="m15.4 6.5-6.8 4"/>'),

  // --- Text formatting ---
  unlink: S('<path d="M17 7h1a5 5 0 0 1 3.5 8.5"/><path d="M7 17H6a5 5 0 0 1-3.5-8.5"/><path d="M9 12h3"/><path d="m3 3 18 18"/>'),

  // --- Blocks ---
  'heading-2': S('<path d="M4 5v14"/><path d="M12 5v14"/><path d="M4 12h8"/><path d="M16 11a2.5 2.5 0 1 1 4 2L16 19h5"/>'),
  'heading-3': S('<path d="M4 5v14"/><path d="M12 5v14"/><path d="M4 12h8"/><path d="M16 10a2 2 0 1 1 2.5 2.5A2 2 0 1 1 16 16"/>'),
  paragraph: S('<path d="M13 4v16"/><path d="M17 4v16"/><path d="M19 4H9.5a4.5 4.5 0 0 0 0 9H13"/>'),
  blockquote: S('<path d="M4 5v14"/><path d="M9 8h11"/><path d="M9 13h8"/><path d="M9 18h11"/>'),
  'code-block': S('<rect x="2.5" y="4" width="19" height="16" rx="2"/><path d="m8 10-2 2 2 2"/><path d="m14 10 2 2-2 2"/>'),
  callout: S('<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M7 12h.01"/><path d="M11 10h6"/><path d="M11 14h4"/>'),
  toggle: S('<path d="m6 7 4 4-4 4"/><path d="M13 11h7"/><path d="M13 17h7"/><path d="M13 5h7"/>'),
  'page-break': S('<path d="M5 8V4h14v4"/><path d="M5 16v4h14v-4"/><path d="M3 12h3"/><path d="M10 12h4"/><path d="M18 12h3"/>'),
  columns: S('<rect x="3" y="4" width="7" height="16" rx="1.5"/><rect x="14" y="4" width="7" height="16" rx="1.5"/>'),
  layout: S('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M9 9v11"/>'),

  // --- Lists ---
  'list-collapse': S('<path d="M10 6h11"/><path d="M10 12h11"/><path d="M10 18h11"/><path d="m3 8 2-2 2 2"/><path d="m3 16 2 2 2-2"/>'),

  // --- Insert ---
  audio: S('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
  embed: S('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18"/>'),
  math: S('<path d="M18 5H6l6 7-6 7h12"/>'),
  mention: S('<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>'),
  comment: S('<path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z"/>'),
  date: S('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/>'),
  attachment: S('<path d="M21 11.5 12.5 20a5 5 0 0 1-7-7l8-8a3.5 3.5 0 0 1 5 5l-8 8a2 2 0 0 1-3-3l7.5-7.5"/>'),

  // --- Alignment & rhythm ---
  'letter-spacing': S('<path d="M7 20V8"/><path d="M17 20V8"/><path d="M3 4h18"/><path d="m5 14 2-2 2 2"/><path d="m15 14 2-2 2 2"/>'),

  // --- Table ---
  'header-col': S('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>'),

  // --- AI ---
  rewrite: S('<path d="m4 20 11-11"/><path d="m14 6 4 4"/><path d="M17 3v4"/><path d="M15 5h4"/><path d="M20 12v3"/><path d="M18.5 13.5h3"/>'),
  regenerate: S('<path d="M20 11a8 8 0 0 0-13.7-5.7L3 8"/><path d="M3 4v4h4"/><path d="M4 13a8 8 0 0 0 13.7 5.7L21 16"/><path d="M21 20v-4h-4"/>'),
  'diff-view': S('<path d="M8 5v14"/><path d="M16 5v14"/><path d="M5 8h6"/><path d="M13 16h6"/>'),

  // --- View & tools ---
  replace: S('<path d="M14 4h5a2 2 0 0 1 2 2v5"/><path d="m18 8 3 3-3 3"/><rect x="3" y="13" width="10" height="8" rx="2"/><path d="M3 8V6a2 2 0 0 1 2-2h2"/>'),
  preview: S('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>'),
  settings: S('<path d="M4 7h10"/><path d="M18 7h2"/><path d="M4 17h4"/><path d="M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'),
  'drag-handle': S('<circle cx="9" cy="6" r="1.3" fill="currentColor"/><circle cx="15" cy="6" r="1.3" fill="currentColor"/><circle cx="9" cy="12" r="1.3" fill="currentColor"/><circle cx="15" cy="12" r="1.3" fill="currentColor"/><circle cx="9" cy="18" r="1.3" fill="currentColor"/><circle cx="15" cy="18" r="1.3" fill="currentColor"/>'),
  duplicate: S('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>'),
  delete: S('<path d="M4 6h16"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/>'),

  // --- Status & collaboration ---
  saved: S('<circle cx="12" cy="12" r="9"/><polyline points="16 9.5 11 15 8 12"/>'),
  error: S('<circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16h.01"/>'),
  info: S('<circle cx="12" cy="12" r="9"/><path d="M12 16v-5"/><path d="M12 8h.01"/>'),
  offline: S('<path d="M7.5 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 17.5 7.5"/><path d="M18 12a4 4 0 0 1 1 6"/><path d="m3 3 18 18"/>'),
  locked: S('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),
  presence: S('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.5a3.5 3.5 0 0 1 0 6.8"/><path d="M18 15.5a6.5 6.5 0 0 1 3.5 4.5"/>'),
  help: S('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.3"/><path d="M12 17h.01"/>')
};

/**
 * Register the extra icon set (or a named subset) into the shared registry.
 * @param {string[]} [names] - Register only these keys; omit for all.
 */
export function registerExtraIcons(names) {
  if (!names) {
    registerIcons(extraIcons);
    return;
  }
  const subset = {};
  for (const n of names) {
    if (extraIcons[n]) subset[n] = extraIcons[n];
  }
  registerIcons(subset);
}

export default registerExtraIcons;
