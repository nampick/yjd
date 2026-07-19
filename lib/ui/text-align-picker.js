import IconUtils, { registerIcons, S } from './icons.js';
import { appendPopup, calculatePopupPosition, setPopupPosition } from '../utils/popup-helper.js';

registerIcons({
  'align-left': S('<line x1="21" x2="3" y1="6" y2="6"/><line x1="15" x2="3" y1="12" y2="12"/><line x1="17" x2="3" y1="18" y2="18"/>'),
  'align-center': S('<line x1="21" x2="3" y1="6" y2="6"/><line x1="17" x2="7" y1="12" y2="12"/><line x1="19" x2="5" y1="18" y2="18"/>'),
  'align-right': S('<line x1="21" x2="3" y1="6" y2="6"/><line x1="21" x2="9" y1="12" y2="12"/><line x1="21" x2="7" y1="18" y2="18"/>'),
  'align-justify': S('<line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/>')
});

/**
 * Text Align Picker Component - Popup for selecting text alignment
 */
class TextAlignPicker {
  constructor(options = {}) {
    this.options = {
      alignments: [
        { value: 'left', label: 'Align Left', icon: 'align-left' },
        { value: 'center', label: 'Align Center', icon: 'align-center' },
        { value: 'right', label: 'Align Right', icon: 'align-right' },
        { value: 'justify', label: 'Justify', icon: 'align-justify' }
      ],
      onAlignSelect: null,
      ...options
    };
    
    this.popup = null;
    this.isVisible = false;
    this.currentAlignment = 'left';
    this.clickOutsideHandler = null;
    
    this.createAlignPicker();
  }

  /**
   * Create text align picker popup
   */
  createAlignPicker() {
    // Create popup
    this.popup = document.createElement('div');
    this.popup.className = 'text-align-picker-popup';
    
    // Create alignment buttons
    this.createAlignmentButtons();
    
    // Add popup to container
    appendPopup(this.popup);
  }

  /**
   * Create alignment buttons
   */
  async createAlignmentButtons() {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'align-button-container';
    
    // Icons are now inline, no need to preload
    
    // Create buttons
    for (const alignment of this.options.alignments) {
      const alignButton = document.createElement('button');
      alignButton.type = 'button';
      alignButton.className = 'align-button';
      alignButton.dataset.alignment = alignment.value;
      alignButton.title = alignment.label;
      
      // Icon only — the label lives in the tooltip (title) above.
      const iconSvg = IconUtils.getIcon(alignment.icon);
      if (iconSvg) {
        alignButton.innerHTML = `<span class="icon-wrapper">${iconSvg}</span>`;
      } else {
        alignButton.textContent = alignment.label.charAt(0);
      }
      
      alignButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.selectAlignment(alignment.value);
      });
      
      buttonContainer.appendChild(alignButton);
    }
    
    this.popup.appendChild(buttonContainer);
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
   * Show text align picker popup
   * @param {HTMLElement} anchor - Element to position popup relative to
   */
  show(anchor) {
    if (!anchor) return;
    
    // Ensure popup is in DOM
    if (!document.body.contains(this.popup)) {
      appendPopup(this.popup);
    }
    
    // Update current alignment state
    this.updateCurrentAlignment();
    
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
   * Hide text align picker popup
   */
  hide() {
    this.popup.classList.remove('visible');
    this.isVisible = false;
    this.removeClickOutside();
  }

  /**
   * Select alignment and trigger callback
   * @param {string} alignment - Selected alignment
   */
  selectAlignment(alignment) {
    this.currentAlignment = alignment;
    
    if (this.options.onAlignSelect) {
      this.options.onAlignSelect(alignment);
    }
    
    this.hide();
  }

  /**
   * Update current alignment state based on selection
   */
  updateCurrentAlignment() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    try {
      const range = selection.getRangeAt(0);

      // Lấy tất cả block trong vùng chọn
      const blocks = this.getSelectedBlockElements(range);

      // Nếu có block → lấy block đầu tiên, nếu không thì fallback về block bao quanh
      const firstBlock = blocks.length > 0
        ? blocks[0]
        : this.getBlockElement(range.commonAncestorContainer);

      if (firstBlock) {
        const textAlign = window.getComputedStyle(firstBlock).textAlign;
        this.currentAlignment =
          textAlign === 'left' || textAlign === 'start' || !textAlign
            ? 'left'
            : textAlign;
      } else {
        this.currentAlignment = 'left';
      }

      // Cập nhật trạng thái nút trong popup
      const buttons = this.popup.querySelectorAll('.align-button');
      buttons.forEach(button => {
        if (button.dataset.alignment === this.currentAlignment) {
          button.classList.add('active');
        } else {
          button.classList.remove('active');
        }
      });

      // Cập nhật icon trên toolbar
      this.updateToolbarButtonIcon(this.currentAlignment);
    } catch (error) {
      console.error('Error updating current alignment:', error);
    }
  }

  /**
   * Lấy tất cả block element trong vùng chọn
   */
  getSelectedBlockElements(range) {
    const blocks = [];
    const startBlock = this.getBlockElement(range.startContainer);
    const endBlock = this.getBlockElement(range.endContainer);

    if (startBlock) blocks.push(startBlock);

    if (startBlock && endBlock && startBlock !== endBlock) {
      let current = startBlock;
      while (current && current !== endBlock) {
        current = current.nextElementSibling;
        if (current && this.getBlockElement(current) && !blocks.includes(current)) {
          blocks.push(current);
        }
      }
      if (endBlock && !blocks.includes(endBlock)) {
        blocks.push(endBlock);
      }
    }

    return blocks;
  }

  /**
   * Update toolbar button icon based on alignment
   * @param {string} alignment - Current alignment
   */
  updateToolbarButtonIcon(alignment) {
    // Import TextAlign class to use its static method
    import('../formats/text-align.js').then(module => {
      const TextAlign = module.default;
      TextAlign.updateToolbarButtonIcon(alignment);
    }).catch(error => {
      console.warn('Could not import TextAlign class:', error);
    });
  }

  /**
   * Get the block element containing the given node
   */
  getBlockElement(node) {
    if (!node) return null;
    
    let currentNode = node;
    while (currentNode && currentNode !== document.body) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const tagName = currentNode.tagName;
        if (['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'LI'].includes(tagName)) {
          return currentNode;
        }
      }
      currentNode = currentNode.parentNode;
    }
    return null;
  }

  /**
   * Destroy text align picker
   */
  destroy() {
    this.removeClickOutside();
    if (this.popup && this.popup.parentNode) {
      this.popup.parentNode.removeChild(this.popup);
    }
  }
}

export default TextAlignPicker; 