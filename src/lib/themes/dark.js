/**
 * Dark Theme - Dark theme for the editor
 * Extracted from ThemeManager.js dark theme logic
 */
class DarkTheme {
  static themeName = 'dark';
  
  static styles = {
    // Editor container
    '.rich-editor': {
      'background-color': '#1a1a1a',
      'border': '1px solid #404040',
      'border-radius': '4px',
      'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      'font-size': '14px',
      'line-height': '1.5',
      'color': '#e0e0e0'
    },

    // Toolbar
    '.toolbar': {
      'background': '#2d2d2d',
      'border-bottom': '1px solid #404040',
      'padding': '8px 12px',
      'display': 'flex',
      'align-items': 'center',
      'gap': '4px',
      'flex-wrap': 'wrap'
    },

    '.toolbar-group': {
      'display': 'flex',
      'align-items': 'center'
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
      'color': '#b0b0b0',
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
      'background-color': '#404040',
      'border-color': '#606060',
      'color': '#ffffff'
    },

    '.toolbar-btn:active, .toolbar-btn.active': {
      'background-color': '#0d7377',
      'color': '#ffffff',
      'border-color': '#0d7377'
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
      'background': '#1a1a1a',
      'color': '#e0e0e0'
    },

    '.editor-content:focus': {
      'outline': 'none'
    },

    // Content formatting
    '.editor-content h1': {
      'font-size': '2em',
      'font-weight': 'bold',
      'margin': '0.67em 0',
      'color': '#ffffff'
    },

    '.editor-content h2': {
      'font-size': '1.5em',
      'font-weight': 'bold',
      'margin': '0.83em 0',
      'color': '#ffffff'
    },

    '.editor-content h3': {
      'font-size': '1.17em',
      'font-weight': 'bold',
      'margin': '1em 0',
      'color': '#ffffff'
    },

    '.editor-content p': {
      'margin': '1em 0',
      'color': '#e0e0e0'
    },

    '.editor-content blockquote': {
      'border-left': '4px solid #0d7377',
      'padding-left': '16px',
      'margin': '1em 0',
      'color': '#b0b0b0',
      'font-style': 'italic'
    },

    '.editor-content ul, .editor-content ol': {
      'padding-left': '24px',
      'margin': '1em 0',
      'color': '#e0e0e0'
    },

    '.editor-content li': {
      'margin': '0.5em 0'
    },

    '.editor-content a': {
      'color': '#14a085',
      'text-decoration': 'underline'
    },

    '.editor-content a:hover': {
      'color': '#0d7377'
    },

    '.editor-content img': {
      'max-width': '100%',
      'height': 'auto',
      'border-radius': '4px',
      'filter': 'brightness(0.9)'
    },

    '.editor-content table': {
      'border-collapse': 'collapse',
      'width': '100%',
      'margin': '1em 0',
      'border': '1px solid #404040'
    },

    '.editor-content th, .editor-content td': {
      'border': '1px solid #404040',
      'padding': '8px 12px',
      'text-align': 'left',
      'color': '#e0e0e0'
    },

    '.editor-content th': {
      'background-color': '#2d2d2d',
      'font-weight': 'bold',
      'color': '#ffffff'
    },

    '.editor-content tr:nth-child(even)': {
      'background-color': '#2d2d2d'
    },

    '.editor-content code': {
      'background-color': '#2d2d2d',
      'padding': '2px 4px',
      'border-radius': '3px',
      'font-family': 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
      'font-size': '0.9em',
      'color': '#14a085'
    },

    '.editor-content pre': {
      'background-color': '#2d2d2d',
      'padding': '12px',
      'border-radius': '4px',
      'overflow-x': 'auto',
      'margin': '1em 0',
      'border': '1px solid #404040'
    },

    '.editor-content pre code': {
      'background': 'none',
      'padding': '0',
      'color': '#e0e0e0'
    },

    // Status bar
    '.statusbar': {
      'background': '#2d2d2d',
      'border-top': '1px solid #404040',
      'padding': '4px 12px',
      'font-size': '12px',
      'color': '#b0b0b0',
      'display': 'flex',
      'justify-content': 'space-between',
      'align-items': 'center'
    },

    // Dropdowns
    '.editor-dropdown': {
      'background': '#2d2d2d',
      'border': '1px solid #404040',
      'border-radius': '4px',
      'box-shadow': '0 2px 10px rgba(0,0,0,0.5)',
      'color': '#e0e0e0'
    },

    '.dropdown-item': {
      'color': '#e0e0e0'
    },

    '.dropdown-item:hover': {
      'background-color': '#404040',
      'color': '#ffffff'
    },

    '.dropdown-item.highlighted': {
      'background-color': '#0d7377',
      'color': '#ffffff'
    },

    // Color picker
    '.color-picker': {
      'background': '#2d2d2d',
      'border': '1px solid #404040',
      'color': '#e0e0e0'
    },

    // Tooltips
    '.editor-tooltip': {
      'background': 'rgba(45, 45, 45, 0.95)',
      'color': '#e0e0e0',
      'border': '1px solid #404040'
    },

    // Table popup
    '.table-popup': {
      'background': '#2d2d2d',
      'border': '1px solid #404040',
      'color': '#e0e0e0'
    },

    // Table toolbar
    '.table-toolbar': {
      'background': '#2d2d2d',
      'border': '1px solid #404040'
    },

    '.table-toolbar button': {
      'background': 'transparent',
      'border': '1px solid #404040',
      'color': '#b0b0b0'
    },

    '.table-toolbar button:hover': {
      'background': '#404040',
      'color': '#ffffff'
    },

    // Media dropzone
    '.media-dropzone': {
      'background': 'rgba(20, 160, 133, 0.15)',
      'border': '2px dashed #14a085',
      'color': '#14a085'
    },

    // Scrollbars
    '.editor-content::-webkit-scrollbar': {
      'width': '8px'
    },

    '.editor-content::-webkit-scrollbar-track': {
      'background': '#2d2d2d'
    },

    '.editor-content::-webkit-scrollbar-thumb': {
      'background': '#404040',
      'border-radius': '4px'
    },

    '.editor-content::-webkit-scrollbar-thumb:hover': {
      'background': '#606060'
    },

    // Selection highlight
    '::selection': {
      'background-color': '#0d7377',
      'color': '#ffffff'
    },

    '::-moz-selection': {
      'background-color': '#0d7377',
      'color': '#ffffff'
    },

    // Focus states
    '.rich-editor:focus-within': {
      'border-color': '#14a085',
      'box-shadow': '0 0 0 2px rgba(20, 160, 133, 0.25)'
    },

    // Upload progress
    '.upload-progress': {
      'background': 'rgba(45, 45, 45, 0.95)',
      'color': '#e0e0e0',
      'border': '1px solid #404040'
    },

    // Upload error
    '.upload-error': {
      'background': '#dc3545',
      'color': '#ffffff'
    },

    // Search input in dropdowns
    '.dropdown-items input[type="text"]': {
      'background': '#404040',
      'border': '1px solid #606060',
      'color': '#e0e0e0'
    },

    '.dropdown-items input[type="text"]:focus': {
      'border-color': '#14a085',
      'outline': 'none'
    },

    // Custom color input
    'input[type="color"]': {
      'background': '#404040',
      'border': '1px solid #606060'
    },

    // Placeholder text
    '.editor-content[data-placeholder]:empty::before': {
      'content': 'attr(data-placeholder)',
      'color': '#666666',
      'font-style': 'italic'
    }
  };

