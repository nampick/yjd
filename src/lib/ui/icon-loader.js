/**
 * Icon Loader Utility - Handles SVG icon loading and management
 */
class IconLoader {
  constructor() {
    this.iconCache = new Map();
    this.iconPath = '/src/assets/icon/';
  }

  /**
   * Get SVG icon content by name
   * @param {string} iconName - Name of the icon (without .svg extension)
   * @returns {Promise<string>} SVG content
   */
  async getIcon(iconName) {
    // Check cache first
    if (this.iconCache.has(iconName)) {
      return this.iconCache.get(iconName);
    }

    try {
      const response = await fetch(`${this.iconPath}icon-${iconName}.svg`);
      if (!response.ok) {
        throw new Error(`Failed to load icon: ${iconName}`);
      }
      
      const svgContent = await response.text();
      
      // Cache the icon
      this.iconCache.set(iconName, svgContent);
      
      return svgContent;
    } catch (error) {
      console.warn(`Could not load icon: ${iconName}`, error);
    }
  }

  /**
   * Preload icons for better performance
   * @param {string[]} iconNames - Array of icon names to preload
   */
  async preloadIcons(iconNames) {
    const promises = iconNames.map(iconName => this.getIcon(iconName));
    await Promise.all(promises);
  }

  /**
   * Create icon element with proper styling
   * @param {string} iconName - Name of the icon
   * @param {Object} options - Options for icon styling
   * @returns {HTMLElement} Icon element
   */
  createIconElement(iconName, options = {}) {
    const iconElement = document.createElement('span');
    iconElement.className = `icon icon-${iconName}`;
    
    // Apply default styles
    iconElement.style.display = 'inline-block';
    iconElement.style.width = options.width || '16px';
    iconElement.style.height = options.height || '16px';
    iconElement.style.verticalAlign = 'middle';
    
    // Load SVG asynchronously
    this.getIcon(iconName).then(svgContent => {
      iconElement.innerHTML = svgContent;
    });
    
    return iconElement;
  }

  /**
   * Clear icon cache
   */
  clearCache() {
    this.iconCache.clear();
  }
}

// Export singleton instance
export default new IconLoader(); 