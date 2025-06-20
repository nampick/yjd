/**
 * Light Theme - Default light theme for the editor
 * Extracted from ThemeManager.js light theme logic
 */
class LightTheme {
  static themeName = 'light';
  
  static styles = {
    // Editor container
    '.rich-editor': {
      'background-color': '#ffffff',
      'border': '1px solid #e1e5e9',
      'border-radius': '4px',
      'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      'font-size': '14px',
      'line-height': '1.5',
      'color': '#333333'
    },

    // Toolbar
    '.toolbar': {
      'background': '#f8f9fa',
      'border-bottom': '1px solid #e1e5e9',
      'padding': '8px 12px',
      'display': 'flex',
      'align-items': 'center',
      'gap': '4px',
      'flex-wrap': 'wrap'
    },

    '.toolbar-group': {
      'display': 'flex',
      'align-items': 'center',
      'gap': '2px',
      'padding': '0 4px',
      'border-right': '1px solid #e1e5e9'
    },

    '.toolbar-group:last-child': {
      'border-right': 'none'
    },

    // Toolbar buttons
    '.toolbar-btn': {
      'background': 'transparent',
      'border': '1px solid transparent',
      'border-radius': '3px',
      'padding': '6px 8px',
      'cursor': 'pointer',
      'color': '#495057',
      'font-size': '14px',
      'line-height': '1',
      'transition': 'all 0.15s ease',
      'display': 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      'min-width': '32px',
      'height': '32px'
    },

    '.toolbar-btn:hover': {
      'background-color': '#e9ecef',
      'border-color': '#d1d5db'
    },

    '.toolbar-btn:active, .toolbar-btn.active': {
      'background-color': '#007bff',
      'color': '#ffffff',
      'border-color': '#007bff'
    },

    '.toolbar-btn:disabled': {
      'opacity': '0.5',
      'cursor': 'not-allowed'
    },

    // Editor content area
    '.editor-content': {
      'padding': '16px',
      'min-height': '200px',
      'outline': 'none',
      'background': '#ffffff',
      'color': '#333333'
    },

    '.editor-content:focus': {
      'outline': 'none'
    },

    // Content formatting
    '.editor-content h1': {
      'font-size': '2em',
      'font-weight': 'bold',
      'margin': '0.67em 0',
      'color': '#1a1a1a'
    },

    '.editor-content h2': {
      'font-size': '1.5em',
      'font-weight': 'bold',
      'margin': '0.83em 0',
      'color': '#1a1a1a'
    },

    '.editor-content h3': {
      'font-size': '1.17em',
      'font-weight': 'bold',
      'margin': '1em 0',
      'color': '#1a1a1a'
    },

    '.editor-content p': {
      'margin': '1em 0'
    },

    '.editor-content blockquote': {
      'border-left': '4px solid #007bff',
      'padding-left': '16px',
      'margin': '1em 0',
      'color': '#6c757d',
      'font-style': 'italic'
    },

    '.editor-content ul, .editor-content ol': {
      'padding-left': '24px',
      'margin': '1em 0'
    },

    '.editor-content li': {
      'margin': '0.5em 0'
    },

    '.editor-content a': {
      'color': '#007bff',
      'text-decoration': 'underline'
    },

    '.editor-content a:hover': {
      'color': '#0056b3'
    },

    '.editor-content img': {
      'max-width': '100%',
      'height': 'auto',
      'border-radius': '4px'
    },

    '.editor-content table': {
      'border-collapse': 'collapse',
      'width': '100%',
      'margin': '1em 0',
      'border': '1px solid #e1e5e9'
    },

    '.editor-content th, .editor-content td': {
      'border': '1px solid #e1e5e9',
      'padding': '8px 12px',
      'text-align': 'left'
    },

    '.editor-content th': {
      'background-color': '#f8f9fa',
      'font-weight': 'bold'
    },

    '.editor-content tr:nth-child(even)': {
      'background-color': '#f8f9fa'
    },

    '.editor-content code': {
      'background-color': '#f8f9fa',
      'padding': '2px 4px',
      'border-radius': '3px',
      'font-family': 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
      'font-size': '0.9em'
    },

    '.editor-content pre': {
      'background-color': '#f8f9fa',
      'padding': '12px',
      'border-radius': '4px',
      'overflow-x': 'auto',
      'margin': '1em 0'
    },

    '.editor-content pre code': {
      'background': 'none',
      'padding': '0'
    },

    // Status bar
    '.statusbar': {
      'background': '#f8f9fa',
      'border-top': '1px solid #e1e5e9',
      'padding': '4px 12px',
      'font-size': '12px',
      'color': '#6c757d',
      'display': 'flex',
      'justify-content': 'space-between',
      'align-items': 'center'
    },

    // Dropdowns
    '.editor-dropdown': {
      'background': '#ffffff',
      'border': '1px solid #e1e5e9',
      'border-radius': '4px',
      'box-shadow': '0 2px 10px rgba(0,0,0,0.15)'
    },

    '.dropdown-item': {
      'color': '#333333'
    },

    '.dropdown-item:hover': {
      'background-color': '#f8f9fa'
    },

    '.dropdown-item.highlighted': {
      'background-color': '#e3f2fd'
    },

    // Color picker
    '.color-picker': {
      'background': '#ffffff',
      'border': '1px solid #e1e5e9'
    },

    // Tooltips
    '.editor-tooltip': {
      'background': 'rgba(0, 0, 0, 0.8)',
      'color': '#ffffff'
    },

    // Table popup
    '.table-popup': {
      'background': '#ffffff',
      'border': '1px solid #e1e5e9'
    },

    // Table toolbar
    '.table-toolbar': {
      'background': '#ffffff',
      'border': '1px solid #e1e5e9'
    },

    // Media dropzone
    '.media-dropzone': {
      'background': 'rgba(74, 144, 226, 0.1)',
      'border': '2px dashed #4a90e2',
      'color': '#4a90e2'
    },

    // Selection highlight
    '::selection': {
      'background-color': '#b3d4fc'
    },

    '::-moz-selection': {
      'background-color': '#b3d4fc'
    },

    // Focus states
    '.rich-editor:focus-within': {
      'border-color': '#007bff',
      'box-shadow': '0 0 0 2px rgba(0, 123, 255, 0.25)'
    }
  };

