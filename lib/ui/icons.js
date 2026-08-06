/**
 * Inline Icons — a single, cohesive outline icon set (Lucide-style).
 * Every icon is a 24×24, stroke-based glyph using `currentColor`, so they all
 * share one visual weight and follow the button's text/accent colour.
 * UI 2.0 family: 24×24 viewBox, 1.75 stroke, round caps and joins, no fills.
 *
 * Tree-shakeable registry: icons register themselves from the feature files
 * that use them, so a minimal build only ships the icons it actually needs.
 * Only the core chrome icons are registered here at module load.
 */
export const S = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

const _icons = {};

/**
 * Register a map of icon name → SVG string into the global registry.
 * Called by feature files as they load so their icons become available.
 * @param {Object<string,string>} map
 */
export function registerIcons(map) {
  Object.assign(_icons, map);
}

// --- Core chrome icons (always present) ---
registerIcons({
  more: S('<circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/>'),
  check: S('<polyline points="20 6 9 17 4 12"/>'),
  dropdown: S('<path d="m6 9 6 6 6-6"/>'),
  'chevron-up': S('<path d="m18 15-6-6-6 6"/>'),
  'chevron-down': S('<path d="m6 9 6 6 6-6"/>'),
  close: S('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
  upload: S('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 8 5-5 5 5"/><path d="M12 3v12"/>'),
  theme: S('<circle cx="12" cy="12" r="4"/><path d="M12 3v2"/><path d="M12 19v2"/><path d="m5.6 5.6 1.5 1.5"/><path d="m16.9 16.9 1.5 1.5"/><path d="M3 12h2"/><path d="M19 12h2"/><path d="m5.6 18.4 1.5-1.5"/><path d="m16.9 7.1 1.5-1.5"/>'),
  'horizontal-rule': S('<line x1="3" x2="21" y1="12" y2="12"/>')
});

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
    return _icons[iconName] || '';
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
    return iconName in _icons;
  }

  /**
   * Get all available icon names
   * @returns {string[]} Array of icon names
   */
  static getIconNames() {
    return Object.keys(_icons);
  }
}

// Export default for backward compatibility
export default IconUtils;
