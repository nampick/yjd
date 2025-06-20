/**
 * CSS Loader - Load và inject CSS styles vào DOM
 * Thay thế cho việc sử dụng inline styles
 */
class StylesLoader {
  static loaded = false;
  static styleElement = null;

  /**
   * Load CSS từ file hoặc string
   */
  static async loadStyles() {
    if (this.loaded) return;

    try {
      // Tạo style element
      this.styleElement = document.createElement('style');
      this.styleElement.id = 'rich-editor-styles';
      
      // Load CSS từ file
      const response = await fetch(new URL('./styles.css', import.meta.url));
      const cssText = await response.text();
      
      this.styleElement.textContent = cssText;
      
      // Inject vào head
      document.head.appendChild(this.styleElement);
      
      this.loaded = true;
      console.log('✅ Rich Editor styles loaded');
      
    } catch (error) {
      console.error('❌ Failed to load Rich Editor styles:', error);
      
      // Fallback: load minimal styles
      this.loadFallbackStyles();
    }
  }

  /**
   * Load minimal fallback styles nếu không thể load từ file
   */
  static loadFallbackStyles() {
    const fallbackCSS = `
      .rich-editor-wrapper { 
        position: relative; 
        background: #fff; 
        border: 1px solid #ddd; 
        border-radius: 4px; 
        display: flex; 
        flex-direction: column; 
        font-family: system-ui, sans-serif; 
      }
      .rich-editor-area { 
        flex: 1; 
        padding: 20px; 
        outline: none; 
        min-height: 100px; 
      }
      .rich-editor-toolbar { 
        display: flex; 
        gap: 4px; 
        padding: 8px; 
        border-bottom: 1px solid #ddd; 
        background: #f9f9f9; 
      }
      .rich-editor-toolbar-btn { 
        padding: 4px 8px; 
        border: 1px solid #ccc; 
        border-radius: 3px; 
        background: #fff; 
        cursor: pointer; 
      }
      .table-grid-selector { 
        position: absolute; 
        background: white; 
        border: 1px solid #ccc; 
        border-radius: 4px; 
        padding: 10px; 
        box-shadow: 0 2px 8px rgba(0,0,0,0.15); 
        z-index: 1000; 
        display: none; 
      }
      .table-grid-cell { 
        width: 20px; 
        height: 20px; 
        border: 1px solid #ddd; 
        cursor: pointer; 
        background: white; 
      }
    `;

    this.styleElement = document.createElement('style');
    this.styleElement.id = 'rich-editor-styles-fallback';
    this.styleElement.textContent = fallbackCSS;
    document.head.appendChild(this.styleElement);
    
    this.loaded = true;
    console.log('⚠️ Rich Editor fallback styles loaded');
  }

  /**
   * Unload styles
   */
  static unloadStyles() {
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
      this.styleElement = null;
      this.loaded = false;
      console.log('🗑️ Rich Editor styles unloaded');
    }
  }

  /**
   * Check if styles are loaded
   */
  static isLoaded() {
    return this.loaded;
  }

  /**
   * Reload styles
   */
  static async reloadStyles() {
    this.unloadStyles();
    await this.loadStyles();
  }

  /**
   * Add custom CSS
   */
  static addCustomCSS(css, id = 'rich-editor-custom') {
    // Remove existing custom styles
    const existing = document.getElementById(id);
    if (existing) {
      existing.remove();
    }

    // Add new custom styles
    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
    
    console.log(`✅ Custom CSS added with id: ${id}`);
  }
}

export default StylesLoader; 