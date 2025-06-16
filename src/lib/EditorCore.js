// EditorCore.js - Core functionality của editor
import '../style.css';
import { ToolbarManager } from './modules/ToolbarManager.js';
import { TableManager } from './modules/TableManager.js';
import { FormatManager } from './modules/FormatManager.js';
import { BlockManager } from './modules/BlockManager.js';
import { MediaManager } from './modules/MediaManager.js';
import { ImportExportManager } from './modules/ImportExportManager.js';
import { ThemeManager } from './modules/ThemeManager.js';
import { TagTemplateManager } from './modules/TagTemplateManager.js';
import { SelectorManager } from './modules/SelectorManager.js';

export class EditorCore {
  constructor(selector, options = {}) {
    this.options = Object.assign({
      toolbar: [
        'bold', 'italic', 'underline', 'strike', 'emoji', 'image', 'link', 'table', 'undo', 'redo', 'indent'
      ],
      placeholder: 'Type here...',
      theme: 'light',
      height: 400,
      width: 800,
      maxWidth: 1200,
      maxHeight: 800,
      features: {
        emoji: true,
        image: true,
        table: true,
        wordCount: true,
        breadcrumb: true
      },
      blockToolbarFeatures: [
        'bold', 'italic', 'underline', 'strikeThrough', 'code', 'fontFamily'
      ]
    }, options);

    // Validate and adjust dimensions
    this.options.width = Math.min(this.options.width, this.options.maxWidth);
    this.options.height = Math.min(this.options.height, this.options.maxHeight);

    // Initialize theme from localStorage or use default
    const savedTheme = localStorage.getItem('richEditorTheme');
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      this.options.theme = savedTheme;
    }

    this.defaultContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2c3e50; margin-bottom: 20px;">Team Meeting Invitation</h1>
        
        <p style="font-size: 16px; line-height: 1.6; color: #34495e;">
          Dear <strong>Team Members</strong>,
        </p>

        <p style="font-size: 16px; line-height: 1.6; color: #34495e;">
          We are pleased to invite you to our monthly team meeting. Please find the details below:
        </p>

        <div style="text-align: center; margin: 20px 0;">
          <img src="https://img.icons8.com/color/96/000000/meeting.png" alt="Meeting Icon" style="width: 64px; height: 64px;">
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Date & Time:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
              <img src="https://img.icons8.com/color/24/000000/calendar--v1.png" alt="Calendar" style="vertical-align: middle; margin-right: 8px;">
              Friday, March 15, 2024 | 2:00 PM - 4:00 PM
            </td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Location:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
              <img src="https://img.icons8.com/color/24/000000/room.png" alt="Location" style="vertical-align: middle; margin-right: 8px;">
              Meeting Room A, 5th Floor
            </td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Agenda:</strong></td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">
              <ul style="margin: 0; padding-left: 20px;">
                <li>
                  <img src="https://img.icons8.com/color/24/000000/progress-report.png" alt="Progress" style="vertical-align: middle; margin-right: 8px;">
                  Project Progress Report
                </li>
                <li>
                  <img src="https://img.icons8.com/color/24/000000/planning.png" alt="Planning" style="vertical-align: middle; margin-right: 8px;">
                  Next Week's Planning
                </li>
                <li>
                  <img src="https://img.icons8.com/color/24/000000/issues.png" alt="Issues" style="vertical-align: middle; margin-right: 8px;">
                  Issue Resolution
                </li>
              </ul>
            </td>
          </tr>
        </table>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 16px; color: #34495e;">
            <img src="https://img.icons8.com/color/24/000000/important-mail.png" alt="Important" style="vertical-align: middle; margin-right: 8px;">
            <strong>Important Note:</strong> Please bring your laptops and prepare your progress reports in advance.
          </p>
        </div>

        <p style="font-size: 16px; line-height: 1.6; color: #34495e;">
          We look forward to your participation.
        </p>

