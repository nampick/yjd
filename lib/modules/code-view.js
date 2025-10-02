import Module from '../core/module.js';

/**
 * Code View Module - Toggles between normal editor view and HTML source code view
 */
class CodeView extends Module {
  constructor(editor, options = {}) {
    super(editor, options);
    
    this.isCodeView = false;
    this.originalContent = '';
    this.codeTextarea = null;
    this.disabledModules = new Set(); // Track disabled modules
    
    this.init();
  }

  init() {
    
    // Listen for code view toggle events
    this.editor.on('toolbar-click', (data) => {
      if (data.command === 'code-view') {
        this.toggleCodeView();
      }
    });
  }

  /**
   * Toggle between normal editor view and code view
   */
  toggleCodeView() {
    
    if (this.isCodeView) {
      this.showNormalView();
    } else {
      this.showCodeView();
    }
    
    this.updateToolbarButton();
  }

  /**
   * Show code view - display HTML source
   */
  showCodeView() {
    const editorArea = this.editor.editor;
    if (!editorArea) return;

    // Store original content
    this.originalContent = editorArea.innerHTML;
    
    // Create textarea for code editing
    this.codeTextarea = document.createElement('textarea');
    this.codeTextarea.className = 'code-view-textarea';
    this.codeTextarea.value = this.formatHTML(this.originalContent);
    
    // Replace editor content with textarea
    editorArea.style.display = 'none';
    editorArea.parentNode.insertBefore(this.codeTextarea, editorArea);
    
    // Add CSS class to wrapper for styling
    const wrapper = this.editor.wrapper;
    if (wrapper) {
      wrapper.classList.add('code-view-active');
    }
    
    // Focus on textarea
    this.codeTextarea.focus();
    
    // Set flag
    this.isCodeView = true;
    
    // Disable other features
    this.disableOtherFeatures();
    
    // Add event listener for real-time updates
    this.codeTextarea.addEventListener('input', () => {
      this.updateOriginalContent();
    });
    
  }

  /**
   * Show normal editor view - restore visual editor
   */
  showNormalView() {
    const editorArea = this.editor.editor;
    if (!editorArea || !this.codeTextarea) return;

    // Get updated content from textarea
    const updatedHTML = this.codeTextarea.value;
    
    // Remove textarea
    this.codeTextarea.parentNode.removeChild(this.codeTextarea);
    this.codeTextarea = null;
    
    // Remove CSS class from wrapper
    const wrapper = this.editor.wrapper;
    if (wrapper) {
      wrapper.classList.remove('code-view-active');
    }
    
    // Show editor area
    editorArea.style.display = '';
    
    // Update editor content
    editorArea.innerHTML = updatedHTML;
    
    // Focus on editor
    editorArea.focus();
    
    // Set flag
    this.isCodeView = false;
    
    // Enable other features
    this.enableOtherFeatures();
    
    // Trigger content change event
    this.editor.onContentChange();
    
  }

  /**
   * Disable other features when in code view
   */
  disableOtherFeatures() {
    // Disable toolbar buttons (except code-view and theme)
    const toolbar = this.editor.getModule('toolbar');
    if (toolbar) {
      const allCommands = [
        'bold', 'italic', 'underline', 'strike', 'subscript', 'superscript',
        'color', 'background', 'link', 'table', 'heading', 
        'font-family', 'line-height', 'capitalization', 'text-align', 'list',
        'indent-increase', 'indent-decrease', 'text-size', 'emoji', 'image',
        'video', 'tag', 'import', 'undo', 'redo'
      ];
      
      allCommands.forEach(command => {
        toolbar.setButtonDisabled(command, true);
      });
      
      // Keep code-view and theme enabled
      toolbar.setButtonDisabled('code-view', false);
      toolbar.setButtonDisabled('theme', false);
    }
    
    // Disable editor events
    this.disableEditorEvents();
    
    // Disable other modules
    this.disableOtherModules();
    
    // Hide any open popups
    this.hideAllPopups();
  }

