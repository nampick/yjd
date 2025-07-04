/**
 * Color Picker Component - Simple color picker with popup
 */
import IconLoader from './icon-loader.js';

class ColorPicker {
  constructor(options = {}) {
    this.options = {
      colors: [
        '#000000', '#333333', '#666666', '#999999', '#cccccc', '#eeeeee',
        '#ff0000', '#ff6600', '#ffcc00', '#ffff00', '#99ff00', '#00ff00',
        '#00ffcc', '#00ccff', '#0066ff', '#0000ff', '#6600ff', '#cc00ff',
        '#ff00cc', '#ff0066', '#800000', '#ff8000', '#808000', '#008000',
        '#008080', '#0080ff', '#004080', '#800080', '#804080', '#ff0080'
      ],
      customColorEnabled: true,
      onColorSelect: null,
      ...options
    };
    
    this.popup = null;
    this.isVisible = false;
    this.currentColor = '#000000';
    this.clickOutsideHandler = null;
    
    this.createColorPicker();
  }

  /**
   * Create color picker popup
   */
  createColorPicker() {
    // Create popup
    this.popup = document.createElement('div');
    this.popup.className = 'color-picker-popup';
    
    // Create color grid
    this.createColorGrid();
    
    // Create custom color input if enabled
    if (this.options.customColorEnabled) {
      this.createCustomColorInput();
    }
    
    // Add popup to body
    document.body.appendChild(this.popup);
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
    
    // No color button
    const noColorButton = document.createElement('button');
    noColorButton.type = 'button';
    noColorButton.className = 'color-button no-color-button';
    noColorButton.title = 'No Color';
    noColorButton.style.backgroundColor = 'transparent';
    
    // Add icon to button
    const noColorIcon = IconLoader.createIconElement('no-color', {
      width: '24',
      height: '24'
    });
    noColorButton.appendChild(noColorIcon);
    
    noColorButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.selectColor('');
    });
    
    // White button
    const whiteButton = document.createElement('button');
    whiteButton.type = 'button';
    whiteButton.className = 'color-button white-button';
    whiteButton.style.backgroundColor = '#ffffff';
    whiteButton.style.border = '1px solid #ccc';
    whiteButton.title = 'White';
    
    whiteButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.selectColor('#ffffff');
    });
    
    // Black button
    const blackButton = document.createElement('button');
    blackButton.type = 'button';
    blackButton.className = 'color-button black-button';
    blackButton.style.backgroundColor = '#000000';
    blackButton.title = 'Black';
    
    blackButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.selectColor('#000000');
    });
    
    // Custom color button with hidden input
    const customColorButton = document.createElement('button');
    customColorButton.type = 'button';
    customColorButton.className = 'color-button custom-color-button';
    customColorButton.title = 'Custom Color';
    customColorButton.style.backgroundColor = 'transparent';
    customColorButton.style.border = '1px solid #ccc';
    // Add icon to button
    const iconElement = IconLoader.createIconElement('custom-color', {
      width: '16px',
      height: '16px'
    });
    customColorButton.appendChild(iconElement);
    
    const customInput = document.createElement('input');
    customInput.type = 'color';
    customInput.className = 'custom-color-input';
    customInput.value = this.currentColor;
    customInput.style.display = 'none';
    
    customColorButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      customInput.click();
    });
    
    customInput.addEventListener('change', (e) => {
      this.selectColor(e.target.value);
    });
    
    customContainer.appendChild(noColorButton);
    customContainer.appendChild(whiteButton);
    customContainer.appendChild(blackButton);
    customContainer.appendChild(customColorButton);
    customContainer.appendChild(customInput);
    
    this.popup.appendChild(customContainer);
  }

  /**
   * Setup click outside handler
   */
  setupClickOutside() {
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler);
    }
    
    this.clickOutsideHandler = (e) => {
      if (!this.popup.contains(e.target)) {
        this.hide();
      }
    };
    
    // Add slight delay to avoid immediate close
    setTimeout(() => {
      document.addEventListener('click', this.clickOutsideHandler);
    }, 100);
  }

  /**
   * Remove click outside handler
   */
  removeClickOutside() {
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler);
      this.clickOutsideHandler = null;
    }
  }

  /**
   * Show color picker popup
   * @param {HTMLElement} anchor - Element to position popup relative to
   */
  show(anchor) {
    if (!anchor) return;
    
    // Ensure popup is in DOM
    if (!document.body.contains(this.popup)) {
      document.body.appendChild(this.popup);
    }
    
    // Get dimensions and position
    const anchorRect = anchor.getBoundingClientRect();
    const popupWidth = 200;
    const popupHeight = 150;
    
    let top = anchorRect.bottom + window.scrollY + 5;
    let left = anchorRect.left + window.scrollX;
    
    // Adjust if popup would go off screen
    if (left + popupWidth > window.innerWidth) {
      left = window.innerWidth - popupWidth - 10;
    }
    
    if (top + popupHeight > window.innerHeight + window.scrollY) {
      top = anchorRect.top + window.scrollY - popupHeight - 5;
    }
    
    // Keep popup on screen
    if (left < 0) left = 10;
    if (top < 0) top = 10;
    
    // Set position
    this.popup.style.top = `${top}px`;
    this.popup.style.left = `${left}px`;
    
    // Show popup by adding visible class
    this.popup.classList.add('visible');
    this.isVisible = true;
    
    // Setup click outside handler
    this.setupClickOutside();
  }

  /**
   * Hide color picker popup
   */
  hide() {
    this.popup.classList.remove('visible');
    this.isVisible = false;
    this.removeClickOutside();
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
   * Destroy color picker
   */
  destroy() {
    this.removeClickOutside();
    if (this.popup && this.popup.parentNode) {
      this.popup.parentNode.removeChild(this.popup);
    }
  }
}

export default ColorPicker; 