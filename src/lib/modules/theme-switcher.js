import Module from '../core/module.js';

/**
 * Theme Switcher Module - Toggles between light and dark themes
 */
class ThemeSwitcher extends Module {
  constructor(editor, options = {}) {
    super(editor, options);
    
    this.currentTheme = 'light'; // Default theme
    this.themes = new Map();
    this.styleElement = null;
    
    this.init();
  }

  init() {
    
    // Load available themes
    this.loadThemes();
    
    // Apply default theme
    this.applyTheme('light');
    
    // Listen for theme toggle events
    this.editor.on('toolbar-click', (data) => {
      if (data.command === 'theme') {
        this.toggleTheme();
      }
    });
  }

  /**
   * Load available themes from registry
   */
  loadThemes() {
    const LightTheme = this.editor.registry.get('themes/light');
    const DarkTheme = this.editor.registry.get('themes/dark');
    
    if (LightTheme) {
      this.themes.set('light', LightTheme);
    }
    
    if (DarkTheme) {
      this.themes.set('dark', DarkTheme);
    }
    
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    
    this.applyTheme(newTheme);
    this.updateToolbarButton();
  }

  /**
   * Apply a specific theme
   * @param {string} themeName - Theme name ('light' or 'dark')
   */
  applyTheme(themeName) {
    const Theme = this.themes.get(themeName);
    if (!Theme) {
      return;
    }

    
    // Remove previous theme
    this.removeCurrentTheme();
    
    // Apply new theme using the theme's built-in apply method
    this.currentTheme = themeName;
    Theme.apply(this.editor);
    
    // Update wrapper class for additional styling
    this.updateWrapperClass(themeName);
    
    // Store theme preference
    localStorage.setItem('rich-editor-theme', themeName);
    
  }

  /**
   * Remove current theme styles
   */
  removeCurrentTheme() {
    if (this.currentTheme) {
      const CurrentTheme = this.themes.get(this.currentTheme);
      if (CurrentTheme && CurrentTheme.remove) {
        CurrentTheme.remove();
      }
    }
  }



  /**
   * Update wrapper class for theme-specific styling
   * @param {string} themeName - Theme name
   */
  updateWrapperClass(themeName) {
    const wrapper = this.editor.wrapper;
    if (wrapper) {
      // Remove all theme classes
      wrapper.classList.remove('theme-light', 'theme-dark');
      
      // Add current theme class
      wrapper.classList.add(`theme-${themeName}`);
    }
  }

  /**
   * Update toolbar button state
   */
  updateToolbarButton() {
    const toolbar = this.editor.getModule('toolbar');
    if (toolbar) {
      // Update button title based on current theme
      const buttonTitle = this.currentTheme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme';
      toolbar.setButtonTitle('theme', buttonTitle);
      
      // Update button icon or class based on theme
      const button = toolbar.getButton('theme');
      if (button) {
        button.classList.toggle('dark-theme', this.currentTheme === 'dark');
      }
      
    }
  }

  /**
   * Get current theme name
   * @returns {string} Current theme name
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Get available themes
   * @returns {Array} Array of theme names
   */
  getAvailableThemes() {
    return Array.from(this.themes.keys());
  }

  /**
   * Check if dark theme is active
   * @returns {boolean} True if dark theme is active
   */
  isDarkTheme() {
    return this.currentTheme === 'dark';
  }

  /**
   * Load theme preference from localStorage
   */
  loadThemePreference() {
    const savedTheme = localStorage.getItem('rich-editor-theme');
    if (savedTheme && this.themes.has(savedTheme)) {
      this.applyTheme(savedTheme);
    }
  }

  /**
   * Set theme programmatically
   * @param {string} themeName - Theme name to apply
   */
  setTheme(themeName) {
    if (this.themes.has(themeName)) {
      this.applyTheme(themeName);
      this.updateToolbarButton();
    } else {
      console.warn(`❌ Theme '${themeName}' not available`);
    }
  }

  /**
   * Clean up when module is destroyed
   */
  destroy() {
    this.removeCurrentTheme();
    this.themes.clear();
    
    // Remove theme class from wrapper
    const wrapper = this.editor.wrapper;
    if (wrapper) {
      wrapper.classList.remove('theme-light', 'theme-dark');
    }
    
  }
}

export default ThemeSwitcher; 