  /**
   * Enable other features when returning to normal view
   */
  enableOtherFeatures() {
    // Enable toolbar buttons
    const toolbar = this.editor.getModule('toolbar');
    if (toolbar) {
      const allCommands = [
        'bold', 'italic', 'underline', 'strike', 'subscript', 'superscript',
        'color', 'background', 'link', 'table', 'heading', 
        'font-family', 'line-height', 'capitalization', 'text-align', 'list',
        'indent-increase', 'indent-decrease', 'text-size', 'emoji', 'image',
        'video', 'tag', 'import', 'undo', 'redo'
      ];
      
      allCommands.forEach(command => {
        toolbar.setButtonDisabled(command, false);
      });
    }
    
    // Enable editor events
    this.enableEditorEvents();
    
    // Enable other modules
    this.enableOtherModules();
  }

  /**
   * Disable editor events when in code view
   */
  disableEditorEvents() {
    const editorArea = this.editor.editor;
    if (!editorArea) return;
    
    // Make editor non-editable to disable all editing functionality
    editorArea.contentEditable = false;
    
    // Add a visual indicator that editor is disabled
    editorArea.style.opacity = '0.5';
    editorArea.style.pointerEvents = 'none';
    editorArea.style.cursor = 'not-allowed';
    
    // Add a title to indicate the editor is disabled
    editorArea.title = 'Editor is disabled in code view mode. Click "Switch to Visual Editor" to return to normal editing.';
  }

  /**
   * Enable editor events when returning to normal view
   */
  enableEditorEvents() {
    const editorArea = this.editor.editor;
    if (!editorArea) return;
    
    // Restore editor functionality
    editorArea.contentEditable = true;
    editorArea.style.opacity = '';
    editorArea.style.pointerEvents = '';
    editorArea.style.cursor = '';
    editorArea.title = '';
  }

  /**
   * Disable other modules when in code view
   */
  disableOtherModules() {
    const modulesToDisable = ['history', 'block-toolbar', 'table-toolbar', 'resize-handles'];
    
    modulesToDisable.forEach(moduleName => {
      const module = this.editor.getModule(moduleName);
      if (module) {
        // Try to disable module if it has disable method
        if (typeof module.disable === 'function') {
          module.disable();
          this.disabledModules.add(moduleName);
        }
        // For modules without disable method, we can hide their UI elements
        else if (module.getContainer && typeof module.getContainer === 'function') {
          const container = module.getContainer();
          if (container) {
            container.style.display = 'none';
            this.disabledModules.add(moduleName);
          }
        }
      }
    });
  }

  /**
   * Enable other modules when returning to normal view
   */
  enableOtherModules() {
    this.disabledModules.forEach(moduleName => {
      const module = this.editor.getModule(moduleName);
      if (module) {
        // Try to enable module if it has enable method
        if (typeof module.enable === 'function') {
          module.enable();
        }
        // For modules without enable method, show their UI elements
        else if (module.getContainer && typeof module.getContainer === 'function') {
          const container = module.getContainer();
          if (container) {
            container.style.display = '';
          }
        }
      }
    });
    
    this.disabledModules.clear();
  }

  /**
   * Update original content when user types in textarea
   */
  updateOriginalContent() {
    if (this.codeTextarea) {
      this.originalContent = this.codeTextarea.value;
      
      // Trigger content change event to call onChange callback
      // Get the HTML content from textarea
      const content = this.codeTextarea.value;
      
      // Call onChange callback if provided
      if (this.editor.options.onChange && typeof this.editor.options.onChange === 'function') {
        this.editor.options.onChange(content);
      }
      
      // Emit text-change event
      this.editor.emit('text-change', content);
    }
  }

