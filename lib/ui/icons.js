/**
 * Inline Icons — a single, cohesive outline icon set (Lucide-style).
 * Every icon is a 24×24, stroke-based glyph using `currentColor`, so they all
 * share one visual weight and follow the button's text/accent colour.
 *
 * Tree-shakeable registry: icons register themselves from the feature files
 * that use them, so a minimal build only ships the icons it actually needs.
 * Only the core chrome icons are registered here at module load.
 */
export const S = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

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
  more: S('<circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/>'),
  check: S('<polyline points="20 6 9 17 4 12"/>'),
  dropdown: S('<path d="m6 9 6 6 6-6"/>'),
  'chevron-up': S('<path d="m18 15-6-6-6 6"/>'),
  'chevron-down': S('<path d="m6 9 6 6 6-6"/>'),
  close: S('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
  theme: S('<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.3 17.7-1.4 1.4"/><path d="m19.1 4.9-1.4 1.4"/>'),
  'horizontal-rule': S('<path d="M5 12h14"/>')
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
