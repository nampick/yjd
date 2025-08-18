/**
 * Emoji Picker Component - Popup for selecting emojis
 */
class EmojiPicker {
  constructor(options = {}) {
    this.options = {
      emojis: [
        // Smileys & People
        '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊',
        '😋', '😎', '😍', '🥰', '😘', '😗', '😙', '😚', '🙂', '🤗',
        '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱',
        '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻',
      ],
      onEmojiSelect: null,
      ...options
    };
    
    this.popup = null;
    this.isVisible = false;
    this.clickOutsideHandler = null;
    
    this.createEmojiPicker();
  }

  /**
   * Detect operating system
   * @returns {string} 'mac' or 'windows'
   */
  detectOS() {
    const platform = navigator.platform.toLowerCase();
    if (platform.includes('mac')) {
      return 'mac';
    } else if (platform.includes('win')) {
      return 'windows';
    }
    // Default to windows for other platforms
    return 'windows';
  }

  /**
   * Get emoji shortcut message based on OS
   * @returns {string} HTML string for the shortcut message
   */
  getEmojiShortcutMessage() {
    const os = this.detectOS();
    
    if (os === 'mac') {
      return `<div style="color: rgb(113, 120, 124); font-style: normal; font-weight: 400; line-height: normal; text-align: center;">Get more emojis with <span style="border-radius: 2.2px; background: #EEE; padding: 2px 4px;">⌘</span> <span style="color: #000;">+</span> <span style="border-radius: 2.2px; background: #EEE; padding: 2px 4px;">CTRL</span> <span style="color: #000;">+</span> <span style="border-radius: 2.2px; background: #EEE; padding: 2px 4px;">SPACE</span></div>`;
    } else {
      return `<div style="color: rgb(113, 120, 124); font-style: normal; font-weight: 400; line-height: normal; text-align: center;">Get more emojis with <span style="border-radius: 2.2px; background: #EEE; padding: 2px 4px;">WIN</span> <span style="color: #000;">+</span> <span style="border-radius: 2.2px; background: #EEE; padding: 2px 4px;">.</span></div>`;
    }
  }

  /**
   * Create emoji picker popup
   */
  createEmojiPicker() {
    // Create popup
    this.popup = document.createElement('div');
    this.popup.className = 'emoji-picker-popup';
    
    // Create emoji grid
    this.createEmojiGrid();
    const emojiTextMessage = document.createElement('div');
    emojiTextMessage.className = 'emoji-text-message';
    
    emojiTextMessage.innerHTML = this.getEmojiShortcutMessage();
    this.popup.appendChild(emojiTextMessage);

    // Add popup to body
    document.body.appendChild(this.popup);
  }

  /**
   * Create emoji grid
   */
  createEmojiGrid() {
    const emojiGrid = document.createElement('div');
    emojiGrid.className = 'emoji-grid';
    
    // Create emoji buttons
    this.options.emojis.forEach(emoji => {
      const emojiButton = document.createElement('button');
      emojiButton.type = 'button';
      emojiButton.className = 'emoji-button';
      emojiButton.textContent = emoji;
      emojiButton.title = emoji;
      
      emojiButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.selectEmoji(emoji);
      });
      
      emojiGrid.appendChild(emojiButton);
    });
    
    this.popup.appendChild(emojiGrid);
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
   * Show emoji picker popup
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
    const popupWidth = 320;
    const popupHeight = 280;
    
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
   * Hide emoji picker popup
   */
  hide() {
    this.popup.classList.remove('visible');
    this.isVisible = false;
    this.removeClickOutside();
  }

  /**
   * Select emoji and trigger callback
   * @param {string} emoji - Selected emoji
   */
  selectEmoji(emoji) {
    if (this.options.onEmojiSelect) {
      this.options.onEmojiSelect(emoji);
    }
    
    this.hide();
  }

  /**
   * Destroy the emoji picker
   */
  destroy() {
    this.removeClickOutside();
    
    if (this.popup && this.popup.parentNode) {
      this.popup.parentNode.removeChild(this.popup);
    }
    
    this.popup = null;
    this.isVisible = false;
  }
}

export default EmojiPicker; 