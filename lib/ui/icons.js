/**
 * Inline Icons — a single, cohesive outline icon set (Lucide-style).
 * Every icon is a 24×24, stroke-based glyph using `currentColor`, so they all
 * share one visual weight and follow the button's text/accent colour.
 */
const S = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const Icons = {
  // --- Text formatting ---
  bold: S('<path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>'),
  italic: S('<line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/>'),
  underline: S('<path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" x2="20" y1="20" y2="20"/>'),
  strike: S('<path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" x2="20" y1="12" y2="12"/>'),
  subscript: S('<path d="m4 5 8 8"/><path d="m12 5-8 8"/><path d="M20 19h-4c0-1.5.44-2 1.5-2.5S20 15.33 20 14c0-.47-.17-.93-.48-1.29a2.11 2.11 0 0 0-2.62-.44c-.42.24-.74.62-.9 1.07"/>'),
  superscript: S('<path d="m4 19 8-8"/><path d="m12 19-8-8"/><path d="M20 12h-4c0-1.5.44-2 1.5-2.5S20 8.33 20 7c0-.47-.17-.93-.48-1.29a2.11 2.11 0 0 0-2.62-.44c-.42.24-.74.62-.9 1.07"/>'),

  // --- Alignment ---
  'align-left': S('<line x1="21" x2="3" y1="6" y2="6"/><line x1="15" x2="3" y1="12" y2="12"/><line x1="17" x2="3" y1="18" y2="18"/>'),
  'align-center': S('<line x1="21" x2="3" y1="6" y2="6"/><line x1="17" x2="7" y1="12" y2="12"/><line x1="19" x2="5" y1="18" y2="18"/>'),
  'align-right': S('<line x1="21" x2="3" y1="6" y2="6"/><line x1="21" x2="9" y1="12" y2="12"/><line x1="21" x2="7" y1="18" y2="18"/>'),
  'align-justify': S('<line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/>'),

  // --- Lists ---
  'list-bullet': S('<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><circle cx="3.5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="3.5" cy="18" r="1" fill="currentColor" stroke="none"/>'),
  'list-ordered': S('<line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>'),
  'list-alpha': S('<line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 10V8a1 1 0 0 1 2 0v2"/><path d="M4 9h2"/><path d="M4 14h1.5a1 1 0 0 1 0 2H4l2-2"/>'),
  'list-roman': S('<line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M5 7v3"/><path d="M4 14h2l-1 4"/>'),
  list: S('<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><circle cx="3.5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="3.5" cy="18" r="1" fill="currentColor" stroke="none"/>'),

  // --- Indentation ---
  'indent-increase': S('<polyline points="3 8 7 12 3 16"/><line x1="21" x2="11" y1="6" y2="6"/><line x1="21" x2="11" y1="12" y2="12"/><line x1="21" x2="11" y1="18" y2="18"/>'),
  'indent-decrease': S('<polyline points="7 8 3 12 7 16"/><line x1="21" x2="11" y1="6" y2="6"/><line x1="21" x2="11" y1="12" y2="12"/><line x1="21" x2="11" y1="18" y2="18"/>'),

  // --- Media ---
  image: S('<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>'),
  video: S('<path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>'),

  // --- Table ---
  table: S('<path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>'),
  'table-profile': S('<path d="M15 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M21 9H3"/><path d="M21 15H3"/>'),
  'add-row-above': S('<rect x="3" y="13" width="18" height="8" rx="2"/><line x1="12" x2="12" y1="3" y2="9"/><line x1="9" x2="15" y1="6" y2="6"/>'),
  'add-row-below': S('<rect x="3" y="3" width="18" height="8" rx="2"/><line x1="12" x2="12" y1="15" y2="21"/><line x1="9" x2="15" y1="18" y2="18"/>'),
  'add-col-left': S('<rect x="13" y="3" width="8" height="18" rx="2"/><line x1="3" x2="9" y1="12" y2="12"/><line x1="6" x2="6" y1="9" y2="15"/>'),
  'add-col-right': S('<rect x="3" y="3" width="8" height="18" rx="2"/><line x1="15" x2="21" y1="12" y2="12"/><line x1="18" x2="18" y1="9" y2="15"/>'),
  'delete-row': S('<rect x="3" y="9" width="18" height="6" rx="2"/><line x1="9" x2="15" y1="12" y2="12"/>'),
  'delete-col': S('<rect x="9" y="3" width="6" height="18" rx="2"/><line x1="12" x2="12" y1="9" y2="15"/>'),
  'delete-table': S('<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>'),

  // --- Colour ---
  color: S('<path d="M4 20h16"/><path d="m6 16 6-12 6 12"/><path d="M8 12h8"/>'),
  background: S('<path d="M12 3a7 7 0 0 1 7 7c0 2-1 3.9-3 5.5S12.5 19.5 12 22c-.5-2.5-2-4.9-4-6.5C6 13.9 5 12 5 10a7 7 0 0 1 7-7z"/>'),
  'no-color': S('<circle cx="12" cy="12" r="9"/><line x1="5.6" x2="18.4" y1="5.6" y2="18.4"/>'),
  'custom-color': S('<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.43-.18-.83-.44-1.12-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.55-2.5 5.55-5.55C22 6 17.5 2 12 2z"/><circle cx="8.5" cy="7.5" r="1" fill="currentColor" stroke="none"/><circle cx="6.5" cy="12.5" r="1" fill="currentColor" stroke="none"/><circle cx="13.5" cy="6.5" r="1" fill="currentColor" stroke="none"/><circle cx="17.5" cy="10.5" r="1" fill="currentColor" stroke="none"/>'),

  // --- History ---
  undo: S('<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>'),
  redo: S('<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>'),

  // --- Insert ---
  link: S('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
  emoji: S('<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>'),
  tag: S('<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none"/>'),
  import: S('<path d="M12 3v12"/><path d="m8 11 4 4 4-4"/><path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4"/>'),
  code: S('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>'),
  'code-view': S('<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>'),
  'clear-format': S('<path d="M4 7V4h16v3"/><path d="M5 20h6"/><path d="M13 4 8 20"/><path d="m15 15 5 5"/><path d="m20 15-5 5"/>'),
  'horizontal-rule': S('<path d="M5 12h14"/>'),
  find: S('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
  'text-direction': S('<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>'),

  // --- UI / utility ---
  check: S('<polyline points="20 6 9 17 4 12"/>'),
  dropdown: S('<path d="m6 9 6 6 6-6"/>'),
  more: S('<circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/>'),
  theme: S('<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.3 17.7-1.4 1.4"/><path d="m19.1 4.9-1.4 1.4"/>'),

  // --- Typography (dropdown triggers; mostly shown as text) ---
  heading: S('<path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="m17 12 3-2v8"/>'),
  'font-family': S('<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/>'),
  'line-height': S('<path d="M3 5h12"/><path d="M3 12h12"/><path d="M3 19h12"/><path d="M19 5v14"/><path d="m16.5 7.5 2.5-2.5 2.5 2.5"/><path d="m16.5 16.5 2.5 2.5 2.5-2.5"/>'),
  capitalization: S('<path d="M4 18 8 8l4 10"/><path d="M5.5 14h5"/><path d="M16 18a3 3 0 1 0 0-6 3 3 0 0 0-3 3v3"/><path d="M19 12v6"/>'),
  'text-size': S('<path d="M21 14h-5"/><path d="M16 16v-3.5a2.5 2.5 0 0 1 5 0V16"/><path d="M4.5 13h6"/><path d="m3 16 4.5-9 4.5 9"/>')
};

/**
 * Icon utility functions
 */
export class IconUtils {
  /**
   * Get icon SVG content by name
   * @param {string} iconName - Name of the icon
   * @returns {string} SVG content or empty string if not found
   */
  static getIcon(iconName) {
    return Icons[iconName] || '';
  }

  /**
   * Create icon element with proper styling
   * @param {string} iconName - Name of the icon
   * @param {Object} options - Options for icon styling
   * @returns {HTMLElement} Icon element
   */
  static createIconElement(iconName, options = {}) {
    const iconElement = document.createElement('span');
    iconElement.className = `icon icon-${iconName}`;

    // Apply default styles
    iconElement.style.display = 'inline-flex';
    iconElement.style.alignItems = 'center';
    iconElement.style.justifyContent = 'center';
    iconElement.style.width = options.width || '16px';
    iconElement.style.height = options.height || '16px';
    iconElement.style.verticalAlign = 'middle';

    // Set SVG content
    iconElement.innerHTML = this.getIcon(iconName);

    return iconElement;
  }

  /**
   * Check if icon exists
   * @param {string} iconName - Name of the icon
   * @returns {boolean} True if icon exists
   */
  static hasIcon(iconName) {
    return iconName in Icons;
  }

  /**
   * Get all available icon names
   * @returns {string[]} Array of icon names
   */
  static getIconNames() {
    return Object.keys(Icons);
  }
}

// Export default for backward compatibility
export default IconUtils;