        <p style="font-size: 16px; line-height: 1.6; color: #34495e;">
          Best regards,<br>
          <strong>Project Management Team</strong>
        </p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
          <p style="font-size: 14px; color: #6c757d;">
            <img src="https://img.icons8.com/color/24/000000/contacts.png" alt="Contact" style="vertical-align: middle; margin-right: 8px;">
            <strong>Contact Information:</strong><br>
            <img src="https://img.icons8.com/color/24/000000/mail.png" alt="Email" style="vertical-align: middle; margin-right: 8px;">
            Email: contact@example.com<br>
            <img src="https://img.icons8.com/color/24/000000/phone.png" alt="Phone" style="vertical-align: middle; margin-right: 8px;">
            Phone: (024) 1234 5678
          </p>
        </div>
      </div>
    `;

    this.root = typeof selector === 'string' ? document.querySelector(selector) : selector;
    this.toolbarBtns = {};
    this.statusbarEls = {};
    this.dropdownMenus = {}; // Store dropdown menu references
    this.blockToolbarTimeout = null; // Timeout cho block toolbar
    
    // Initialize managers
    this.toolbarManager = new ToolbarManager(this, this.options);
    this.tableManager = new TableManager(this);
    this.formatManager = new FormatManager(this);
    this.blockManager = new BlockManager(this);
    this.mediaManager = new MediaManager(this);
    this.importExportManager = new ImportExportManager(this);
    this.themeManager = new ThemeManager(this);
    this.tagTemplateManager = new TagTemplateManager(this);
    this.selectorManager = new SelectorManager(this);
    
    this.init();
  }

  init() {
    // Tạo wrapper
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'editor-wrapper';
    this.wrapper.style.position = 'relative';
    this.wrapper.style.background = '#fff';
    this.wrapper.style.border = '1px solid #d1d5db';
    this.wrapper.style.borderRadius = '6px';
    this.wrapper.style.overflow = 'visible';
    this.wrapper.style.width = this.options.width + 'px';
    this.wrapper.style.maxWidth = this.options.maxWidth + 'px';
    this.wrapper.style.boxShadow = '0 2px 8px rgba(31,41,55,0.08)';
    this.wrapper.style.minHeight = this.options.height + 'px';
    this.wrapper.style.maxHeight = this.options.maxHeight + 'px';
    this.wrapper.style.margin = '0 auto';
    this.wrapper.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.wrapper.style.display = 'flex';
    this.wrapper.style.flexDirection = 'column';
    this.wrapper.style.boxSizing = 'border-box';

    // Toolbar
    this.toolbar = this.toolbarManager.createToolbar();
    this.wrapper.appendChild(this.toolbar);

    // Table popup và các phần tử liên quan (nếu bật table)
    if (this.options.features.table) {
      this.tableManager.createTableUI();
    }

    // Editor area
    this.editor = document.createElement('div');
    this.editor.className = 'editor-area';
    this.editor.contentEditable = true;
    this.editor.style.flex = '1 1 auto';
    this.editor.style.minHeight = '40px';
    this.editor.style.padding = '40px';
    this.editor.style.fontSize = '16px';
    this.editor.style.lineHeight = '1.7';
    this.editor.style.outline = 'none';
    this.editor.style.background = '#fff';
    this.editor.style.color = '#2c3e50';
    this.editor.style.fontFamily = 'inherit';
    this.editor.style.overflowY = 'auto';
    this.editor.style.boxSizing = 'border-box';
    this.editor.style.border = 'none';
    this.editor.setAttribute('placeholder', this.options.placeholder);
    this.editor.innerHTML = this.defaultContent;
    this.wrapper.appendChild(this.editor);

    // Statusbar
    if (this.options.features.wordCount || this.options.features.breadcrumb) {
      this.statusbar = document.createElement('div');
      this.statusbar.className = 'editor-statusbar';
      this.statusbar.style.padding = '4px 12px';
      this.statusbar.style.borderTop = '1px solid #d1d5db';
      this.statusbar.style.background = '#f9fafb';
      this.statusbar.style.fontSize = '13px';
      this.statusbar.style.color = '#6b7280';
      this.statusbar.style.display = 'flex';
      this.statusbar.style.justifyContent = 'space-between';
      this.statusbar.style.alignItems = 'center';
      this.statusbar.style.fontFamily = 'inherit';
      this.statusbar.style.minHeight = '32px';
      this.statusbar.style.boxSizing = 'border-box';

      // Tạo các phần tử con và lưu vào this.statusbarEls
      this.statusbarEls.breadcrumb = document.createElement('span');
      this.statusbarEls.breadcrumb.className = 'breadcrumb';
      this.statusbarEls.breadcrumb.style.fontFamily = 'monospace';
      this.statusbarEls.breadcrumb.style.background = 'transparent';
      this.statusbarEls.breadcrumb.style.padding = '0 4px';
      this.statusbarEls.breadcrumb.style.borderRadius = '3px';
      this.statusbarEls.breadcrumb.style.border = 'none';
      this.statusbarEls.breadcrumb.style.boxSizing = 'border-box';

      this.statusbarEls.wordcount = document.createElement('span');
      this.statusbarEls.wordcount.className = 'wordcount';

      this.statusbar.appendChild(this.statusbarEls.breadcrumb);
      this.statusbar.appendChild(this.statusbarEls.wordcount);
      this.wrapper.appendChild(this.statusbar);
    }

    // Thêm wrapper vào root
    this.root.appendChild(this.wrapper);

    // Setup observers và handlers
    this.setupContentObserver();
    this.addGlobalClickHandler();
    this.bindEvents();
    this.updateStatusbar();
    
    // Cập nhật heading selector và font size display lần đầu
    this.blockManager.updateHeadingSelector && this.blockManager.updateHeadingSelector();
    this.formatManager.updateFontSizeDisplay && this.formatManager.updateFontSizeDisplay();
    this.formatManager.updateLineHeightDisplay && this.formatManager.updateLineHeightDisplay();

    // Tính toán lại chiều cao editor-area
    setTimeout(() => this.updateEditorAreaHeight(), 0);
    window.addEventListener('resize', () => {
      this.updateEditorAreaHeight();
      // Re-add toolbar2 separators on resize
      setTimeout(() => this.toolbarManager.addToolbar2RowSeparators && this.toolbarManager.addToolbar2RowSeparators(), 100);
    });

    // Thêm block toolbar
    this.blockManager.createBlockToolbar && this.blockManager.createBlockToolbar();

    // Apply initial theme
    this.themeManager.applyTheme && this.themeManager.applyTheme();
    
    setTimeout(() => {
      if (this.editor) {
        this.editor.focus();

        // Tìm node đầu tiên có thể đặt con trỏ (text node)
        const walker = document.createTreeWalker(
          this.editor,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              return node.textContent.trim().length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
            }
          }
        );

        const firstTextNode = walker.nextNode();
        const range = document.createRange();
        const selection = window.getSelection();
        if (firstTextNode) {
          range.setStart(firstTextNode, 0);
        } else {
          // fallback nếu không tìm được text node
          range.setStart(this.editor, 0);
        }
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }, 100);
  }

  setupContentObserver() {
    if (!this.editor) return;
    
    // Create observer to watch for content changes
    this.contentObserver = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      mutations.forEach(mutation => {
        // Check if new nodes were added with inline styles
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Element node
              if (node.hasAttribute && node.hasAttribute('style')) {
                shouldUpdate = true;
              }
              // Check child elements
              const styledElements = node.querySelectorAll && node.querySelectorAll('*[style]');
              if (styledElements && styledElements.length > 0) {
                shouldUpdate = true;
              }
            }
          });
        }
      });
      
      // Update theme for new content
      if (shouldUpdate) {
        setTimeout(() => this.themeManager.updateEditorContentTheme && this.themeManager.updateEditorContentTheme(), 100);
      }
    });
    
    // Start observing
    this.contentObserver.observe(this.editor, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style']
    });
  }

  addGlobalClickHandler() {
    // Add global click handler to close dropdowns when clicking outside
    document.addEventListener('mousedown', (e) => {
      // Check if click is inside any dropdown or toolbar button
      const clickedInsideDropdown = e.target.closest('#image-dropdown, #link-dropdown, #emoji-dropdown, #video-dropdown, #import-dropdown, .heading-dropdown, .fontsize-dropdown, .font-dropdown, .lineheight-dropdown, .capitalization-dropdown');
      const clickedInsideToolbarButton = e.target.closest('.toolbar button, .toolbar .custom-select-button');
      const clickedInsideColorPicker = this.colorPicker && this.colorPicker.contains(e.target);

      // If clicked outside all dropdowns and toolbar buttons, close all dropdowns
      if (!clickedInsideDropdown && !clickedInsideToolbarButton && !clickedInsideColorPicker) {
        this.toolbarManager.closeAllDropdowns && this.toolbarManager.closeAllDropdowns();
      }
    });
  }

  updateEditorAreaHeight() {
    const toolbarHeight = this.toolbar ? this.toolbar.getBoundingClientRect().height : 0;
    const statusbarHeight = this.statusbar ? this.statusbar.getBoundingClientRect().height : 0;
    const total = this.options.height;
    const editorHeight = Math.max(40, total - toolbarHeight - statusbarHeight);
    this.editor.style.height = editorHeight + 'px';
    this.editor.style.overflowY = 'auto';
  }

  bindEvents() {
    this.editor.addEventListener('input', () => {
      this.updateStatusbar();
      this.blockManager.updateIndentButtonState && this.blockManager.updateIndentButtonState();
      this.blockManager.updateHeadingSelector && this.blockManager.updateHeadingSelector();
      this.formatManager.updateFontSizeDisplay && this.formatManager.updateFontSizeDisplay();
      this.formatManager.updateLineHeightDisplay && this.formatManager.updateLineHeightDisplay();
      this.toolbarManager.updateFormatButtonStates && this.toolbarManager.updateFormatButtonStates();
      this.toolbarManager.updateColorButtonStates && this.toolbarManager.updateColorButtonStates();
      
      // Kiểm tra nếu editor trống thì tạo thẻ div và p
      if (this.editor.innerHTML === '' || this.editor.innerHTML === '<br>') {
        const div = document.createElement('div');
        div.style.fontFamily = 'Arial, sans-serif';
        div.style.maxWidth = '600px';
        div.style.margin = '0 auto';
        div.style.padding = '20px';

        const p = document.createElement('p');
        p.innerHTML = '<br>';
        div.appendChild(p);
        this.editor.appendChild(div);

        // Đặt con trỏ vào thẻ p
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(p, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });

    // Cập nhật trạng thái nút khi con trỏ di chuyển hoặc selection thay đổi
    document.addEventListener('selectionchange', () => {
      if (document.activeElement === this.editor || this.editor.contains(document.activeElement)) {
        // Debounce để tránh gọi quá nhiều lần
        clearTimeout(this.selectionTimeout);
        this.selectionTimeout = setTimeout(() => {
          this.blockManager.updateIndentButtonState && this.blockManager.updateIndentButtonState();
          this.blockManager.updateHeadingSelector && this.blockManager.updateHeadingSelector();
          this.formatManager.updateFontSizeDisplay && this.formatManager.updateFontSizeDisplay();
          this.formatManager.updateLineHeightDisplay && this.formatManager.updateLineHeightDisplay();
          this.toolbarManager.updateFormatButtonStates && this.toolbarManager.updateFormatButtonStates();
          this.toolbarManager.updateColorButtonStates && this.toolbarManager.updateColorButtonStates();
        }, 1);
      }
    });

    // Thêm event listeners cho mouse và keyboard để cập nhật trạng thái ngay lập tức
    this.editor.addEventListener('mouseup', () => {
      setTimeout(() => {
        this.toolbarManager.updateFormatButtonStates && this.toolbarManager.updateFormatButtonStates();
        this.toolbarManager.updateColorButtonStates && this.toolbarManager.updateColorButtonStates();
      }, 10);
    });

    this.editor.addEventListener('keyup', (e) => {
      // Chỉ cập nhật khi không phải là các phím điều hướng
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
        setTimeout(() => {
          this.toolbarManager.updateFormatButtonStates && this.toolbarManager.updateFormatButtonStates();
          this.toolbarManager.updateColorButtonStates && this.toolbarManager.updateColorButtonStates();
        }, 10);
      }
    });
  }

  updateStatusbar() {
    if (!this.statusbar) return;

    const sel = window.getSelection();
    if (!sel) return;

    // Kiểm tra xem selection có nằm trong editor-area không
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const element = container.nodeType === 3 ? container.parentElement : container;
      
      // Kiểm tra xem element có nằm trong editor-area không
      if (!this.editor.contains(element) && element !== this.editor) {
        return; // Bỏ qua nếu cursor không nằm trong editor-area
      }
    } else {
      // Nếu không có selection, kiểm tra activeElement
      if (document.activeElement !== this.editor && !this.editor.contains(document.activeElement)) {
        return; // Bỏ qua nếu focus không nằm trong editor-area
      }
    }

    // Update breadcrumb (show current element path)
    if (this.statusbarEls.breadcrumb && this.options.features.breadcrumb) {
      const currentNode = sel.anchorNode;
      const path = [];
      let element = currentNode?.nodeType === 3 ? currentNode.parentElement : currentNode;
      
      while (element && element !== this.editor && element !== document.body) {
        if (element.tagName) {
          let tagInfo = element.tagName.toLowerCase();
          
          // Add class info if available
          if (element.className && typeof element.className === 'string') {
            const classes = element.className.trim();
            if (classes) {
              tagInfo += '.' + classes.split(' ').join('.');
            }
          }
          
          // Add id info if available
          if (element.id) {
            tagInfo += '#' + element.id;
          }
          
          path.unshift(tagInfo);
        }
        element = element.parentElement;
      }
      
      this.statusbarEls.breadcrumb.textContent = path.length > 0 ? path.join(' > ') : 'editor';
    }

    // Update word count
    if (this.statusbarEls.wordcount && this.options.features.wordCount) {
      const text = this.editor.textContent || '';
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      const charsNoSpaces = text.replace(/\s/g, '').length;
      
      this.statusbarEls.wordcount.textContent = `${words} words, ${chars} chars (${charsNoSpaces} no spaces)`;
    }
  }

  saveSelection() {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      return sel.getRangeAt(0).cloneRange();
    }
    return null;
  }

  restoreSelection(range) {
    if (range) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  toggleSourceView() {
    const isSourceView = this.editor.getAttribute('contenteditable') === 'false';
    
    if (isSourceView) {
      // Chuyển từ source view sang editor view
      this.editor.innerHTML = this.sourceTextarea.value;
      this.editor.setAttribute('contenteditable', 'true');
      this.sourceTextarea.remove();
      if (this.toolbarBtns && this.toolbarBtns.viewSource) {
        this.toolbarBtns.viewSource.innerHTML = '<i class="fas fa-code"></i>';
        this.toolbarBtns.viewSource.title = 'View Source';
      }
    } else {
      // Chuyển từ editor view sang source view
      this.sourceTextarea = document.createElement('textarea');
      this.sourceTextarea.value = this.editor.innerHTML;
      this.sourceTextarea.style.flex = '1';
      this.sourceTextarea.style.minHeight = '200px';
      this.sourceTextarea.style.height = '100%';
      this.sourceTextarea.style.width = '100%';
      this.sourceTextarea.style.padding = '12px';
      this.sourceTextarea.style.fontFamily = 'inherit';
      this.sourceTextarea.style.fontSize = '16px';
      this.sourceTextarea.style.lineHeight = '1.7';
      this.sourceTextarea.style.border = 'none';
      this.sourceTextarea.style.outline = 'none';
      this.sourceTextarea.style.background = '#fff';
      this.sourceTextarea.style.color = '#2c3e50';
      this.sourceTextarea.style.resize = 'none';
      this.sourceTextarea.style.overflow = 'auto';
      this.sourceTextarea.style.boxSizing = 'border-box';
      
      this.editor.setAttribute('contenteditable', 'false');
      this.editor.innerHTML = '';
      this.editor.appendChild(this.sourceTextarea);
      if (this.toolbarBtns && this.toolbarBtns.viewSource) {
        this.toolbarBtns.viewSource.innerHTML = '<i class="fas fa-edit"></i>';
        this.toolbarBtns.viewSource.title = 'Edit';
      }
    }
  }

  adjustEditorZoom(factor) {
    // Get current zoom level or default to 1
    if (!this.currentZoom) {
      this.currentZoom = 1;
    }
    
    // Apply zoom factor
    this.currentZoom *= factor;
    
    // Limit zoom between 0.5x and 3x
    this.currentZoom = Math.max(0.5, Math.min(3, this.currentZoom));
    
    // Apply zoom to editor
    this.editor.style.zoom = this.currentZoom;
    
    // Update status if needed
    this.updateZoomStatus();
  }

  resetEditorZoom() {
    this.currentZoom = 1;
    this.editor.style.zoom = '1';
    this.updateZoomStatus();
  }

  updateZoomStatus() {
    // You can add zoom level display in status bar if needed
    const zoomPercentage = Math.round(this.currentZoom * 100);
    console.log(`Zoom: ${zoomPercentage}%`);
  }

  destroy() {
    // Remove list menu from document.body if it exists
    if (this.listMenu && this.listMenu.parentNode) {
      this.listMenu.parentNode.removeChild(this.listMenu);
    }
    
    // Clean up other dropdowns if needed
    Object.values(this.dropdownMenus).forEach(({ menu }) => {
      if (menu && menu.parentNode === document.body) {
        document.body.removeChild(menu);
      }
    });

    // Close all dropdowns and clean up global handlers
    this.toolbarManager.closeAllDropdowns && this.toolbarManager.closeAllDropdowns();
    
    // Remove content observer
    if (this.contentObserver) {
      this.contentObserver.disconnect();
    }
    
    // Remove main wrapper
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
  }
} 