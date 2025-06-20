/**
 * Color Picker Component - Provides color selection interface
 * Extracted from FormatManager.js color picker logic
 */
class ColorPicker {
  constructor(options = {}) {
    this.options = {
      colors: [
        '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
        '#ff0000', '#ff8800', '#ffff00', '#88ff00', '#00ff00', '#00ff88',
        '#00ffff', '#0088ff', '#0000ff', '#8800ff', '#ff00ff', '#ff0088',
        '#800000', '#804000', '#808000', '#408000', '#008000', '#008040',
        '#008080', '#004080', '#000080', '#400080', '#800080', '#800040'
      ],
      customColors: [],
      showCustom: true,
      showTransparent: true,
      ...options
    };
    
    this.picker = null;
    this.isOpen = false;
    this.currentInput = null;
    this.onColorSelect = null;
    
    this.init();
  }

  /**
   * Initialize color picker
   */
  init() {
    this.createPicker();
    this.setupEventListeners();
  }

  /**
   * Create color picker element
   */
  createPicker() {
    this.picker = document.createElement('div');
    this.picker.className = 'rich-editor-color-picker';

    // Create color grid
    this.createColorGrid();
    
    // Create custom color input
    if (this.options.showCustom) {
      this.createCustomColorInput();
    }

    document.body.appendChild(this.picker);
  }

  /**
   * Create color grid - extracted from createColorPicker()
   */
  createColorGrid() {
    const colorGrid = document.createElement('div');
    colorGrid.className = 'color-grid';

    // Add transparent option
    if (this.options.showTransparent) {
      const transparentBtn = this.createColorButton('transparent', 'Transparent');
      // Transparent pattern handled by CSS
      colorGrid.appendChild(transparentBtn);
    }

    // Add predefined colors
    this.options.colors.forEach(color => {
      const colorBtn = this.createColorButton(color, color);
      colorGrid.appendChild(colorBtn);
    });

    // Add custom colors
    this.options.customColors.forEach(color => {
      const colorBtn = this.createColorButton(color, color);
      colorBtn.classList.add('custom');
      colorGrid.appendChild(colorBtn);
    });

    this.picker.appendChild(colorGrid);
  }

  /**
   * Create individual color button
   */
  createColorButton(color, title) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'color-button';
    button.title = title;
    
    if (color !== 'transparent') {
      button.style.background = color;
    }

    // Hover effects handled by CSS

    button.addEventListener('click', () => {
      this.selectColor(color);
    });

    return button;
  }

  /**
   * Create custom color input
   */
  createCustomColorInput() {
    const customSection = document.createElement('div');
    customSection.className = 'custom-color-section';

    const label = document.createElement('label');
    label.textContent = 'Custom Color:';
    label.className = 'custom-color-label';

    this.customInput = document.createElement('input');
    this.customInput.type = 'color';
    this.customInput.className = 'custom-color-input';

    this.customInput.addEventListener('change', () => {
      const color = this.customInput.value;
      this.addCustomColor(color);
      this.selectColor(color);
    });

    customSection.appendChild(label);
    customSection.appendChild(this.customInput);
    this.picker.appendChild(customSection);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Close picker when clicking outside
    document.addEventListener('mousedown', (e) => {
      if (this.isOpen && !this.picker.contains(e.target) && 
          !e.target.closest('.color-picker-trigger')) {
        this.close();
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  /**
   * Show color picker at position
   */
  show(x, y, onSelect) {
    this.onColorSelect = onSelect;
    this.picker.classList.add('visible');
    this.picker.style.left = x + 'px';
    this.picker.style.top = y + 'px';
    this.isOpen = true;

    // Ensure picker stays within viewport
    this.adjustPosition();
  }

  /**
   * Show color picker relative to element
   */
  showAt(element, onSelect) {
    if (!element) return;

    this.onColorSelect = onSelect;
    const rect = element.getBoundingClientRect();
    
    this.picker.classList.add('visible');
    this.picker.style.left = rect.left + 'px';
    this.picker.style.top = rect.bottom + 5 + 'px';
    this.isOpen = true;

    this.adjustPosition();
  }

  /**
   * Adjust picker position to stay within viewport
   */
  adjustPosition() {
    const pickerRect = this.picker.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let left = parseInt(this.picker.style.left);
    let top = parseInt(this.picker.style.top);

    // Adjust horizontal position
    if (pickerRect.right > viewport.width) {
      left = viewport.width - pickerRect.width - 10;
    }
    if (left < 0) {
      left = 10;
    }

    // Adjust vertical position
    if (pickerRect.bottom > viewport.height) {
      top = viewport.height - pickerRect.height - 10;
    }
    if (top < 0) {
      top = 10;
    }

    this.picker.style.left = left + 'px';
    this.picker.style.top = top + 'px';
  }

  /**
   * Close color picker
   */
  close() {
    this.picker.classList.remove('visible');
    this.isOpen = false;
    this.onColorSelect = null;
  }

  /**
   * Select color
   */
  selectColor(color) {
    if (this.onColorSelect && typeof this.onColorSelect === 'function') {
      this.onColorSelect(color);
    }
    this.close();
  }

  /**
   * Add custom color to palette
   */
  addCustomColor(color) {
    if (!this.options.customColors.includes(color)) {
      this.options.customColors.push(color);
      
      // Limit custom colors to 6
      if (this.options.customColors.length > 6) {
        this.options.customColors.shift();
      }
      
      // Recreate grid to show new custom color
      this.picker.querySelector('.color-grid').remove();
      this.createColorGrid();
    }
  }

  /**
   * Get current color from element
   */
  getCurrentColor(element) {
    if (!element) return '#000000';
    
    const computedStyle = window.getComputedStyle(element);
    return this.rgbToHex(computedStyle.color) || '#000000';
  }

  /**
   * Convert RGB to Hex
   */
  rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent') return '#000000';
    
    const match = rgb.match(/\d+/g);
    if (!match || match.length < 3) return '#000000';
    
    const r = parseInt(match[0]);
    const g = parseInt(match[1]);
    const b = parseInt(match[2]);
    
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /**
   * Check if color is light
   */
  isLightColor(color) {
    if (color === 'transparent') return true;
    
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  }

  /**
   * Destroy color picker
   */
  destroy() {
    if (this.picker && this.picker.parentNode) {
      this.picker.parentNode.removeChild(this.picker);
    }
    
    this.picker = null;
    this.currentInput = null;
    this.onColorSelect = null;
    this.isOpen = false;
  }

  /**
   * Static method to create color picker trigger
   */
  static createTrigger(options = {}) {
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'color-picker-trigger';
    
    // Set background color only
    if (options.color) {
      trigger.style.background = options.color;
    }

    // Add color preview
    const preview = document.createElement('div');
    preview.className = 'color-picker-preview';
    if (options.color) {
      preview.style.background = options.color;
    }
    trigger.appendChild(preview);

    return trigger;
  }
}

export default ColorPicker; 