  /**
   * Apply theme styles to editor
   */
  static apply(editor) {
    // Remove existing theme classes
    if (editor.wrapper) {
      editor.wrapper.classList.remove('theme-light', 'theme-dark');
      
      // Add dark theme class
      editor.wrapper.classList.add('theme-dark');
    }

    // Apply styles
    this.injectStyles();

    // Update theme-specific settings
    if (editor.options) {
      editor.options.theme = 'dark';
    }

    // Trigger theme change event
    if (editor.wrapper) {
      editor.wrapper.dispatchEvent(new CustomEvent('theme:change', {
        detail: { theme: 'dark' }
      }));
    }
  }

  /**
   * Inject theme styles into document
   */
  static injectStyles() {
    // Remove existing dark theme styles
    const existingStyle = document.getElementById('rich-editor-dark-theme');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create new style element
    const style = document.createElement('style');
    style.id = 'rich-editor-dark-theme';
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
      primary: '#14a085',
      secondary: '#b0b0b0',
      success: '#28a745',
      warning: '#ffc107',
      danger: '#dc3545',
      info: '#17a2b8',
      light: '#e0e0e0',
      dark: '#1a1a1a',
      background: '#1a1a1a',
      surface: '#2d2d2d',
      text: '#e0e0e0',
      textSecondary: '#b0b0b0',
      border: '#404040'
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
      isDark: true
    };
  }

  /**
   * Remove theme
   */
  static remove() {
    const style = document.getElementById('rich-editor-dark-theme');
    if (style) {
      style.remove();
    }
  }
}

export default DarkTheme; 