  /**
   * Apply theme styles to editor
   */
  static apply(editor) {
    // Remove existing theme classes
    editor.container.classList.remove('theme-light', 'theme-dark');
    
    // Add light theme class
    editor.container.classList.add('theme-light');

    // Apply styles
    this.injectStyles();

    // Update theme-specific settings
    if (editor.options) {
      editor.options.theme = 'light';
    }

    // Trigger theme change event
    editor.container.dispatchEvent(new CustomEvent('theme:change', {
      detail: { theme: 'light' }
    }));
  }

  /**
   * Inject theme styles into document
   */
  static injectStyles() {
    // Remove existing light theme styles
    const existingStyle = document.getElementById('rich-editor-light-theme');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create new style element
    const style = document.createElement('style');
    style.id = 'rich-editor-light-theme';
    style.type = 'text/css';

    // Convert styles object to CSS
    let css = '';
    for (const [selector, rules] of Object.entries(this.styles)) {
      css += `${selector} {\n`;
      for (const [property, value] of Object.entries(rules)) {
        css += `  ${property}: ${value};\n`;
      }
      css += '}\n\n';
    }

    style.textContent = css;
    document.head.appendChild(style);
  }

  /**
   * Get theme colors
   */
  static getColors() {
    return {
      primary: '#007bff',
      secondary: '#6c757d',
      success: '#28a745',
      warning: '#ffc107',
      danger: '#dc3545',
      info: '#17a2b8',
      light: '#f8f9fa',
      dark: '#343a40',
      background: '#ffffff',
      surface: '#f8f9fa',
      text: '#333333',
      textSecondary: '#6c757d',
      border: '#e1e5e9'
    };
  }

  /**
   * Get theme configuration
   */
  static getConfig() {
    return {
      name: this.themeName,
      colors: this.getColors(),
      styles: this.styles,
      isDark: false
    };
  }

  /**
   * Remove theme
   */
  static remove() {
    const style = document.getElementById('rich-editor-light-theme');
    if (style) {
      style.remove();
    }
  }
}

export default LightTheme; 