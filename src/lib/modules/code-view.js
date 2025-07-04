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
    
    // Style the textarea
    this.styleCodeTextarea();
    
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
    // Simple HTML formatting for readability
    let formatted = html;
    
    // Add line breaks after closing tags
    formatted = formatted.replace(/></g, '>\n<');
    
    // Add indentation
    const lines = formatted.split('\n');
    let indentLevel = 0;
    const indentSize = 2;
    
    const formattedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      
      // Decrease indent for closing tags
      if (trimmed.startsWith('</')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      const indentedLine = ' '.repeat(indentLevel * indentSize) + trimmed;
      
      // Increase indent for opening tags (but not self-closing or closing tags)
      if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) {
        // Check if it's not a self-closing tag
        const tagMatch = trimmed.match(/^<(\w+)/);
        if (tagMatch) {
          const tagName = tagMatch[1];
          // Self-closing HTML tags
          const selfClosingTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
          if (!selfClosingTags.includes(tagName.toLowerCase())) {
            indentLevel++;
          }
        }
      }
      
      return indentedLine;
    });
    
    return formattedLines.join('\n');
  }

  /**
   * Style the code textarea
   */
  styleCodeTextarea() {
    if (!this.codeTextarea) return;
    
    const editorArea = this.editor.editor;
    const editorRect = editorArea.getBoundingClientRect();
    const editorStyles = window.getComputedStyle(editorArea);
    
    // Copy dimensions and positioning
    this.codeTextarea.style.width = '100%';
    this.codeTextarea.style.height = editorStyles.height || '300px';
    this.codeTextarea.style.minHeight = '300px';
    this.codeTextarea.style.maxHeight = '80vh';
    
    // Code styling
    this.codeTextarea.style.fontFamily = '"Consolas", "Monaco", "Courier New", monospace';
    this.codeTextarea.style.fontSize = '14px';
    this.codeTextarea.style.lineHeight = '1.5';
    this.codeTextarea.style.padding = '16px';
    this.codeTextarea.style.border = '1px solid #d1d5db';
    this.codeTextarea.style.borderRadius = '6px';
    this.codeTextarea.style.backgroundColor = '#f8fafc';
    this.codeTextarea.style.color = '#374151';
    this.codeTextarea.style.resize = 'vertical';
    this.codeTextarea.style.outline = 'none';
    this.codeTextarea.style.whiteSpace = 'pre';
    this.codeTextarea.style.wordWrap = 'break-word';
    this.codeTextarea.style.tabSize = '2';
    
    // Focus styles
    this.codeTextarea.addEventListener('focus', () => {
      this.codeTextarea.style.borderColor = '#3b82f6';
      this.codeTextarea.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
    });
    
    this.codeTextarea.addEventListener('blur', () => {
      this.codeTextarea.style.borderColor = '#d1d5db';
      this.codeTextarea.style.boxShadow = 'none';
    });
    
    // Handle tab key for indentation
    this.codeTextarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        
        const start = this.codeTextarea.selectionStart;
        const end = this.codeTextarea.selectionEnd;
        
        // Insert tab character
        this.codeTextarea.value = this.codeTextarea.value.substring(0, start) + '  ' + this.codeTextarea.value.substring(end);
        
        // Move cursor
        this.codeTextarea.selectionStart = this.codeTextarea.selectionEnd = start + 2;
        
        // Trigger input event
        this.updateOriginalContent();
      }
    });
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