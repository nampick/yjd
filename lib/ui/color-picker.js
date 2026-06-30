/**
 * Color Picker Component - Simple color picker with popup
 */
import IconUtils from './icons.js';
import { appendPopup, calculatePopupPosition, setPopupPosition } from '../utils/popup-helper.js';

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
      editor: null,
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
    
    // Add popup to container
    appendPopup(this.popup);
    
    // Prevent focus loss when clicking on popup
    if (this.options.editor && typeof this.options.editor.preventFocusLoss === 'function') {
      this.options.editor.preventFocusLoss(this.popup);
    }
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
      
      // Keep the editor focused on mousedown so the browser's pending typing
      // styles (a bold/italic/underline armed on a collapsed caret) survive the
      // click — otherwise blurring the editor discards them and only the colour
      // would be applied. The click still fires; only the focus shift is blocked.
      colorButton.addEventListener('mousedown', (e) => e.preventDefault());

      colorButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.selectColor(color);
        // Maintain editor focus after color selection
        if (this.options.editor) {
          setTimeout(() => this.options.editor.focus(), 0);
        }
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
    const noColorIcon = IconUtils.createIconElement('no-color', {
      width: '24',
      height: '24'
    });
    noColorButton.appendChild(noColorIcon);
    
    noColorButton.addEventListener('mousedown', (e) => e.preventDefault());
    noColorButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.selectColor('transparent');
      // Maintain editor focus after color selection
      if (this.options.editor) {
        setTimeout(() => this.options.editor.focus(), 0);
      }
    });
    
    // White button
    const whiteButton = document.createElement('button');
    whiteButton.type = 'button';
    whiteButton.className = 'color-button white-button';
    whiteButton.style.backgroundColor = '#ffffff';
    whiteButton.style.border = '1px solid #ccc';
    whiteButton.title = 'White';
    
    whiteButton.addEventListener('mousedown', (e) => e.preventDefault());
    whiteButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.selectColor('#ffffff');
      // Maintain editor focus after color selection
      if (this.options.editor) {
        setTimeout(() => this.options.editor.focus(), 0);
      }
    });
    
    // Black button
    const blackButton = document.createElement('button');
    blackButton.type = 'button';
    blackButton.className = 'color-button black-button';
    blackButton.style.backgroundColor = '#000000';
    blackButton.title = 'Black';
    
    blackButton.addEventListener('mousedown', (e) => e.preventDefault());
    blackButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.selectColor('#000000');
      // Maintain editor focus after color selection
      if (this.options.editor) {
        setTimeout(() => this.options.editor.focus(), 0);
      }
    });
    
    // Custom color button with hidden input
    const customColorButton = document.createElement('button');
    customColorButton.type = 'button';
    customColorButton.className = 'color-button custom-color-button';
    customColorButton.title = 'Custom Color';
    customColorButton.style.backgroundColor = 'transparent';
    customColorButton.style.border = '1px solid #ccc';
    customColorButton.style.font = 'none !important';
    // Add icon to button
    const iconElement = IconUtils.createIconElement('custom-color', {
      width: '16px',
      height: '16px'
    });
    customColorButton.appendChild(iconElement);
    
    const customInput = document.createElement('input');
    customInput.type = 'color';
    customInput.className = 'custom-color-input';
    customInput.value = this.currentColor;
    customInput.style.visibility = 'hidden';
    customInput.style.pointerEvents = 'none'; // ngăn không cho click
    customInput.style.opacity = '0'; // ẩn hẳn về mặt thị giác
    customColorButton.addEventListener('click', (e) => {
      customInput.style.visibility = 'visible';
      customInput.style.pointerEvents = 'auto';
      customInput.style.opacity = '1';
      e.preventDefault();
      e.stopPropagation();
      customInput.click();

    });
    
    customInput.addEventListener('change', (e) => {
      customInput.style.visibility = 'hidden';
      customInput.style.pointerEvents = 'none'; // ngăn không cho click
      customInput.style.opacity = '0'; // ẩn hẳn về mặt thị giác
      this.selectColor(e.target.value);
      // Maintain editor focus after color selection
      if (this.options.editor) {
        setTimeout(() => this.options.editor.focus(), 0);
      }
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
      appendPopup(this.popup);
    }
    
    // Calculate and set popup position
    const position = calculatePopupPosition(anchor, this.popup, {
      offsetY: 5,
      offsetX: 0
    });
    setPopupPosition(this.popup, position);
    
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