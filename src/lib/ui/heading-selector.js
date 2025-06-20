/**
 * Heading Selector UI Component
 * Provides a dropdown for selecting different heading levels
 */
class HeadingSelector {
  constructor(editor) {
    this.editor = editor;
    this.container = null;
    this.dropdown = null;
    this.triggerButton = null;
    this.isOpen = false;
    
    this.headingOptions = [
      { value: 'paragraph', text: 'Paragraph', tagName: 'P' },
      { value: 'h1', text: 'Heading 1', tagName: 'H1' },
      { value: 'h2', text: 'Heading 2', tagName: 'H2' },
      { value: 'h3', text: 'Heading 3', tagName: 'H3' },
      { value: 'h4', text: 'Heading 4', tagName: 'H4' },
      { value: 'h5', text: 'Heading 5', tagName: 'H5' },
      { value: 'h6', text: 'Heading 6', tagName: 'H6' }
    ];
    
    this.init();
  }

  init() {
    this.createTriggerButton();
    this.createDropdown();
    this.setupEventListeners();
  }

  createTriggerButton() {
    this.triggerButton = document.createElement('button');
    this.triggerButton.type = 'button';
    this.triggerButton.className = 'rich-editor-toolbar-btn heading-selector-trigger';
    this.triggerButton.innerHTML = `
      <span class="heading-selector-text">Paragraph</span>
      <span class="heading-selector-arrow">▼</span>
    `;
    this.triggerButton.title = 'Chọn định dạng tiêu đề';
    
    // Add styling
    this.triggerButton.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 100px;
      justify-content: space-between;
      position: relative;
    `;
  }

  createDropdown() {
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'heading-selector-dropdown';
    this.dropdown.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      background: white;
      border: 1px solid #e1e5e9;
      border-radius: 6px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.18);
      z-index: 1000;
      min-width: 180px;
      max-height: 300px;
      overflow-y: auto;
      display: none;
      padding: 4px 0;
    `;

    // Create options
    this.headingOptions.forEach(option => {
      const optionElement = document.createElement('div');
      optionElement.className = 'heading-selector-option';
      optionElement.dataset.value = option.value;
      optionElement.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        border: none;
        background: none;
        text-align: left;
        width: 100%;
        font-size: 14px;
        line-height: 1.4;
        transition: background-color 0.2s;
      `;

      // Create preview text with appropriate styling
      if (option.value === 'paragraph') {
        optionElement.innerHTML = `<p style="margin: 0; font-size: 14px;">${option.text}</p>`;
      } else {
        const level = option.value.replace('h', '');
        const fontSize = Math.max(14, 24 - (level - 1) * 2);
        optionElement.innerHTML = `<${option.tagName.toLowerCase()} style="margin: 0; font-size: ${fontSize}px; font-weight: bold;">${option.text}</${option.tagName.toLowerCase()}>`;
      }

      // Add hover effect
      optionElement.addEventListener('mouseenter', () => {
        optionElement.style.backgroundColor = '#f5f5f5';
      });
      
      optionElement.addEventListener('mouseleave', () => {
        optionElement.style.backgroundColor = 'transparent';
      });

      // Add click handler
      optionElement.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.selectOption(option);
      });

      this.dropdown.appendChild(optionElement);
    });

    // Create container for positioning
    this.container = document.createElement('div');
    this.container.style.position = 'relative';
    this.container.style.display = 'inline-block';
    this.container.appendChild(this.triggerButton);
    this.container.appendChild(this.dropdown);
  }

  setupEventListeners() {
    // Toggle dropdown on trigger button click
    this.triggerButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.closeDropdown();
      }
    });

    // Update button text when selection changes
    if (this.editor && this.editor.container) {
      this.editor.container.addEventListener('selectionchange', () => {
        this.updateButtonText();
      });
      
      // Also listen for keyup and mouseup to catch selection changes
      this.editor.container.addEventListener('keyup', () => {
        setTimeout(() => this.updateButtonText(), 10);
      });
      
      this.editor.container.addEventListener('mouseup', () => {
        setTimeout(() => this.updateButtonText(), 10);
      });
    }
  }

  toggleDropdown() {
    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown() {
    this.dropdown.style.display = 'block';
    this.isOpen = true;
    this.triggerButton.classList.add('active');
    
    // Update current selection
    this.updateCurrentSelection();
  }

  closeDropdown() {
    this.dropdown.style.display = 'none';
    this.isOpen = false;
    this.triggerButton.classList.remove('active');
  }

  selectOption(option) {
    console.log(`🎯 Selecting heading option: ${option.value}`);
    
    if (option.value === 'paragraph') {
      // Apply paragraph format
      const ParagraphClass = this.editor.registry.get('formats/paragraph');
      if (ParagraphClass) {
        const paragraph = new ParagraphClass();
        paragraph.apply();
      }
    } else {
      // Apply heading format
      const level = parseInt(option.value.replace('h', ''));
      const HeadingClass = this.editor.registry.get(`formats/${option.value}`);
      if (HeadingClass) {
        const heading = new HeadingClass();
        heading.apply();
      }
    }

    this.closeDropdown();
    this.updateButtonText();
    
    // Focus back to editor
    if (this.editor && this.editor.focus) {
      this.editor.focus();
    }
  }

  updateButtonText() {
    const currentFormat = this.getCurrentFormat();
    const textSpan = this.triggerButton.querySelector('.heading-selector-text');
    
    if (textSpan) {
      const option = this.headingOptions.find(opt => opt.value === currentFormat);
      textSpan.textContent = option ? option.text : 'Paragraph';
    }
  }

  updateCurrentSelection() {
    const currentFormat = this.getCurrentFormat();
    
    // Highlight current option
    this.dropdown.querySelectorAll('.heading-selector-option').forEach(option => {
      option.classList.remove('active');
      if (option.dataset.value === currentFormat) {
        option.classList.add('active');
        option.style.backgroundColor = '#e3f2fd';
      }
    });
  }

  getCurrentFormat() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 'paragraph';

    let node = selection.anchorNode;
    while (node && node !== document.body) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName;
        if (tagName === 'P') return 'paragraph';
        if (tagName === 'H1') return 'h1';
        if (tagName === 'H2') return 'h2';
        if (tagName === 'H3') return 'h3';
        if (tagName === 'H4') return 'h4';
        if (tagName === 'H5') return 'h5';
        if (tagName === 'H6') return 'h6';
      }
      node = node.parentNode;
    }
    return 'paragraph';
  }

  getTriggerButton() {
    return this.container;
  }

  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

export default HeadingSelector; 