  /**
   * Format HTML for better readability
   */
  formatHTML(html) {
    let formatted = html;
    
    // Tách thẻ mở và đóng thành dòng riêng biệt
    formatted = formatted.replace(/></g, '>\n<');
    
    // Tách nội dung giữa thẻ mở và đóng thành dòng riêng
    formatted = formatted.replace(/>([^<>\s][^<]*)</g, '>\n$1\n<');
    
    const lines = formatted.split('\n');
    const indentSize = 4;
    const formattedLines = [];
    const tagStack = []; // Stack để theo dõi thẻ mở

    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Check for closing tag - xử lý trước khi in
      if (/^<\/(\w+)/.test(trimmed)) {
        const closeTagMatch = trimmed.match(/^<\/(\w+)/);
        if (closeTagMatch) {
          const tagName = closeTagMatch[1];
          // Tìm và loại bỏ thẻ mở tương ứng từ stack
          for (let i = tagStack.length - 1; i >= 0; i--) {
            if (tagStack[i] === tagName) {
              tagStack.splice(i, 1);
              break;
            }
          }
        }
      }

      // Apply indentation based on current stack level
      let currentLevel = tagStack.length;
      
      // Nếu là nội dung text (không phải thẻ), nó nằm bên trong thẻ cha nên cần thụt lề thêm
      if (!trimmed.startsWith('<')) {
        currentLevel = tagStack.length;
      }
      
      formattedLines.push(' '.repeat(currentLevel * indentSize) + trimmed);

      // Check for opening tag (not self-closing) - xử lý sau khi in
      const openTagMatch = trimmed.match(/^<(\w+)/);
      if (
        openTagMatch &&
        !trimmed.startsWith('</') &&
        !trimmed.endsWith('/>') &&
        !['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'].includes(openTagMatch[1].toLowerCase())
      ) {
        const tagName = openTagMatch[1];
        tagStack.push(tagName);
      }
    }

    return formattedLines.join('\n');
  }

  /**
   * Update toolbar button state
   */
  updateToolbarButton() {
    
    const toolbar = this.editor.getModule('toolbar');
    if (toolbar) {
      toolbar.setButtonActive('code-view', this.isCodeView);
      
      // Update button title
      const buttonTitle = this.isCodeView ? 'Switch to Visual Editor' : 'View HTML Source';
      toolbar.setButtonTitle('code-view', buttonTitle);
      
    } else {
    }
  }

  /**
   * Check if currently in code view
   */
  isInCodeView() {
    return this.isCodeView;
  }

  /**
   * Get current content (from textarea if in code view, otherwise from editor)
   */
  getCurrentContent() {
    if (this.isCodeView && this.codeTextarea) {
      return this.codeTextarea.value;
    }
    return this.editor.editor.innerHTML;
  }

  /**
   * Set content programmatically
   */
  setContent(html) {
    if (this.isCodeView && this.codeTextarea) {
      this.codeTextarea.value = this.formatHTML(html);
      this.updateOriginalContent();
    } else {
      this.editor.editor.innerHTML = html;
    }
  }

  /**
   * Hide all popups when entering code view
   */
  hideAllPopups() {
    // Remove all popup elements from the DOM
    const popups = document.querySelectorAll('.rich-editor-popup, .color-picker-popup, .emoji-picker-popup, .link-popup, .image-popup, .video-popup, .table-popup, .tag-popup, .import-popup');
    popups.forEach(popup => {
      if (popup.parentNode) {
        popup.parentNode.removeChild(popup);
      }
    });
    
    // Clear any popup instances from the editor
    if (this.editor.popupInstances) {
      this.editor.popupInstances.clear();
    }
  }

  /**
   * Clean up when module is destroyed
   */
  destroy() {
    if (this.isCodeView) {
      this.showNormalView();
    }
    
    if (this.codeTextarea && this.codeTextarea.parentNode) {
      this.codeTextarea.parentNode.removeChild(this.codeTextarea);
    }
    
    this.codeTextarea = null;
    this.originalContent = '';
    this.isCodeView = false;
    this.disabledModules.clear();
  }
}

export default CodeView; 