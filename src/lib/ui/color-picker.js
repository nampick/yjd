/**
 * Enhanced Color Picker UI Component
 * Provides color selection for text and background colors
 */
class ColorPicker {
  constructor(options = {}) {
    this.options = {
      colors: [],
      onColorSelect: null,
      position: 'bottom',
      type: 'text', // 'text' or 'background'
      ...options
    };
    
    this.container = null;
    this.isVisible = false;
    this.currentColor = null;
    
    this.init();
  }

  init() {
    this.createColorPicker();
    this.setupEventListeners();
  }

  /**
   * Create color picker DOM structure
   */
  createColorPicker() {
    this.container = document.createElement('div');
    this.container.className = 'rich-editor-color-picker';
    this.container.setAttribute('data-type', this.options.type);
    
    // Create header
    const header = document.createElement('div');
    header.className = 'color-picker-header';
    header.innerHTML = `
      <span class="color-picker-title">
        ${this.options.type === 'text' ? '🎨 Text Color' : '🖍️ Background Color'}
      </span>
      <button class="color-picker-close" type="button">×</button>
    `;
    this.container.appendChild(header);

    // Create current color preview
    const preview = document.createElement('div');
    preview.className = 'color-picker-preview';
    preview.innerHTML = `
      <span class="preview-label">Current:</span>
      <div class="preview-color" style="background: ${this.currentColor || (this.options.type === 'text' ? '#000000' : '#FFFF00')}"></div>
      <span class="preview-value">${this.currentColor || (this.options.type === 'text' ? '#000000' : '#FFFF00')}</span>
    `;
    this.container.appendChild(preview);

    // Create color grid
    const grid = document.createElement('div');
    grid.className = 'color-grid';
    
    const colors = this.options.colors.length > 0 ? this.options.colors : this.getDefaultColors();
    colors.forEach(color => {
      const colorButton = document.createElement('button');
      colorButton.className = 'color-button';
      colorButton.type = 'button';
      colorButton.style.backgroundColor = color;
      colorButton.setAttribute('data-color', color);
      colorButton.title = color;
      
      // Add checkmark for current color
      if (color === this.currentColor) {
        colorButton.classList.add('selected');
        colorButton.innerHTML = '✓';
      }
      
      grid.appendChild(colorButton);
    });
    
    this.container.appendChild(grid);

    // Create custom color section
    const customSection = document.createElement('div');
    customSection.className = 'custom-color-section';
    customSection.innerHTML = `
      <label class="custom-color-label">Custom Color:</label>
      <input type="color" class="custom-color-input" value="${this.currentColor || '#000000'}">
      <button type="button" class="custom-color-apply">Apply</button>
    `;
    this.container.appendChild(customSection);

    // Create remove color section
    if (this.options.type === 'text' || this.options.type === 'background') {
      const removeSection = document.createElement('div');
      removeSection.className = 'remove-color-section';
      removeSection.innerHTML = `
        <button type="button" class="remove-color-btn">
          ${this.options.type === 'text' ? 'Remove Text Color' : 'Remove Background'}
        </button>
      `;
      this.container.appendChild(removeSection);
    }

    // Add to document
    document.body.appendChild(this.container);
  }

