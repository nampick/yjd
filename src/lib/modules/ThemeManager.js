// ThemeManager.js - Quản lý theme và styling
export class ThemeManager {
  constructor(editor) {
    this.editor = editor;
  }

  // Toggle theme between light and dark
  toggleTheme() {
    this.editor.options.theme = this.editor.options.theme === 'dark' ? 'light' : 'dark';
    this.editor.options.theme = this.editor.options.theme;
    
    // Save theme preference to localStorage
    localStorage.setItem('richEditorTheme', this.editor.options.theme);
    
    // Apply theme to the editor
    this.applyTheme();
    
    // Update theme toggle button
    this.updateThemeToggleButton();
  }

  // Apply theme styles to the editor and components
  applyTheme() {
    const isDark = this.editor.options.theme === 'dark';
    
    // Set theme attribute on body to apply CSS variables
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    
    // Apply theme to specific elements that need JS styling
    if (this.container) {
      this.container.style.background = isDark ? '#1a1a1a' : '#ffffff';
      this.container.style.color = isDark ? '#e0e0e0' : '#333333';
      this.container.style.border = isDark ? '1px solid #404040' : '1px solid #e0e0e0';
    }

    // Apply theme to toolbar
    if (this.toolbar) {
      this.toolbar.style.background = isDark ? '#2a2a2a' : '#f8f9fa';
      this.toolbar.style.borderBottom = isDark ? '1px solid #404040' : '1px solid #e0e0e0';
    }

    // Apply theme to toolbar separator
    if (this.toolbarSeparator) {
      this.toolbarSeparator.style.background = isDark ? '#404040' : '#e5e7eb';
    }

    // Update toolbar2 row separators theme
    const rowSeparators = this.toolbar2?.querySelectorAll('.toolbar-row-separator');
    if (rowSeparators) {
      rowSeparators.forEach(separator => {
        separator.style.background = isDark ? '#404040' : '#e5e7eb';
      });
    }

    // Apply theme to editor area
    if (this.editor) {
      this.editor.wrapper.style.background = isDark ? '#1e1e1e' : '#ffffff';
      this.editor.wrapper.style.color = isDark ? '#e0e0e0' : '#333333';
    }

    // Apply theme to status bar
    if (this.statusbar) {
      this.statusbar.style.background = isDark ? '#2a2a2a' : '#f8f9fa';
      this.statusbar.style.borderTop = isDark ? '1px solid #404040' : '1px solid #e0e0e0';
      this.statusbar.style.color = isDark ? '#b0b0b0' : '#666666';
    }

    // Update all toolbar buttons
    this.updateToolbarButtonsTheme();
    
    // Update dropdown selectors
    this.updateSelectorsTheme();

    // Apply theme to dynamic content that CSS can't reach
    this.updateDynamicElements();
    
    // Update inline styles in editor content
    this.updateEditorContentTheme();
  }

  // Update theme toggle button appearance
  updateThemeToggleButton() {
    if (!this.themeToggleBtn) return;
    
    const isDark = this.options.theme === 'dark';
    
    this.themeToggleBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    this.themeToggleBtn.title = isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme';
    this.themeToggleBtn.style.background = isDark ? '#2a2a2a' : '#ffffff';
    this.themeToggleBtn.style.color = isDark ? '#e0e0e0' : '#333333';
    this.themeToggleBtn.style.border = isDark ? '1px solid #404040' : '1px solid #e0e0e0';
  }

  // Update all toolbar buttons theme
  updateToolbarButtonsTheme() {
    const isDark = this.editor.options.theme === 'dark';
    const buttons = this.editor.toolbar.querySelectorAll('.editor-btn');
    
    buttons.forEach(btn => {
      if (btn === this.themeToggleBtn) return; // Skip theme button, it has its own styling
      
      btn.style.background = isDark ? '#2a2a2a' : '#ffffff';
      btn.style.color = isDark ? '#e0e0e0' : '#333333';
      btn.style.border = isDark ? '1px solid #404040' : '1px solid #e0e0e0';
      
      // Update hover effects
      btn.onmouseover = () => {
        btn.style.background = isDark ? '#404040' : '#f5f5f5';
      };
      
      btn.onmouseout = () => {
        const isActive = btn.classList.contains('active');
        if (isActive) {
          btn.style.background = isDark ? '#0f4c75' : '#007bff';
          btn.style.color = '#ffffff';
        } else {
          btn.style.background = isDark ? '#2a2a2a' : '#ffffff';
          btn.style.color = isDark ? '#e0e0e0' : '#333333';
        }
      };
    });
  }

