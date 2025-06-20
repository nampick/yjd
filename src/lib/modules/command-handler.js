import Module from '../core/module.js';

/**
 * Command Handler Module - Handles all toolbar command logic and state management
 * Separated from toolbar module for better separation of concerns
 */
class CommandHandler extends Module {
  constructor(editor, options = {}) {
    super(editor, options);
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupSelectionChangeListener();
  }

  /**
   * Setup event listeners for toolbar clicks
   */
  setupEventListeners() {
    const toolbar = this.editor.getModule('toolbar');
    if (toolbar) {
      toolbar.on('toolbar-click', (event) => {
        this.handleCommand(event.command, event.button);
      });
    }
  }

  /**
   * Setup selection change listener for button state updates
   */
  setupSelectionChangeListener() {
    document.addEventListener('selectionchange', () => {
      if (document.activeElement === this.editor.editor || 
          this.editor.editor.contains(document.activeElement)) {
        this.updateAllButtonStates();
        this.updateUndoRedoButtonStates();
      }
    });
  }

  /**
   * Handle toolbar command
   */
  handleCommand(command, button) {
    // Special handling for certain commands
    if (command === 'link') {
      this.handleLinkCommand(button);
      return;
    } else if (command === 'image') {
      this.handleImageCommand(button);
      return;
    } else if (command === 'table') {
      this.handleTableCommand(button);
      return;
    } else if (command === 'color') {
      this.handleColorCommand(button);
      return;
    } else if (command === 'background') {
      this.handleBackgroundCommand(button);
      return;
    } else if (command === 'undo') {
      this.handleUndoCommand(button);
      return;
    } else if (command === 'redo') {
      this.handleRedoCommand(button);
      return;
    }

    // Standard format handling
    const formatClass = this.editor.registry.get(`formats/${command}`);
    if (formatClass) {
      const format = new formatClass();
      if (typeof format.toggle === 'function') {
        format.toggle();
      } else if (typeof format.apply === 'function') {
        format.apply();
      }
      this.updateButtonState(command, button);
    } else {
      // fallback nếu không có format class
      document.execCommand(command, false, null);
      this.updateButtonState(command, button);
    }

    this.editor.focus();
  }

  /**
   * Handle link button click
   */
  handleLinkCommand(button) {
    const formatClass = this.editor.registry.get('formats/link');
    if (formatClass) {
      const linkFormat = new formatClass();
      
      // Check if currently in a link
      if (linkFormat.isActive()) {
        const currentUrl = linkFormat.getCurrentUrl();
        const newUrl = prompt('Edit link URL:', currentUrl || 'https://');
        
        if (newUrl === null) {
          // User cancelled
          return;
        } else if (newUrl.trim() === '') {
          // Remove link
          linkFormat.remove();
        } else {
          // Update link
          linkFormat.updateUrl(newUrl.trim());
        }
      } else {
        // Create new link
        linkFormat.insertWithPrompt();
      }
      
      this.updateButtonState('link', button);
    }
    this.editor.focus();
  }

  /**
   * Handle image button click
   */
  handleImageCommand(button) {
    const formatClass = this.editor.registry.get('formats/image');
    if (formatClass) {
      const imageFormat = new formatClass();
      
      // Show options: URL or File upload
      const choice = confirm('Insert image from URL? (Cancel for file upload)');
      
      if (choice) {
        // URL insertion
        imageFormat.insertWithPrompt();
      } else {
        // File upload
        this.showImageFileDialog(imageFormat);
      }
      
      this.updateButtonState('image', button);
    }
    this.editor.focus();
  }

  /**
   * Handle table button click
   */
  handleTableCommand(button) {
    const tableModule = this.editor.getModule('table');
    if (tableModule && tableModule.showGridSelector) {
      tableModule.showGridSelector(button);
    }
    this.editor.focus();
  }

