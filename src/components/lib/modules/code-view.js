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
    
    // Trigger content change event
    this.editor.onContentChange();
    
  }

  /**
   * Update original content when user types in textarea
   */
  updateOriginalContent() {
    if (this.codeTextarea) {
      this.originalContent = this.codeTextarea.value;
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
      console.warn('❌ Toolbar module not found');
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
  }
}

export default CodeView; 