import cssText from './styles.css.js';

/**
 * CSS Loader - Load và inject CSS styles vào DOM
 * Thay thế cho việc sử dụng inline styles
 *
 * CSS được import trực tiếp dưới dạng chuỗi (sinh từ styles.css), nên hoạt động
 * cả với native ESM trong trình duyệt lẫn khi đóng gói bằng Rollup/CDN — không
 * còn phụ thuộc vào fetch runtime (vốn làm hỏng việc dùng qua npm/CDN).
 */
class StylesLoader {
  static loaded = false;
  static styleElement = null;

  /**
   * Load CSS (inject inlined stylesheet vào <head>)
   * Trả về Promise để giữ tương thích với code gọi cũ (.catch/.then).
   */
  static loadStyles() {
    if (this.loaded) return Promise.resolve();

    try {
      this.styleElement = document.createElement('style');
      this.styleElement.id = 'rich-editor-styles';
      this.styleElement.textContent = cssText;
      document.head.appendChild(this.styleElement);
      this.loaded = true;
    } catch (error) {
      // Fallback: load minimal styles
      this.loadFallbackStyles();
    }

    return Promise.resolve();
  }

  /**
   * Load minimal fallback styles nếu không thể load từ file
   */
  static loadFallbackStyles() {
    const fallbackCSS = `
      .yjd-rich-editor { 
        position: relative; 
        background: #fff; 
        border: 1px solid #ddd; 
        border-radius: 4px; 
        display: flex; 
        flex-direction: column; 
        font-family: system-ui, sans-serif; 
      }
      .yjd-rich-editor .rich-editor-area { 
        flex: 1; 
        padding: 20px; 
        outline: none; 
        min-height: 100px; 
      }
      .yjd-rich-editor .rich-editor-toolbar { 
        display: flex; 
        gap: 4px; 
        padding: 8px; 
        border-bottom: 1px solid #ddd; 
        background: #f9f9f9; 
      }
      .yjd-rich-editor .rich-editor-toolbar-btn { 
        padding: 4px 8px; 
        border: 1px solid #ccc; 
        border-radius: 3px; 
        background: #fff; 
        cursor: pointer; 
      }
      .yjd-rich-editor .table-grid-selector { 
        position: absolute; 
        background: white; 
        border: 1px solid #ccc; 
        border-radius: 4px; 
        padding: 10px; 
        box-shadow: 0 2px 8px rgba(0,0,0,0.15); 
        z-index: 1000; 
        display: none; 
      }
      .yjd-rich-editor .table-grid-cell { 
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
  }

  /**
   * Unload styles
   */
  static unloadStyles() {
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
      this.styleElement = null;
      this.loaded = false;
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
    
  }
}

export default StylesLoader; 