  /**
   * Show file dialog for image upload
   */
  showImageFileDialog(imageFormat) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          await imageFormat.handleFileUpload(file);
        } catch (error) {
          alert('Error uploading image: ' + error.message);
        }
      }
      document.body.removeChild(input);
    });
    
    document.body.appendChild(input);
    input.click();
  }

  /**
   * Handle color button click
   */
  handleColorCommand(button) {
    const formatClass = this.editor.registry.get('formats/color');
    if (formatClass) {
      const colorFormat = new formatClass();
      const currentColor = colorFormat.getCurrentColor();
      
      this.showColorPicker(button, 'text', currentColor, (color) => {
        if (color) {
          colorFormat.apply(color);
        } else {
          colorFormat.remove();
        }
        this.updateButtonState('color', button);
      });
    }
    this.editor.focus();
  }

  /**
   * Handle background color button click
   */
  handleBackgroundCommand(button) {
    const formatClass = this.editor.registry.get('formats/background');
    if (formatClass) {
      const backgroundFormat = new formatClass();
      const currentColor = backgroundFormat.getCurrentColor();
      
      this.showColorPicker(button, 'background', currentColor, (color) => {
        if (color) {
          backgroundFormat.apply(color);
        } else {
          backgroundFormat.remove();
        }
        this.updateButtonState('background', button);
      });
    }
    this.editor.focus();
  }

  /**
   * Show color picker
   * @param {HTMLElement} button - Button that triggered the picker
   * @param {string} type - 'text' or 'background'
   * @param {string} currentColor - Current color value
   * @param {function} callback - Callback when color is selected
   */
  showColorPicker(button, type, currentColor, callback) {
    // Import color picker dynamically
    import('../ui/color-picker.js').then(({ default: ColorPicker }) => {
      // Create color picker instance
      const colorPicker = new ColorPicker({
        type: type,
        onColorSelect: (color) => {
          callback(color);
          colorPicker.destroy();
        }
      });

      // Position relative to button
      const rect = button.getBoundingClientRect();
      const x = rect.left;
      const y = rect.bottom + 5;

      // Show color picker
      colorPicker.show(x, y, currentColor);
    }).catch(error => {
      console.error('Failed to load color picker:', error);
      // Fallback to simple prompt
      const color = prompt(`Enter ${type} color (hex):`, currentColor || '#000000');
      if (color !== null) {
        callback(color.trim() || null);
      }
    });
  }

  /**
   * Handle undo button click
   */
  handleUndoCommand(button) {
    const historyModule = this.editor.getModule('history');
    if (historyModule && typeof historyModule.undo === 'function') {
      const success = historyModule.undo();
      if (success) {
        this.updateUndoRedoButtonStates();
      }
    }
    this.editor.focus();
  }

  /**
   * Handle redo button click
   */
  handleRedoCommand(button) {
    const historyModule = this.editor.getModule('history');
    if (historyModule && typeof historyModule.redo === 'function') {
      const success = historyModule.redo();
      if (success) {
        this.updateUndoRedoButtonStates();
      }
    }
    this.editor.focus();
  }

  /**
   * Update button active state
   */
  updateButtonState(command, button) {
    const toolbar = this.editor.getModule('toolbar');
    if (!toolbar) return;

    // Skip update for UI components that handle their own state
    if (command === 'format' || command === 'font-size' || command === 'align') {
      if (button && typeof button.updateButtonState === 'function') {
        button.updateButtonState();
      }
      return;
    }

    const formatClass = this.editor.registry.get(`formats/${command}`);
    let isActive = false;

    if (formatClass) {
      const format = new formatClass();
      if (typeof format.isActive === 'function') {
        isActive = format.isActive();
      }
    } else {
      // fallback for standard commands
      try {
        isActive = document.queryCommandState(command);
      } catch (e) {
        console.warn(`queryCommandState failed for "${command}"`, e);
      }
    }

    // Update button appearance via toolbar
    toolbar.setButtonActive(command, isActive);

    // Special handling for link button text
    if (command === 'link') {
      const title = isActive ? 'Edit/Remove Link' : 'Add Link';
      toolbar.setButtonTitle(command, title);
    }
  }

  /**
   * Update all button states
   */
  updateAllButtonStates() {
    const toolbar = this.editor.getModule('toolbar');
    if (!toolbar) return;

    // Get all buttons from toolbar
    const buttons = toolbar.buttons;
    if (!buttons) return;

    buttons.forEach((button, command) => {
      this.updateButtonState(command, button);
    });
  }

  /**
   * Update undo/redo button states
   */
  updateUndoRedoButtonStates() {
    const toolbar = this.editor.getModule('toolbar');
    const historyModule = this.editor.getModule('history');
    
    if (!toolbar || !historyModule) return;

    // Update undo button
    const canUndo = historyModule.canUndo();
    toolbar.setButtonDisabled('undo', !canUndo);

    // Update redo button
    const canRedo = historyModule.canRedo();
    toolbar.setButtonDisabled('redo', !canRedo);
  }

  /**
   * Destroy command handler
   */
  destroy() {
    // Cleanup if needed
  }
}

export default CommandHandler; 