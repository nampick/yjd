/**
 * Color Picker Component - Simple color picker with popup
 */
import IconUtils, { registerIcons, S } from './icons.js';
import { appendPopup, calculatePopupPosition, setPopupPosition } from '../utils/popup-helper.js';

registerIcons({
  'no-color': S('<circle cx="12" cy="12" r="9"/><line x1="5.6" x2="18.4" y1="5.6" y2="18.4"/>'),
  'custom-color': S('<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.43-.18-.83-.44-1.12-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.55-2.5 5.55-5.55C22 6 17.5 2 12 2z"/><circle cx="8.5" cy="7.5" r="1" fill="currentColor" stroke="none"/><circle cx="6.5" cy="12.5" r="1" fill="currentColor" stroke="none"/><circle cx="13.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>')
});

class ColorPicker {
  constructor(options = {}) {
    this.options = {
      // UI 2.0 v2 palette — the classic 30-colour web grid (6 columns).
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

    // Mono uppercase header (UI 2.0), e.g. "Text colour" / "Background".
    if (this.options.title) {
      const head = document.createElement('div');
      head.className = 'color-picker-head';
      head.textContent = this.options.title;
      this.popup.appendChild(head);
    }

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
      // title alone isn't reliably announced by screen readers; add a label.
      colorButton.setAttribute('aria-label', `Color ${color}`);
      
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
   * Bottom row under the grid (UI 2.0 v2): no-colour · white · black ·
   * custom, then a mono hex readout of the last-picked colour on the right —
   * separated from the swatches by a hairline.
   */
  createCustomColorInput() {
    const customContainer = document.createElement('div');
    customContainer.className = 'custom-color-container';

    const mkBtn = (cls, label) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `color-button ${cls}`;
      b.title = label;
      b.setAttribute('aria-label', label);
      // Keep the editor focused on mousedown so armed typing styles survive.
      b.addEventListener('mousedown', (e) => e.preventDefault());
      return b;
    };
    const pick = (b, color) => b.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.selectColor(color);
      if (this.options.editor) {
        setTimeout(() => this.options.editor.focus(), 0);
      }
    });

    const noColorButton = mkBtn('no-color-button', 'No colour');
    noColorButton.appendChild(IconUtils.createIconElement('no-color', { width: '15px', height: '15px' }));
    pick(noColorButton, 'transparent');

    const whiteButton = mkBtn('white-button', 'White');
    pick(whiteButton, '#ffffff');
    const blackButton = mkBtn('black-button', 'Black');
    pick(blackButton, '#000000');

    const customColorButton = mkBtn('custom-color-button', 'Custom colour');
    customColorButton.appendChild(IconUtils.createIconElement('custom-color', { width: '15px', height: '15px' }));
    const customInput = document.createElement('input');
    customInput.type = 'color';
    customInput.className = 'custom-color-input';
    customInput.value = this.currentColor;
    customInput.style.visibility = 'hidden';
    customInput.style.pointerEvents = 'none';
    customInput.style.opacity = '0';
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
      customInput.style.pointerEvents = 'none';
      customInput.style.opacity = '0';
      this.selectColor(e.target.value);
      if (this.options.editor) {
        setTimeout(() => this.options.editor.focus(), 0);
      }
    });

    const spacer = document.createElement('span');
    spacer.className = 'color-row-spacer';
    this.hexEl = document.createElement('span');
    this.hexEl.className = 'color-hex-readout';
    this.hexEl.textContent = '';

    customContainer.append(noColorButton, whiteButton, blackButton, customColorButton, customInput, spacer, this.hexEl);
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
   * Setup Escape-to-close so the picker is dismissible from the keyboard.
   */
  setupKeyHandler() {
    if (this.keyHandler) document.removeEventListener('keydown', this.keyHandler);
    this.keyHandler = (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        e.preventDefault();
        this.hide();
        if (this.options.editor && typeof this.options.editor.focus === 'function') {
          this.options.editor.focus();
        }
      }
    };
    document.addEventListener('keydown', this.keyHandler);
  }

  /**
   * Remove Escape handler.
   */
  removeKeyHandler() {
    if (this.keyHandler) {
      document.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
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

    // Setup Escape-to-close
    this.setupKeyHandler();
  }

  /**
   * Hide color picker popup
   */
  hide() {
    this.popup.classList.remove('visible');
    this.isVisible = false;
    this.removeClickOutside();
    this.removeKeyHandler();
  }

  /**
   * Select color and trigger callback
   * @param {string} color - Selected color
   */
  selectColor(color) {
    this.currentColor = color;
    // Mono hex readout in the bottom row (UI 2.0 v2).
    if (this.hexEl) this.hexEl.textContent = color === 'transparent' ? '' : color;

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
    this.removeKeyHandler();
    if (this.popup && this.popup.parentNode) {
      this.popup.parentNode.removeChild(this.popup);
    }
  }
}

export default ColorPicker; 