/**
 * Color Picker Component - Simple color picker with popup
 */
class ColorPicker {
  constructor(options = {}) {
    this.options = {
      colors: [
        '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
        '#ff0000', '#ff6600', '#ffcc00', '#ffff00', '#99ff00', '#00ff00',
        '#00ffcc', '#00ccff', '#0066ff', '#0000ff', '#6600ff', '#cc00ff',
        '#ff00cc', '#ff0066', '#800000', '#ff8000', '#808000', '#008000',
        '#008080', '#0080ff', '#004080', '#800080', '#804080', '#ff0080'
      ],
      customColorEnabled: true,
      onColorSelect: null,
      ...options
    };
    
    this.container = null;
    this.popup = null;
    this.isVisible = false;
    this.currentColor = '#000000';
    
    this.createColorPicker();
  }

  /**
   * Create color picker button and popup
   */
  createColorPicker() {
    // Create container
    this.container = document.createElement('div');
    this.container.className = 'color-picker-container';
    
    // Create popup
    this.popup = document.createElement('div');
    this.popup.className = 'color-picker-popup';
    this.popup.style.display = 'none';
    
    // Create color grid
    this.createColorGrid();
    
    // Create custom color input if enabled
    if (this.options.customColorEnabled) {
      this.createCustomColorInput();
    }
    
    // Add to container
    this.container.appendChild(this.popup);
    
    // Add event listeners
    this.addEventListeners();
  }

  /**
   * Create color grid
   */
  createColorGrid() {
    const grid = document.createElement('div');
    grid.className = 'color-grid';
    
    this.options.colors.forEach(color => {
      const colorButton = document.createElement('button');
      colorButton.type = 'button';
      colorButton.className = 'color-button';
      colorButton.style.backgroundColor = color;
      colorButton.dataset.color = color;
      colorButton.title = color;
      
      colorButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.selectColor(color);
      });
      
      grid.appendChild(colorButton);
    });
    
    this.popup.appendChild(grid);
  }

  /**
   * Create custom color input
   */
  createCustomColorInput() {
    const customContainer = document.createElement('div');
    customContainer.className = 'custom-color-container';
    
    const customInput = document.createElement('input');
    customInput.type = 'color';
    customInput.className = 'custom-color-input';
    customInput.value = this.currentColor;
    
    const customLabel = document.createElement('label');
    customLabel.textContent = 'Custom Color';
    customLabel.className = 'custom-color-label';
    
    customInput.addEventListener('change', (e) => {
      this.selectColor(e.target.value);
    });
    
    customContainer.appendChild(customLabel);
    customContainer.appendChild(customInput);
    this.popup.appendChild(customContainer);
  }

  /**
   * Add event listeners
   */
  addEventListeners() {
    // Close popup when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.hide();
      }
    });
    
    // Prevent popup from closing when clicking inside
    this.popup.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  /**
   * Show color picker popup
   * @param {HTMLElement} anchor - Element to position popup relative to
   */
  show(anchor) {
    if (!anchor) return;
    
    this.isVisible = true;
    this.popup.style.display = 'block';
    
    // Position popup relative to anchor
    const anchorRect = anchor.getBoundingClientRect();
    const popupRect = this.popup.getBoundingClientRect();
    
    // Position below anchor by default
    let top = anchorRect.bottom + window.scrollY + 5;
    let left = anchorRect.left + window.scrollX;
    
    // Adjust if popup would go off screen
    if (left + popupRect.width > window.innerWidth) {
      left = window.innerWidth - popupRect.width - 10;
    }
    
    if (top + popupRect.height > window.innerHeight + window.scrollY) {
      top = anchorRect.top + window.scrollY - popupRect.height - 5;
    }
    
    this.popup.style.position = 'absolute';
    this.popup.style.top = `${top}px`;
    this.popup.style.left = `${left}px`;
    this.popup.style.zIndex = '1000';
    
    // Add to document if not already added
    if (!document.body.contains(this.popup)) {
      document.body.appendChild(this.popup);
    }
  }

  /**
   * Hide color picker popup
   */
  hide() {
    this.isVisible = false;
    this.popup.style.display = 'none';
  }

  /**
   * Toggle color picker visibility
   * @param {HTMLElement} anchor - Element to position popup relative to
   */
  toggle(anchor) {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show(anchor);
    }
  }

  /**
   * Select color and trigger callback
   * @param {string} color - Selected color
   */
  selectColor(color) {
    this.currentColor = color;
    
    if (this.options.onColorSelect) {
      this.options.onColorSelect(color);
    }
    
    this.hide();
  }

  /**
   * Get current selected color
   */
  getCurrentColor() {
    return this.currentColor;
  }

  /**
   * Set current color
   * @param {string} color - Color to set
   */
  setCurrentColor(color) {
    this.currentColor = color;
    
    // Update custom color input if exists
    const customInput = this.popup.querySelector('.custom-color-input');
    if (customInput) {
      customInput.value = color;
    }
  }

  /**
   * Destroy color picker
   */
  destroy() {
    if (this.popup && this.popup.parentNode) {
      this.popup.parentNode.removeChild(this.popup);
    }
    
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

export default ColorPicker; 