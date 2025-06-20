/**
 * Alignment Selector UI Component
 * Provides a dropdown for text alignment selection
 */
class AlignSelector {
  constructor(editor) {
    this.editor = editor;
    this.container = null;
    this.triggerButton = null;
    this.dropdown = null;
    this.isOpen = false;
    this.currentAlignment = 'left';
    
    this.alignments = [
      { value: 'left', icon: '⬅️', label: 'Align Left' },
      { value: 'center', icon: '⬇️', label: 'Align Center' },
      { value: 'right', icon: '➡️', label: 'Align Right' },
      { value: 'justify', icon: '⬌', label: 'Justify' }
    ];
    
    this.init();
  }

  init() {
    this.createTriggerButton();
    this.createDropdown();
    this.setupEventListeners();
  }

  /**
   * Create trigger button
   */
  createTriggerButton() {
    this.triggerButton = document.createElement('button');
    this.triggerButton.type = 'button';
    this.triggerButton.className = 'rich-editor-toolbar-btn align-selector-trigger';
    this.triggerButton.innerHTML = '⬅️'; // Default left align icon
    this.triggerButton.title = 'Text Alignment';
    
    // Add dropdown arrow
    const arrow = document.createElement('span');
    arrow.className = 'dropdown-arrow';
    arrow.innerHTML = ' ▼';
    this.triggerButton.appendChild(arrow);
  }

  /**
   * Create dropdown menu
   */
  createDropdown() {
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'align-selector-dropdown';
    
    this.alignments.forEach(alignment => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'align-option';
      option.dataset.value = alignment.value;
      option.innerHTML = `${alignment.icon} ${alignment.label}`;
      option.title = alignment.label;
      
      // Mark current alignment as active
      if (alignment.value === this.currentAlignment) {
        option.classList.add('active');
      }
      
      option.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.selectAlignment(alignment.value);
      });
      
      this.dropdown.appendChild(option);
    });
    
    // Add to document body
    document.body.appendChild(this.dropdown);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Trigger button click
    this.triggerButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.dropdown.contains(e.target) && !this.triggerButton.contains(e.target)) {
        this.closeDropdown();
      }
    });

    // Close dropdown on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeDropdown();
      }
    });
  }

  /**
   * Toggle dropdown visibility
   */
  toggleDropdown() {
    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  /**
   * Open dropdown
   */
  openDropdown() {
    // Update current alignment before opening
    this.updateCurrentAlignment();
    
    // Position dropdown
    const rect = this.triggerButton.getBoundingClientRect();
    this.dropdown.style.left = rect.left + 'px';
    this.dropdown.style.top = (rect.bottom + 5) + 'px';
    
    // Show dropdown
    this.dropdown.classList.add('visible');
    this.triggerButton.classList.add('active');
    this.isOpen = true;
    
    console.log('📋 Alignment dropdown opened');
  }

  /**
   * Close dropdown
   */
  closeDropdown() {
    this.dropdown.classList.remove('visible');
    this.triggerButton.classList.remove('active');
    this.isOpen = false;
    
    console.log('📋 Alignment dropdown closed');
  }

  /**
   * Select alignment
   * @param {string} alignment - Alignment value
   */
  selectAlignment(alignment) {
    console.log(`🎯 Alignment selected: ${alignment}`);
    
    // Apply alignment using format class
    const alignFormat = this.editor.registry.get('formats/align');
    if (alignFormat) {
      const format = new alignFormat();
      format.apply(alignment);
    }
    
    // Update current alignment
    this.currentAlignment = alignment;
    this.updateTriggerButton();
    this.updateActiveOption();
    
    // Close dropdown
    this.closeDropdown();
    
    // Focus back to editor
    this.editor.focus();
  }

  /**
   * Update trigger button appearance
   */
  updateTriggerButton() {
    const alignment = this.alignments.find(a => a.value === this.currentAlignment);
    if (alignment) {
      // Update icon (remove dropdown arrow first)
      const arrow = this.triggerButton.querySelector('.dropdown-arrow');
      this.triggerButton.innerHTML = alignment.icon;
      if (arrow) {
        this.triggerButton.appendChild(arrow);
      } else {
        this.triggerButton.innerHTML += ' ▼';
      }
      
      this.triggerButton.title = `Text Alignment: ${alignment.label}`;
    }
  }

  /**
   * Update active option in dropdown
   */
  updateActiveOption() {
    // Remove previous active state
    this.dropdown.querySelectorAll('.align-option').forEach(option => {
      option.classList.remove('active');
    });
    
    // Add active state to current option
    const activeOption = this.dropdown.querySelector(`[data-value="${this.currentAlignment}"]`);
    if (activeOption) {
      activeOption.classList.add('active');
    }
  }

  /**
   * Update current alignment from editor
   */
  updateCurrentAlignment() {
    const alignFormat = this.editor.registry.get('formats/align');
    if (alignFormat) {
      const format = new alignFormat();
      this.currentAlignment = format.getCurrentAlignment();
      this.updateTriggerButton();
      this.updateActiveOption();
    }
  }

  /**
   * Update button state (called from toolbar)
   */
  updateButtonState() {
    this.updateCurrentAlignment();
  }

  /**
   * Get trigger button element
   * @returns {HTMLElement} Trigger button
   */
  getTriggerButton() {
    return this.triggerButton;
  }

  /**
   * Destroy alignment selector
   */
  destroy() {
    if (this.dropdown && this.dropdown.parentNode) {
      this.dropdown.parentNode.removeChild(this.dropdown);
    }
    if (this.triggerButton && this.triggerButton.parentNode) {
      this.triggerButton.parentNode.removeChild(this.triggerButton);
    }
  }
}

export default AlignSelector;