  // Update dropdown selectors theme
  updateSelectorsTheme() {
    const isDark = this.editor.options.theme === 'dark';
    
    // Update font selector
    if (this.fontSelector) {
      this.fontSelector.style.background = isDark ? '#2a2a2a' : '#ffffff';
      this.fontSelector.style.color = isDark ? '#e0e0e0' : '#333333';
      this.fontSelector.style.border = isDark ? '1px solid #404040' : '1px solid #e0e0e0';
      
      // Add hover effects
      this.fontSelector.onmouseover = () => {
        this.fontSelector.style.background = isDark ? '#404040' : '#f5f5f5';
      };
      
      this.fontSelector.onmouseout = () => {
        this.fontSelector.style.background = isDark ? '#2a2a2a' : '#ffffff';
      };
    }

    // Update heading selector
    if (this.headingSelector) {
      this.headingSelector.style.background = isDark ? '#2a2a2a' : '#ffffff';
      this.headingSelector.style.color = isDark ? '#e0e0e0' : '#333333';
      this.headingSelector.style.border = isDark ? '1px solid #404040' : '1px solid #e0e0e0';
      
      // Add hover effects
      this.headingSelector.onmouseover = () => {
        this.headingSelector.style.background = isDark ? '#404040' : '#f5f5f5';
      };
      
      this.headingSelector.onmouseout = () => {
        this.headingSelector.style.background = isDark ? '#2a2a2a' : '#ffffff';
      };
    }

    // Update font size input
    if (this.fontSizeInput) {
      this.fontSizeInput.style.background = isDark ? '#2a2a2a' : '#ffffff';
      this.fontSizeInput.style.color = isDark ? '#e0e0e0' : '#333333';
      this.fontSizeInput.style.border = isDark ? '1px solid #404040' : '1px solid #e0e0e0';
      
      // Add focus effects for input
      this.fontSizeInput.onfocus = () => {
        this.fontSizeInput.style.background = isDark ? '#404040' : '#f5f5f5';
        this.fontSizeInput.style.borderColor = isDark ? '#66ccff' : '#007bff';
      };
      
      this.fontSizeInput.onblur = () => {
        this.fontSizeInput.style.background = isDark ? '#2a2a2a' : '#ffffff';
        this.fontSizeInput.style.borderColor = isDark ? '#404040' : '#e0e0e0';
      };
    }

    // Update line height selector
    if (this.lineHeightSelector) {
      this.lineHeightSelector.style.background = isDark ? '#2a2a2a' : '#ffffff';
      this.lineHeightSelector.style.color = isDark ? '#e0e0e0' : '#333333';
      this.lineHeightSelector.style.border = isDark ? '1px solid #404040' : '1px solid #e0e0e0';
      
      // Add hover effects
      this.lineHeightSelector.onmouseover = () => {
        this.lineHeightSelector.style.background = isDark ? '#404040' : '#f5f5f5';
      };
      
      this.lineHeightSelector.onmouseout = () => {
        this.lineHeightSelector.style.background = isDark ? '#2a2a2a' : '#ffffff';
      };
    }

    // Update capitalization selector
    if (this.capitalizationSelector) {
      this.capitalizationSelector.style.background = isDark ? '#2a2a2a' : '#ffffff';
      this.capitalizationSelector.style.color = isDark ? '#e0e0e0' : '#333333';
      this.capitalizationSelector.style.border = isDark ? '1px solid #404040' : '1px solid #e0e0e0';
      
      // Add hover effects
      this.capitalizationSelector.onmouseover = () => {
        this.capitalizationSelector.style.background = isDark ? '#404040' : '#f5f5f5';
      };
      
      this.capitalizationSelector.onmouseout = () => {
        this.capitalizationSelector.style.background = isDark ? '#2a2a2a' : '#ffffff';
      };
    }

    // Update any other dropdown elements that might exist
    const allSelectors = this.editor.toolbar.querySelectorAll('select, input[type="number"], .font-select, .block-format-select');
    allSelectors.forEach(selector => {
      // Skip if already handled above
      if (selector === this.fontSelector || selector === this.headingSelector || 
          selector === this.fontSizeInput || selector === this.lineHeightSelector || 
          selector === this.capitalizationSelector) {
        return;
      }
      
      selector.style.background = isDark ? '#2a2a2a' : '#ffffff';
      selector.style.color = isDark ? '#e0e0e0' : '#333333';
      selector.style.border = isDark ? '1px solid #404040' : '1px solid #e0e0e0';
      
      // Add appropriate hover/focus effects
      if (selector.tagName.toLowerCase() === 'select') {
        selector.onmouseover = () => {
          selector.style.background = isDark ? '#404040' : '#f5f5f5';
        };
        
        selector.onmouseout = () => {
          selector.style.background = isDark ? '#2a2a2a' : '#ffffff';
        };
      } else if (selector.tagName.toLowerCase() === 'input') {
        selector.onfocus = () => {
          selector.style.background = isDark ? '#404040' : '#f5f5f5';
          selector.style.borderColor = isDark ? '#66ccff' : '#007bff';
        };
        
        selector.onblur = () => {
          selector.style.background = isDark ? '#2a2a2a' : '#ffffff';
          selector.style.borderColor = isDark ? '#404040' : '#e0e0e0';
        };
      }
    });
  }