  /**
   * Get default color palette based on type
   */
  getDefaultColors() {
    if (this.options.type === 'background') {
      return [
        '#FFFF00', '#FFE135', '#FFCC02', '#FF9500', '#FF6900', '#FF3838',
        '#FF007F', '#E100FF', '#9500FF', '#6A00FF', '#3838FF', '#0099FF',
        '#00BFFF', '#00FFFF', '#00FF9F', '#00FF00', '#9FFF00', '#CCFF00',
        '#FFF2CC', '#FCE5CD', '#F4CCCC', '#D9EAD3', '#D0E0E3', '#CFE2F3',
        '#D9D2E9', '#EAD1DC', '#FFEAA7', '#FDCB6E', '#E17055', '#00B894',
        '#00CEC9', '#6C5CE7', '#A29BFE', '#FD79A8', '#E84393', '#2D3436'
      ];
    } else {
      return [
        '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
        '#FF0000', '#FF6600', '#FFCC00', '#FFFF00', '#CCFF00', '#66FF00',
        '#00FF00', '#00FF66', '#00FFCC', '#00FFFF', '#00CCFF', '#0066FF',
        '#0000FF', '#6600FF', '#CC00FF', '#FF00FF', '#FF00CC', '#FF0066',
        '#8B0000', '#FF4500', '#FFA500', '#FFD700', '#ADFF2F', '#32CD32',
        '#00CED1', '#1E90FF', '#4169E1', '#8A2BE2', '#9932CC', '#DC143C'
      ];
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Color button clicks
    this.container.addEventListener('click', (e) => {
      if (e.target.classList.contains('color-button')) {
        const color = e.target.getAttribute('data-color');
        this.selectColor(color);
      } else if (e.target.classList.contains('color-picker-close')) {
        this.hide();
      } else if (e.target.classList.contains('custom-color-apply')) {
        const customInput = this.container.querySelector('.custom-color-input');
        this.selectColor(customInput.value);
      } else if (e.target.classList.contains('remove-color-btn')) {
        this.removeColor();
      }
    });

    // Custom color input change
    const customInput = this.container.querySelector('.custom-color-input');
    customInput.addEventListener('input', (e) => {
      this.updatePreview(e.target.value);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (this.isVisible && !this.container.contains(e.target)) {
        this.hide();
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  /**
   * Show color picker at position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {string} currentColor - Currently selected color
   */
  show(x, y, currentColor = null) {
    this.currentColor = currentColor;
    this.updatePreview(currentColor);
    this.updateSelectedButton(currentColor);
    
    this.container.style.left = x + 'px';
    this.container.style.top = y + 'px';
    this.container.classList.add('visible');
    this.isVisible = true;

    // Adjust position if off-screen
    this.adjustPosition();
  }

  /**
   * Hide color picker
   */
  hide() {
    this.container.classList.remove('visible');
    this.isVisible = false;
  }

  /**
   * Select a color
   * @param {string} color - Selected color
   */
  selectColor(color) {
    this.currentColor = color;
    this.updatePreview(color);
    this.updateSelectedButton(color);
    
    if (this.options.onColorSelect) {
      this.options.onColorSelect(color);
    }
    
    this.hide();
  }

  /**
   * Remove color formatting
   */
  removeColor() {
    if (this.options.onColorSelect) {
      this.options.onColorSelect(null);
    }
    this.hide();
  }

  /**
   * Update color preview
   * @param {string} color - Color to preview
   */
  updatePreview(color) {
    if (!color) return;
    
    const previewColor = this.container.querySelector('.preview-color');
    const previewValue = this.container.querySelector('.preview-value');
    
    if (previewColor && previewValue) {
      previewColor.style.backgroundColor = color;
      previewValue.textContent = color;
    }
  }

  /**
   * Update selected button in grid
   * @param {string} color - Selected color
   */
  updateSelectedButton(color) {
    // Remove previous selection
    const prevSelected = this.container.querySelector('.color-button.selected');
    if (prevSelected) {
      prevSelected.classList.remove('selected');
      prevSelected.innerHTML = '';
    }

    // Add selection to current color
    if (color) {
      const colorButton = this.container.querySelector(`[data-color="${color}"]`);
      if (colorButton) {
        colorButton.classList.add('selected');
        colorButton.innerHTML = '✓';
      }
    }
  }

  /**
   * Adjust position to stay within viewport
   */
  adjustPosition() {
    const rect = this.container.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust horizontal position
    if (rect.right > viewportWidth) {
      this.container.style.left = (viewportWidth - rect.width - 10) + 'px';
    }
    if (rect.left < 0) {
      this.container.style.left = '10px';
    }

    // Adjust vertical position
    if (rect.bottom > viewportHeight) {
      this.container.style.top = (viewportHeight - rect.height - 10) + 'px';
    }
    if (rect.top < 0) {
      this.container.style.top = '10px';
    }
  }

  /**
   * Set current color
   * @param {string} color - Color to set as current
   */
  setCurrentColor(color) {
    this.currentColor = color;
    this.updatePreview(color);
    this.updateSelectedButton(color);
    
    const customInput = this.container.querySelector('.custom-color-input');
    if (customInput) {
      customInput.value = color || '#000000';
    }
  }

  /**
   * Destroy color picker
   */
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

export default ColorPicker; 