  // Update dynamic elements that CSS can't reach
  updateDynamicElements() {
    const isDark = this.editor.options.theme === 'dark';
    
    // Update any existing tooltips
    const tooltips = document.querySelectorAll('.editor-tooltip, #custom-tooltip');
    tooltips.forEach(tooltip => {
      tooltip.style.background = isDark ? '#2a2a2a' : '#ffffff';
      tooltip.style.border = isDark ? '1px solid #404040' : '1px solid #ccc';
      tooltip.style.color = isDark ? '#e0e0e0' : '#333333';
      tooltip.style.boxShadow = isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.18)';
    });

    // Update overlay backgrounds
    const overlays = document.querySelectorAll('#custom-tooltip-overlay, #tags-popup-overlay, #templates-popup-overlay');
    overlays.forEach(overlay => {
      overlay.style.background = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.08)';
    });

    // Update any existing popups
    const popups = document.querySelectorAll('#tags-popup, #templates-popup');
    popups.forEach(popup => {
      popup.style.background = isDark ? '#2a2a2a' : '#ffffff';
      popup.style.border = isDark ? '1px solid #404040' : '1px solid #e5e7eb';
      popup.style.color = isDark ? '#e0e0e0' : '#333333';
      popup.style.boxShadow = isDark ? '0 10px 25px rgba(0,0,0,0.3)' : '0 10px 25px rgba(0,0,0,0.15)';
    });

    // Update popup headers
    const popupHeaders = document.querySelectorAll('#tags-popup .header, #templates-popup .header');
    popupHeaders.forEach(header => {
      header.style.borderBottom = isDark ? '1px solid #404040' : '1px solid #e5e7eb';
    });

    // Update close buttons in popups
    const closeButtons = document.querySelectorAll('#tags-popup button[onclick*="close"], #templates-popup button[onclick*="close"]');
    closeButtons.forEach(btn => {
      btn.style.color = isDark ? '#b0b0b0' : '#6b7280';
    });

    // Update category buttons in tags popup
    const categoryButtons = document.querySelectorAll('#tags-popup .category-btn');
    categoryButtons.forEach(btn => {
      const span = btn.querySelector('span:last-child');
      if (span) {
        span.style.color = isDark ? '#e0e0e0' : '#374151';
      }
    });

    // Update block toolbar if exists
    if (this.blockToolbar) {
      this.blockToolbar.style.background = isDark ? '#2a2a2a' : '#ffffff';
      this.blockToolbar.style.boxShadow = isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.13)';
      
      // Update arrow
      const arrow = this.blockToolbar.querySelector('.block-toolbar-arrow');
      if (arrow) {
        arrow.style.borderTop = isDark ? '8px solid #2a2a2a' : '8px solid #fff';
        arrow.style.filter = isDark ? 'drop-shadow(-2px 2px 2px rgba(0,0,0,0.4))' : 'drop-shadow(-2px 2px 2px rgba(0,0,0,0.08))';
      }

      // Update buttons in block toolbar
      const buttons = this.blockToolbar.querySelectorAll('button');
      buttons.forEach(btn => {
        btn.style.background = isDark ? '#2a2a2a' : '#fff';
        btn.style.color = isDark ? '#e0e0e0' : '#374151';
      });
    }

    // Update color picker if exists
    if (this.colorPicker) {
      this.colorPicker.style.background = isDark ? '#2a2a2a' : '#fff';
      this.colorPicker.style.border = isDark ? '1px solid #404040' : '1px solid #ccc';
      this.colorPicker.style.boxShadow = isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.12)';
      
      // Update custom button in color picker
      const customBtn = this.colorPicker.querySelector('button');
      if (customBtn && customBtn.textContent === 'Custom') {
        customBtn.style.background = isDark ? '#404040' : '#f4f6fa';
        customBtn.style.color = isDark ? '#66ccff' : '#1976d2';
        customBtn.style.border = isDark ? '1px solid #404040' : '1px solid #eee';
      }
    }

    // Update custom insert dropdowns
    const insertDropdowns = document.querySelectorAll('#image-dropdown, #link-dropdown, #emoji-dropdown, #video-dropdown');
    insertDropdowns.forEach(dropdown => {
      dropdown.style.background = isDark ? '#2a2a2a' : '#fff';
      dropdown.style.border = isDark ? '1px solid #404040' : '1px solid #e1e1e1';
      dropdown.style.boxShadow = isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.18)';
      
      // Update inputs in dropdown
      const inputs = dropdown.querySelectorAll('input');
      inputs.forEach(input => {
        input.style.background = isDark ? '#1e1e1e' : '#fff';
        input.style.color = isDark ? '#e0e0e0' : '#333';
        input.style.border = isDark ? '1px solid #404040' : '1px solid #ccc';
      });
      
      // Update buttons in dropdown
      const buttons = dropdown.querySelectorAll('button');
      buttons.forEach(btn => {
        if (btn.textContent === 'Insert') {
          btn.style.background = isDark ? '#0d7377' : '#007bff';
        } else if (btn.textContent === 'Cancel') {
          btn.style.background = isDark ? '#404040' : '#eee';
          btn.style.color = isDark ? '#e0e0e0' : '#333';
        } else {
          // For emoji buttons
          btn.style.background = 'transparent';
        }
      });
    });
  }

  // Update inline styles in editor content for theme compatibility
  updateEditorContentTheme() {
    const isDark = this.editor.options.theme === 'dark';
    
    if (!this.editor) return;
    
    // Define color mappings
    const colorMappings = {
      // Dark colors to light for dark theme
      '#1f2937': isDark ? '#e0e0e0' : '#1f2937',
      '#374151': isDark ? '#e0e0e0' : '#374151', 
      '#111827': isDark ? '#f0f0f0' : '#111827',
      '#6b7280': isDark ? '#b0b0b0' : '#6b7280',
      '#333333': isDark ? '#e0e0e0' : '#333333',
      '#000000': isDark ? '#f0f0f0' : '#000000',
      // Light backgrounds to dark for dark theme
      '#ffffff': isDark ? '#2a2a2a' : '#ffffff',
      '#f9fafb': isDark ? '#2a2a2a' : '#f9fafb',
      '#f3f4f6': isDark ? '#2a2a2a' : '#f3f4f6',
      '#f8f9fa': isDark ? '#2a2a2a' : '#f8f9fa',
      // Borders
      '#e5e7eb': isDark ? '#404040' : '#e5e7eb',
      '#d1d5db': isDark ? '#404040' : '#d1d5db'
    };
    
    // Get all elements with inline styles in editor
    const elementsWithInlineStyles = this.editor.editor.querySelectorAll('*[style]');
    
    elementsWithInlineStyles.forEach(element => {
      const style = element.getAttribute('style');
      let newStyle = style;
      
      // Replace colors in style attribute
      Object.keys(colorMappings).forEach(oldColor => {
        const newColor = colorMappings[oldColor];
        // Replace color values
        newStyle = newStyle.replace(new RegExp(oldColor, 'gi'), newColor);
      });
      
      // Update style if changed
      if (newStyle !== style) {
        element.setAttribute('style', newStyle);
      }
    });
    
    // Also update any text content that might have colors
    this.updateTableThemes();
  }

  // Update table themes specifically
  updateTableThemes() {
    const isDark = this.editor.options.theme === 'dark';
    const tables = this.editor.editor.querySelectorAll('table');
    
    tables.forEach(table => {
      // Reset table styles first
      table.style.removeProperty('background');
      table.style.removeProperty('background-color');
      table.style.removeProperty('border-color');
      
      // Apply theme-specific styles
      if (isDark) {
        table.style.background = '#2a2a2a';
        table.style.borderColor = '#404040';
      } else {
        table.style.background = '#ffffff';
        table.style.borderColor = '#dee2e6';
      }
      
      // Update table headers
      const headers = table.querySelectorAll('th');
      headers.forEach(th => {
        const currentStyle = th.getAttribute('style') || '';
        
        if (isDark) {
          // For dark theme, check if it has special colors
          if (currentStyle.includes('background-color: #f59e0b') || 
              currentStyle.includes('background: #f59e0b') ||
              currentStyle.includes('background-color: #ef4444') || 
              currentStyle.includes('background: #ef4444') ||
              currentStyle.includes('background-color: #10b981') || 
              currentStyle.includes('background: #10b981') ||
              currentStyle.includes('background-color: #3b82f6') || 
              currentStyle.includes('background: #3b82f6')) {
            // Keep special colors but adjust for dark theme visibility
            th.style.color = 'white';
          } else {
            // Standard dark theme header
            th.style.background = '#404040';
            th.style.color = '#f0f0f0';
          }
          th.style.borderColor = '#404040';
        } else {
          // For light theme, reset and apply proper colors
          if (currentStyle.includes('background-color: #f59e0b') || 
              currentStyle.includes('background: #f59e0b')) {
            th.style.background = '#f59e0b';
            th.style.color = 'white';
          } else if (currentStyle.includes('background-color: #ef4444') || 
                    currentStyle.includes('background: #ef4444')) {
            th.style.background = '#ef4444';
            th.style.color = 'white';
          } else if (currentStyle.includes('background-color: #10b981') || 
                    currentStyle.includes('background: #10b981')) {
            th.style.background = '#10b981';
            th.style.color = 'white';
          } else if (currentStyle.includes('background-color: #3b82f6') || 
                    currentStyle.includes('background: #3b82f6')) {
            th.style.background = '#3b82f6';
            th.style.color = 'white';
          } else {
            // Standard light theme header
            th.style.background = '#f8f9fa';
            th.style.color = '#333333';
          }
          th.style.borderColor = '#dee2e6';
        }
      });
      
      // Update table cells
      const cells = table.querySelectorAll('td');
      cells.forEach(td => {
        // Reset cell styles first
        td.style.removeProperty('background');
        td.style.removeProperty('background-color');
        
        if (isDark) {
          td.style.color = '#e0e0e0';
          td.style.borderColor = '#404040';
          
          // Check if cell has special background colors and adjust
          const currentStyle = td.getAttribute('style') || '';
          if (currentStyle.includes('background-color:') || currentStyle.includes('background:')) {
            // Keep background but ensure text is visible
            if (currentStyle.includes('#ffffff') || currentStyle.includes('#f9fafb') || 
                currentStyle.includes('#f3f4f6') || currentStyle.includes('#fff')) {
              td.style.background = '#2a2a2a';
            }
          }
        } else {
          td.style.color = '#333333';
          td.style.borderColor = '#dee2e6';
          
          // Reset any dark theme backgrounds
          const currentStyle = td.getAttribute('style') || '';
          if (currentStyle.includes('background-color: #2a2a2a') || 
              currentStyle.includes('background: #2a2a2a')) {
            td.style.background = 'transparent';
          }
        }
      });
    });
  }

  // Apply theme to a specific element and its children
  applyThemeToElement(element) {
    const isDark = this.options.theme === 'dark';
    
    // Define color mappings
    const colorMappings = {
      // Dark colors to light for dark theme
      '#1f2937': isDark ? '#e0e0e0' : '#1f2937',
      '#374151': isDark ? '#e0e0e0' : '#374151', 
      '#111827': isDark ? '#f0f0f0' : '#111827',
      '#6b7280': isDark ? '#b0b0b0' : '#6b7280',
      '#333333': isDark ? '#e0e0e0' : '#333333',
      '#000000': isDark ? '#f0f0f0' : '#000000',
      '#2c3e50': isDark ? '#e0e0e0' : '#2c3e50',
      '#34495e': isDark ? '#d0d0d0' : '#34495e',
      // Light backgrounds to dark for dark theme
      '#ffffff': isDark ? '#2a2a2a' : '#ffffff',
      '#f9fafb': isDark ? '#2a2a2a' : '#f9fafb',
      '#f3f4f6': isDark ? '#2a2a2a' : '#f3f4f6',
      '#f8f9fa': isDark ? '#2a2a2a' : '#f8f9fa',
      '#fff': isDark ? '#2a2a2a' : '#fff',
      // Borders
      '#e5e7eb': isDark ? '#404040' : '#e5e7eb',
      '#d1d5db': isDark ? '#404040' : '#d1d5db',
      '#dee2e6': isDark ? '#404040' : '#dee2e6'
    };
    
    // Get all elements with inline styles in the element
    const elementsWithInlineStyles = element.querySelectorAll('*[style]');
    
    // Include the element itself if it has styles
    if (element.hasAttribute('style')) {
      elementsWithInlineStyles.push(element);
    }
    
    elementsWithInlineStyles.forEach(el => {
      const style = el.getAttribute('style');
      let newStyle = style;
      
      // Replace colors in style attribute
      Object.keys(colorMappings).forEach(oldColor => {
        const newColor = colorMappings[oldColor];
        // Replace color values (case insensitive)
        newStyle = newStyle.replace(new RegExp(oldColor, 'gi'), newColor);
      });
      
      // Update style if changed
      if (newStyle !== style) {
        el.setAttribute('style', newStyle);
      }
    });
  }
} 