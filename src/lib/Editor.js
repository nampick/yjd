// Editor.js - Editor library giống TinyMCE/Quill cấu hình được
import '../style.css';

export class Editor {
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
        'image', 'table', 'heading', 'list', 'quote', 'code', 'video', 'import', 'indent'
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
    this.wrapper.style.transition = 'all 0.3s ease';
    this.wrapper.style.margin = '0 auto';
    this.wrapper.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.wrapper.style.display = 'flex';
    this.wrapper.style.flexDirection = 'column';
    this.wrapper.style.boxSizing = 'border-box';

    // Menu bar (new dropdown menu bar above toolbar)
    this.menuBar = this.createMenuBar();
    this.wrapper.appendChild(this.menuBar);

    // Toolbar
    this.toolbar = this.createToolbar();
    this.wrapper.appendChild(this.toolbar);

    // Table popup và các phần tử liên quan (nếu bật table)
    if (this.options.features.table) {
      this.createTableUI();
    }

    // Editor area
    this.editor = document.createElement('div');
    this.editor.className = 'editor-area';
    this.editor.contentEditable = true;
    this.editor.style.flex = '1 1 auto';
    this.editor.style.minHeight = '40px';
    this.editor.style.padding = '12px';
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
      this.statusbar.appendChild(this.statusbarEls.breadcrumb);

      this.statusbarEls.wordcount = document.createElement('span');
      this.statusbarEls.wordcount.className = 'wordcount';
      this.statusbarEls.wordcount.style.fontFamily = 'monospace';
      this.statusbarEls.wordcount.style.background = 'transparent';
      this.statusbarEls.wordcount.style.padding = '0 4px';
      this.statusbarEls.wordcount.style.borderRadius = '3px';
      this.statusbarEls.wordcount.style.border = 'none';
      this.statusbarEls.wordcount.style.boxSizing = 'border-box';
      this.statusbar.appendChild(this.statusbarEls.wordcount);

      this.wrapper.appendChild(this.statusbar);
    }

    // Gắn vào root
    this.root.innerHTML = '';
    this.root.appendChild(this.wrapper);
    // Gắn event
    this.bindEvents();
    // Cập nhật statusbar lần đầu
    this.updateStatusbar();
    // Cập nhật heading selector và font size display lần đầu
    this.updateHeadingSelector();
    this.updateFontSizeDisplay();
    this.updateLineHeightDisplay();

    // Tính toán lại chiều cao editor-area
    setTimeout(() => this.updateEditorAreaHeight(), 0);
    window.addEventListener('resize', () => this.updateEditorAreaHeight());

    // Thêm block toolbar
    this.createBlockToolbar();

    // Apply initial theme
    this.applyTheme();
    
    // Setup content observer to update theme when content changes
    this.setupContentObserver();
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
        setTimeout(() => this.updateEditorContentTheme(), 100);
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

  updateEditorAreaHeight() {
    const toolbarHeight = this.toolbar ? this.toolbar.getBoundingClientRect().height : 0;
    const statusbarHeight = this.statusbar ? this.statusbar.getBoundingClientRect().height : 0;
    const total = this.options.height;
    const editorHeight = Math.max(40, total - toolbarHeight - statusbarHeight);
    this.editor.style.height = editorHeight + 'px';
    this.editor.style.overflowY = 'auto';
  }

  createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    toolbar.style.padding = '6px 16px';
    toolbar.style.borderBottom = '1px solid #d1d5db';
    toolbar.style.display = 'flex';
    toolbar.style.gap = '8px';
    toolbar.style.flexWrap = 'wrap';
    toolbar.style.background = '#f4f6fa';
    toolbar.style.transition = 'all 0.3s ease';
    toolbar.style.alignItems = 'stretch';
    toolbar.style.minHeight = '56px';
    toolbar.style.paddingBottom = '8px';
    toolbar.style.boxSizing = 'border-box';
    toolbar.style.width = '100%';
    toolbar.style.overflow = 'hidden';
    toolbar.style.borderTopLeftRadius = '6px';
    toolbar.style.borderTopRightRadius = '6px';
    toolbar.style.borderBottomLeftRadius = '0';
    toolbar.style.borderBottomRightRadius = '0';

    // Lưu các nút để có thể truy cập sau này
    this.toolbarBtns = {};

    // Định dạng văn bản
    const formatBtns = [
      { icon: '<i class="fas fa-bold"></i>', title: 'Bold', cmd: 'bold' },
      { icon: '<i class="fas fa-italic"></i>', title: 'Italic', cmd: 'italic' },
      { icon: '<i class="fas fa-underline"></i>', title: 'Underline', cmd: 'underline' },
      { icon: '<i class="fas fa-strikethrough"></i>', title: 'Strike', cmd: 'strikeThrough' },
      { icon: '<i class="fas fa-superscript"></i>', title: 'Superscript', cmd: 'superscript' },
      { icon: '<i class="fas fa-subscript"></i>', title: 'Subscript', cmd: 'subscript' }
    ];

    formatBtns.forEach(btn => {
      const button = this.createBtn(btn.icon, btn.title, btn.cmd);
      toolbar.appendChild(button);
      this.toolbarBtns[btn.cmd] = button;
    });

    // Thêm separator
    toolbar.appendChild(this.createSeparator());

    // Định dạng khối
    const blockBtns = [
      { icon: '<i class="fas fa-heading"></i>', title: 'Heading 1', cmd: 'formatBlock', value: 'H1' },
      { icon: '<i class="fas fa-heading"></i>', title: 'Heading 2', cmd: 'formatBlock', value: 'H2' },
      { icon: '<i class="fas fa-quote-right"></i>', title: 'Quote', cmd: 'formatBlock', value: 'BLOCKQUOTE' },
      { icon: '<i class="fas fa-code"></i>', title: 'Code', cmd: 'formatBlock', value: 'PRE' }
    ];

    blockBtns.forEach(btn => {
      const button = this.createBtn(btn.icon, btn.title, btn.cmd, btn.value);
      toolbar.appendChild(button);
      this.toolbarBtns[btn.cmd + btn.value] = button;
    });

    // Thêm separator
    toolbar.appendChild(this.createSeparator());

    // Căn lề
    const alignDropdown = document.createElement('div');
    alignDropdown.className = 'toolbar-dropdown';
    alignDropdown.style.position = 'relative';
    alignDropdown.style.display = 'inline-block';

    const alignBtn = this.createBtn('<i class="fas fa-align-left"></i>', 'Text Alignment');
    alignDropdown.appendChild(alignBtn);
    this.toolbarBtns['textAlignment'] = alignBtn;

    const alignMenu = document.createElement('div');
    alignMenu.className = 'dropdown-menu';
    alignMenu.style.display = 'none';
    alignMenu.style.position = 'fixed'; // Changed from absolute to fixed
    alignMenu.style.zIndex = '99999'; // Increased z-index
    alignMenu.style.backgroundColor = '#fff';
    alignMenu.style.border = '1px solid #d1d5db';
    alignMenu.style.borderRadius = '8px';
    alignMenu.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    alignMenu.style.minWidth = '160px';
    alignMenu.style.padding = '4px';
    alignMenu.style.transition = 'all 0.2s ease';
    alignMenu.style.opacity = '0';
    alignMenu.style.transform = 'translateY(-10px)';
    alignMenu.style.pointerEvents = 'none';

    const alignOptions = [
      { icon: '<i class="fas fa-align-left"></i>', title: 'Left', cmd: 'justifyLeft' },
      { icon: '<i class="fas fa-align-center"></i>', title: 'Center', cmd: 'justifyCenter' },
      { icon: '<i class="fas fa-align-right"></i>', title: 'Right', cmd: 'justifyRight' },
      { icon: '<i class="fas fa-align-justify"></i>', title: 'Justify', cmd: 'justifyFull' }
    ];

    alignOptions.forEach(option => {
      const button = this.createBtn(option.icon, option.title, option.cmd);
      button.style.display = 'flex';
      button.style.width = '100%';
      button.style.alignItems = 'center';
      button.style.padding = '8px 12px';
      button.style.border = 'none';
      button.style.backgroundColor = 'transparent';
      button.style.cursor = 'pointer';
      button.style.borderRadius = '6px';
      button.style.transition = 'all 0.2s ease';
      button.style.color = '#374151';
      button.style.fontSize = '14px';
      button.style.gap = '8px';
      
      const label = document.createElement('span');
      label.textContent = option.title;
      button.appendChild(label);
      
      button.addEventListener('mouseover', () => {
        button.style.backgroundColor = '#f3f4f6';
      });
      
      button.addEventListener('mouseout', () => {
        button.style.backgroundColor = 'transparent';
      });
      
      button.addEventListener('click', () => {
        document.execCommand(option.cmd, false, null);
        alignBtn.innerHTML = option.icon;
        alignMenu.style.display = 'none';
        alignMenu.style.opacity = '0';
        alignMenu.style.transform = 'translateY(-10px)';
        alignMenu.style.pointerEvents = 'none';
      });
      
      alignMenu.appendChild(button);
    });

    alignDropdown.appendChild(alignMenu);
    toolbar.appendChild(alignDropdown);

    // Thêm sự kiện click cho nút dropdown
    alignBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = alignMenu.style.display === 'block';
      this.closeAllDropdowns();
      
      if (!isVisible) {
        // Calculate position
        const btnRect = alignBtn.getBoundingClientRect();
        alignMenu.style.top = (btnRect.bottom + 5) + 'px';
        alignMenu.style.left = btnRect.left + 'px';
        
        alignMenu.style.display = 'block';
        requestAnimationFrame(() => {
          alignMenu.style.opacity = '1';
          alignMenu.style.transform = 'translateY(0)';
          alignMenu.style.pointerEvents = 'auto';
        });
      } else {
        alignMenu.style.opacity = '0';
        alignMenu.style.transform = 'translateY(-10px)';
        alignMenu.style.pointerEvents = 'none';
        setTimeout(() => {
          alignMenu.style.display = 'none';
        }, 200);
      }
    });

    // Thêm sự kiện click cho document để đóng dropdown khi click ra ngoài
    document.addEventListener('click', () => {
      alignMenu.style.opacity = '0';
      alignMenu.style.transform = 'translateY(-10px)';
      alignMenu.style.pointerEvents = 'none';
      setTimeout(() => {
        alignMenu.style.display = 'none';
      }, 200);
    });

    // Thêm separator
    toolbar.appendChild(this.createSeparator());

    // Danh sách
    const listBtns = [
      { icon: '<i class="fas fa-list-ul"></i>', title: 'Unordered List', cmd: 'insertUnorderedList' },
      { icon: '<i class="fas fa-list-ol"></i>', title: 'Ordered List', cmd: 'insertOrderedList' }
    ];

    listBtns.forEach(btn => {
      const button = this.createBtn(btn.icon, btn.title, btn.cmd);
      toolbar.appendChild(button);
      this.toolbarBtns[btn.cmd] = button;
    });

    // Thêm separator
    toolbar.appendChild(this.createSeparator());

    // Font select
    const fontSelect = document.createElement('select');
    fontSelect.className = 'font-select';
    fontSelect.style.padding = '6px 12px';
    fontSelect.style.border = '1px solid #e0e0e0';
    fontSelect.style.borderRadius = '6px';
    fontSelect.style.background = this.options.theme === 'dark' ? '#2a2a2a' : '#ffffff';
    fontSelect.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#333333';
    fontSelect.style.fontSize = '14px';
    fontSelect.style.cursor = 'pointer';
    fontSelect.style.transition = 'all 0.2s ease';

    const fonts = [
      { value: 'default', text: 'Default' },
      { value: 'Arial', text: 'Arial' },
      { value: 'Times New Roman', text: 'Times New Roman' },
      { value: 'Courier New', text: 'Courier New' },
      { value: 'Georgia', text: 'Georgia' },
      { value: 'Verdana', text: 'Verdana' }
    ];

    fonts.forEach(font => {
      const option = document.createElement('option');
      option.value = font.value;
      option.textContent = font.text;
      fontSelect.appendChild(option);
    });

    fontSelect.addEventListener('change', () => {
      const font = fontSelect.value;
      if (font === 'default') {
        document.execCommand('removeFormat');
        return;
      }
      document.execCommand('fontName', false, font);
    });

    toolbar.appendChild(fontSelect);

    // Line height select
    const lineHeightSelect = document.createElement('select');
    lineHeightSelect.className = 'line-height-select';
    lineHeightSelect.style.padding = '6px 12px';
    lineHeightSelect.style.border = '1px solid #e0e0e0';
    lineHeightSelect.style.borderRadius = '6px';
    lineHeightSelect.style.background = this.options.theme === 'dark' ? '#2a2a2a' : '#ffffff';
    lineHeightSelect.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#333333';
    lineHeightSelect.style.fontSize = '14px';
    lineHeightSelect.style.cursor = 'pointer';
    lineHeightSelect.style.transition = 'all 0.2s ease';
    lineHeightSelect.style.minWidth = '100px';

    const lineHeights = [
      { value: 'default', text: 'Line Height' },
      { value: '1', text: '1.0' },
      { value: '1.2', text: '1.2' },
      { value: '1.4', text: '1.4' },
      { value: '1.5', text: '1.5' },
      { value: '1.6', text: '1.6' },
      { value: '1.8', text: '1.8' },
      { value: '2', text: '2.0' },
      { value: '2.5', text: '2.5' },
      { value: '3', text: '3.0' }
    ];

    lineHeights.forEach(lineHeight => {
      const option = document.createElement('option');
      option.value = lineHeight.value;
      option.textContent = lineHeight.text;
      lineHeightSelect.appendChild(option);
    });

    lineHeightSelect.addEventListener('change', () => {
      const lineHeight = lineHeightSelect.value;
      if (lineHeight === 'default') {
        this.removeLineHeight();
        return;
      }
      this.applyLineHeight(lineHeight);
    });

    toolbar.appendChild(lineHeightSelect);
    this.lineHeightSelector = lineHeightSelect;

    // Capitalization select
    const capitalizationSelect = document.createElement('select');
    capitalizationSelect.className = 'capitalization-select';
    capitalizationSelect.style.padding = '6px 12px';
    capitalizationSelect.style.border = '1px solid #e0e0e0';
    capitalizationSelect.style.borderRadius = '6px';
    capitalizationSelect.style.background = this.options.theme === 'dark' ? '#2a2a2a' : '#ffffff';
    capitalizationSelect.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#333333';
    capitalizationSelect.style.fontSize = '14px';
    capitalizationSelect.style.cursor = 'pointer';
    capitalizationSelect.style.transition = 'all 0.2s ease';
    capitalizationSelect.style.minWidth = '120px';

    const capitalizationOptions = [
      { value: 'default', text: 'Capitalization' },
      { value: 'lowercase', text: 'lowercase' },
      { value: 'uppercase', text: 'UPPERCASE' },
      { value: 'titlecase', text: 'Title Case' },
      { value: 'capitalize', text: 'Capitalize First' }
    ];

    capitalizationOptions.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.text;
      capitalizationSelect.appendChild(optionElement);
    });

    capitalizationSelect.addEventListener('change', () => {
      const capitalization = capitalizationSelect.value;
      if (capitalization === 'default') {
        capitalizationSelect.value = 'default'; // Reset to default
        return;
      }
      this.applyCapitalization(capitalization);
      // Reset to default after applying
      setTimeout(() => {
        capitalizationSelect.value = 'default';
      }, 100);
    });

    toolbar.appendChild(capitalizationSelect);
    this.capitalizationSelector = capitalizationSelect;

    // Thêm separator
    toolbar.appendChild(this.createSeparator());

    // Chèn nội dung
    const insertBtns = [
      { icon: '<i class="far fa-smile"></i>', title: 'Emoji', cmd: 'emoji' },
      { icon: '<i class="far fa-image"></i>', title: 'Image', cmd: 'image' },
      { icon: '<i class="fas fa-link"></i>', title: 'Link', cmd: 'link' },
      { icon: '<i class="fas fa-table"></i>', title: 'Table', cmd: 'table' },
      { icon: '<i class="fas fa-video"></i>', title: 'Video', cmd: 'video' },
      { icon: '<i class="fas fa-file-import"></i>', title: 'Import', cmd: 'import' },
      { icon: '<i class="fas fa-tags"></i>', title: 'Insert Tags', cmd: 'insertTags' },
      { icon: '<i class="fas fa-file-alt"></i>', title: 'Insert Template', cmd: 'insertTemplate' }
    ];

    insertBtns.forEach(btn => {
      const button = this.createBtn(btn.icon, btn.title, btn.cmd);
      toolbar.appendChild(button);
      this.toolbarBtns[btn.cmd] = button;
    });

    // Thêm separator
    toolbar.appendChild(this.createSeparator());

    // Nút chọn màu chữ
    const textColorBtn = this.createBtn('<i class="fas fa-font"></i>', 'Text Color', 'textColor');
    toolbar.appendChild(textColorBtn);
    this.toolbarBtns.textColor = textColorBtn;

    // Nút chọn màu nền
    const bgColorBtn = this.createBtn('<i class="fas fa-fill-drip"></i>', 'Background Color', 'bgColor');
    toolbar.appendChild(bgColorBtn);
    this.toolbarBtns.bgColor = bgColorBtn;

    // Hoàn tác/Làm lại
    const undoRedoBtns = [
      { icon: '<i class="fas fa-undo"></i>', title: 'Undo', cmd: 'undo' },
      { icon: '<i class="fas fa-redo"></i>', title: 'Redo', cmd: 'redo' }
    ];

    undoRedoBtns.forEach(btn => {
      const button = this.createBtn(btn.icon, btn.title, btn.cmd);
      toolbar.appendChild(button);
      this.toolbarBtns[btn.cmd] = button;
    });

    // Thêm separator
    toolbar.appendChild(this.createSeparator());

    // Thêm nút View Source
    const viewSourceBtn = this.createBtn('<i class="fas fa-code"></i>', 'View Source', 'viewSource');
    viewSourceBtn.onclick = () => this.toggleSourceView();
    toolbar.appendChild(viewSourceBtn);

    // Theme toggle button
    const themeBtn = document.createElement('button');
    themeBtn.className = 'editor-btn theme-toggle';
    themeBtn.innerHTML = this.options.theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    themeBtn.title = this.options.theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme';
    themeBtn.style.padding = '8px 12px';
    themeBtn.style.border = '1px solid #e0e0e0';
    themeBtn.style.borderRadius = '6px';
    themeBtn.style.background = this.options.theme === 'dark' ? '#2a2a2a' : '#ffffff';
    themeBtn.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#333333';
    themeBtn.style.cursor = 'pointer';
    themeBtn.style.fontSize = '14px';
    themeBtn.style.transition = 'all 0.2s ease';
    themeBtn.style.marginLeft = '8px';

    themeBtn.onclick = () => {
      this.toggleTheme();
    };

    themeBtn.onmouseover = () => {
      themeBtn.style.background = this.options.theme === 'dark' ? '#404040' : '#f5f5f5';
    };

    themeBtn.onmouseout = () => {
      themeBtn.style.background = this.options.theme === 'dark' ? '#2a2a2a' : '#ffffff';
    };

    toolbar.appendChild(themeBtn);
    this.themeToggleBtn = themeBtn;

    // Thêm separator
    toolbar.appendChild(this.createSeparator());

    // Heading/Block selector (simple select like font selector)
    const headingSelect = document.createElement('select');
    headingSelect.className = 'heading-select';
    headingSelect.style.padding = '6px 12px';
    headingSelect.style.border = '1px solid #e0e0e0';
    headingSelect.style.borderRadius = '6px';
    headingSelect.style.background = this.options.theme === 'dark' ? '#2a2a2a' : '#ffffff';
    headingSelect.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#333333';
    headingSelect.style.fontSize = '14px';
    headingSelect.style.cursor = 'pointer';
    headingSelect.style.transition = 'all 0.2s ease';
    headingSelect.style.minWidth = '130px';

    const headingOptions = [
      { value: 'P', text: 'Paragraph' },
      { value: 'H1', text: 'Heading 1' },
      { value: 'H2', text: 'Heading 2' },
      { value: 'H3', text: 'Heading 3' },
      { value: 'H4', text: 'Heading 4' },
      { value: 'H5', text: 'Heading 5' },
      { value: 'H6', text: 'Heading 6' },
      { value: 'PRE', text: 'Code Block' },
      { value: 'BLOCKQUOTE', text: 'Quote' }
    ];

    headingOptions.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.text;
      headingSelect.appendChild(optionElement);
    });

    headingSelect.addEventListener('change', () => {
      const selectedValue = headingSelect.value;
      this.applyHeadingToSelection(selectedValue);
    });

    toolbar.appendChild(headingSelect);
    this.headingSelector = headingSelect;

    // Thêm separator
    toolbar.appendChild(this.createSeparator());

    // Font size selector (simple select like font selector)
    const fontSizeSelect = document.createElement('select');
    fontSizeSelect.className = 'font-size-select';
    fontSizeSelect.style.padding = '6px 12px';
    fontSizeSelect.style.border = '1px solid #e0e0e0';
    fontSizeSelect.style.borderRadius = '6px';
    fontSizeSelect.style.background = this.options.theme === 'dark' ? '#2a2a2a' : '#ffffff';
    fontSizeSelect.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#333333';
    fontSizeSelect.style.fontSize = '14px';
    fontSizeSelect.style.cursor = 'pointer';
    fontSizeSelect.style.transition = 'all 0.2s ease';
    fontSizeSelect.style.width = '80px';

    const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 44, 48, 54, 60, 66, 72];

    fontSizes.forEach(size => {
      const option = document.createElement('option');
      option.value = size;
      option.textContent = size + 'px';
      if (size === 16) option.selected = true; // Default selection
      fontSizeSelect.appendChild(option);
    });

    fontSizeSelect.addEventListener('change', () => {
      const selectedSize = parseInt(fontSizeSelect.value);
      this.setFontSize(selectedSize);
    });

    toolbar.appendChild(fontSizeSelect);
    this.fontSizeSelector = fontSizeSelect;

    return toolbar;
  }

  createBtn(icon, title, cmd, value = null) {
    const btn = document.createElement('button');
    btn.innerHTML = icon;
    btn.title = title;
    btn.classList.add('toolbar-btn');
    btn.style.padding = '6px 9px';
    btn.style.border = '1.5px solid transparent';
    btn.style.borderRadius = '7px';
    btn.style.background = '#fff';
    btn.style.color = '#374151';
    btn.style.cursor = 'pointer';
    btn.style.transition = 'all 0.18s cubic-bezier(.4,0,.2,1)';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.minWidth = '32px';
    btn.style.height = '32px';
    btn.style.fontSize = '17px';
    btn.style.boxSizing = 'border-box';
    btn.style.margin = '0';
    btn.style.marginTop = '0';
    btn.style.marginBottom = '0';
    btn.style.backgroundClip = 'padding-box';

    // CSS cho trạng thái active
    btn._setActive = function(active) {
      if (active) {
        btn.classList.add('active');
        btn.style.background = '#e0f0ff';
        btn.style.color = '#1976d2';
        btn.style.borderColor = '#90caf9';
        btn.style.boxShadow = '0 2px 8px rgba(25, 118, 210, 0.08)';
      } else {
        btn.classList.remove('active');
        btn.style.background = '#fff';
        btn.style.color = '#374151';
        btn.style.borderColor = 'transparent';
        btn.style.boxShadow = 'none';
      }
    };

    btn.onmouseover = () => {
      if (!btn.classList.contains('active')) {
        btn.style.background = '#e9ecef';
        btn.style.color = '#374151';
        btn.style.borderColor = '#b6d4fe';
        btn.style.transform = 'translateY(-1px)';
        btn.style.boxShadow = '0 2px 8px rgba(25, 118, 210, 0.06)';
      }
    };

    btn.onmouseout = () => {
      if (btn.classList.contains('active')) {
        btn.style.background = '#e0f0ff';
        btn.style.color = '#1976d2';
        btn.style.borderColor = '#90caf9';
        btn.style.boxShadow = '0 2px 8px rgba(25, 118, 210, 0.08)';
      } else {
        btn.style.background = '#fff';
        btn.style.color = '#374151';
        btn.style.borderColor = 'transparent';
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = 'none';
      }
    };

    btn.onclick = e => {
      e.preventDefault();
      if (cmd === 'viewSource') {
        this.toggleSourceView();
        return;
      }
      if (cmd === 'textColor' || cmd === 'bgColor') {
        this.showColorPicker(btn, cmd);
        return;
      }
      if (cmd === 'emoji') {
        this.savedEmojiSelection = this.saveSelection();
        this.showTooltip({
          title: 'Insert Emoji',
          placeholder: 'Search or select emoji...',
          confirmText: 'Insert',
          emojis: true,
          onSubmit: emoji => {
            this.restoreSelection(this.savedEmojiSelection);
            this.editor.focus();
            const sel = window.getSelection();
            if (sel.rangeCount && this.editor.contains(sel.anchorNode)) {
              sel.getRangeAt(0).insertNode(document.createTextNode(emoji));
            } else {
              this.editor.appendChild(document.createTextNode(emoji));
            }
          }
        });
        return;
      }
      if (cmd === 'image') {
        this.savedSelection = this.saveSelection();
        this.showTooltip({
          title: 'Insert Image',
          placeholder: 'Paste image URL or select file...',
          confirmText: 'Insert',
          file: true,
          onSubmit: url => this.insertImageWithStyle(url)
        });
        return;
      }
      if (cmd === 'video') {
        this.savedSelection = this.saveSelection();
        this.showTooltip({
          title: 'Insert Video',
          placeholder: 'Paste video URL (YouTube, Vimeo, etc.)...',
          confirmText: 'Insert',
          onSubmit: url => this.insertVideo(url)
        });
        return;
      }
      if (cmd === 'import') {
        this.savedSelection = this.saveSelection();
        this.showTooltip({
          title: 'Import Content',
          placeholder: 'Paste HTML content to import...',
          confirmText: 'Import',
          showImportOptions: true, // Thêm tùy chọn cho các loại file
          onSubmit: (content, fileType) => this.importContent(content, fileType)
        });
        return;
      }
      if (cmd === 'insertTags') {
        this.savedSelection = this.saveSelection();
        this.showTagsPopup();
        return;
      }
      if (cmd === 'insertTemplate') {
        this.savedSelection = this.saveSelection();
        this.showTemplatesPopup();
        return;
      }
      if (cmd === 'link') {
        this.showTooltip({
          title: 'Insert Link',
          placeholder: 'Enter URL (https://...)',
          confirmText: 'Insert',
          onSubmit: url => document.execCommand('createLink', false, url)
        });
        return;
      }
      if (cmd === 'table') {
        const rect = this.toolbarBtns.table.getBoundingClientRect();
        this.tablePopup.style.display = this.tablePopup.style.display === 'block' ? 'none' : 'block';
        this.tablePopup.style.top = rect.bottom + window.scrollY + 4 - this.wrapper.getBoundingClientRect().top + 'px';
        this.tablePopup.style.left = rect.left + window.scrollX - this.wrapper.getBoundingClientRect().left + 'px';
        return;
      }
      if (cmd === 'indent') {
        this.applyIndentToSelection();
        return;
      }
      if (cmd === 'indentIncrease') {
        this.applyPaddingIndentToSelection(true);
        return;
      }
      if (cmd === 'indentDecrease') {
        this.applyPaddingIndentToSelection(false);
        return;
      }
      document.execCommand(cmd, false, value);
      this.editor.focus();
    };
    return btn;
  }

  createSeparator() {
    const separator = document.createElement('div');
    separator.style.width = '1px';
    separator.style.height = '16px';
    separator.style.background = '#e5e7eb';
    separator.style.margin = '0 2px';
    separator.style.boxSizing = 'border-box';
    return separator;
  }

  createTableUI() {
    // Tạo popup chọn bảng
    this.tablePopup = document.createElement('div');
    this.tablePopup.className = 'table-popup';
    this.tablePopup.style.display = 'none';
    this.tablePopup.style.position = 'absolute';
    this.tablePopup.style.background = '#fff';
    this.tablePopup.style.border = '1px solid #ccc';
    this.tablePopup.style.padding = '8px';
    this.tablePopup.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
    this.tablePopup.style.zIndex = 100;
    // Tạo lưới chọn bảng
    this.tableGrid = document.createElement('div');
    this.tableGrid.className = 'table-grid';
    this.tableGrid.style.display = 'grid';
    this.tableGrid.style.gridTemplateColumns = 'repeat(8, 20px)';
    this.tableGrid.style.gridGap = '2px';
    this.tableGrid.style.marginBottom = '8px';
    this.tablePopup.appendChild(this.tableGrid);
    // Tạo label kích thước
    this.tableSizeLabel = document.createElement('div');
    this.tableSizeLabel.className = 'table-size-label';
    this.tableSizeLabel.textContent = '0x0';
    this.tablePopup.appendChild(this.tableSizeLabel);
    // Thêm popup vào wrapper
    this.wrapper.appendChild(this.tablePopup);
    // Tạo lưới 8x8
    const maxRows = 8, maxCols = 8;
    for (let r = 0; r < maxRows; r++) {
      for (let c = 0; c < maxCols; c++) {
        const cell = document.createElement('div');
        cell.className = 'table-cell';
        cell.style.width = '20px';
        cell.style.height = '20px';
        cell.style.border = '1px solid #eee';
        cell.style.background = '#f9f9f9';
        cell.style.cursor = 'pointer';
        cell.dataset.row = r + 1;
        cell.dataset.col = c + 1;
        this.tableGrid.appendChild(cell);
      }
    }
    // Sự kiện chọn kích thước bảng
    let hoverRows = 0, hoverCols = 0;
    this.tableGrid.addEventListener('mousemove', e => {
      if (e.target.classList.contains('table-cell')) {
        hoverRows = Number(e.target.dataset.row);
        hoverCols = Number(e.target.dataset.col);
        Array.from(this.tableGrid.children).forEach(cell => {
          const row = Number(cell.dataset.row), col = Number(cell.dataset.col);
          cell.classList.toggle('selected', row <= hoverRows && col <= hoverCols);
        });
        this.tableSizeLabel.textContent = `${hoverCols}x${hoverRows}`;
      }
    });
    this.tableGrid.addEventListener('mouseleave', () => {
      Array.from(this.tableGrid.children).forEach(cell => cell.classList.remove('selected'));
      this.tableSizeLabel.textContent = `0x0`;
    });
    this.tableGrid.addEventListener('mousedown', e => {
      if (e.target.classList.contains('table-cell')) {
        const rows = Number(e.target.dataset.row);
        const cols = Number(e.target.dataset.col);
        this.insertTable(rows, cols);
        this.tablePopup.style.display = 'none';
      }
    });

    // Ẩn popup khi click ra ngoài
    document.addEventListener('mousedown', e => {
      if (!this.tablePopup.contains(e.target) && e.target !== this.toolbarBtns.table) {
        this.tablePopup.style.display = 'none';
      }
    });

    // Tạo table toolbar
    this.tableToolbar = document.createElement('div');
    this.tableToolbar.className = 'table-toolbar';
    this.tableToolbar.style.display = 'none';
    this.tableToolbar.style.position = 'absolute';
    this.tableToolbar.style.background = '#fff';
    this.tableToolbar.style.border = '1px solid #ccc';
    this.tableToolbar.style.borderRadius = '4px';
    this.tableToolbar.style.padding = '4px';
    this.tableToolbar.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
    this.tableToolbar.style.zIndex = 100;
    this.tableToolbar.style.gap = '4px';

    // Thêm các nút vào toolbar
    const buttons = [
      { icon: '<i class="fas fa-arrow-up"></i>', title: 'Thêm dòng trên', cmd: 'addRowAbove' },
      { icon: '<i class="fas fa-arrow-down"></i>', title: 'Thêm dòng dưới', cmd: 'addRowBelow' },
      { icon: '<i class="fas fa-arrow-left"></i>', title: 'Thêm cột trái', cmd: 'addColLeft' },
      { icon: '<i class="fas fa-arrow-right"></i>', title: 'Thêm cột phải', cmd: 'addColRight' },
      { icon: '<i class="fas fa-trash"></i>', title: 'Xóa dòng', cmd: 'deleteRow' },
      { icon: '<i class="fas fa-trash"></i>', title: 'Xóa cột', cmd: 'deleteCol' },
      { icon: '<i class="fas fa-object-group"></i>', title: 'Merge cells', cmd: 'mergeCells' },
      { icon: '<i class="fas fa-object-ungroup"></i>', title: 'Split cells', cmd: 'splitCells' },
      { icon: '<i class="fas fa-times"></i>', title: 'Xóa bảng', cmd: 'deleteTable' }
    ];

    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.innerHTML = btn.icon;
      button.title = btn.title;
      button.style.padding = '4px 8px';
      button.style.border = '1px solid #ccc';
      button.style.borderRadius = '4px';
      button.style.background = '#fff';
      button.style.cursor = 'pointer';
      button.onclick = e => {
        e.preventDefault();
        this.handleTableCommand(btn.cmd);
      };
      this.tableToolbar.appendChild(button);
    });

    this.wrapper.appendChild(this.tableToolbar);
  }

  insertTable(rows, cols) {
    let html = '<table style="border-collapse:collapse;width:100%;">';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        html += '<td style="border:1px solid #ccc;min-width:40px;height:28px;">&nbsp;</td>';
      }
      html += '</tr>';
    }
    html += '</table><br>';
    this.editor.focus();
    document.execCommand('insertHTML', false, html);
  }

  handleTableCommand(cmd) {
    if (!this.selectedTable) return;

    switch(cmd) {
      case 'addRowAbove':
        this.addTableRow('above');
        break;
      case 'addRowBelow':
        this.addTableRow('below');
        break;
      case 'addColLeft':
        this.addTableColumn('left');
        break;
      case 'addColRight':
        this.addTableColumn('right');
        break;
      case 'deleteRow':
        this.deleteTableRow();
        break;
      case 'deleteCol':
        this.deleteTableColumn();
        break;
      case 'mergeCells':
        this.mergeTableCells();
        break;
      case 'splitCells':
        this.splitTableCells();
        break;
      case 'deleteTable':
        this.deleteTable();
        break;
    }
  }

  addTableRow(position) {
    if (!this.selectedCell) return;
    const row = this.selectedCell.parentElement;
    const newRow = row.cloneNode(true);
    newRow.querySelectorAll('td,th').forEach(cell => cell.innerHTML = '&nbsp;');
    if (position === 'above') {
      row.parentElement.insertBefore(newRow, row);
    } else {
      row.parentElement.insertBefore(newRow, row.nextSibling);
    }
  }

  addTableColumn(position) {
    if (!this.selectedCell) return;
    const cellIndex = this.selectedCell.cellIndex;
    Array.from(this.selectedTable.rows).forEach(row => {
      const newCell = row.insertCell(position === 'left' ? cellIndex : cellIndex + 1);
      newCell.innerHTML = '&nbsp;';
    });
  }

  deleteTableRow() {
    if (!this.selectedCell) return;
    const row = this.selectedCell.parentElement;
    if (row.parentElement.rows.length > 1) {
      row.remove();
    }
  }

  deleteTableColumn() {
    if (!this.selectedCell) return;
    const cellIndex = this.selectedCell.cellIndex;
    if (this.selectedTable.rows[0].cells.length > 1) {
      Array.from(this.selectedTable.rows).forEach(row => {
        row.deleteCell(cellIndex);
      });
    }
  }

  mergeTableCells() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const startCell = range.startContainer.closest('td,th');
    const endCell = range.endContainer.closest('td,th');

    if (!startCell || !endCell || startCell === endCell) return;

    // Tính toán vị trí
    const startRow = startCell.parentElement.rowIndex;
    const endRow = endCell.parentElement.rowIndex;
    const startCol = startCell.cellIndex;
    const endCol = endCell.cellIndex;

    // Đảm bảo start luôn nhỏ hơn end
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);

    // Merge cells
    const rowspan = maxRow - minRow + 1;
    const colspan = maxCol - minCol + 1;

    // Lấy nội dung từ tất cả cells
    let content = '';
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const cell = this.selectedTable.rows[r].cells[c];
        if (cell) {
          content += cell.innerHTML;
        }
      }
    }

    // Xóa các cells cũ
    for (let r = maxRow; r >= minRow; r--) {
      for (let c = maxCol; c >= minCol; c--) {
        if (r === minRow && c === minCol) continue;
        const cell = this.selectedTable.rows[r].cells[c];
        if (cell) cell.remove();
      }
    }

    // Cập nhật cell đầu tiên
    const firstCell = this.selectedTable.rows[minRow].cells[minCol];
    firstCell.rowSpan = rowspan;
    firstCell.colSpan = colspan;
    firstCell.innerHTML = content;
  }

  splitTableCells() {
    if (!this.selectedCell) return;
    const rowspan = this.selectedCell.rowSpan || 1;
    const colspan = this.selectedCell.colSpan || 1;

    if (rowspan === 1 && colspan === 1) return;

    const row = this.selectedCell.parentElement;
    const cellIndex = this.selectedCell.cellIndex;
    const content = this.selectedCell.innerHTML;

    // Xóa cell cũ
    this.selectedCell.remove();

    // Tạo các cells mới
    for (let r = 0; r < rowspan; r++) {
      for (let c = 0; c < colspan; c++) {
        const newCell = document.createElement(this.selectedCell.tagName);
        newCell.innerHTML = r === 0 && c === 0 ? content : '&nbsp;';
        if (r === 0) {
          row.insertBefore(newCell, row.cells[cellIndex + c] || null);
        } else {
          const newRow = row.cloneNode(true);
          newRow.innerHTML = '';
          newRow.appendChild(newCell);
          row.parentElement.insertBefore(newRow, row.nextSibling);
        }
      }
    }
  }

  deleteTable() {
    if (this.selectedTable) {
      this.selectedTable.remove();
      this.tableToolbar.style.display = 'none';
      this.selectedTable = null;
      this.selectedCell = null;
    }
  }

  bindEvents() {
    this.editor.addEventListener('input', () => {
      this.updateStatusbar();
      this.updateIndentButtonState(); // Update indent button state when content changes
      this.updateHeadingSelector(); // Update heading selector when content changes
      this.updateFontSizeDisplay(); // Update font size display when content changes
      this.updateLineHeightDisplay(); // Update line height display when content changes
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
    function checkCaretPosition() {
      const selection = window.getSelection();
      if (!selection.rangeCount) {
        console.log("Không có con trỏ nào được chọn.");
        return;
      }

      const range = selection.getRangeAt(0);
      const container = range.startContainer;

      // Tìm thẻ chứa con trỏ (thường là node cha chứa text)
      let parentElement = container.nodeType === 1 ? container : container.parentElement;

      // Tìm phần tử cha gần nhất là thẻ p, h1-h6, pre, blockquote
      const validTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE', 'BLOCKQUOTE'];
      while (parentElement && !validTags.includes(parentElement.tagName)) {
        parentElement = parentElement.parentElement;
      }

      if (!parentElement) {
        console.log("Con trỏ không nằm trong các thẻ hợp lệ.");
        return;
      }

      // Tính độ dài tổng của text trong thẻ
      const totalText = parentElement.innerText;
      const caretOffset = getCaretCharacterOffsetWithin(parentElement);

      if (caretOffset === 0) {
        console.log(`Con trỏ đang ở **ĐẦU** của thẻ <${parentElement.tagName.toLowerCase()}>.`);
      } else if (caretOffset >= totalText.length) {
        console.log(`Con trỏ đang ở **CUỐI** của thẻ <${parentElement.tagName.toLowerCase()}>.`);
      } else {
        console.log(`Con trỏ đang ở **GIỮA** của thẻ <${parentElement.tagName.toLowerCase()}>.`);
      }
    }

    // Hàm phụ để lấy offset con trỏ tương đối trong element
    function getCaretCharacterOffsetWithin(element) {
      const selection = window.getSelection();
      let caretOffset = 0;

      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        caretOffset = preCaretRange.toString().length;
      }

      return caretOffset;
    }
    this.editor.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        checkCaretPosition();
        e.preventDefault();
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const node = range.startContainer;
          let block = node.nodeType === 3 ? node.parentNode : node;
          
          // Tìm thẻ block cha gần nhất (h1-h6, p, pre)
          while (block && block !== this.editor && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'PRE'].includes(block.nodeName)) {
            block = block.parentNode;
          }

          // Nếu đang ở trong text node
          if (node.nodeType === 3) {
            const text = node.textContent;
            const offset = range.startOffset;
            const tagName = block.nodeName;
            
            // Nếu là thẻ h1-h6, p, pre
            if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'PRE'].includes(tagName)) {
              // Nếu con trỏ ở cuối text
              if (offset === text.length) {
                // Tạo thẻ p mới
                const newP = document.createElement('p');
                newP.innerHTML = '<br>';
                block.parentNode.insertBefore(newP, block.nextSibling);
                
                // Đặt con trỏ vào thẻ p mới
                const newRange = document.createRange();
                newRange.setStart(newP, 0);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);
              } else {
                // Tách text thành 2 phần
                const beforeText = text.substring(0, offset);
                const afterText = text.substring(offset);
                console.log("beforeText", beforeText);
                console.log("afterText", afterText);
                // Tạo bản sao của thẻ hiện tại để giữ nguyên style và cấu trúc HTML
                function isStopTag(el) {
                  if (!el) return false;
                  const tag = el.tagName.toLowerCase();
                  return tag === 'p' || /^h[1-6]$/.test(tag) || tag === 'pre';
                }

                function getSiblings(element) {
                  let anhemtruoc = [];
                  let anhemsau = [];

                  // Lấy parent của element
                  const parent = element.parentElement;
                  if (!parent) return { anhemtruoc, anhemsau };
                  
                  // Lấy tất cả các node con của parent (bao gồm cả text node và element node)
                  const allSiblings = Array.from(parent.childNodes);
                  
                  // Tìm vị trí của element trong danh sách
                  const elementIndex = allSiblings.indexOf(element);
                  
                  if (elementIndex === -1) return { anhemtruoc, anhemsau };
                  
                  // Tất cả node trước element
                  for (let i = 0; i < elementIndex; i++) {
                    const sibling = allSiblings[i];
                    // Chỉ thêm vào nếu là element node hoặc là text node có nội dung
                    if (sibling.nodeType === 1 || (sibling.nodeType === 3 && sibling.textContent.trim() !== '')) {
                      anhemtruoc.push(sibling);
                    }
                  }
                  
                  // Tất cả node sau element
                  for (let i = elementIndex + 1; i < allSiblings.length; i++) {
                    const sibling = allSiblings[i];
                    // Chỉ thêm vào nếu là element node hoặc là text node có nội dung
                    if (sibling.nodeType === 1 || (sibling.nodeType === 3 && sibling.textContent.trim() !== '')) {
                      anhemsau.push(sibling);
                    }
                  }

                  return { anhemtruoc, anhemsau };
                }
                /**
                 * Trả về mảng các object theo thứ tự cấp cha:
                 * [
                 *   { cha: HTMLElement, anhemtruoc: [HTMLElements], anhemsau: [HTMLElements] },
                 *   { cha: HTMLElement, anhemtruoc: [...], anhemsau: [...] },
                 *   ...
                 * ]
                 */
                function getParentAndSiblingData(element) {
                  let current = element;
                  const result = [];

                  while (current && !isStopTag(current)) {
                    const parent = current.parentElement;
                    if (!parent) break;

                    const { anhemtruoc, anhemsau } = getSiblings(current);

                    result.push({
                      cha: parent,
                      anhemtruoc,
                      anhemsau,
                    });

                    current = parent;
                  }

                  return result;
                }
                function cloneWithSiblings(beforeText, afterText, data, offsetElement) {
                  if (!data.length) return { ele1: null, ele2: null };
                  
                  // Bắt đầu từ cấp thấp nhất (gần offsetElement nhất)
                  let ele1 = null;
                  let ele2 = null;

                  for (let i = data.length - 1; i >= 0; i--) {
                    const { cha, anhemtruoc, anhemsau } = data[i];

                    const chax = cha.cloneNode(false); // clone cha (không clone con)

                    const newEle1 = chax.cloneNode(false);
                    const newEle2 = chax.cloneNode(false);

                    // Thêm anh em trước vào ele1
                    anhemtruoc.forEach(el => {
                      newEle1.appendChild(el.cloneNode(true));
                    });

                    // ele1 xử lý trước, luôn thêm ele1 ở cuối (sau anh em trước)
                    if (ele1) {
                      newEle1.appendChild(ele1);
                    } else {
                      // Đây là cấp gần offsetElement nhất — xử lý trước/afterText
                      // Clone offsetElement giữ nguyên thuộc tính và style
                      const left = offsetElement.cloneNode(false);
                      
                      // Xóa tất cả nội dung hiện tại và đặt text mới
                      left.innerHTML = '';
                      left.textContent = beforeText;
                      
                      newEle1.appendChild(left);
                    }

                    // ele2 xử lý đúng thứ tự: phần tử chính trước, anh em sau đứng sau
                    if (ele2) {
                      // Nếu có ele2 từ trước, thêm vào đầu tiên
                      newEle2.appendChild(ele2);
                    } else {
                      // Trường hợp đầu tiên: thêm phần tử chứa afterText
                      // Clone offsetElement giữ nguyên thuộc tính và style
                      const right = offsetElement.cloneNode(false);
                      
                      // Xóa tất cả nội dung hiện tại và đặt text mới
                      right.innerHTML = '';
                      right.textContent = afterText;
                      
                      newEle2.appendChild(right);
                    }
                    
                    // Thêm anh em sau vào ele2 (sau phần tử chính)
                    anhemsau.forEach(el => {
                      newEle2.appendChild(el.cloneNode(true));
                    });

                    ele1 = newEle1;
                    ele2 = newEle2;
                  }
                  
                  return { ele1, ele2 };
                }
                function replaceChaxWith(ele1, ele2, data) {
                  if (!data.length || !ele1 || !ele2) return;

                  const chax = data[0].cha;
                  const parent = chax.parentElement;
                  if (!parent) return;

                  parent.insertBefore(ele1, chax);
                  parent.insertBefore(ele2, chax.nextSibling); // Sau ele1
                  parent.removeChild(chax);
                  }
                // --------- Sử dụng trong code của bạn ---------
                const sel = window.getSelection();
                if (!sel.rangeCount) return;

                const range = sel.getRangeAt(0);
                const containerNode = range.startContainer;

                const offsetElement = containerNode.nodeType === 3
                  ? containerNode.parentElement
                  : containerNode;
                
                // Kiểm tra nếu offsetElement chính là thẻ block
                const isBlockElement = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'PRE'].includes(offsetElement.nodeName);
                
                if (isBlockElement) {
                  // Trường hợp đơn giản khi offsetElement là thẻ block
                  const newBlock1 = document.createElement(offsetElement.nodeName);
                  const newBlock2 = document.createElement(offsetElement.nodeName);
                  
                  // Sao chép style và các thuộc tính khác
                  if (offsetElement.hasAttributes()) {
                    const attrs = offsetElement.attributes;
                    for (let i = 0; i < attrs.length; i++) {
                      newBlock1.setAttribute(attrs[i].name, attrs[i].value);
                      newBlock2.setAttribute(attrs[i].name, attrs[i].value);
                    }
                  }
                  
                  // Chia nội dung
                  const tempDiv1 = document.createElement('div');
                  const tempDiv2 = document.createElement('div');
                  tempDiv1.innerHTML = offsetElement.innerHTML;
                  tempDiv2.innerHTML = offsetElement.innerHTML;
                  
                  // Tìm node text cần cắt
                  const textNodes1 = [];
                  const textNodes2 = [];
                  
                  function findTextNodes(node, arr) {
                    if (node.nodeType === 3) arr.push(node);
                    else node.childNodes.forEach(child => findTextNodes(child, arr));
                  }
                  
                  findTextNodes(tempDiv1, textNodes1);
                  findTextNodes(tempDiv2, textNodes2);
                  
                  if (textNodes1.length > 0 && textNodes2.length > 0) {
                    textNodes1[0].textContent = beforeText;
                    textNodes2[0].textContent = afterText;
                    
                    newBlock1.innerHTML = tempDiv1.innerHTML;
                    newBlock2.innerHTML = tempDiv2.innerHTML;
                    
                    // Thay thế block gốc
                    offsetElement.parentNode.insertBefore(newBlock1, offsetElement);
                    offsetElement.parentNode.insertBefore(newBlock2, offsetElement.nextSibling);
                    offsetElement.remove();
                    
                    // Đặt con trỏ vào đầu block thứ hai
                    const newRange = document.createRange();
                    const firstNode = newBlock2.firstChild;
                    newRange.setStart(firstNode.nodeType === 3 ? firstNode : firstNode.firstChild, 0);
                    newRange.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(newRange);
                    return;
                  }
                }
                
                const data = getParentAndSiblingData(offsetElement);
                
                console.log(data); // Log ra kết quả trả về
                // Tạo 2 cây mới từ beforeText và afterText
                const { ele1, ele2 } = cloneWithSiblings(beforeText, afterText, data, offsetElement);
                // Bước 3: thay thế chax trong DOM
                replaceChaxWith(ele1, ele2, data);
                // Đặt con trỏ vào đầu thẻ mới
                const newRange = document.createRange();
                const newBlock = ele2;
                newRange.setStart(newBlock, 0);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);
              }
            } else {
              // Nếu không phải thẻ h1-h6, p, pre, tạo p mới
              const newP = document.createElement('p');
              newP.innerHTML = '<br>';
              block.parentNode.insertBefore(newP, block.nextSibling);
              
              // Đặt con trỏ vào thẻ p mới
              const newRange = document.createRange();
              newRange.setStart(newP, 0);
              newRange.collapse(true);
              sel.removeAllRanges();
              sel.addRange(newRange);
            }
          } else {
            // Nếu không phải text node, tạo p mới
            const newP = document.createElement('p');
            newP.innerHTML = '<br>';
            block.parentNode.insertBefore(newP, block.nextSibling);
            
            // Đặt con trỏ vào thẻ p mới
            const newRange = document.createRange();
            newRange.setStart(newP, 0);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
          }
        }
      } else if (e.key === 'Tab') {
        // Xử lý khi nhấn Tab để thụt đầu dòng
        e.preventDefault(); // Ngăn hành vi mặc định (focus sang element khác)
        
        // Sử dụng hàm applyIndentToSelection để hỗ trợ cả việc bôi đen nhiều block
        this.applyIndentToSelection();
      } else if (e.key === 'Backspace') {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const node = range.startContainer;
          
          // Nếu đang ở đầu một thẻ và có thẻ trước đó
          if (range.collapsed && range.startOffset === 0) {
            let block = node.nodeType === 3 ? node.parentNode : node;
            
            // Tìm thẻ block cha gần nhất
            while (block && block !== this.editor && !['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV'].includes(block.nodeName)) {
              block = block.parentNode;
            }
            
            // Nếu tìm thấy thẻ block và có thẻ trước đó
            if (block && block.previousElementSibling) {
              const prevBlock = block.previousElementSibling;
              
              // Nếu cả hai thẻ đều là heading
              if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(block.nodeName) && 
                  ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(prevBlock.nodeName)) {
                e.preventDefault();
                
                // Sao chép style từ thẻ hiện tại sang thẻ trước đó nếu thẻ trước đó không có style
                if (block.hasAttribute('style') && !prevBlock.hasAttribute('style')) {
                  prevBlock.setAttribute('style', block.getAttribute('style'));
                }
                
                // Lấy text từ cả hai thẻ
                const prevText = prevBlock.textContent;
                const currentText = block.textContent;
                
                // Xóa nội dung cũ
                prevBlock.textContent = '';
                block.textContent = '';
                
                // Tạo text node mới với nội dung đã hợp nhất
                const mergedText = document.createTextNode(prevText + currentText);
                prevBlock.appendChild(mergedText);
                
                // Xóa thẻ hiện tại
                block.remove();
                
                // Đặt con trỏ vào cuối thẻ trước đó
                const newRange = document.createRange();
                newRange.setStart(prevBlock.firstChild, prevBlock.firstChild.length);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);
              }
            }
          } else if (range.collapsed && node.nodeType === 3) {
            // Xử lý khi xóa text trong thẻ heading
            let block = node.parentNode;
            while (block && block !== this.editor && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(block.nodeName)) {
              block = block.parentNode;
            }
            
            if (block && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(block.nodeName)) {
              // Nếu đang xóa text trong thẻ heading, giữ nguyên thẻ và style
              const text = node.textContent;
              if (text.length > 0) {
                node.textContent = text.substring(0, range.startOffset - 1) + text.substring(range.startOffset);
              }
            }
          }
        }
      }
    });

    this.editor.addEventListener('keyup', () => this.updateStatusbar());
    this.editor.addEventListener('mouseup', () => this.updateStatusbar());
    document.addEventListener('selectionchange', () => {
      this.updateStatusbar();
      this.updateIndentDecreaseButtonVisibility(); // This will also update the increase button
      this.updateIndentButtonState(); // Update indent button state
      this.updateHeadingSelector(); // Update heading selector
      this.updateFontSizeDisplay(); // Update font size display
      this.updateLineHeightDisplay(); // Update line height display
    });

    // Lắng nghe click vào ảnh trong editor
    this.editor.addEventListener('mousedown', e => {
      if (e.target.tagName === 'IMG' && e.target.getAttribute('data-resizable') === 'true') {
        this.showImgResizeHandles(e.target);
      } else {
        this.removeImgResizeHandles();
      }
    });

    // Khi click ra ngoài editor và ngoài handle, ẩn handle
    document.addEventListener('mousedown', e => {
      if (!this.editor.contains(e.target) && !e.target.classList.contains('img-resize-handle')) {
        this.removeImgResizeHandles();
      }
    });

    // Lắng nghe click vào bảng
    this.editor.addEventListener('mousedown', e => {
      let table = e.target.closest('table');
      if (table && this.editor.contains(table)) {
        // Nếu click vào bảng hiện tại, không làm gì cả
        if (this.selectedTable === table) return;
        
        // Nếu click vào bảng khác, cập nhật selectedTable
        this.selectedTable = table;
        this.selectedCell = e.target.closest('td,th');
        
        // Hiển thị toolbar phía trên và căn giữa bảng
        const rect = table.getBoundingClientRect();
        this.tableToolbar.style.display = 'flex';
        this.tableToolbar.style.top = (window.scrollY + rect.top - this.tableToolbar.offsetHeight - 8) + 'px';
        this.tableToolbar.style.left = (window.scrollX + rect.left + rect.width/2 - this.tableToolbar.offsetWidth/2) + 'px';
        this.addTableResizeHandles(table);
      } else {
        // Ẩn toolbar nếu click ra ngoài bảng
        this.tableToolbar.style.display = 'none';
        this.selectedTable = null;
        this.selectedCell = null;
        this.removeTableResizeHandles();
      }
    });

    // Ẩn handle khi scroll hoặc resize
    window.addEventListener('scroll', () => {
      this.removeImgResizeHandles();
      this.removeTableResizeHandles();
      // Ẩn toolbar khi scroll
      if (this.tableToolbar) {
        this.tableToolbar.style.display = 'none';
      }
    });
    window.addEventListener('resize', () => {
      this.removeImgResizeHandles();
      this.removeTableResizeHandles();
      // Ẩn toolbar khi resize
      if (this.tableToolbar) {
        this.tableToolbar.style.display = 'none';
      }
    });

    // Thêm sự kiện cho block toolbar
    this.editor.addEventListener('keyup', e => {
      // if (e.key === 'Enter') {
      //   setTimeout(() => {
      //     const sel = window.getSelection();
      //     if (sel.rangeCount > 0) {
      //       const range = sel.getRangeAt(0);
      //       const node = range.startContainer;
      //       let block = node.nodeType === 3 ? node.parentNode : node;
      //       // Kiểm tra block là dòng trống: chỉ chứa <br> hoặc text rỗng
      //       let isEmptyBlock = false;
      //       if (block && (block.nodeName === 'DIV' || block.nodeName === 'P')) {
      //         if (
      //           block.textContent.trim() === '' ||
      //           (block.childNodes.length === 1 && block.childNodes[0].nodeName === 'BR')
      //         ) {
      //           isEmptyBlock = true;
      //         }
      //       }
      //       // Nếu block là editor-area và chỉ có 1 child là <br> hoặc text rỗng
      //       if (!isEmptyBlock && block === this.editor) {
      //         if (
      //           this.editor.childNodes.length === 1 &&
      //           (this.editor.firstChild.nodeName === 'BR' || this.editor.textContent.trim() === '')
      //         ) {
      //           isEmptyBlock = true;
      //         }
      //       }
      //       if (isEmptyBlock && block.offsetHeight > 0) {
      //         const rect = block.getBoundingClientRect();
      //         this.showBlockToolbar(rect);
      //       } else {
      //         this.hideBlockToolbar();
      //       }
      //     }
      //   }, 10);
      // } else {
      //   this.hideBlockToolbar();
      // }
    });
    // Ẩn toolbar khi click ra ngoài hoặc nhập nội dung
    this.editor.addEventListener('input', () => {
      const sel = window.getSelection();
      if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        let block = range.startContainer.nodeType === 3 ? range.startContainer.parentNode : range.startContainer;
        if (block && (block.nodeName === 'DIV' || block.nodeName === 'P')) {
          // Nếu block đã có nội dung, ẩn toolbar
          if (block.textContent.trim() !== '' && !(block.childNodes.length === 1 && block.childNodes[0].nodeName === 'BR')) {
            this.hideBlockToolbar();
          }
        } else {
          this.hideBlockToolbar();
        }
      } else {
        this.hideBlockToolbar();
      }
    });
    document.addEventListener('mousedown', e => {
      // Chỉ ẩn nếu click ra ngoài toolbar và ngoài editor-area
      if (
        this.blockToolbar &&
        !this.blockToolbar.contains(e.target) &&
        !this.editor.contains(e.target)
      ) {
        this.hideBlockToolbar();
      }
    });
    // Hiển thị block toolbar khi click vào dòng trống (tối ưu)
    this.editor.addEventListener('click', e => {
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        let node = sel.anchorNode;
        // Nếu là text node hoặc <br>, lấy parent
        if (node.nodeType === 3 || node.nodeName === 'BR') node = node.parentNode;
        // Tìm block cha gần nhất là DIV/P/editor-area
        let block = node;
        while (block && block !== this.editor && !['DIV', 'P'].includes(block.nodeName)) {
          block = block.parentNode;
        }
        if (!block) block = this.editor;
        // Kiểm tra dòng trống
        let isEmptyBlock = false;
        if (block === this.editor) {
          // Nếu là editor-area, kiểm tra childNodes tại vị trí selection
          if (
            this.editor.childNodes.length === 1 &&
            (this.editor.firstChild.nodeName === 'BR' || this.editor.textContent.trim() === '')
          ) {
            isEmptyBlock = true;
          }
        } else if (['DIV', 'P'].includes(block.nodeName)) {
          if (
            block.textContent.trim() === '' ||
            (block.childNodes.length === 1 && block.childNodes[0].nodeName === 'BR')
          ) {
            isEmptyBlock = true;
          }
        }
        if (isEmptyBlock && block.offsetHeight > 0) {
          const rect = block.getBoundingClientRect();
          this.showBlockToolbar(rect);
        } else {
          this.hideBlockToolbar();
        }
      }, 10);
    });

    // Hiển thị toolbar khi select text
    this.editor.addEventListener('mouseup', e => {
      const sel = window.getSelection();
      if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (!range.collapsed) { // Nếu có text được chọn
          const rect = range.getBoundingClientRect();
          // Hiển thị toolbar phía trên vùng chọn
          this.showBlockToolbar({
            left: rect.left + (rect.width / 2),
            top: rect.top - 10
          });
        } else {
          this.hideBlockToolbar();
        }
      }
    });
  }

  updateStatusbar() {
    if (!this.statusbar) return;

    const sel = window.getSelection();
    if (!sel) return;

    // Update toolbar buttons state based on current selection or cursor position
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      
      // Check text formatting
      const formatCommands = {
        'bold': 'bold',
        'italic': 'italic',
        'underline': 'underline',
        'strikeThrough': 'strikeThrough',
        'superscript': 'superscript',
        'subscript': 'subscript'
      };

      // Check block formatting
      const blockCommands = {
        'h1': 'formatBlockH1',
        'h2': 'formatBlockH2',
        'blockquote': 'formatBlockBLOCKQUOTE',
        'pre': 'formatBlockPRE'
      };

      // Check alignment
      const alignCommands = {
        'justifyLeft': 'justifyLeft',
        'justifyCenter': 'justifyCenter',
        'justifyRight': 'justifyRight',
        'justifyFull': 'justifyFull'
      };

      // Check lists
      const listCommands = {
        'insertUnorderedList': 'insertUnorderedList',
        'insertOrderedList': 'insertOrderedList'
      };

      // Reset all buttons first
      Object.values(this.toolbarBtns).forEach(btn => {
        if (btn.tagName === 'BUTTON' || btn.classList.contains('toolbar-btn')) {
          btn._setActive(false);
        }
      });

      // Get the current block element at cursor position
      const currentBlock = this.getBlockElementAtCaret();
      
      // Check text formatting
      Object.entries(formatCommands).forEach(([cmd, btnKey]) => {
        const btn = this.toolbarBtns[btnKey];
        if (btn && (btn.tagName === 'BUTTON' || btn.classList.contains('toolbar-btn'))) {
          // Check if the command is active
          const isActive = document.queryCommandState(cmd);
          
          // If we're in an empty paragraph, check if the parent has the style
          if (currentBlock && currentBlock.tagName.toLowerCase() === 'p' && !currentBlock.textContent.trim()) {
            const parentStyle = window.getComputedStyle(currentBlock);
            if (cmd === 'bold' && parentStyle.fontWeight >= 600) {
              btn._setActive(true);
            } else if (cmd === 'italic' && parentStyle.fontStyle === 'italic') {
              btn._setActive(true);
            } else if (cmd === 'underline' && parentStyle.textDecoration.includes('underline')) {
              btn._setActive(true);
            } else if (cmd === 'strikeThrough' && parentStyle.textDecoration.includes('line-through')) {
              btn._setActive(true);
            } else {
              btn._setActive(isActive);
            }
          } else {
            btn._setActive(isActive);
          }
        }
      });

      // Check block formatting
      if (currentBlock) {
        const tagName = currentBlock.tagName.toLowerCase();
        const btnKey = blockCommands[tagName];
        if (btnKey) {
          const btn = this.toolbarBtns[btnKey];
          if (btn && (btn.tagName === 'BUTTON' || btn.classList.contains('toolbar-btn'))) {
            btn._setActive(true);
          }
        }
      }

      // Check alignment
      Object.entries(alignCommands).forEach(([cmd, btnKey]) => {
        if (document.queryCommandState(cmd)) {
          const btn = this.toolbarBtns[btnKey];
          if (btn && (btn.tagName === 'BUTTON' || btn.classList.contains('toolbar-btn'))) {
            btn._setActive(true);
          }
        }
      });

      // Check lists
      Object.entries(listCommands).forEach(([cmd, btnKey]) => {
        if (document.queryCommandState(cmd)) {
          const btn = this.toolbarBtns[btnKey];
          if (btn && (btn.tagName === 'BUTTON' || btn.classList.contains('toolbar-btn'))) {
            btn._setActive(true);
          }
        }
      });

      // Update text alignment button icon based on current alignment
      const alignmentBtn = this.toolbarBtns['textAlignment'];
      if (alignmentBtn) {
        if (document.queryCommandState('justifyLeft')) {
          alignmentBtn.innerHTML = '<i class="fas fa-align-left"></i>';
        } else if (document.queryCommandState('justifyCenter')) {
          alignmentBtn.innerHTML = '<i class="fas fa-align-center"></i>';
        } else if (document.queryCommandState('justifyRight')) {
          alignmentBtn.innerHTML = '<i class="fas fa-align-right"></i>';
        } else if (document.queryCommandState('justifyFull')) {
          alignmentBtn.innerHTML = '<i class="fas fa-align-justify"></i>';
        }
      }
    }
  }

  // Thêm hàm mới để xử lý việc toggle định dạng
  toggleFormat(cmd) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    // Lưu selection hiện tại
    this.savedSelection = this.saveSelection();

    // Thực hiện command
    document.execCommand(cmd, false, null);

    // Cập nhật trạng thái active ngay lập tức
    const isActive = document.queryCommandState(cmd);
    const buttons = this.toolbar.querySelectorAll('button[data-command]');
    buttons.forEach(btn => {
      const btnCmd = btn.getAttribute('data-command');
      if (btnCmd === cmd) {
        btn._setActive(isActive);
      }
    });

    // Khôi phục selection
    this.restoreSelection(this.savedSelection);
    this.editor.focus();
  }

  // Thêm các phương thức mới
  showTooltip({ 
    title = '', 
    placeholder = '', 
    confirmText = 'OK', 
    file = false,
    emojis = false,
    showImportOptions = false,
    onSubmit, 
    onClose 
  }) {
    // Xóa tooltip cũ nếu có
    const old = document.getElementById('custom-tooltip');
    if (old) old.remove();
    const oldOverlay = document.getElementById('custom-tooltip-overlay');
    if (oldOverlay) oldOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'custom-tooltip-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = this.options.theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.08)';
    overlay.style.zIndex = 9998;
    overlay.onclick = () => { close(); };

    const tooltip = document.createElement('div');
    tooltip.id = 'custom-tooltip';
    tooltip.style.position = 'fixed';
    tooltip.style.top = '120px';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translateX(-50%)';
    tooltip.style.background = this.options.theme === 'dark' ? '#2a2a2a' : '#fff';
    tooltip.style.border = this.options.theme === 'dark' ? '1px solid #404040' : '1px solid #ccc';
    tooltip.style.borderRadius = '10px';
    tooltip.style.boxShadow = this.options.theme === 'dark' ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.18)';
    tooltip.style.padding = '20px 24px 16px 24px';
    tooltip.style.zIndex = 9999;
    tooltip.style.display = 'flex';
    tooltip.style.flexDirection = 'column';
    tooltip.style.gap = '12px';
    tooltip.style.minWidth = '320px';
    tooltip.style.maxWidth = '90vw';
    tooltip.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#333333';
    tooltip.classList.add('editor-tooltip');

    if (title) {
      const h = document.createElement('div');
      h.textContent = title;
      h.style.fontWeight = 'bold';
      h.style.fontSize = '18px';
      h.style.marginBottom = '4px';
      tooltip.appendChild(h);
    }

    // Nếu là chức năng import với nhiều lựa chọn
    let selectedFileType = 'html';
    if (showImportOptions) {
      const optionsDiv = document.createElement('div');
      optionsDiv.style.display = 'flex';
      optionsDiv.style.gap = '10px';
      optionsDiv.style.marginBottom = '12px';
      optionsDiv.style.flexWrap = 'wrap';
      
      const options = [
        { id: 'excel', label: 'Excel', icon: '<i class="fas fa-file-excel"></i>' },
        { id: 'pdf', label: 'PDF', icon: '<i class="fas fa-file-pdf"></i>' },
        { id: 'doc', label: 'Word', icon: '<i class="fas fa-file-word"></i>' }
      ];
      
      options.forEach(option => {
        const btn = document.createElement('button');
        btn.innerHTML = `${option.icon} ${option.label}`;
        btn.dataset.type = option.id;
        btn.style.padding = '8px 12px';
        btn.style.border = this.options.theme === 'dark' ? '1px solid #404040' : '1px solid #eee';
        btn.style.borderRadius = '6px';
        btn.style.background = option.id === 'excel' ? 
          (this.options.theme === 'dark' ? '#2a4a6b' : '#e0f0ff') : 
          (this.options.theme === 'dark' ? '#2a2a2a' : '#fff');
        btn.style.color = option.id === 'excel' ? 
          (this.options.theme === 'dark' ? '#66ccff' : '#1976d2') : 
          (this.options.theme === 'dark' ? '#e0e0e0' : '#333');
        btn.style.cursor = 'pointer';
        btn.style.fontSize = '14px';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.gap = '6px';
        
        btn.onclick = () => {
          // Cập nhật UI và placeholder cho loại file được chọn
          options.forEach(opt => {
            const el = optionsDiv.querySelector(`[data-type="${opt.id}"]`);
            if (el) {
              el.style.background = opt.id === option.id ? 
                (this.options.theme === 'dark' ? '#2a4a6b' : '#e0f0ff') : 
                (this.options.theme === 'dark' ? '#2a2a2a' : '#fff');
              el.style.color = opt.id === option.id ? 
                (this.options.theme === 'dark' ? '#66ccff' : '#1976d2') : 
                (this.options.theme === 'dark' ? '#e0e0e0' : '#333');
            }
          });
          
          selectedFileType = option.id;
          
          // Cập nhật placeholder và hiển thị file input
          input.placeholder = `Select ${option.label} file to import...`;
          input.style.display = 'block';
          if (fileInputWrapper) fileInputWrapper.style.display = 'block';
        };
        
        optionsDiv.appendChild(btn);
      });
      
      tooltip.appendChild(optionsDiv);
    }

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.style.padding = '10px';
    input.style.fontSize = '16px';
    input.style.border = this.options.theme === 'dark' ? '1px solid #404040' : '1px solid #ccc';
    input.style.borderRadius = '5px';
    input.style.outline = 'none';
    input.style.background = this.options.theme === 'dark' ? '#1e1e1e' : '#ffffff';
    input.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#333333';
    tooltip.appendChild(input);

    let fileInput, fileInputWrapper, fileLabel, filePreview;
    if (file || showImportOptions) {
      fileInputWrapper = document.createElement('div');
      fileInputWrapper.style.marginTop = '8px';
      
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.style.width = '100%';
      
      // Nếu là import options, thiết lập chấp nhận các loại file tương ứng
      if (showImportOptions) {
        fileInput.accept = '.html,.htm,.xlsx,.xls,.pdf,.doc,.docx';
        fileInputWrapper.style.display = 'none'; // Ẩn ban đầu nếu chọn HTML
      } else if (file) {
        fileInput.accept = 'image/*';
      }
      
      fileInputWrapper.appendChild(fileInput);
      tooltip.appendChild(fileInputWrapper);
      
      if (file) {
        filePreview = document.createElement('img');
        filePreview.style.maxWidth = '100%';
        filePreview.style.maxHeight = '120px';
        filePreview.style.marginTop = '8px';
        filePreview.style.display = 'none';
        tooltip.appendChild(filePreview);
      }
      
      fileInput.addEventListener('change', async () => {
        if (fileInput.files && fileInput.files[0]) {
          const fileName = fileInput.files[0].name;
          input.value = fileName;
          
          if (file) {
            // Hiển thị preview nếu là ảnh
            const reader = new FileReader();
            reader.onload = e => {
              filePreview.src = e.target.result;
              filePreview.style.display = 'block';
            };
            reader.readAsDataURL(fileInput.files[0]);
            // Upload demo lên imgbb
            const formData = new FormData();
            formData.append('image', fileInput.files[0]);
            // Gợi ý: Nên dùng API key riêng của bạn ở đây
            const imgbbKey = 'YOUR_IMGBB_API_KEY'; // Đăng ký miễn phí tại https://api.imgbb.com/
            input.value = 'Đang upload...';
            input.disabled = true;
            try {
              const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
                method: 'POST',
                body: formData
              });
              const data = await res.json();
              if (data && data.data && data.data.url) {
                input.value = data.data.url;
              } else {
                input.value = '';
                alert('Upload ảnh thất bại!');
              }
            } catch (err) {
              input.value = '';
              alert('Upload ảnh thất bại!', err);
            }
            input.disabled = false;
          }
        }
      });
    }

    if (emojis) {
      const emojiList = '😀 😃 😄 😁 😆 😅 😂 😊 😇 😉 😍 😘 😜 🤗 🤔 🤩 🤨 🥳 🥰 😎 😏 😤 😱 😭 😡 🤬 🥶 🥵 🤯 🥳 🥺 🙏 👍 👎 👏 🙌 💪 🤝 🧠 🦾 🦿 🦵 🦶 👀 👋'.split(' ');
      const emojiBox = document.createElement('div');
      emojiBox.style.display = 'flex';
      emojiBox.style.flexWrap = 'wrap';
      emojiBox.style.gap = '6px';
      emojiBox.style.margin = '8px 0';
      emojiList.forEach(emo => {
        const btn = document.createElement('button');
        btn.textContent = emo;
        btn.style.fontSize = '22px';
        btn.style.padding = '4px 8px';
        btn.style.border = 'none';
        btn.style.background = 'none';
        btn.style.cursor = 'pointer';
        btn.onclick = () => {
          // Khôi phục selection emoji và chèn emoji ngay lập tức
          this.restoreSelection(this.savedEmojiSelection);
          this.editor.focus();
          const sel = window.getSelection();
          if (sel.rangeCount && this.editor.contains(sel.anchorNode)) {
            sel.getRangeAt(0).insertNode(document.createTextNode(emo));
          } else {
            this.editor.appendChild(document.createTextNode(emo));
          }
          // Đóng tooltip
          overlay.remove();
          tooltip.remove();
        };
        emojiBox.appendChild(btn);
      });
      tooltip.insertBefore(emojiBox, input);
    }

    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '8px';
    btnRow.style.justifyContent = 'flex-end';

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = confirmText;
    confirmBtn.style.padding = '8px 18px';
    confirmBtn.style.background = this.options.theme === 'dark' ? '#0d7377' : '#007bff';
    confirmBtn.style.color = '#fff';
    confirmBtn.style.border = 'none';
    confirmBtn.style.borderRadius = '4px';
    confirmBtn.style.cursor = 'pointer';
    confirmBtn.style.fontWeight = 'bold';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Đóng';
    closeBtn.style.padding = '8px 18px';
    closeBtn.style.background = this.options.theme === 'dark' ? '#404040' : '#eee';
    closeBtn.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#333';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '4px';
    closeBtn.style.cursor = 'pointer';

    btnRow.appendChild(confirmBtn);
    btnRow.appendChild(closeBtn);
    tooltip.appendChild(btnRow);

    function close() {
      overlay.remove();
      tooltip.remove();
      if (onClose) onClose();
    }

    confirmBtn.onclick = () => {
      if (showImportOptions && fileInput && fileInput.files && fileInput.files[0] && selectedFileType !== 'html') {
        // Xử lý file import
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = e => {
          onSubmit(e.target.result, selectedFileType);
          close();
        };
        reader.readAsDataURL(file);
      } else if (input.value.trim() && input.value !== 'Đang upload...') {
        onSubmit(input.value.trim(), selectedFileType);
        close();
      } else {
        input.focus();
      }
    };
    closeBtn.onclick = close;

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') confirmBtn.click();
      if (e.key === 'Escape') close();
    });

    setTimeout(() => input.focus(), 10);

    document.body.appendChild(overlay);
    document.body.appendChild(tooltip);
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

  insertImageWithStyle(url) {
    const img = document.createElement('img');
    img.src = url;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';
    img.setAttribute('data-resizable', 'true');
    img.width = 300;
    img.height = 200;

    // Khôi phục selection trước khi chèn
    this.restoreSelection(this.savedSelection);
    this.editor.focus();
    const sel = window.getSelection();
    if (sel.rangeCount && this.editor.contains(sel.anchorNode)) {
      sel.getRangeAt(0).insertNode(img);
    } else {
      this.editor.appendChild(img);
    }
    setTimeout(() => {
      img.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.showImgResizeHandles(img);
    }, 10);
  }

  insertVideo(url) {
  let embedUrl = url;
  if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    if (videoId) {
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
  } else if (url.includes('vimeo.com/')) {
    const videoId = url.match(/vimeo\.com\/([0-9]+)/)?.[1];
    if (videoId) {
      embedUrl = `https://player.vimeo.com/video/${videoId}`;
    }
  }

  // Tạo iframe video
  const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.width = '560';
    iframe.height = '315';
    iframe.frameBorder = '0';
    iframe.allowFullscreen = true;
    iframe.style.maxWidth = '100%';
    iframe.style.borderRadius = '8px';
    iframe.setAttribute('data-resizable', 'true');

    // Bao khung resize
    const wrapper = document.createElement('div');
    wrapper.style.display = 'inline-block';
    wrapper.style.position = 'relative';
    wrapper.style.resize = 'both';
    wrapper.style.overflow = 'hidden';
    wrapper.style.border = '1px dashed #ccc';
    wrapper.appendChild(iframe);

    iframe.style.width = '100%';
    iframe.style.height = '100%';
    wrapper.style.width = 300;
    wrapper.style.height = 200;
    // Khôi phục selection trước khi chèn
    this.restoreSelection(this.savedSelection);
    this.editor.focus();
    const sel = window.getSelection();
    if (sel.rangeCount && this.editor.contains(sel.anchorNode)) {
      sel.getRangeAt(0).insertNode(wrapper);
    } else {
      this.editor.appendChild(wrapper);
    }
    setTimeout(() => {
      wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.showImgResizeHandles(wrapper);
    }, 10);
  }


  importContent(content, fileType = 'html') {
    try {
      // Khôi phục selection
      this.restoreSelection(this.savedSelection);
      this.editor.focus();
      const sel = window.getSelection();
      
      // Xử lý nội dung dựa trên loại file
      if (fileType === 'html') {
        // Xử lý HTML như trước
        const temp = document.createElement('div');
        temp.innerHTML = content;
        
        // Chèn nội dung
        if (sel.rangeCount && this.editor.contains(sel.anchorNode)) {
          sel.getRangeAt(0).insertNode(temp);
        } else {
          this.editor.appendChild(temp);
        }
        
        // Xóa div tạm nhưng giữ lại nội dung
        while (temp.firstChild) {
          temp.parentNode.insertBefore(temp.firstChild, temp);
        }
        temp.remove();
      } 
      else if (fileType === 'excel') {
        this.importExcelFile(content);
      }
      else if (fileType === 'pdf') {
        this.importPdfFile(content);
      }
      else if (fileType === 'doc') {
        this.importDocFile(content);
      }
    } catch (error) {
      console.error('Error importing content:', error);
      alert(`Failed to import ${fileType} content. Please check if the file is valid.`);
    }
  }
  
  importExcelFile(content) {
    try {
      // Trích xuất dữ liệu từ file Excel
      // Lưu ý: Hàm này giả định file được đọc thành base64 data URL
      this.parseExcelToTable(content, (tableHTML) => {
        // Chèn HTML table vào editor
        const sel = window.getSelection();
        if (sel.rangeCount && this.editor.contains(sel.anchorNode)) {
          // Tạo wrapper để bọc table
          const wrapper = document.createElement('div');
          wrapper.className = 'excel-table-wrapper';
          wrapper.style.margin = '10px 0';
          wrapper.style.maxWidth = '100%';
          wrapper.style.overflowX = 'auto';
          
          // Header với icon Excel
          const header = document.createElement('div');
          header.innerHTML = '<i class="fas fa-file-excel" style="color: #1D6F42; margin-right: 8px;"></i> Excel Data';
          header.style.fontWeight = 'bold';
          header.style.marginBottom = '8px';
          header.style.display = 'flex';
          header.style.alignItems = 'center';
          wrapper.appendChild(header);
          
          // Thêm table vào wrapper
          wrapper.innerHTML += tableHTML;
          
          // Làm đẹp table
          const tables = wrapper.querySelectorAll('table');
          tables.forEach(table => {
            table.style.borderCollapse = 'collapse';
            table.style.width = '100%';
            table.style.maxWidth = '100%';
            table.style.border = '1px solid #ddd';
            
            const cells = table.querySelectorAll('th, td');
            cells.forEach(cell => {
              cell.style.border = '1px solid #ddd';
              cell.style.padding = '8px';
              cell.style.textAlign = 'left';
            });
            
            const headerCells = table.querySelectorAll('thead th');
            headerCells.forEach(th => {
              th.style.backgroundColor = '#f2f2f2';
              th.style.position = 'sticky';
              th.style.top = '0';
            });
            
            // Thêm style cho dòng chẵn/lẻ
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach((row, index) => {
              if (index % 2 === 0) {
                row.style.backgroundColor = '#f9f9f9';
              }
            });
          });
          
          // Chèn vào editor
          sel.getRangeAt(0).insertNode(wrapper);
        } else {
          this.editor.appendChild(document.createTextNode(tableHTML));
        }
      });
    } catch (error) {
      console.error('Error importing Excel:', error);
      
      // Fallback nếu không thể xử lý file Excel
      const excelContainer = document.createElement('div');
      excelContainer.className = 'excel-import-container';
      excelContainer.style.border = '1px solid #ccc';
      excelContainer.style.borderRadius = '4px';
      excelContainer.style.padding = '10px';
      excelContainer.style.margin = '10px 0';
      excelContainer.style.background = '#f9f9f9';
      
      // Header với icon Excel
      const header = document.createElement('div');
      header.innerHTML = '<i class="fas fa-file-excel" style="color: #1D6F42; margin-right: 8px;"></i> Excel File';
      header.style.fontWeight = 'bold';
      header.style.marginBottom = '8px';
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      excelContainer.appendChild(header);
      
      // Thông báo lỗi
      const info = document.createElement('p');
      info.textContent = 'Could not parse Excel data. Please check if the file is valid.';
      info.style.margin = '0';
      info.style.color = '#dc3545';
      excelContainer.appendChild(info);
      
      // Chèn vào editor
      const sel = window.getSelection();
      if (sel.rangeCount && this.editor.contains(sel.anchorNode)) {
        sel.getRangeAt(0).insertNode(excelContainer);
      } else {
        this.editor.appendChild(excelContainer);
      }
    }
  }
  
  parseExcelToTable(base64Data, callback) {
    // Hàm này xử lý file Excel và chuyển đổi thành HTML table
    // Lưu ý: Cần thêm SheetJS/xlsx library vào trang
    // <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    
    // Kiểm tra nếu XLSX đã được tải
    if (typeof XLSX === 'undefined') {
      // Nếu chưa có XLSX, thêm script
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.onload = () => {
        // Sau khi tải xong, xử lý file
        this.processExcelFile(base64Data, callback);
      };
      script.onerror = () => {
        console.error('Failed to load XLSX library');
        callback('<p>Failed to load Excel processing library. Please add SheetJS/xlsx to your project.</p>');
      };
      document.head.appendChild(script);
    } else {
      // Nếu XLSX đã có sẵn, xử lý file ngay
      this.processExcelFile(base64Data, callback);
    }
  }
  
  processExcelFile(base64Data, callback) {
    try {
      // Chuyển đổi base64 data URL thành binary string
      const base64 = base64Data.split(',')[1];
      const binaryString = window.atob(base64);
      
      // Chuyển binary string thành array buffer
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Đọc file Excel
      const workbook = XLSX.read(bytes, { type: 'array' });
      
      // Lấy sheet đầu tiên
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Chuyển đổi thành HTML table
      const tableHTML = XLSX.utils.sheet_to_html(worksheet, { 
        editable: false,
        header: `<div style="margin-bottom: 8px; font-style: italic; color: #666;">Sheet: ${firstSheetName}</div>`
      });
      
      // Tạo tabs nếu có nhiều sheet
      if (workbook.SheetNames.length > 1) {
        let tabsHTML = '<div class="excel-tabs" style="display: flex; gap: 4px; margin-bottom: 10px; overflow-x: auto;">';
        workbook.SheetNames.forEach((sheetName, index) => {
          const isActive = index === 0;
          tabsHTML += `
            <button 
              data-sheet="${sheetName}" 
              style="
                padding: 6px 12px; 
                border: 1px solid #ccc; 
                border-radius: 4px 4px 0 0;
                background: ${isActive ? '#e0f0ff' : '#f5f5f5'}; 
                color: ${isActive ? '#1976d2' : '#333'}; 
                cursor: pointer;
                font-size: 12px;
                border-bottom: ${isActive ? '2px solid #1976d2' : '1px solid #ccc'};
                margin-bottom: ${isActive ? '-1px' : '0'};
              "
            >${sheetName}</button>
          `;
        });
        tabsHTML += '</div>';
        
        // Thêm tabs vào đầu HTML
        const finalHTML = tabsHTML + tableHTML;
        callback(finalHTML);
      } else {
        callback(tableHTML);
      }
    } catch (error) {
      console.error('Error processing Excel file:', error);
      callback('<p>Error processing Excel file. Please check if the file is valid.</p>');
    }
  }
  
  importPdfFile(content) {
    try {
      // Tải PDF.js nếu chưa có
      this.loadPdfJs(() => {
        this.renderPdfAsHtml(content);
      });
    } catch (error) {
      console.error('Error importing PDF:', error);
      this.showPdfErrorMessage();
    }
  }
  
  loadPdfJs(callback) {
    // Kiểm tra nếu PDF.js đã được tải
    if (typeof pdfjsLib === 'undefined') {
      // Tải thư viện PDF.js
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        // Cần tải worker sau khi tải thư viện chính
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        callback();
      };
      script.onerror = () => {
        console.error('Failed to load PDF.js library');
        this.showPdfErrorMessage();
      };
      document.head.appendChild(script);
    } else {
      callback();
    }
  }
  
  renderPdfAsHtml(base64Data) {
    try {
      // Trích xuất dữ liệu từ base64 Data URL
      const base64 = base64Data.split(',')[1];
      const binary = atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      // Tạo container để hiển thị PDF
      const pdfContainer = document.createElement('div');
      pdfContainer.className = 'pdf-import-container';
      pdfContainer.style.border = '1px solid #ccc';
      pdfContainer.style.borderRadius = '4px';
      pdfContainer.style.padding = '10px';
      pdfContainer.style.margin = '10px 0';
      pdfContainer.style.background = '#f9f9f9';
      
      // Header với icon PDF
      const header = document.createElement('div');
      header.innerHTML = '<i class="fas fa-file-pdf" style="color: #F40F02; margin-right: 8px;"></i> PDF Document';
      header.style.fontWeight = 'bold';
      header.style.marginBottom = '8px';
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      pdfContainer.appendChild(header);
      
      // Tạo container cho các trang PDF
      const pagesContainer = document.createElement('div');
      pagesContainer.className = 'pdf-pages';
      pagesContainer.style.maxWidth = '100%';
      pagesContainer.style.overflow = 'hidden';
      pdfContainer.appendChild(pagesContainer);
      
      // Thêm nút "Xem chi tiết"
      const expandBtn = document.createElement('button');
      expandBtn.textContent = 'Expand PDF';
      expandBtn.style.marginTop = '8px';
      expandBtn.style.padding = '4px 10px';
      expandBtn.style.background = '#F40F02';
      expandBtn.style.color = 'white';
      expandBtn.style.border = 'none';
      expandBtn.style.borderRadius = '4px';
      expandBtn.style.cursor = 'pointer';
      
      let expanded = false;
      expandBtn.onclick = () => {
        expanded = !expanded;
        pagesContainer.style.maxHeight = expanded ? 'none' : '300px';
        expandBtn.textContent = expanded ? 'Collapse PDF' : 'Expand PDF';
      };
      pdfContainer.appendChild(expandBtn);
      
      // Chèn container vào editor
      const sel = window.getSelection();
      if (sel.rangeCount && this.editor.contains(sel.anchorNode)) {
        sel.getRangeAt(0).insertNode(pdfContainer);
      } else {
        this.editor.appendChild(pdfContainer);
      }
      
      // Tải PDF với PDF.js
      pdfjsLib.getDocument(bytes).promise.then(pdf => {
        const numPages = pdf.numPages;
        
        // Giới hạn số trang hiển thị
        const pagesToRender = Math.min(numPages, 5);
        pagesContainer.innerHTML = `<div style="margin-bottom: 8px; color: #666;">Total pages: ${numPages}</div>`;
        
        // Hiển thị thông báo nếu có nhiều trang
        if (numPages > 5) {
          const notice = document.createElement('div');
          notice.textContent = `Showing first 5 out of ${numPages} pages`;
          notice.style.margin = '5px 0';
          notice.style.fontSize = '12px';
          notice.style.color = '#666';
          pagesContainer.appendChild(notice);
        }
        
        // Tạo container cho trang
        const pageContainer = document.createElement('div');
        pageContainer.style.display = 'flex';
        pageContainer.style.flexDirection = 'column';
        pageContainer.style.gap = '10px';
        pageContainer.style.maxHeight = '300px';
        pageContainer.style.overflowY = 'auto';
        pagesContainer.appendChild(pageContainer);
        
        // Render từng trang
        for (let i = 1; i <= pagesToRender; i++) {
          pdf.getPage(i).then(page => {
            const scale = 1.5;
            const viewport = page.getViewport({ scale });
            
            // Tạo canvas cho trang
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.style.maxWidth = '100%';
            canvas.style.height = 'auto';
            canvas.style.border = '1px solid #ddd';
            canvas.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            
            // Thêm label trang
            const pageWrapper = document.createElement('div');
            pageWrapper.style.position = 'relative';
            const pageLabel = document.createElement('div');
            pageLabel.textContent = `Page ${i}`;
            pageLabel.style.position = 'absolute';
            pageLabel.style.top = '5px';
            pageLabel.style.right = '5px';
            pageLabel.style.background = 'rgba(255,255,255,0.8)';
            pageLabel.style.padding = '2px 6px';
            pageLabel.style.borderRadius = '3px';
            pageLabel.style.fontSize = '12px';
            pageWrapper.appendChild(canvas);
            pageWrapper.appendChild(pageLabel);
            pageContainer.appendChild(pageWrapper);
            
            // Render trang vào canvas
            const renderContext = {
              canvasContext: context,
              viewport: viewport
            };
            page.render(renderContext);
            
            // Thêm text layer (chỉ hiển thị, không sao chép được)
            page.getTextContent().then(textContent => {
              const textLayer = document.createElement('div');
              textLayer.style.position = 'absolute';
              textLayer.style.left = '0';
              textLayer.style.top = '0';
              textLayer.style.right = '0';
              textLayer.style.bottom = '0';
              textLayer.style.overflow = 'hidden';
              textLayer.style.color = 'transparent';
              textLayer.style.pointerEvents = 'none';
              pageWrapper.appendChild(textLayer);
              
              pdfjsLib.renderTextLayer({
                textContent: textContent,
                container: textLayer,
                viewport: viewport,
                textDivs: []
              });
            });
          });
        }
      }).catch(error => {
        console.error('Error rendering PDF:', error);
        pagesContainer.innerHTML = '<p style="color: #dc3545;">Error rendering PDF. The file may be corrupted or password protected.</p>';
      });
      
    } catch (error) {
      console.error('Error processing PDF:', error);
      this.showPdfErrorMessage();
    }
  }
  
  showPdfErrorMessage() {
    const pdfContainer = document.createElement('div');
    pdfContainer.className = 'pdf-import-container';
    pdfContainer.style.border = '1px solid #ccc';
    pdfContainer.style.borderRadius = '4px';
    pdfContainer.style.padding = '10px';
    pdfContainer.style.margin = '10px 0';
    pdfContainer.style.background = '#f9f9f9';
    
    // Header với icon PDF
    const header = document.createElement('div');
    header.innerHTML = '<i class="fas fa-file-pdf" style="color: #F40F02; margin-right: 8px;"></i> PDF File';
    header.style.fontWeight = 'bold';
    header.style.marginBottom = '8px';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    pdfContainer.appendChild(header);
    
    // Thông báo lỗi
    const info = document.createElement('p');
    info.textContent = 'Could not render PDF. Please check if the file is valid and not password protected.';
    info.style.margin = '0';
    info.style.color = '#dc3545';
    pdfContainer.appendChild(info);
    
    // Chèn vào editor
    const sel = window.getSelection();
    if (sel.rangeCount && this.editor.contains(sel.anchorNode)) {
      sel.getRangeAt(0).insertNode(pdfContainer);
    } else {
      this.editor.appendChild(pdfContainer);
    }
  }
  
  importDocFile(content) {
    try {
      // Tải mammoth.js nếu chưa có
      this.loadMammoth(() => {
        this.convertDocToHtml(content);
      });
    } catch (error) {
      console.error('Error importing Word document:', error);
      this.showDocErrorMessage();
    }
  }
  
  loadMammoth(callback) {
    // Kiểm tra nếu mammoth.js đã được tải
    if (typeof mammoth === 'undefined') {
      // Tải thư viện mammoth.js
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
      script.onload = callback;
      script.onerror = () => {
        console.error('Failed to load mammoth.js library');
        this.showDocErrorMessage();
      };
      document.head.appendChild(script);
    } else {
      callback();
    }
  }
  
  convertDocToHtml(base64Data) {
    try {
      // Trích xuất dữ liệu từ base64 Data URL
      const base64 = base64Data.split(',')[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      // Chuyển đổi DOCX sang HTML bằng mammoth.js
      mammoth.convertToHtml({ arrayBuffer: bytes.buffer })
        .then(result => {
          const html = result.value;
          const warnings = result.messages;
          
          if (warnings.length > 0) {
            console.warn('Warnings when converting Word document:', warnings);
          }
          
          // Tạo container cho nội dung Word
          const docContainer = document.createElement('div');
          docContainer.className = 'doc-import-container';
          docContainer.style.border = '1px solid #ccc';
          docContainer.style.borderRadius = '4px';
          docContainer.style.padding = '15px';
          docContainer.style.margin = '10px 0';
          docContainer.style.background = '#fff';
          
          // Header với icon Word
          const header = document.createElement('div');
          header.innerHTML = '<i class="fas fa-file-word" style="color: #2B579A; margin-right: 8px;"></i> Word Document';
          header.style.fontWeight = 'bold';
          header.style.marginBottom = '12px';
          header.style.display = 'flex';
          header.style.alignItems = 'center';
          
          // Container cho nội dung HTML
          const contentContainer = document.createElement('div');
          contentContainer.className = 'doc-content';
          contentContainer.innerHTML = html;
          
          // Áp dụng style cho nội dung
          contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
            heading.style.marginTop = '1em';
            heading.style.marginBottom = '0.5em';
            heading.style.color = '#333';
          });
          
          contentContainer.querySelectorAll('p').forEach(p => {
            p.style.marginBottom = '0.8em';
            p.style.lineHeight = '1.6';
          });
          
          contentContainer.querySelectorAll('ul, ol').forEach(list => {
            list.style.marginBottom = '1em';
            list.style.paddingLeft = '2em';
          });
          
          contentContainer.querySelectorAll('li').forEach(item => {
            item.style.marginBottom = '0.5em';
          });
          
          contentContainer.querySelectorAll('table').forEach(table => {
            table.style.borderCollapse = 'collapse';
            table.style.width = '100%';
            table.style.marginBottom = '1em';
            
            // Style cho các cell trong bảng
            table.querySelectorAll('td, th').forEach(cell => {
              cell.style.border = '1px solid #ddd';
              cell.style.padding = '8px';
            });
            
            // Style cho header bảng
            table.querySelectorAll('th').forEach(th => {
              th.style.backgroundColor = '#f2f2f2';
              th.style.fontWeight = 'bold';
            });
          });
          
          // Thêm các phần tử vào container
          docContainer.appendChild(header);
          docContainer.appendChild(contentContainer);
          
          // Chèn vào editor
          const sel = window.getSelection();
          if (sel.rangeCount && this.editor.contains(sel.anchorNode)) {
            sel.getRangeAt(0).insertNode(docContainer);
          } else {
            this.editor.appendChild(docContainer);
          }
        })
        .catch(error => {
          console.error('Error converting Word document:', error);
          this.showDocErrorMessage();
        });
    } catch (error) {
      console.error('Error processing Word document:', error);
      this.showDocErrorMessage();
    }
  }
  
  showDocErrorMessage() {
    const docContainer = document.createElement('div');
    docContainer.className = 'doc-import-container';
    docContainer.style.border = '1px solid #ccc';
    docContainer.style.borderRadius = '4px';
    docContainer.style.padding = '10px';
    docContainer.style.margin = '10px 0';
    docContainer.style.background = '#f9f9f9';
    
    // Header với icon Word
    const header = document.createElement('div');
    header.innerHTML = '<i class="fas fa-file-word" style="color: #2B579A; margin-right: 8px;"></i> Word Document';
    header.style.fontWeight = 'bold';
    header.style.marginBottom = '8px';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    docContainer.appendChild(header);
    
    // Thông báo lỗi
    const info = document.createElement('p');
    info.textContent = 'Could not import Word document. Please check if the file is a valid .docx file.';
    info.style.margin = '0';
    info.style.color = '#dc3545';
    docContainer.appendChild(info);
    
    // Chèn vào editor
    const sel = window.getSelection();
    if (sel.rangeCount && this.editor.contains(sel.anchorNode)) {
      sel.getRangeAt(0).insertNode(docContainer);
    } else {
      this.editor.appendChild(docContainer);
    }
  }

  showImgResizeHandles(img) {
    this.removeImgResizeHandles();
    this.currentImg = img;
    this.imgAspect = img.naturalWidth / img.naturalHeight;
    // Tính vị trí ảnh trên trang
    const rect = img.getBoundingClientRect();
    const scrollY = window.scrollY, scrollX = window.scrollX;
    this.imgHandles = ['tl', 'tr', 'bl', 'br'].map(pos => {
      const div = document.createElement('div');
      div.className = 'img-resize-handle ' + pos;
      div.style.position = 'absolute';
      div.style.width = '14px';
      div.style.height = '14px';
      div.style.background = '#007bff';
      div.style.border = '2px solid #fff';
      div.style.borderRadius = '50%';
      div.style.zIndex = 20;
      div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
      div.style.cursor =
        pos === 'tl' ? 'nwse-resize' :
        pos === 'tr' ? 'nesw-resize' :
        pos === 'bl' ? 'nesw-resize' :
        'nwse-resize';
      document.body.appendChild(div);
      return div;
    });
    this.positionImgHandles();
    img.style.outline = '2px solid #007bff';
    window.addEventListener('scroll', this.positionImgHandles.bind(this));
    window.addEventListener('resize', this.positionImgHandles.bind(this));
    this.imgHandles.forEach((handle, idx) => {
      handle.addEventListener('mousedown', e => {
        e.preventDefault();
        e.stopPropagation();
        this.startResizeImgHandle(e, idx);
      });
    });
  }

  positionImgHandles() {
    if (!this.currentImg || this.imgHandles.length !== 4) return;
    const rect = this.currentImg.getBoundingClientRect();
    const scrollY = window.scrollY, scrollX = window.scrollX;
    // tl
    this.imgHandles[0].style.top = (rect.top + scrollY - 7) + 'px';
    this.imgHandles[0].style.left = (rect.left + scrollX - 7) + 'px';
    // tr
    this.imgHandles[1].style.top = (rect.top + scrollY - 7) + 'px';
    this.imgHandles[1].style.left = (rect.right + scrollX - 7) + 'px';
    // bl
    this.imgHandles[2].style.top = (rect.bottom + scrollY - 7) + 'px';
    this.imgHandles[2].style.left = (rect.left + scrollX - 7) + 'px';
    // br
    this.imgHandles[3].style.top = (rect.bottom + scrollY - 7) + 'px';
    this.imgHandles[3].style.left = (rect.right + scrollX - 7) + 'px';
  }

  removeImgResizeHandles() {
    if (this.currentImg) this.currentImg.style.outline = '';
    if (this.imgHandles) {
      this.imgHandles.forEach(h => h.remove());
      this.imgHandles = [];
    }
    window.removeEventListener('scroll', this.positionImgHandles.bind(this));
    window.removeEventListener('resize', this.positionImgHandles.bind(this));
    this.currentImg = null;
  }

  startResizeImgHandle(e, which) {
    e.preventDefault();
    this.imgResizing = true;
    this.imgWhich = which;
    this.imgStartX = e.clientX;
    this.imgStartY = e.clientY;
    this.imgStartW = this.currentImg.width;
    this.imgStartH = this.currentImg.height || (this.currentImg.width / this.imgAspect);
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', this.resizingImgHandle.bind(this));
    document.addEventListener('mouseup', this.stopResizeImgHandle.bind(this));
  }

  resizingImgHandle(e) {
    if (!this.imgResizing || !this.currentImg) return;
    let dx = e.clientX - this.imgStartX;
    let dy = e.clientY - this.imgStartY;
    let newW = this.imgStartW, newH = this.imgStartH;
    if (this.imgWhich === 3) { // br
      newW = this.imgStartW + dx;
      newH = this.imgStartH + dy;
    } else if (this.imgWhich === 2) { // bl
      newW = this.imgStartW - dx;
      newH = this.imgStartH + dy;
    } else if (this.imgWhich === 1) { // tr
      newW = this.imgStartW + dx;
      newH = this.imgStartH - dy;
    } else if (this.imgWhich === 0) { // tl
      newW = this.imgStartW - dx;
      newH = this.imgStartH - dy;
    }
    // Giữ tỷ lệ gốc khi kéo chéo
    if (e.shiftKey) {
      const ratio = this.imgAspect;
      if (Math.abs(dx) > Math.abs(dy)) {
        newH = newW / ratio;
      } else {
        newW = newH * ratio;
      }
    }
    if (newW > 40) this.currentImg.width = newW;
    if (newH > 40) this.currentImg.height = newH;
    this.positionImgHandles();
  }

  stopResizeImgHandle() {
    this.imgResizing = false;
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', this.resizingImgHandle.bind(this));
    document.removeEventListener('mouseup', this.stopResizeImgHandle.bind(this));
  }

  addTableResizeHandles(table) {
    this.removeTableResizeHandles();
    const rect = table.getBoundingClientRect();
    const handles = ['tl', 'tr', 'bl', 'br'].map(pos => {
      const div = document.createElement('div');
      div.className = 'table-resize-handle ' + pos;
      document.body.appendChild(div);
      return div;
    });
    this.positionTableHandles(table, handles);

    window.addEventListener('scroll', () => this.positionTableHandles(table, handles));
    window.addEventListener('resize', () => this.positionTableHandles(table, handles));

    // Resize logic
    let resizing = false, startX, startY, startW, startH, which;
    handles.forEach((handle, idx) => {
      handle.addEventListener('mousedown', e => {
        e.preventDefault();
        resizing = true;
        which = idx;
        startX = e.clientX;
        startY = e.clientY;
        startW = table.offsetWidth;
        startH = table.offsetHeight;
        document.body.style.userSelect = 'none';
      });
    });

    const onMove = e => {
      if (!resizing) return;
      let dx = e.clientX - startX;
      let dy = e.clientY - startY;
      let newW = startW, newH = startH;
      if (which === 3) { // br
        newW = startW + dx;
        newH = startH + dy;
      } else if (which === 2) { // bl
        newW = startW - dx;
        newH = startH + dy;
      } else if (which === 1) { // tr
        newW = startW + dx;
        newH = startH - dy;
      } else if (which === 0) { // tl
        newW = startW - dx;
        newH = startH - dy;
      }
      if (newW > 60) table.style.width = newW + 'px';
      if (newH > 40) table.style.height = newH + 'px';
      this.positionTableHandles(table, handles);
    };

    const onUp = () => {
      if (resizing) {
        resizing = false;
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);

    // Lưu lại để xóa khi cần
    table._resizeHandles = handles;
    table._resizePositionHandles = () => this.positionTableHandles(table, handles);
  }

  positionTableHandles(table, handles) {
    const rect = table.getBoundingClientRect();
    const scrollY = window.scrollY, scrollX = window.scrollX;
    handles[0].style.top = (rect.top + scrollY - 7) + 'px'; // tl
    handles[0].style.left = (rect.left + scrollX - 7) + 'px';
    handles[1].style.top = (rect.top + scrollY - 7) + 'px'; // tr
    handles[1].style.left = (rect.right + scrollX - 7) + 'px';
    handles[2].style.top = (rect.bottom + scrollY - 7) + 'px'; // bl
    handles[2].style.left = (rect.left + scrollX - 7) + 'px';
    handles[3].style.top = (rect.bottom + scrollY - 7) + 'px'; // br
    handles[3].style.left = (rect.right + scrollX - 7) + 'px';
  }

  removeTableResizeHandles() {
    document.querySelectorAll('.table-resize-handle').forEach(h => h.remove());
  }

  toggleSourceView() {
    const isSourceView = this.editor.getAttribute('contenteditable') === 'false';
    
    if (isSourceView) {
      // Chuyển từ source view sang editor view
      this.editor.innerHTML = this.sourceTextarea.value;
      this.editor.setAttribute('contenteditable', 'true');
      this.sourceTextarea.remove();
      this.toolbarBtns.viewSource.innerHTML = '<i class="fas fa-code"></i>';
      this.toolbarBtns.viewSource.title = 'View Source';
    } else {
      // Chuyển từ editor view sang source view
      this.sourceTextarea = document.createElement('textarea');
      this.sourceTextarea.value = this.editor.innerHTML;
      this.sourceTextarea.style.flex = '1';
      this.sourceTextarea.style.minHeight = '200px';
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
      this.toolbarBtns.viewSource.innerHTML = '<i class="fas fa-edit"></i>';
      this.toolbarBtns.viewSource.title = 'Edit';
    }
  }

  showColorPicker(btn, type) {
    // Nếu đã có color picker thì remove
    if (this.colorPicker) {
      this.colorPicker.remove();
      this.colorPicker = null;
    }
    // Danh sách màu phổ biến
    const palette = [
      '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
      '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff',
      '#ff33cc', '#ff6600', '#ffcc00', '#33cc33', '#3366ff', '#6600cc',
      '#ff99cc', '#ffcc99', '#ffff99', '#ccffcc', '#ccffff', '#99ccff'
    ];
    // Tạo popup palette
    const paletteDiv = document.createElement('div');
    paletteDiv.style.position = 'absolute';
    paletteDiv.style.zIndex = 1000;
    paletteDiv.style.left = (btn.getBoundingClientRect().left + window.scrollX) + 'px';
    paletteDiv.style.top = (btn.getBoundingClientRect().bottom + window.scrollY + 4) + 'px';
    paletteDiv.style.background = '#fff';
    paletteDiv.style.border = '1px solid #ccc';
    paletteDiv.style.borderRadius = '8px';
    paletteDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
    paletteDiv.style.padding = '8px 10px 6px 10px';
    paletteDiv.style.display = 'flex';
    paletteDiv.style.flexWrap = 'wrap';
    paletteDiv.style.gap = '6px';
    paletteDiv.style.width = '220px';

    palette.forEach(color => {
      const colorBtn = document.createElement('button');
      colorBtn.style.width = '22px';
      colorBtn.style.height = '22px';
      colorBtn.style.border = '1.5px solid #eee';
      colorBtn.style.borderRadius = '4px';
      colorBtn.style.background = color;
      colorBtn.style.cursor = 'pointer';
      colorBtn.style.outline = 'none';
      colorBtn.style.transition = 'box-shadow 0.15s';
      colorBtn.title = color;
      colorBtn.onclick = e => {
        e.preventDefault();
        this.restoreSelection && this.restoreSelection(this.savedColorSelection);
        if (type === 'textColor') {
          document.execCommand('foreColor', false, color);
        } else {
          document.execCommand('hiliteColor', false, color);
        }
        paletteDiv.remove();
        this.colorPicker = null;
      };
      colorBtn.onmouseover = () => {
        colorBtn.style.boxShadow = '0 0 0 2px #007bff44';
      };
      colorBtn.onmouseout = () => {
        colorBtn.style.boxShadow = 'none';
      };
      paletteDiv.appendChild(colorBtn);
    });

    // Nút custom
    const customBtn = document.createElement('button');
    customBtn.textContent = 'Custom';
    customBtn.style.marginTop = '8px';
    customBtn.style.width = '100%';
    customBtn.style.padding = '4px 0';
    customBtn.style.border = '1px solid #eee';
    customBtn.style.borderRadius = '4px';
    customBtn.style.background = '#f4f6fa';
    customBtn.style.color = '#1976d2';
    customBtn.style.fontWeight = 'bold';
    customBtn.style.cursor = 'pointer';
    customBtn.onclick = e => {
      e.preventDefault();
      paletteDiv.remove();
      // Hiện input color picker như cũ
      const input = document.createElement('input');
      input.type = 'color';
      input.style.position = 'absolute';
      input.style.zIndex = 1000;
      input.style.left = (btn.getBoundingClientRect().left + window.scrollX) + 'px';
      input.style.top = (btn.getBoundingClientRect().bottom + window.scrollY + 4) + 'px';
      input.style.width = '32px';
      input.style.height = '32px';
      input.style.border = 'none';
      input.style.padding = '0';
      input.style.background = 'transparent';
      input.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
      input.onchange = (e) => {
        const color = e.target.value;
        this.restoreSelection && this.restoreSelection(this.savedColorSelection);
        if (type === 'textColor') {
          document.execCommand('foreColor', false, color);
        } else {
          document.execCommand('hiliteColor', false, color);
        }
        input.remove();
        this.colorPicker = null;
      };
      input.onblur = () => {
        input.remove();
        this.colorPicker = null;
      };
      document.body.appendChild(input);
      input.focus();
      this.colorPicker = input;
      this.savedColorSelection = this.saveSelection();
    };
    paletteDiv.appendChild(customBtn);

    document.body.appendChild(paletteDiv);
    this.colorPicker = paletteDiv;
    // Lưu selection để áp dụng màu đúng vùng chọn
    this.savedColorSelection = this.saveSelection();
    // Đóng palette khi click ra ngoài
    setTimeout(() => {
      const closePalette = (e) => {
        if (!paletteDiv.contains(e.target) && e.target !== btn) {
          paletteDiv.remove();
          this.colorPicker = null;
          document.removeEventListener('mousedown', closePalette);
        }
      };
      document.addEventListener('mousedown', closePalette);
    }, 10);
  }

  createBlockToolbar() {
    // Tạo block toolbar floating
    this.blockToolbar = document.createElement('div');
    this.blockToolbar.className = 'block-toolbar';
    this.blockToolbar.style.position = 'absolute';
    this.blockToolbar.style.display = 'none';
    this.blockToolbar.style.zIndex = 1001;
    this.blockToolbar.style.background = '#fff';
    this.blockToolbar.style.border = 'none';
    this.blockToolbar.style.borderRadius = '12px';
    this.blockToolbar.style.boxShadow = '0 4px 24px rgba(0,0,0,0.13)';
    this.blockToolbar.style.padding = '10px 16px';
    this.blockToolbar.style.gap = '16px';
    this.blockToolbar.style.display = 'flex';
    this.blockToolbar.style.alignItems = 'center';
    this.blockToolbar.style.transition = 'opacity 0.18s';
    this.blockToolbar.style.opacity = '0';
    this.blockToolbar.style.pointerEvents = 'none';
    this.blockToolbar.style.minWidth = 'auto';
    this.blockToolbar.style.minHeight = 'auto';
    this.blockToolbar.style.width = 'auto';
    this.blockToolbar.style.height = 'auto';
    this.blockToolbar.style.overflow = 'visible';
    // Thêm mũi tên bên trái
    if (!this.blockToolbar.arrow) {
      const arrow = document.createElement('div');
      arrow.className = 'block-toolbar-arrow';
      arrow.style.position = 'absolute';
      arrow.style.left = '-12px';
      arrow.style.top = '18px';
      arrow.style.width = '0';
      arrow.style.height = '0';
      arrow.style.borderTop = '10px solid transparent';
      arrow.style.borderBottom = '10px solid transparent';
      arrow.style.borderRight = '12px solid #fff';
      arrow.style.filter = 'drop-shadow(-2px 2px 2px rgba(0,0,0,0.08))';
      this.blockToolbar.appendChild(arrow);
      this.blockToolbar.arrow = arrow;
    }
    // Xóa cũ nếu có
    if (this.blockToolbar.parentNode) this.blockToolbar.parentNode.removeChild(this.blockToolbar);
    document.body.appendChild(this.blockToolbar);
    // Thêm các nút
    this.blockToolbar.innerHTML = '';
    const features = this.options.blockToolbarFeatures;
    const icons = {
      image: '<i class="fas fa-image"></i>',
      table: '<i class="fas fa-table"></i>',
      heading: '<i class="fas fa-heading"></i>',
      list: '<i class="fas fa-list-ul"></i>',
      quote: '<i class="fas fa-quote-left"></i>',
      code: '<i class="fas fa-code"></i>',
      video: '<i class="fas fa-video"></i>',
      import: '<i class="fas fa-file-import"></i>',
      indent: '<i class="fas fa-indent"></i>'
    };
    features.forEach(f => {
      const btn = document.createElement('button');
      btn.innerHTML = icons[f] || f;
      btn.title = f.charAt(0).toUpperCase() + f.slice(1);
      btn.style.background = '#fff';
      btn.style.border = 'none';
      btn.style.borderRadius = '8px';
      btn.style.width = '38px';
      btn.style.height = '38px';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.fontSize = '20px';
      btn.style.color = '#374151';
      btn.style.cursor = 'pointer';
      btn.style.margin = '0 4px';
      btn.style.transition = 'all 0.18s';
      btn.onmouseover = () => {
        btn.style.background = '#f4f6fa';
        btn.style.color = '#1976d2';
      };
      btn.onmouseout = () => {
        btn.style.background = '#fff';
        btn.style.color = '#374151';
      };
      btn.onclick = e => {
        e.preventDefault();
        this.handleBlockToolbarAction(f);
        this.hideBlockToolbar();
      };
      this.blockToolbar.appendChild(btn);
    });
    // Đảm bảo arrow luôn là phần tử đầu tiên
    if (this.blockToolbar.arrow) {
      this.blockToolbar.insertBefore(this.blockToolbar.arrow, this.blockToolbar.firstChild);
    }
  }

  showBlockToolbar(rect) {
    if (!this.blockToolbar) return;
    this.blockToolbar.style.left = rect.left + 'px';
    this.blockToolbar.style.top = (rect.top + window.scrollY - 8) + 'px';
    this.blockToolbar.style.display = 'flex';
    setTimeout(() => {
      this.blockToolbar.style.opacity = '1';
      this.blockToolbar.style.pointerEvents = 'auto';
    }, 10);
  }

  hideBlockToolbar() {
    if (!this.blockToolbar) return;
    this.blockToolbar.style.opacity = '0';
    this.blockToolbar.style.pointerEvents = 'none';
    setTimeout(() => {
      this.blockToolbar.style.display = 'none';
    }, 180);
  }

  handleBlockToolbarAction(type) {
    // Thực hiện chức năng tương ứng
    if (type === 'image') {
      this.toolbarBtns.image && this.toolbarBtns.image.click();
    } else if (type === 'table') {
      this.toolbarBtns.table && this.toolbarBtns.table.click();
    } else if (type === 'heading') {
      document.execCommand('formatBlock', false, 'H2');
    } else if (type === 'list') {
      document.execCommand('insertUnorderedList');
    } else if (type === 'quote') {
      document.execCommand('formatBlock', false, 'BLOCKQUOTE');
    } else if (type === 'code') {
      document.execCommand('formatBlock', false, 'PRE');
    } else if (type === 'video') {
      this.toolbarBtns.video && this.toolbarBtns.video.click();
    } else if (type === 'import') {
      this.toolbarBtns.import && this.toolbarBtns.import.click();
    } else if (type === 'indent') {
      // Cho phép chọn giữa text-indent và padding-left
      const sel = window.getSelection();
      if (sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed) {
        // Nếu có text đã được chọn, sử dụng padding-left
        this.applyPaddingIndentToSelection(true);
      } else {
        // Nếu chỉ có caret, sử dụng text-indent toggle
        this.applyIndentToSelection();
      }
    }
  }

  // Thêm phương thức để xử lý indentation cho nhiều block đã được chọn
  applyIndentToSelection() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    const range = sel.getRangeAt(0);
    
    // Nếu không có selection (chỉ có caret), áp dụng indent cho block hiện tại
    if (range.collapsed) {
      this.toggleIndentForBlock(this.getBlockElementAtCaret());
      return;
    }
    
    // Nếu có selection, tìm tất cả các blocks trong vùng chọn
    const blocks = this.getBlocksInSelection();
    blocks.forEach(block => this.toggleIndentForBlock(block));
    
    // Giữ nguyên selection sau khi áp dụng indent
    this.editor.focus();
  }
  
  // Lấy block hiện tại tại vị trí caret
  getBlockElementAtCaret() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return null;
    
    const node = sel.anchorNode;
    let block = node.nodeType === 3 ? node.parentNode : node;
    
    // Tìm thẻ block cha gần nhất
    while (block && block !== this.editor && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'PRE', 'DIV', 'BLOCKQUOTE', 'LI'].includes(block.nodeName)) {
      block = block.parentNode;
    }
    
    return block === this.editor ? null : block;
  }
  
  // Lấy tất cả các blocks trong vùng selection
  getBlocksInSelection() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return [];
    
    const range = sel.getRangeAt(0);
    
    // Tạo vùng bao phủ toàn bộ selection
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;
    const startOffset = range.startOffset;
    const endOffset = range.endOffset;
    
    // Nếu cả hai container đều là text nodes và cùng thuộc một block, chỉ trả về block đó
    if (startContainer === endContainer && startContainer.nodeType === 3) {
      const block = this.getParentBlock(startContainer);
      return block ? [block] : [];
    }
    
    // Tìm tất cả các blocks con trong editor
    const allBlocks = Array.from(this.editor.querySelectorAll('p, h1, h2, h3, h4, h5, h6, pre, div, blockquote, li'))
      .filter(block => this.editor.contains(block)); // Đảm bảo block nằm trong editor
    
    // Lọc ra các blocks nằm trong range
    const blocksInRange = [];
    let inRange = false;
    
    // Duyệt qua tất cả các blocks
    for (const block of allBlocks) {
      // Nếu block chứa startContainer, đánh dấu bắt đầu vùng chọn
      if (!inRange && (block.contains(startContainer) || this.isAfterNode(block, startContainer))) {
        inRange = true;
      }
      
      // Nếu đang trong vùng chọn, thêm block vào kết quả
      if (inRange) {
        blocksInRange.push(block);
      }
      
      // Nếu block chứa endContainer, đánh dấu kết thúc vùng chọn
      if (inRange && (block.contains(endContainer) || this.isBeforeNode(block, endContainer))) {
        inRange = false;
      }
    }
    
    return blocksInRange;
  }
  
  // Kiểm tra nếu nodeA nằm sau nodeB trong DOM
  isAfterNode(nodeA, nodeB) {
    return (nodeA.compareDocumentPosition(nodeB) & Node.DOCUMENT_POSITION_PRECEDING) !== 0;
  }
  
  // Kiểm tra nếu nodeA nằm trước nodeB trong DOM
  isBeforeNode(nodeA, nodeB) {
    return (nodeA.compareDocumentPosition(nodeB) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
  }
  
  // Lấy block cha của một node
  getParentBlock(node) {
    let parent = node.parentNode;
    while (parent && parent !== this.editor && !['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE', 'DIV', 'BLOCKQUOTE', 'LI'].includes(parent.nodeName)) {
      parent = parent.parentNode;
    }
    return parent === this.editor ? null : parent;
  }
  
  // Toggle text-indent cho block
  toggleIndentForBlock(block) {
    if (!block) return;
    
    // Lấy style hiện tại
    const currentStyle = block.getAttribute('style') || '';
    const hasIndent = currentStyle.includes('text-indent');
    
    if (hasIndent) {
      // Nếu đã có text-indent, bỏ nó đi (dù là em hay px)
      const newStyle = currentStyle.replace(/text-indent:\s*\d+(em|px);?\s*/i, '');
      block.setAttribute('style', newStyle.trim());

      // Nếu style rỗng sau khi bỏ indent, xóa thuộc tính style
      if (block.getAttribute('style') === '') {
        block.removeAttribute('style');
      }
    } else {
      // Nếu chưa có text-indent, thêm mới với 32px
      block.setAttribute('style', `${currentStyle}${currentStyle ? '; ' : ''}text-indent: 32px;`);
    }
    
    // Cập nhật trạng thái nút indent
    this.updateIndentButtonState();
  }
  
  // Cập nhật trạng thái nút indent dựa trên block hiện tại
  updateIndentButtonState() {
    const indentButton = this.toolbarBtns.indent;
    if (!indentButton) return;
    
    // Kiểm tra block hiện tại
    const block = this.getBlockElementAtCaret();
    const hasIndent = this.blockHasTextIndent(block);
    
    // Cập nhật trạng thái nút
    if (hasIndent) {
      indentButton._setActive(true);
    } else {
      indentButton._setActive(false);
    }
  }
  
  // Kiểm tra xem block có text-indent không
  blockHasTextIndent(block) {
    if (!block) return false;
    
    const currentStyle = block.getAttribute('style') || '';
    return currentStyle.includes('text-indent');
  }
  
  // Áp dụng padding-left indentation cho các block được chọn
  applyPaddingIndentToSelection(increase = true) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    const range = sel.getRangeAt(0);
    
    // Nếu không có selection (chỉ có caret), áp dụng indent cho block hiện tại
    if (range.collapsed) {
      this.applyPaddingIndentToBlock(this.getBlockElementAtCaret(), increase);
    } else {
      // Nếu có selection, tìm tất cả các blocks trong vùng chọn
      const blocks = this.getBlocksInSelection();
      blocks.forEach(block => this.applyPaddingIndentToBlock(block, increase));
    }
    
    // Giữ nguyên selection sau khi áp dụng indent
    this.editor.focus();
    
    // Cập nhật trạng thái hiển thị của nút indentDecrease
    this.updateIndentDecreaseButtonVisibility();
  }
  
  // Áp dụng padding-left indent cho một block
  applyPaddingIndentToBlock(block, increase = true) {
    if (!block) return;
    
    // Lấy style hiện tại và tìm padding-left
    const currentStyle = block.getAttribute('style') || '';
    const hasPaddingLeft = currentStyle.includes('padding-left');
    
    if (hasPaddingLeft) {
      // Tìm giá trị padding-left hiện tại
      const paddingMatch = currentStyle.match(/padding-left:\s*(\d+)px/);
      if (paddingMatch && paddingMatch[1]) {
        let paddingValue = parseInt(paddingMatch[1]);
        
        // Tăng hoặc giảm padding-left tùy theo tham số
        if (increase) {
          // Không vượt quá 480px
          paddingValue = Math.min(480, paddingValue + 40);
        } else {
          paddingValue = Math.max(0, paddingValue - 40);
        }
        
        // Cập nhật style với giá trị padding-left mới
        const newStyle = currentStyle.replace(
          /padding-left:\s*\d+px/, 
          `padding-left: ${paddingValue}px`
        );
        block.setAttribute('style', newStyle);
      }
    } else if (increase) {
      // Nếu chưa có padding-left và đang tăng indent, thêm mới với 40px
      block.setAttribute('style', `${currentStyle}${currentStyle ? '; ' : ''}padding-left: 40px;`);
    }
  }
  
  // Cập nhật trạng thái hiển thị của nút indentDecrease
  updateIndentDecreaseButtonVisibility() {
    const decreaseButton = this.toolbarBtns.indentDecrease;
    if (!decreaseButton) return;
    
    let shouldShow = false;
    
    // Kiểm tra block hiện tại hoặc blocks được chọn
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      
      if (range.collapsed) {
        // Chỉ có caret
        const block = this.getBlockElementAtCaret();
        shouldShow = this.blockHasPositivePaddingLeft(block);
      } else {
        // Có selection
        const blocks = this.getBlocksInSelection();
        // Hiện nút nếu có ít nhất một block có padding-left > 0
        shouldShow = blocks.some(block => this.blockHasPositivePaddingLeft(block));
      }
    }
    
    // Cập nhật trạng thái hiển thị
    decreaseButton.style.display = shouldShow ? '' : 'none';
    
    // Cập nhật cả nút increase
    this.updateIndentIncreaseButtonVisibility();
  }
  
  // Cập nhật trạng thái hiển thị của nút indentIncrease
  updateIndentIncreaseButtonVisibility() {
    const increaseButton = this.toolbarBtns.indentIncrease;
    if (!increaseButton) return;
    
    let shouldHide = false;
    
    // Kiểm tra block hiện tại hoặc blocks được chọn
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      
      if (range.collapsed) {
        // Chỉ có caret
        const block = this.getBlockElementAtCaret();
        shouldHide = this.blockHasMaxPaddingLeft(block);
      } else {
        // Có selection
        const blocks = this.getBlocksInSelection();
        // Ẩn nút nếu tất cả các block đã đạt max padding-left
        shouldHide = blocks.length > 0 && blocks.every(block => this.blockHasMaxPaddingLeft(block));
      }
    }
    
    // Cập nhật trạng thái hiển thị
    increaseButton.style.display = shouldHide ? 'none' : '';
  }
  
  // Kiểm tra xem một block có padding-left > 0 không
  blockHasPositivePaddingLeft(block) {
    if (!block) return false;
    
    const currentStyle = block.getAttribute('style') || '';
    if (!currentStyle.includes('padding-left')) return false;
    
    const paddingMatch = currentStyle.match(/padding-left:\s*(\d+)px/);
    return paddingMatch && parseInt(paddingMatch[1]) > 0;
  }
  
  // Kiểm tra xem một block có padding-left đạt max (480px) không
  blockHasMaxPaddingLeft(block) {
    if (!block) return false;
    
    const currentStyle = block.getAttribute('style') || '';
    if (!currentStyle.includes('padding-left')) return false;
    
    const paddingMatch = currentStyle.match(/padding-left:\s*(\d+)px/);
    return paddingMatch && parseInt(paddingMatch[1]) >= 480;
  }
  
  // Áp dụng heading cho selection
  applyHeadingToSelection(tagName) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    const range = sel.getRangeAt(0);
    
    // Nếu không có selection (chỉ có caret), áp dụng cho block hiện tại
    if (range.collapsed) {
      this.changeBlockTag(this.getBlockElementAtCaret(), tagName);
    } else {
      // Nếu có selection, tìm tất cả các blocks trong vùng chọn
      const blocks = this.getBlocksInSelection();
      blocks.forEach(block => this.changeBlockTag(block, tagName));
    }
    
    // Giữ nguyên selection sau khi áp dụng
    this.editor.focus();
    this.updateHeadingSelector();
  }
  
  // Thay đổi tag của một block
  changeBlockTag(block, newTagName) {
    if (!block || block === this.editor) return;
    
    // Tạo element mới với tag mong muốn
    const newBlock = document.createElement(newTagName);
    
    // Sao chép tất cả thuộc tính từ block cũ
    Array.from(block.attributes).forEach(attr => {
      newBlock.setAttribute(attr.name, attr.value);
    });
    
    // Sao chép nội dung
    newBlock.innerHTML = block.innerHTML;
    
    // Thay thế block cũ bằng block mới
    block.parentNode.insertBefore(newBlock, block);
    block.remove();
    
    // Đặt lại selection vào block mới
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(newBlock);
    range.collapse(false); // Đặt con trỏ ở cuối
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  // Cập nhật trạng thái heading selector
  updateHeadingSelector() {
    if (!this.headingSelector) return;
    
    const block = this.getBlockElementAtCaret();
    if (!block) return;
    
    const tagName = block.tagName.toUpperCase();
    this.headingSelector.value = tagName;
  }
  
  // Điều chỉnh font size
  adjustFontSize(delta) {
    const currentSize = parseInt(this.fontSizeSelector.value) || 16;
    const newSize = Math.max(8, Math.min(72, currentSize + delta));
    this.fontSizeSelector.value = newSize;
    this.setFontSize(newSize);
  }
  
  // Thiết lập font size
  setFontSize(size) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    const range = sel.getRangeAt(0);
    
    if (range.collapsed) {
      // Nếu không có selection, áp dụng cho block hiện tại
      const block = this.getBlockElementAtCaret();
      this.applyFontSizeToBlock(block, size);
    } else {
      // Nếu có selection, áp dụng cho vùng được chọn
      this.applyFontSizeToSelection(size);
    }
    
    this.editor.focus();
    this.updateFontSizeDisplay();
  }
  
  // Áp dụng font size cho một block
  applyFontSizeToBlock(block, size) {
    if (!block) return;
    
    const currentStyle = block.getAttribute('style') || '';
    
    // Remove existing font-size
    const newStyle = currentStyle.replace(/font-size:\s*\d+px;?\s*/i, '');
    
    // Add new font-size
    const finalStyle = `${newStyle}${newStyle ? '; ' : ''}font-size: ${size}px;`;
    block.setAttribute('style', finalStyle.trim());
  }
  
  // Áp dụng font size cho selection
  applyFontSizeToSelection(size) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    const range = sel.getRangeAt(0);
    
    // Tạo span với font-size
    const span = document.createElement('span');
    span.style.fontSize = size + 'px';
    
    try {
      // Bọc nội dung được chọn trong span
      range.surroundContents(span);
    } catch (e) {
      // Nếu không thể surroundContents, sử dụng cách khác
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    }
    
    // Đặt lại selection
    range.selectNodeContents(span);
    sel.removeAllRanges();
    sel.addRange(range);
  }
  
  // Cập nhật hiển thị font size
  updateFontSizeDisplay() {
    if (!this.fontSizeSelector) return;
    
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    let fontSize = 16; // default
    
    // Lấy font size từ element hiện tại
    const node = sel.anchorNode;
    let element = node.nodeType === 3 ? node.parentElement : node;
    
    while (element && element !== this.editor) {
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.fontSize) {
        fontSize = parseInt(computedStyle.fontSize);
        break;
      }
      element = element.parentElement;
    }
    
    // Tìm giá trị gần nhất trong danh sách
    const availableSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 44, 48, 54, 60, 66, 72];
    const closestSize = availableSizes.reduce((prev, curr) => 
      Math.abs(curr - fontSize) < Math.abs(prev - fontSize) ? curr : prev
    );
    
    this.fontSizeSelector.value = closestSize;
  }

  removeLineHeight() {
    // Remove line height styles from the selected text
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const selectedText = range.extractContents();
      const span = document.createElement('span');
      span.style.fontSize = 'inherit';
      span.style.lineHeight = 'inherit';
      span.appendChild(selectedText);
      range.insertNode(span);
    }
  }

  applyLineHeight(lineHeight) {
    // Apply line height to the selected text
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const selectedText = range.extractContents();
      const span = document.createElement('span');
      span.style.fontSize = 'inherit';
      span.style.lineHeight = lineHeight;
      span.appendChild(selectedText);
      range.insertNode(span);
    }
  }

  // Áp dụng line height cho selection
  applyLineHeight(lineHeight) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    const range = sel.getRangeAt(0);
    
    if (range.collapsed) {
      // Nếu không có selection (chỉ có caret), áp dụng cho block hiện tại
      const block = this.getBlockElementAtCaret();
      this.applyLineHeightToBlock(block, lineHeight);
    } else {
      // Nếu có selection, tìm tất cả các blocks trong vùng chọn
      const blocks = this.getBlocksInSelection();
      if (blocks.length > 0) {
        // Nếu có blocks được chọn, áp dụng cho blocks
        blocks.forEach(block => this.applyLineHeightToBlock(block, lineHeight));
      } else {
        // Nếu chỉ có text được chọn, bọc trong span
        this.applyLineHeightToSelection(lineHeight);
      }
    }
    
    this.editor.focus();
    this.updateLineHeightDisplay();
  }
  
  // Áp dụng line height cho một block
  applyLineHeightToBlock(block, lineHeight) {
    if (!block) return;
    
    const currentStyle = block.getAttribute('style') || '';
    
    // Remove existing line-height
    const newStyle = currentStyle.replace(/line-height:\s*[^;]+;?\s*/i, '');
    
    // Add new line-height
    const finalStyle = `${newStyle}${newStyle ? '; ' : ''}line-height: ${lineHeight};`;
    block.setAttribute('style', finalStyle.trim());
  }
  
  // Áp dụng line height cho selection text
  applyLineHeightToSelection(lineHeight) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    const range = sel.getRangeAt(0);
    
    // Tạo span với line-height
    const span = document.createElement('span');
    span.style.lineHeight = lineHeight;
    
    try {
      // Bọc nội dung được chọn trong span
      range.surroundContents(span);
    } catch (e) {
      // Nếu không thể surroundContents, sử dụng cách khác
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    }
    
    // Đặt lại selection
    range.selectNodeContents(span);
    sel.removeAllRanges();
    sel.addRange(range);
  }
  
  // Xóa line height
  removeLineHeight() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    const range = sel.getRangeAt(0);
    
    if (range.collapsed) {
      // Nếu không có selection, xóa line-height từ block hiện tại
      const block = this.getBlockElementAtCaret();
      this.removeLineHeightFromBlock(block);
    } else {
      // Nếu có selection, tìm tất cả các blocks trong vùng chọn
      const blocks = this.getBlocksInSelection();
      if (blocks.length > 0) {
        // Nếu có blocks được chọn, xóa line-height từ blocks
        blocks.forEach(block => this.removeLineHeightFromBlock(block));
      } else {
        // Nếu chỉ có text được chọn, xóa line-height từ các spans
        this.removeLineHeightFromSelection();
      }
    }
    
    this.editor.focus();
    this.updateLineHeightDisplay();
  }
  
  // Xóa line height từ một block
  removeLineHeightFromBlock(block) {
    if (!block) return;
    
    const currentStyle = block.getAttribute('style') || '';
    const newStyle = currentStyle.replace(/line-height:\s*[^;]+;?\s*/i, '');
    
    if (newStyle.trim()) {
      block.setAttribute('style', newStyle.trim());
    } else {
      block.removeAttribute('style');
    }
  }
  
  // Xóa line height từ selection
  removeLineHeightFromSelection() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    
    // Tìm tất cả các spans có line-height trong vùng chọn
    const spans = container.querySelectorAll ? container.querySelectorAll('span[style*="line-height"]') : [];
    spans.forEach(span => {
      const style = span.getAttribute('style') || '';
      const newStyle = style.replace(/line-height:\s*[^;]+;?\s*/i, '');
      
      if (newStyle.trim()) {
        span.setAttribute('style', newStyle.trim());
      } else {
        // Nếu không còn style nào khác, unwrap span
        const parent = span.parentNode;
        while (span.firstChild) {
          parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
      }
    });
  }
  
  // Cập nhật hiển thị line height
  updateLineHeightDisplay() {
    if (!this.lineHeightSelector) return;
    
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    let lineHeight = 'default';
    
    // Lấy line height từ element hiện tại
    const node = sel.anchorNode;
    let element = node.nodeType === 3 ? node.parentElement : node;
    
    while (element && element !== this.editor) {
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.lineHeight && computedStyle.lineHeight !== 'normal') {
        // Chuyển đổi từ px sang number nếu cần
        const lineHeightValue = computedStyle.lineHeight;
        if (lineHeightValue.includes('px')) {
          const fontSize = parseInt(computedStyle.fontSize);
          const lineHeightPx = parseInt(lineHeightValue);
          lineHeight = (lineHeightPx / fontSize).toFixed(1);
        } else {
          lineHeight = lineHeightValue;
        }
        break;
      }
      element = element.parentElement;
    }
    
    // Tìm giá trị gần nhất trong danh sách
    const availableLineHeights = ['1', '1.2', '1.4', '1.5', '1.6', '1.8', '2', '2.5', '3'];
    const closestLineHeight = availableLineHeights.find(lh => lh === lineHeight) || 'default';
    
    this.lineHeightSelector.value = closestLineHeight;
  }

  // Áp dụng capitalization cho text được chọn
  applyCapitalization(type) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    const range = sel.getRangeAt(0);
    
    if (range.collapsed) {
      // Nếu không có selection, áp dụng cho toàn bộ block hiện tại
      const block = this.getBlockElementAtCaret();
      this.applyCapitalizationToBlock(block, type);
    } else {
      // Nếu có selection, áp dụng cho text được chọn
      this.applyCapitalizationToSelection(type);
    }
    
    this.editor.focus();
  }
  
  // Áp dụng capitalization cho một block
  applyCapitalizationToBlock(block, type) {
    if (!block) return;
    
    const textContent = block.textContent;
    const transformedText = this.transformText(textContent, type);
    
    // Giữ nguyên cấu trúc HTML nhưng thay đổi text content
    this.replaceTextInElement(block, textContent, transformedText);
  }
  
  // Áp dụng capitalization cho selection
  applyCapitalizationToSelection(type) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    
    const range = sel.getRangeAt(0);
    const selectedText = range.toString();
    
    if (!selectedText) return;
    
    const transformedText = this.transformText(selectedText, type);
    
    // Thay thế text được chọn
    range.deleteContents();
    range.insertNode(document.createTextNode(transformedText));
    
    // Giữ nguyên selection
    const newRange = document.createRange();
    newRange.setStart(range.startContainer, range.startOffset);
    newRange.setEnd(range.startContainer, range.startOffset + transformedText.length);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }
  
  // Transform text dựa trên loại capitalization
  transformText(text, type) {
    switch (type) {
      case 'lowercase':
        return text.toLowerCase();
      case 'uppercase':
        return text.toUpperCase();
      case 'titlecase':
        return this.toTitleCase(text);
      case 'capitalize':
        return this.capitalizeFirst(text);
      default:
        return text;
    }
  }
  
  // Chuyển đổi sang Title Case
  toTitleCase(text) {
    // Danh sách các từ không viết hoa (articles, prepositions, conjunctions)
    const smallWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'of', 'on', 'or', 'the', 'to', 'up', 'via'];
    
    return text.toLowerCase().replace(/\b\w+/g, (word, index) => {
      // Luôn viết hoa từ đầu tiên và cuối cùng
      if (index === 0 || !smallWords.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    });
  }
  
  // Viết hoa chữ cái đầu tiên của văn bản
  capitalizeFirst(text) {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  
  // Thay thế text trong element while preserving HTML structure
  replaceTextInElement(element, oldText, newText) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    
    // Ghép tất cả text content
    let fullText = textNodes.map(n => n.textContent).join('');
    
    // Nếu text khớp với oldText, thay thế
    if (fullText === oldText) {
      // Phân bổ lại text đã transform
      let remainingText = newText;
      textNodes.forEach((textNode, index) => {
        const originalLength = textNode.textContent.length;
        const newContent = remainingText.substring(0, originalLength);
        textNode.textContent = newContent;
        remainingText = remainingText.substring(originalLength);
      });
    }
  }

  // Dữ liệu các tag categories
  getTagCategories() {
    return {
      Contact: {
        icon: '<i class="fas fa-user"></i>',
        color: '#3b82f6',
        tags: [
          { label: 'First Name', value: 'Customer.Firstname' },
          { label: 'Last Name', value: 'Customer.Lastname' },
          { label: 'Full Name', value: 'Customer.Fullname' },
          { label: 'Email', value: 'Customer.Email' },
          { label: 'Phone', value: 'Customer.Phone' },
          { label: 'Address', value: 'Customer.Address' },
          { label: 'City', value: 'Customer.City' },
          { label: 'State', value: 'Customer.State' },
          { label: 'Zip Code', value: 'Customer.ZipCode' },
          { label: 'Country', value: 'Customer.Country' },
          { label: 'Birth Date', value: 'Customer.BirthDate' },
          { label: 'Gender', value: 'Customer.Gender' }
        ]
      },
      Company: {
        icon: '<i class="fas fa-building"></i>',
        color: '#10b981',
        tags: [
          { label: 'Company Name', value: 'Company.Name' },
          { label: 'Company Address', value: 'Company.Address' },
          { label: 'Company Phone', value: 'Company.Phone' },
          { label: 'Company Email', value: 'Company.Email' },
          { label: 'Company Website', value: 'Company.Website' },
          { label: 'Company Logo', value: 'Company.Logo' },
          { label: 'Tax ID', value: 'Company.TaxID' },
          { label: 'Registration Number', value: 'Company.RegNumber' },
          { label: 'Industry', value: 'Company.Industry' },
          { label: 'Founded Year', value: 'Company.FoundedYear' }
        ]
      },
      Sender: {
        icon: '<i class="fas fa-paper-plane"></i>',
        color: '#f59e0b',
        tags: [
          { label: 'Sender Name', value: 'Sender.Name' },
          { label: 'Sender Email', value: 'Sender.Email' },
          { label: 'Sender Title', value: 'Sender.Title' },
          { label: 'Sender Department', value: 'Sender.Department' },
          { label: 'Sender Phone', value: 'Sender.Phone' },
          { label: 'Sender Signature', value: 'Sender.Signature' },
          { label: 'Sender Avatar', value: 'Sender.Avatar' },
          { label: 'Send Date', value: 'Sender.Date' },
          { label: 'Send Time', value: 'Sender.Time' }
        ]
      },
      Subscription: {
        icon: '<i class="fas fa-bell"></i>',
        color: '#8b5cf6',
        tags: [
          { label: 'Subscription Date', value: 'Subscription.Date' },
          { label: 'Subscription Status', value: 'Subscription.Status' },
          { label: 'Subscription Plan', value: 'Subscription.Plan' },
          { label: 'Subscription Price', value: 'Subscription.Price' },
          { label: 'Next Billing Date', value: 'Subscription.NextBilling' },
          { label: 'Trial End Date', value: 'Subscription.TrialEnd' },
          { label: 'Subscription ID', value: 'Subscription.ID' },
          { label: 'Renewal Frequency', value: 'Subscription.Frequency' },
          { label: 'Discount Code', value: 'Subscription.DiscountCode' },
          { label: 'Unsubscribe Link', value: 'Subscription.UnsubscribeLink' }
        ]
      }
    };
  }

  // Hiển thị popup chọn tags
  showTagsPopup() {
    // Xóa popup cũ nếu có
    const oldPopup = document.getElementById('tags-popup');
    if (oldPopup) oldPopup.remove();
    const oldOverlay = document.getElementById('tags-popup-overlay');
    if (oldOverlay) oldOverlay.remove();

    // Tạo overlay
    const overlay = document.createElement('div');
    overlay.id = 'tags-popup-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = this.options.theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.08)';
    overlay.style.zIndex = '9998';
    overlay.onclick = () => { this.closeTagsPopup(); };

    // Tạo popup
    const popup = document.createElement('div');
    popup.id = 'tags-popup';
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.background = '#fff';
    popup.style.border = '1px solid #e5e7eb';
    popup.style.borderRadius = '12px';
    popup.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
    popup.style.zIndex = '9999';
    popup.style.minWidth = '600px';
    popup.style.maxWidth = '90vw';
    popup.style.maxHeight = '80vh';
    popup.style.overflow = 'hidden';
    popup.style.display = 'flex';
    popup.style.flexDirection = 'column';

    // Header
    const header = document.createElement('div');
    header.style.padding = '20px 24px 16px 24px';
    header.style.borderBottom = '1px solid #e5e7eb';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';

    const title = document.createElement('h3');
    title.textContent = 'Insert Tags';
    title.style.margin = '0';
    title.style.fontSize = '18px';
    title.style.fontWeight = 'bold';
    title.style.color = '#111827';

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '18px';
    closeBtn.style.color = '#6b7280';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.padding = '4px';
    closeBtn.onclick = () => this.closeTagsPopup();

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Content
    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.height = '400px';

    // Categories sidebar
    const sidebar = document.createElement('div');
    sidebar.style.width = '200px';
    sidebar.style.background = '#f9fafb';
    sidebar.style.borderRight = '1px solid #e5e7eb';
    sidebar.style.padding = '16px 0';
    sidebar.style.overflowY = 'auto';

    // Tags content area
    const tagsArea = document.createElement('div');
    tagsArea.style.flex = '1';
    tagsArea.style.padding = '16px 20px';
    tagsArea.style.overflowY = 'auto';

    const categories = this.getTagCategories();
    let firstCategoryShown = false;

    // Tạo các category buttons
    Object.entries(categories).forEach(([categoryName, categoryData]) => {
      const categoryBtn = document.createElement('button');
      categoryBtn.style.width = '100%';
      categoryBtn.style.padding = '12px 16px';
      categoryBtn.style.border = 'none';
      categoryBtn.style.background = 'transparent';
      categoryBtn.style.textAlign = 'left';
      categoryBtn.style.cursor = 'pointer';
      categoryBtn.style.display = 'flex';
      categoryBtn.style.alignItems = 'center';
      categoryBtn.style.gap = '10px';
      categoryBtn.style.borderRadius = '6px';
      categoryBtn.style.margin = '2px 12px';
      categoryBtn.style.transition = 'all 0.2s ease';
      categoryBtn.style.fontSize = '14px';
      categoryBtn.style.fontWeight = '500';

      categoryBtn.innerHTML = `
        <span style="color: ${categoryData.color}; font-size: 16px;">${categoryData.icon}</span>
        <span style="color: #374151;">${categoryName}</span>
      `;

      categoryBtn.onmouseover = () => {
        categoryBtn.style.background = '#e5e7eb';
      };

      categoryBtn.onmouseout = () => {
        if (!categoryBtn.classList.contains('active')) {
          categoryBtn.style.background = 'transparent';
        }
      };

      categoryBtn.onclick = () => {
        // Remove active state from all buttons
        sidebar.querySelectorAll('button').forEach(btn => {
          btn.classList.remove('active');
          btn.style.background = 'transparent';
        });

        // Add active state to clicked button
        categoryBtn.classList.add('active');
        categoryBtn.style.background = '#e5e7eb';

        // Show tags for this category
        this.showTagsForCategory(tagsArea, categoryName, categoryData);
      };

      sidebar.appendChild(categoryBtn);

      // Show first category by default
      if (!firstCategoryShown) {
        categoryBtn.click();
        firstCategoryShown = true;
      }
    });

    content.appendChild(sidebar);
    content.appendChild(tagsArea);

    popup.appendChild(header);
    popup.appendChild(content);

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    this.tagsPopup = popup;
    this.tagsOverlay = overlay;
  }

  // Hiển thị tags cho một category
  showTagsForCategory(container, categoryName, categoryData) {
    container.innerHTML = '';

    // Category header
    const categoryHeader = document.createElement('div');
    categoryHeader.style.display = 'flex';
    categoryHeader.style.alignItems = 'center';
    categoryHeader.style.gap = '10px';
    categoryHeader.style.marginBottom = '16px';
    categoryHeader.style.paddingBottom = '12px';
    categoryHeader.style.borderBottom = '1px solid #e5e7eb';

    categoryHeader.innerHTML = `
      <span style="color: ${categoryData.color}; font-size: 20px;">${categoryData.icon}</span>
      <h4 style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">${categoryName} Tags</h4>
    `;

    container.appendChild(categoryHeader);

    // Tags grid
    const tagsGrid = document.createElement('div');
    tagsGrid.style.display = 'grid';
    tagsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
    tagsGrid.style.gap = '8px';

    categoryData.tags.forEach(tag => {
      const tagBtn = document.createElement('button');
      tagBtn.style.padding = '10px 12px';
      tagBtn.style.border = '1px solid #e5e7eb';
      tagBtn.style.borderRadius = '6px';
      tagBtn.style.background = '#fff';
      tagBtn.style.color = '#374151';
      tagBtn.style.cursor = 'pointer';
      tagBtn.style.textAlign = 'left';
      tagBtn.style.fontSize = '13px';
      tagBtn.style.transition = 'all 0.2s ease';
      tagBtn.style.display = 'flex';
      tagBtn.style.flexDirection = 'column';
      tagBtn.style.alignItems = 'flex-start';
      tagBtn.style.gap = '4px';

      tagBtn.innerHTML = `
        <span style="font-weight: 500; color: #111827;">${tag.label}</span>
        <span style="font-size: 11px; color: #6b7280; font-family: monospace;">{{${tag.value}}}</span>
      `;

      tagBtn.onmouseover = () => {
        tagBtn.style.background = '#f3f4f6';
        tagBtn.style.borderColor = categoryData.color;
        tagBtn.style.transform = 'translateY(-1px)';
        tagBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      };

      tagBtn.onmouseout = () => {
        tagBtn.style.background = '#fff';
        tagBtn.style.borderColor = '#e5e7eb';
        tagBtn.style.transform = 'translateY(0)';
        tagBtn.style.boxShadow = 'none';
      };

      tagBtn.onclick = () => {
        this.insertTag(tag.value);
        this.closeTagsPopup();
      };

      tagsGrid.appendChild(tagBtn);
    });

    container.appendChild(tagsGrid);
  }

  // Chèn tag vào editor
  insertTag(tagValue) {
    this.restoreSelection(this.savedSelection);
    this.editor.focus();
    
    const sel = window.getSelection();
    const tagText = `{{${tagValue}}}`;
    
    if (sel.rangeCount && this.editor.contains(sel.anchorNode)) {
      // Tạo span với style đặc biệt cho tag
      const tagSpan = document.createElement('span');
      tagSpan.style.background = '#e0f2fe';
      tagSpan.style.color = '#0369a1';
      tagSpan.style.padding = '2px 6px';
      tagSpan.style.borderRadius = '4px';
      tagSpan.style.fontSize = '13px';
      tagSpan.style.fontFamily = 'monospace';
      tagSpan.style.border = '1px solid #7dd3fc';
      tagSpan.textContent = tagText;
      tagSpan.setAttribute('data-tag', tagValue);
      tagSpan.setAttribute('contenteditable', 'false');
      
      sel.getRangeAt(0).insertNode(tagSpan);
      
      // Thêm space sau tag
      const space = document.createTextNode(' ');
      sel.getRangeAt(0).insertNode(space);
      
      // Đặt cursor sau tag
      const range = document.createRange();
      range.setStartAfter(space);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      this.editor.appendChild(document.createTextNode(tagText + ' '));
    }
  }

  // Đóng popup tags
  closeTagsPopup() {
    if (this.tagsPopup) {
      this.tagsPopup.remove();
      this.tagsPopup = null;
    }
    if (this.tagsOverlay) {
      this.tagsOverlay.remove();
      this.tagsOverlay = null;
    }
  }

  // Dữ liệu các template categories
  getTemplateCategories() {
    return {
      Email: {
        icon: '<i class="fas fa-envelope"></i>',
        color: '#3b82f6',
        templates: [
          {
            name: 'Welcome Email',
            description: 'Welcome new customers',
            content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #2563eb; text-align: center;">Welcome to {{Company.Name}}!</h1><p style="font-size: 16px; line-height: 1.6;">Hi {{Customer.Firstname}},</p><p style="font-size: 16px; line-height: 1.6;">Thank you for joining {{Company.Name}}! We're excited to have you as part of our community.</p><div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;"><h3 style="color: #1f2937; margin-top: 0;">Getting Started:</h3><ul style="color: #374151;"><li>Complete your profile</li><li>Explore our features</li><li>Contact support if you need help</li></ul></div><p style="font-size: 16px; line-height: 1.6;">If you have any questions, feel free to reach out to us at {{Company.Email}}.</p><p style="font-size: 16px; line-height: 1.6;">Best regards,<br>{{Sender.Name}}<br>{{Company.Name}} Team</p></div>`
          },
          {
            name: 'Order Confirmation',
            description: 'Confirm customer orders',
            content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><h1 style="color: #059669; text-align: center;">Order Confirmed!</h1><p style="font-size: 16px; line-height: 1.6;">Dear {{Customer.Firstname}},</p><p style="font-size: 16px; line-height: 1.6;">Thank you for your order! We're processing it now and will send you tracking information soon.</p><div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;"><h3 style="color: #065f46; margin-top: 0;">Order Details:</h3><p style="margin: 5px 0;"><strong>Order ID:</strong> #12345</p><p style="margin: 5px 0;"><strong>Order Date:</strong> {{Sender.Date}}</p><p style="margin: 5px 0;"><strong>Delivery Address:</strong> {{Customer.Address}}, {{Customer.City}}</p></div><p style="font-size: 16px; line-height: 1.6;">You can track your order status anytime by visiting our website.</p><p style="font-size: 16px; line-height: 1.6;">Thank you for choosing {{Company.Name}}!</p></div>`
          }
        ]
      },
      Newsletter: {
        icon: '<i class="fas fa-newspaper"></i>',
        color: '#10b981',
        templates: [
          {
            name: 'Monthly Newsletter',
            description: 'Monthly newsletter edition',
            content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px;"><h1 style="color: #10b981; margin: 0;">{{Company.Name}} Newsletter</h1><p style="color: #6b7280; margin: 5px 0;">Monthly Edition - {{Sender.Date}}</p></div><h2 style="color: #1f2937;">What's New This Month</h2><div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;"><h3 style="color: #166534; margin-top: 0;">🚀 Product Updates</h3><p style="line-height: 1.6;">We've launched exciting new features that will help you work more efficiently. Check out our latest improvements and see how they can benefit your workflow.</p></div><div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;"><h3 style="color: #92400e; margin-top: 0;">📰 Industry News</h3><p style="line-height: 1.6;">Stay updated with the latest trends and insights in our industry. This month we're covering important developments that could impact your business.</p></div><div style="text-align: center; margin: 30px 0;"><a href="{{Subscription.UnsubscribeLink}}" style="color: #6b7280; font-size: 12px; text-decoration: underline;">Unsubscribe</a></div></div>`
          }
        ]
      },
      Invoice: {
        icon: '<i class="fas fa-file-invoice-dollar"></i>',
        color: '#f59e0b',
        templates: [
          {
            name: 'Service Invoice',
            description: 'Professional service invoice',
            content: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;"><div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 30px;"><div><h1 style="color: #f59e0b; margin: 0;">INVOICE</h1><p style="margin: 5px 0; color: #6b7280;">#INV-2024-001</p></div><div style="text-align: right;"><h2 style="color: #1f2937; margin: 0;">{{Company.Name}}</h2><p style="margin: 5px 0; color: #6b7280;">{{Company.Address}}</p><p style="margin: 5px 0; color: #6b7280;">{{Company.Phone}}</p></div></div><div style="display: flex; justify-content: space-between; margin-bottom: 30px;"><div><h3 style="color: #1f2937; margin-bottom: 10px;">Bill To:</h3><p style="margin: 5px 0;"><strong>{{Customer.Fullname}}</strong></p><p style="margin: 5px 0;">{{Customer.Address}}</p><p style="margin: 5px 0;">{{Customer.Email}}</p></div><div style="text-align: right;"><p style="margin: 5px 0;"><strong>Invoice Date:</strong> {{Sender.Date}}</p><p style="margin: 5px 0;"><strong>Due Date:</strong> {{Sender.Date}}</p></div></div><table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;"><thead><tr style="background-color: #f59e0b; color: white;"><th style="padding: 12px; text-align: left;">Description</th><th style="padding: 12px; text-align: center;">Qty</th><th style="padding: 12px; text-align: right;">Rate</th><th style="padding: 12px; text-align: right;">Amount</th></tr></thead><tbody><tr><td style="padding: 12px; border: 1px solid #e5e7eb;">Web Development Service</td><td style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">1</td><td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">$1,500.00</td><td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">$1,500.00</td></tr></tbody></table><div style="text-align: right; margin-bottom: 30px;"><p style="margin: 5px 0;"><strong>Subtotal: $1,500.00</strong></p><p style="margin: 5px 0;">Tax (10%): $150.00</p><h3 style="color: #f59e0b; margin: 10px 0;">Total: $1,650.00</h3></div></div>`
          }
        ]
      },
      Letter: {
        icon: '<i class="fas fa-envelope-open-text"></i>',
        color: '#8b5cf6',
        templates: [
          {
            name: 'Business Letter',
            description: 'Formal business letter',
            content: `<div style="font-family: Times New Roman, serif; max-width: 700px; margin: 0 auto; padding: 40px; line-height: 1.8;"><div style="text-align: right; margin-bottom: 40px;"><p style="margin: 5px 0;">{{Company.Name}}</p><p style="margin: 5px 0;">{{Company.Address}}</p><p style="margin: 5px 0;">{{Company.Phone}}</p></div><div style="margin-bottom: 30px;"><p style="margin: 5px 0;">{{Sender.Date}}</p></div><div style="margin-bottom: 30px;"><p style="margin: 5px 0;">{{Customer.Fullname}}</p><p style="margin: 5px 0;">{{Customer.Address}}</p><p style="margin: 5px 0;">{{Customer.City}}, {{Customer.State}} {{Customer.ZipCode}}</p></div><div style="margin-bottom: 20px;"><p style="margin: 0;">Dear {{Customer.Firstname}},</p></div><div style="margin-bottom: 20px; text-align: justify;"><p style="margin-bottom: 15px;">I hope this letter finds you in good health and spirits. I am writing to present a business opportunity that I believe would be mutually beneficial for both our organizations.</p><p style="margin-bottom: 15px;">{{Company.Name}} has been a leader in our industry, and we have consistently delivered high-quality services to our clients. We have recently expanded our capabilities and are looking for strategic partners to collaborate with.</p><p style="margin-bottom: 15px;">We would like to schedule a meeting to discuss this opportunity in detail. Please let us know your availability for the coming weeks.</p><p style="margin-bottom: 15px;">Thank you for your time and consideration. I look forward to hearing from you soon.</p></div><div style="margin-top: 40px;"><p style="margin: 5px 0;">Sincerely,</p><br><br><p style="margin: 5px 0;">{{Sender.Name}}</p><p style="margin: 5px 0;">{{Sender.Title}}</p><p style="margin: 5px 0;">{{Company.Name}}</p></div></div>`
          }
        ]
      }
    };
  }

  // Hiển thị popup chọn templates
  showTemplatesPopup() {
    // Xóa popup cũ nếu có
    const oldPopup = document.getElementById('templates-popup');
    if (oldPopup) oldPopup.remove();
    const oldOverlay = document.getElementById('templates-popup-overlay');
    if (oldOverlay) oldOverlay.remove();

    // Tạo overlay
    const overlay = document.createElement('div');
    overlay.id = 'templates-popup-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.1)';
    overlay.style.zIndex = '9998';
    overlay.onclick = () => { this.closeTemplatesPopup(); };

    // Tạo popup
    const popup = document.createElement('div');
    popup.id = 'templates-popup';
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.background = '#fff';
    popup.style.border = '1px solid #e5e7eb';
    popup.style.borderRadius = '12px';
    popup.style.boxShadow = '0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)';
    popup.style.zIndex = '9999';
    popup.style.minWidth = '800px';
    popup.style.maxWidth = '95vw';
    popup.style.maxHeight = '90vh';
    popup.style.overflow = 'hidden';
    popup.style.display = 'flex';
    popup.style.flexDirection = 'column';

    // Header
    const header = document.createElement('div');
    header.style.padding = '24px 28px 20px 28px';
    header.style.borderBottom = '1px solid #e5e7eb';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    header.style.color = 'white';

    const title = document.createElement('h3');
    title.innerHTML = '<i class="fas fa-file-alt" style="margin-right: 10px;"></i>Insert Template';
    title.style.margin = '0';
    title.style.fontSize = '20px';
    title.style.fontWeight = 'bold';

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.style.background = 'rgba(255,255,255,0.2)';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '18px';
    closeBtn.style.color = 'white';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.padding = '8px 10px';
    closeBtn.style.borderRadius = '6px';
    closeBtn.style.transition = 'background 0.2s ease';
    closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255,255,255,0.3)';
    closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255,255,255,0.2)';
    closeBtn.onclick = () => this.closeTemplatesPopup();

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Content
    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.height = '500px';

    // Categories sidebar
    const sidebar = document.createElement('div');
    sidebar.style.width = '220px';
    sidebar.style.background = '#f8fafc';
    sidebar.style.borderRight = '1px solid #e5e7eb';
    sidebar.style.padding = '20px 0';
    sidebar.style.overflowY = 'auto';

    // Templates content area
    const templatesArea = document.createElement('div');
    templatesArea.style.flex = '1';
    templatesArea.style.padding = '20px 24px';
    templatesArea.style.overflowY = 'auto';

    const categories = this.getTemplateCategories();
    let firstCategoryShown = false;

    // Tạo các category buttons
    Object.entries(categories).forEach(([categoryName, categoryData]) => {
      const categoryBtn = document.createElement('button');
      categoryBtn.style.width = '100%';
      categoryBtn.style.padding = '14px 20px';
      categoryBtn.style.border = 'none';
      categoryBtn.style.background = 'transparent';
      categoryBtn.style.textAlign = 'left';
      categoryBtn.style.cursor = 'pointer';
      categoryBtn.style.display = 'flex';
      categoryBtn.style.alignItems = 'center';
      categoryBtn.style.gap = '12px';
      categoryBtn.style.borderRadius = '8px';
      categoryBtn.style.margin = '4px 16px';
      categoryBtn.style.transition = 'all 0.2s ease';
      categoryBtn.style.fontSize = '15px';
      categoryBtn.style.fontWeight = '500';

      categoryBtn.innerHTML = `
        <span style="color: ${categoryData.color}; font-size: 18px;">${categoryData.icon}</span>
        <span style="color: #374151;">${categoryName}</span>
      `;

      categoryBtn.onmouseover = () => {
        if (!categoryBtn.classList.contains('active')) {
          categoryBtn.style.background = '#e2e8f0';
        }
      };

      categoryBtn.onmouseout = () => {
        if (!categoryBtn.classList.contains('active')) {
          categoryBtn.style.background = 'transparent';
        }
      };

      categoryBtn.onclick = () => {
        // Remove active state from all buttons
        sidebar.querySelectorAll('button').forEach(btn => {
          btn.classList.remove('active');
          btn.style.background = 'transparent';
          btn.style.color = '#374151';
        });

        // Add active state to clicked button
        categoryBtn.classList.add('active');
        categoryBtn.style.background = categoryData.color;
        categoryBtn.style.color = 'white';

        // Show templates for this category
        this.showTemplatesForCategory(templatesArea, categoryName, categoryData);
      };

      sidebar.appendChild(categoryBtn);

      // Show first category by default
      if (!firstCategoryShown) {
        categoryBtn.click();
        firstCategoryShown = true;
      }
    });

    content.appendChild(sidebar);
    content.appendChild(templatesArea);

    popup.appendChild(header);
    popup.appendChild(content);

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    this.templatesPopup = popup;
    this.templatesOverlay = overlay;
  }

  // Hiển thị templates cho một category
  showTemplatesForCategory(container, categoryName, categoryData) {
    container.innerHTML = '';

    // Category header
    const categoryHeader = document.createElement('div');
    categoryHeader.style.display = 'flex';
    categoryHeader.style.alignItems = 'center';
    categoryHeader.style.gap = '12px';
    categoryHeader.style.marginBottom = '20px';
    categoryHeader.style.paddingBottom = '16px';
    categoryHeader.style.borderBottom = '2px solid #e5e7eb';

    categoryHeader.innerHTML = `
      <span style="color: ${categoryData.color}; font-size: 24px;">${categoryData.icon}</span>
      <h4 style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">${categoryName} Templates</h4>
    `;

    container.appendChild(categoryHeader);

    // Templates grid
    const templatesGrid = document.createElement('div');
    templatesGrid.style.display = 'grid';
    templatesGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
    templatesGrid.style.gap = '16px';

    categoryData.templates.forEach(template => {
      const templateCard = document.createElement('div');
      templateCard.style.border = '1px solid #e5e7eb';
      templateCard.style.borderRadius = '10px';
      templateCard.style.background = '#fff';
      templateCard.style.cursor = 'pointer';
      templateCard.style.transition = 'all 0.2s ease';
      templateCard.style.overflow = 'hidden';

      templateCard.innerHTML = `
        <div style="padding: 20px;">
          <h5 style="margin: 0 0 8px 0; color: #111827; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            <span style="color: ${categoryData.color};">${categoryData.icon}</span>
            ${template.name}
          </h5>
          <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.4;">${template.description}</p>
          <div style="margin-top: 16px;">
            <button style="
              background: ${categoryData.color}; 
              color: white; 
              border: none; 
              padding: 8px 16px; 
              border-radius: 6px; 
              font-size: 13px; 
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s ease;
            " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
              Insert Template
            </button>
          </div>
        </div>
      `;

      templateCard.onmouseover = () => {
        templateCard.style.borderColor = categoryData.color;
        templateCard.style.transform = 'translateY(-2px)';
        templateCard.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
      };

      templateCard.onmouseout = () => {
        templateCard.style.borderColor = '#e5e7eb';
        templateCard.style.transform = 'translateY(0)';
        templateCard.style.boxShadow = 'none';
      };

      templateCard.onclick = () => {
        this.insertTemplate(template.content);
        this.closeTemplatesPopup();
      };

      templatesGrid.appendChild(templateCard);
    });

    container.appendChild(templatesGrid);
  }

  // Chèn template vào editor
  insertTemplate(templateContent) {
    this.restoreSelection(this.savedSelection);
    this.editor.focus();
    
    const sel = window.getSelection();
    
    if (sel.rangeCount && this.editor.contains(sel.anchorNode)) {
      // Tạo div container cho template
      const templateDiv = document.createElement('div');
      templateDiv.innerHTML = templateContent;
      templateDiv.style.position = 'relative';    
      sel.getRangeAt(0).insertNode(templateDiv);
      
      // Đặt cursor sau template
      const range = document.createRange();
      range.setStartAfter(templateDiv);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      // Fallback: chèn vào cuối editor
      const templateDiv = document.createElement('div');
      templateDiv.innerHTML = templateContent;
      this.editor.appendChild(templateDiv);
    }
  }

  // Đóng popup templates
  closeTemplatesPopup() {
    if (this.templatesPopup) {
      this.templatesPopup.remove();
      this.templatesPopup = null;
    }
    if (this.templatesOverlay) {
      this.templatesOverlay.remove();
      this.templatesOverlay = null;
    }
  }

  // Toggle theme between light and dark
  toggleTheme() {
    this.options.theme = this.options.theme === 'dark' ? 'light' : 'dark';
    
    // Save theme preference to localStorage
    localStorage.setItem('richEditorTheme', this.options.theme);
    
    // Apply theme to the editor
    this.applyTheme();
    
    // Update theme toggle button
    this.updateThemeToggleButton();
  }

  // Apply theme styles to the editor and components
  applyTheme() {
    const isDark = this.options.theme === 'dark';
    
    // Set theme attribute on body to apply CSS variables
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    
    // Apply theme to specific elements that need JS styling
    if (this.container) {
      this.container.style.background = isDark ? '#1a1a1a' : '#ffffff';
      this.container.style.color = isDark ? '#e0e0e0' : '#333333';
      this.container.style.border = isDark ? '1px solid #404040' : '1px solid #e0e0e0';
    }

    // Apply theme to toolbar
    if (this.toolbar) {
      this.toolbar.style.background = isDark ? '#2a2a2a' : '#f8f9fa';
      this.toolbar.style.borderBottom = isDark ? '1px solid #404040' : '1px solid #e0e0e0';
    }

    // Apply theme to editor area
    if (this.editor) {
      this.editor.style.background = isDark ? '#1e1e1e' : '#ffffff';
      this.editor.style.color = isDark ? '#e0e0e0' : '#333333';
    }

    // Apply theme to status bar
    if (this.statusbar) {
      this.statusbar.style.background = isDark ? '#2a2a2a' : '#f8f9fa';
      this.statusbar.style.borderTop = isDark ? '1px solid #404040' : '1px solid #e0e0e0';
      this.statusbar.style.color = isDark ? '#b0b0b0' : '#666666';
    }

    // Update all toolbar buttons
    this.updateToolbarButtonsTheme();
    
    // Update dropdown selectors
    this.updateSelectorsTheme();

    // Apply theme to dynamic content that CSS can't reach
    this.updateDynamicElements();
    
    // Update inline styles in editor content
    this.updateEditorContentTheme();
  }

  // Update theme toggle button appearance
  updateThemeToggleButton() {
    if (!this.themeToggleBtn) return;
    
    const isDark = this.options.theme === 'dark';
    
    this.themeToggleBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    this.themeToggleBtn.title = isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme';
    this.themeToggleBtn.style.background = isDark ? '#2a2a2a' : '#ffffff';
    this.themeToggleBtn.style.color = isDark ? '#e0e0e0' : '#333333';
    this.themeToggleBtn.style.border = isDark ? '1px solid #404040' : '1px solid #e0e0e0';
  }

  // Update all toolbar buttons theme
  updateToolbarButtonsTheme() {
    const isDark = this.options.theme === 'dark';
    const buttons = this.toolbar.querySelectorAll('.editor-btn');
    
    buttons.forEach(btn => {
      if (btn === this.themeToggleBtn) return; // Skip theme button, it has its own styling
      
      btn.style.background = isDark ? '#2a2a2a' : '#ffffff';
      btn.style.color = isDark ? '#e0e0e0' : '#333333';
      btn.style.border = isDark ? '1px solid #404040' : '1px solid #e0e0e0';
      
      // Update hover effects
      btn.onmouseover = () => {
        btn.style.background = isDark ? '#404040' : '#f5f5f5';
      };
      
      btn.onmouseout = () => {
        const isActive = btn.classList.contains('active');
        if (isActive) {
          btn.style.background = isDark ? '#0f4c75' : '#007bff';
          btn.style.color = '#ffffff';
        } else {
          btn.style.background = isDark ? '#2a2a2a' : '#ffffff';
          btn.style.color = isDark ? '#e0e0e0' : '#333333';
        }
      };
    });
  }

  // Update dropdown selectors theme
  updateSelectorsTheme() {
    const isDark = this.options.theme === 'dark';
    
    // Update font selector
    if (this.fontSelector) {
      this.fontSelector.style.background = isDark ? '#2a2a2a' : '#ffffff';
      this.fontSelector.style.color = isDark ? '#e0e0e0' : '#333333';
      this.fontSelector.style.border = isDark ? '1px solid #404040' : '1px solid #e0e0e0';
      
      // Add hover effects
      this.fontSelector.onmouseover = () => {
        this.fontSelector.style.background = isDark ? '#404040' : '#f5f5f5';
      };
      
      this.fontSelector.onmouseout = () => {
        this.fontSelector.style.background = isDark ? '#2a2a2a' : '#ffffff';
      };
    }

    // Update heading selector
    if (this.headingSelector) {
      this.headingSelector.style.background = isDark ? '#2a2a2a' : '#ffffff';
      this.headingSelector.style.color = isDark ? '#e0e0e0' : '#333333';
      this.headingSelector.style.border = isDark ? '1px solid #404040' : '1px solid #e0e0e0';
      
      // Add hover effects
      this.headingSelector.onmouseover = () => {
        this.headingSelector.style.background = isDark ? '#404040' : '#f5f5f5';
      };
      
      this.headingSelector.onmouseout = () => {
        this.headingSelector.style.background = isDark ? '#2a2a2a' : '#ffffff';
      };
    }

    // Update font size input
    if (this.fontSizeInput) {
      this.fontSizeInput.style.background = isDark ? '#2a2a2a' : '#ffffff';
      this.fontSizeInput.style.color = isDark ? '#e0e0e0' : '#333333';
      this.fontSizeInput.style.border = isDark ? '1px solid #404040' : '1px solid #e0e0e0';
      
      // Add focus effects for input
      this.fontSizeInput.onfocus = () => {
        this.fontSizeInput.style.background = isDark ? '#404040' : '#f5f5f5';
        this.fontSizeInput.style.borderColor = isDark ? '#66ccff' : '#007bff';
      };
      
      this.fontSizeInput.onblur = () => {
        this.fontSizeInput.style.background = isDark ? '#2a2a2a' : '#ffffff';
        this.fontSizeInput.style.borderColor = isDark ? '#404040' : '#e0e0e0';
      };
    }

    // Update line height selector
    if (this.lineHeightSelector) {
      this.lineHeightSelector.style.background = isDark ? '#2a2a2a' : '#ffffff';
      this.lineHeightSelector.style.color = isDark ? '#e0e0e0' : '#333333';
      this.lineHeightSelector.style.border = isDark ? '1px solid #404040' : '1px solid #e0e0e0';
      
      // Add hover effects
      this.lineHeightSelector.onmouseover = () => {
        this.lineHeightSelector.style.background = isDark ? '#404040' : '#f5f5f5';
      };
      
      this.lineHeightSelector.onmouseout = () => {
        this.lineHeightSelector.style.background = isDark ? '#2a2a2a' : '#ffffff';
      };
    }

    // Update capitalization selector
    if (this.capitalizationSelector) {
      this.capitalizationSelector.style.background = isDark ? '#2a2a2a' : '#ffffff';
      this.capitalizationSelector.style.color = isDark ? '#e0e0e0' : '#333333';
      this.capitalizationSelector.style.border = isDark ? '1px solid #404040' : '1px solid #e0e0e0';
      
      // Add hover effects
      this.capitalizationSelector.onmouseover = () => {
        this.capitalizationSelector.style.background = isDark ? '#404040' : '#f5f5f5';
      };
      
      this.capitalizationSelector.onmouseout = () => {
        this.capitalizationSelector.style.background = isDark ? '#2a2a2a' : '#ffffff';
      };
    }

    // Update any other dropdown elements that might exist
    const allSelectors = this.toolbar.querySelectorAll('select, input[type="number"], .font-select, .block-format-select');
    allSelectors.forEach(selector => {
      // Skip if already handled above
      if (selector === this.fontSelector || selector === this.headingSelector || 
          selector === this.fontSizeInput || selector === this.lineHeightSelector || 
          selector === this.capitalizationSelector) {
        return;
      }
      
      selector.style.background = isDark ? '#2a2a2a' : '#ffffff';
      selector.style.color = isDark ? '#e0e0e0' : '#333333';
      selector.style.border = isDark ? '1px solid #404040' : '1px solid #e0e0e0';
      
      // Add appropriate hover/focus effects
      if (selector.tagName.toLowerCase() === 'select') {
        selector.onmouseover = () => {
          selector.style.background = isDark ? '#404040' : '#f5f5f5';
        };
        
        selector.onmouseout = () => {
          selector.style.background = isDark ? '#2a2a2a' : '#ffffff';
        };
      } else if (selector.tagName.toLowerCase() === 'input') {
        selector.onfocus = () => {
          selector.style.background = isDark ? '#404040' : '#f5f5f5';
          selector.style.borderColor = isDark ? '#66ccff' : '#007bff';
        };
        
        selector.onblur = () => {
          selector.style.background = isDark ? '#2a2a2a' : '#ffffff';
          selector.style.borderColor = isDark ? '#404040' : '#e0e0e0';
        };
      }
    });
  }

  // Update dynamic elements that CSS can't reach
  updateDynamicElements() {
    const isDark = this.options.theme === 'dark';
    
    // Update any existing tooltips
    const tooltips = document.querySelectorAll('.editor-tooltip, #custom-tooltip');
    tooltips.forEach(tooltip => {
      tooltip.style.background = isDark ? '#2a2a2a' : '#ffffff';
      tooltip.style.border = isDark ? '1px solid #404040' : '1px solid #ccc';
      tooltip.style.color = isDark ? '#e0e0e0' : '#333333';
      tooltip.style.boxShadow = isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.18)';
    });

    // Update overlay backgrounds
    const overlays = document.querySelectorAll('#custom-tooltip-overlay, #tags-popup-overlay, #templates-popup-overlay');
    overlays.forEach(overlay => {
      overlay.style.background = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.08)';
    });

    // Update any existing popups
    const popups = document.querySelectorAll('#tags-popup, #templates-popup');
    popups.forEach(popup => {
      popup.style.background = isDark ? '#2a2a2a' : '#ffffff';
      popup.style.border = isDark ? '1px solid #404040' : '1px solid #e5e7eb';
      popup.style.color = isDark ? '#e0e0e0' : '#333333';
      popup.style.boxShadow = isDark ? '0 10px 25px rgba(0,0,0,0.3)' : '0 10px 25px rgba(0,0,0,0.15)';
    });

    // Update popup headers
    const popupHeaders = document.querySelectorAll('#tags-popup .header, #templates-popup .header');
    popupHeaders.forEach(header => {
      header.style.borderBottom = isDark ? '1px solid #404040' : '1px solid #e5e7eb';
    });

    // Update close buttons in popups
    const closeButtons = document.querySelectorAll('#tags-popup button[onclick*="close"], #templates-popup button[onclick*="close"]');
    closeButtons.forEach(btn => {
      btn.style.color = isDark ? '#b0b0b0' : '#6b7280';
    });

    // Update category buttons in tags popup
    const categoryButtons = document.querySelectorAll('#tags-popup .category-btn');
    categoryButtons.forEach(btn => {
      const span = btn.querySelector('span:last-child');
      if (span) {
        span.style.color = isDark ? '#e0e0e0' : '#374151';
      }
    });

    // Update block toolbar if exists
    if (this.blockToolbar) {
      this.blockToolbar.style.background = isDark ? '#2a2a2a' : '#ffffff';
      this.blockToolbar.style.boxShadow = isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.13)';
      
      // Update arrow
      const arrow = this.blockToolbar.querySelector('.block-toolbar-arrow');
      if (arrow) {
        arrow.style.borderRight = isDark ? '12px solid #2a2a2a' : '12px solid #fff';
        arrow.style.filter = isDark ? 'drop-shadow(-2px 2px 2px rgba(0,0,0,0.4))' : 'drop-shadow(-2px 2px 2px rgba(0,0,0,0.08))';
      }

      // Update buttons in block toolbar
      const buttons = this.blockToolbar.querySelectorAll('button');
      buttons.forEach(btn => {
        btn.style.background = isDark ? '#2a2a2a' : '#fff';
        btn.style.color = isDark ? '#e0e0e0' : '#374151';
      });
    }

    // Update color picker if exists
    if (this.colorPicker) {
      this.colorPicker.style.background = isDark ? '#2a2a2a' : '#fff';
      this.colorPicker.style.border = isDark ? '1px solid #404040' : '1px solid #ccc';
      this.colorPicker.style.boxShadow = isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.12)';
      
      // Update custom button in color picker
      const customBtn = this.colorPicker.querySelector('button');
      if (customBtn && customBtn.textContent === 'Custom') {
        customBtn.style.background = isDark ? '#404040' : '#f4f6fa';
        customBtn.style.color = isDark ? '#66ccff' : '#1976d2';
        customBtn.style.border = isDark ? '1px solid #404040' : '1px solid #eee';
      }
    }
  }

  // Update inline styles in editor content for theme compatibility
  updateEditorContentTheme() {
    const isDark = this.options.theme === 'dark';
    
    if (!this.editor) return;
    
    // Define color mappings
    const colorMappings = {
      // Dark colors to light for dark theme
      '#1f2937': isDark ? '#e0e0e0' : '#1f2937',
      '#374151': isDark ? '#e0e0e0' : '#374151', 
      '#111827': isDark ? '#f0f0f0' : '#111827',
      '#6b7280': isDark ? '#b0b0b0' : '#6b7280',
      '#333333': isDark ? '#e0e0e0' : '#333333',
      '#000000': isDark ? '#f0f0f0' : '#000000',
      // Light backgrounds to dark for dark theme
      '#ffffff': isDark ? '#2a2a2a' : '#ffffff',
      '#f9fafb': isDark ? '#2a2a2a' : '#f9fafb',
      '#f3f4f6': isDark ? '#2a2a2a' : '#f3f4f6',
      '#f8f9fa': isDark ? '#2a2a2a' : '#f8f9fa',
      // Borders
      '#e5e7eb': isDark ? '#404040' : '#e5e7eb',
      '#d1d5db': isDark ? '#404040' : '#d1d5db'
    };
    
    // Get all elements with inline styles in editor
    const elementsWithInlineStyles = this.editor.querySelectorAll('*[style]');
    
    elementsWithInlineStyles.forEach(element => {
      const style = element.getAttribute('style');
      let newStyle = style;
      
      // Replace colors in style attribute
      Object.keys(colorMappings).forEach(oldColor => {
        const newColor = colorMappings[oldColor];
        // Replace color values
        newStyle = newStyle.replace(new RegExp(oldColor, 'gi'), newColor);
      });
      
      // Update style if changed
      if (newStyle !== style) {
        element.setAttribute('style', newStyle);
      }
    });
    
    // Also update any text content that might have colors
    this.updateTableThemes();
  }
  
  // Update table themes specifically
  updateTableThemes() {
    const isDark = this.options.theme === 'dark';
    const tables = this.editor.querySelectorAll('table');
    
    tables.forEach(table => {
      // Reset table styles first
      table.style.removeProperty('background');
      table.style.removeProperty('background-color');
      table.style.removeProperty('border-color');
      
      // Apply theme-specific styles
      if (isDark) {
        table.style.background = '#2a2a2a';
        table.style.borderColor = '#404040';
      } else {
        table.style.background = '#ffffff';
        table.style.borderColor = '#dee2e6';
      }
      
      // Update table headers
      const headers = table.querySelectorAll('th');
      headers.forEach(th => {
        const currentStyle = th.getAttribute('style') || '';
        
        if (isDark) {
          // For dark theme, check if it has special colors
          if (currentStyle.includes('background-color: #f59e0b') || 
              currentStyle.includes('background: #f59e0b') ||
              currentStyle.includes('background-color: #ef4444') || 
              currentStyle.includes('background: #ef4444') ||
              currentStyle.includes('background-color: #10b981') || 
              currentStyle.includes('background: #10b981') ||
              currentStyle.includes('background-color: #3b82f6') || 
              currentStyle.includes('background: #3b82f6')) {
            // Keep special colors but adjust for dark theme visibility
            th.style.color = 'white';
          } else {
            // Standard dark theme header
            th.style.background = '#404040';
            th.style.color = '#f0f0f0';
          }
          th.style.borderColor = '#404040';
        } else {
          // For light theme, reset and apply proper colors
          if (currentStyle.includes('background-color: #f59e0b') || 
              currentStyle.includes('background: #f59e0b')) {
            th.style.background = '#f59e0b';
            th.style.color = 'white';
          } else if (currentStyle.includes('background-color: #ef4444') || 
                    currentStyle.includes('background: #ef4444')) {
            th.style.background = '#ef4444';
            th.style.color = 'white';
          } else if (currentStyle.includes('background-color: #10b981') || 
                    currentStyle.includes('background: #10b981')) {
            th.style.background = '#10b981';
            th.style.color = 'white';
          } else if (currentStyle.includes('background-color: #3b82f6') || 
                    currentStyle.includes('background: #3b82f6')) {
            th.style.background = '#3b82f6';
            th.style.color = 'white';
          } else {
            // Standard light theme header
            th.style.background = '#f8f9fa';
            th.style.color = '#333333';
          }
          th.style.borderColor = '#dee2e6';
        }
      });
      
      // Update table cells
      const cells = table.querySelectorAll('td');
      cells.forEach(td => {
        // Reset cell styles first
        td.style.removeProperty('background');
        td.style.removeProperty('background-color');
        
        if (isDark) {
          td.style.color = '#e0e0e0';
          td.style.borderColor = '#404040';
          
          // Check if cell has special background colors and adjust
          const currentStyle = td.getAttribute('style') || '';
          if (currentStyle.includes('background-color:') || currentStyle.includes('background:')) {
            // Keep background but ensure text is visible
            if (currentStyle.includes('#ffffff') || currentStyle.includes('#f9fafb') || 
                currentStyle.includes('#f3f4f6') || currentStyle.includes('#fff')) {
              td.style.background = '#2a2a2a';
            }
          }
        } else {
          td.style.color = '#333333';
          td.style.borderColor = '#dee2e6';
          
          // Reset any dark theme backgrounds
          const currentStyle = td.getAttribute('style') || '';
          if (currentStyle.includes('background-color: #2a2a2a') || 
              currentStyle.includes('background: #2a2a2a')) {
            td.style.background = 'transparent';
          }
        }
      });
    });
  }

  // Apply theme to a specific element and its children
  applyThemeToElement(element) {
    const isDark = this.options.theme === 'dark';
    
    // Define color mappings
    const colorMappings = {
      // Dark colors to light for dark theme
      '#1f2937': isDark ? '#e0e0e0' : '#1f2937',
      '#374151': isDark ? '#e0e0e0' : '#374151', 
      '#111827': isDark ? '#f0f0f0' : '#111827',
      '#6b7280': isDark ? '#b0b0b0' : '#6b7280',
      '#333333': isDark ? '#e0e0e0' : '#333333',
      '#000000': isDark ? '#f0f0f0' : '#000000',
      '#2c3e50': isDark ? '#e0e0e0' : '#2c3e50',
      '#34495e': isDark ? '#d0d0d0' : '#34495e',
      // Light backgrounds to dark for dark theme
      '#ffffff': isDark ? '#2a2a2a' : '#ffffff',
      '#f9fafb': isDark ? '#2a2a2a' : '#f9fafb',
      '#f3f4f6': isDark ? '#2a2a2a' : '#f3f4f6',
      '#f8f9fa': isDark ? '#2a2a2a' : '#f8f9fa',
      '#fff': isDark ? '#2a2a2a' : '#fff',
      // Borders
      '#e5e7eb': isDark ? '#404040' : '#e5e7eb',
      '#d1d5db': isDark ? '#404040' : '#d1d5db',
      '#dee2e6': isDark ? '#404040' : '#dee2e6'
    };
    
    // Get all elements with inline styles in the element
    const elementsWithInlineStyles = element.querySelectorAll('*[style]');
    
    // Include the element itself if it has styles
    if (element.hasAttribute('style')) {
      elementsWithInlineStyles.push(element);
    }
    
    elementsWithInlineStyles.forEach(el => {
      const style = el.getAttribute('style');
      let newStyle = style;
      
      // Replace colors in style attribute
      Object.keys(colorMappings).forEach(oldColor => {
        const newColor = colorMappings[oldColor];
        // Replace color values (case insensitive)
        newStyle = newStyle.replace(new RegExp(oldColor, 'gi'), newColor);
      });
      
      // Update style if changed
      if (newStyle !== style) {
        el.setAttribute('style', newStyle);
      }
    });
  }

  createMenuBar() {
    const menuBar = document.createElement('div');
    menuBar.className = 'menu-bar';

    // Define menu configurations with all toolbar functionalities
    const menuConfigs = [
      {
        label: 'File',
        items: [
          { 
            label: 'New Document',
            icon: '<i class="fas fa-file"></i>',
            action: () => this.createNewDocument()
          },
          { 
            label: 'Import Document',
            icon: '<i class="fas fa-file-import"></i>',
            action: () => this.importDocument()
          },
          { 
            label: 'Import Content',
            icon: '<i class="fas fa-file-import"></i>',
            action: () => this.toolbarBtns.import?.click()
          },
          { type: 'separator' },
          { 
            label: 'Export as HTML',
            icon: '<i class="fas fa-code"></i>',
            action: () => this.exportAsHTML()
          },
          { 
            label: 'View Source',
            icon: '<i class="fas fa-code"></i>',
            action: () => this.toggleSourceView()
          },
          { 
            label: 'Print',
            icon: '<i class="fas fa-print"></i>',
            action: () => window.print()
          }
        ]
      },
      {
        label: 'Edit',
        items: [
          { 
            label: 'Undo',
            icon: '<i class="fas fa-undo"></i>',
            action: () => document.execCommand('undo')
          },
          { 
            label: 'Redo',
            icon: '<i class="fas fa-redo"></i>',
            action: () => document.execCommand('redo')
          },
          { type: 'separator' },
          { 
            label: 'Cut',
            icon: '<i class="fas fa-cut"></i>',
            action: () => document.execCommand('cut')
          },
          { 
            label: 'Copy',
            icon: '<i class="fas fa-copy"></i>',
            action: () => document.execCommand('copy')
          },
          { 
            label: 'Paste',
            icon: '<i class="fas fa-paste"></i>',
            action: () => document.execCommand('paste')
          },
          { type: 'separator' },
          { 
            label: 'Select All',
            icon: '<i class="fas fa-check-square"></i>',
            action: () => document.execCommand('selectAll')
          }
        ]
      },
      {
        label: 'Format',
        items: [
          { 
            label: 'Bold',
            icon: '<i class="fas fa-bold"></i>',
            action: () => document.execCommand('bold')
          },
          { 
            label: 'Italic',
            icon: '<i class="fas fa-italic"></i>',
            action: () => document.execCommand('italic')
          },
          { 
            label: 'Underline',
            icon: '<i class="fas fa-underline"></i>',
            action: () => document.execCommand('underline')
          },
          { 
            label: 'Strikethrough',
            icon: '<i class="fas fa-strikethrough"></i>',
            action: () => document.execCommand('strikeThrough')
          },
          { 
            label: 'Superscript',
            icon: '<i class="fas fa-superscript"></i>',
            action: () => document.execCommand('superscript')
          },
          { 
            label: 'Subscript',
            icon: '<i class="fas fa-subscript"></i>',
            action: () => document.execCommand('subscript')
          },
          { type: 'separator' },
          { 
            label: 'Clear Formatting',
            icon: '<i class="fas fa-remove-format"></i>',
            action: () => document.execCommand('removeFormat')
          },
          { type: 'separator' },
          { 
            label: 'Text Color',
            icon: '<i class="fas fa-font"></i>',
            action: () => this.toolbarBtns.textColor?.click()
          },
          { 
            label: 'Background Color',
            icon: '<i class="fas fa-fill-drip"></i>',
            action: () => this.toolbarBtns.bgColor?.click()
          }
        ]
      },
      {
        label: 'Paragraph',
        items: [
          { 
            label: 'Heading 1',
            icon: '<i class="fas fa-heading"></i>',
            action: () => this.applyHeadingToSelection('H1')
          },
          { 
            label: 'Heading 2',
            icon: '<i class="fas fa-heading"></i>',
            action: () => this.applyHeadingToSelection('H2')
          },
          { 
            label: 'Heading 3',
            icon: '<i class="fas fa-heading"></i>',
            action: () => this.applyHeadingToSelection('H3')
          },
          { 
            label: 'Heading 4',
            icon: '<i class="fas fa-heading"></i>',
            action: () => this.applyHeadingToSelection('H4')
          },
          { 
            label: 'Heading 5',
            icon: '<i class="fas fa-heading"></i>',
            action: () => this.applyHeadingToSelection('H5')
          },
          { 
            label: 'Heading 6',
            icon: '<i class="fas fa-heading"></i>',
            action: () => this.applyHeadingToSelection('H6')
          },
          { 
            label: 'Paragraph',
            icon: '<i class="fas fa-paragraph"></i>',
            action: () => this.applyHeadingToSelection('P')
          },
          { type: 'separator' },
          { 
            label: 'Quote',
            icon: '<i class="fas fa-quote-right"></i>',
            action: () => document.execCommand('formatBlock', false, 'BLOCKQUOTE')
          },
          { 
            label: 'Code Block',
            icon: '<i class="fas fa-code"></i>',
            action: () => document.execCommand('formatBlock', false, 'PRE')
          },
          { type: 'separator' },
          { 
            label: 'Align Left',
            icon: '<i class="fas fa-align-left"></i>',
            action: () => document.execCommand('justifyLeft')
          },
          { 
            label: 'Align Center',
            icon: '<i class="fas fa-align-center"></i>',
            action: () => document.execCommand('justifyCenter')
          },
          { 
            label: 'Align Right',
            icon: '<i class="fas fa-align-right"></i>',
            action: () => document.execCommand('justifyRight')
          },
          { 
            label: 'Justify',
            icon: '<i class="fas fa-align-justify"></i>',
            action: () => document.execCommand('justifyFull')
          },
          { type: 'separator' },
          { 
            label: 'Increase Indent',
            icon: '<i class="fas fa-indent"></i>',
            action: () => this.applyPaddingIndentToSelection(true)
          },
          { 
            label: 'Decrease Indent',
            icon: '<i class="fas fa-outdent"></i>',
            action: () => this.applyPaddingIndentToSelection(false)
          },
          { type: 'separator' },
          { 
            label: 'Bulleted List',
            icon: '<i class="fas fa-list-ul"></i>',
            action: () => document.execCommand('insertUnorderedList')
          },
          { 
            label: 'Numbered List',
            icon: '<i class="fas fa-list-ol"></i>',
            action: () => document.execCommand('insertOrderedList')
          }
        ]
      },
      {
        label: 'Insert',
        items: [
          { 
            label: 'Image',
            icon: '<i class="far fa-image"></i>',
            action: () => this.insertImage()
          },
          { 
            label: 'Table',
            icon: '<i class="fas fa-table"></i>',
            action: () => this.toolbarBtns.table?.click()
          },
          { 
            label: 'Link',
            icon: '<i class="fas fa-link"></i>',
            action: () => this.insertLink()
          },
          { type: 'separator' },
          { 
            label: 'Emoji',
            icon: '<i class="far fa-smile"></i>',
            action: () => this.insertEmoji()
          },
          { 
            label: 'Video',
            icon: '<i class="fas fa-video"></i>',
            action: () => this.insertVideo()
          },
          { type: 'separator' },
          { 
            label: 'Tags',
            icon: '<i class="fas fa-tags"></i>',
            action: () => this.toolbarBtns.insertTags?.click()
          },
          { 
            label: 'Template',
            icon: '<i class="fas fa-file-alt"></i>',
            action: () => this.toolbarBtns.insertTemplate?.click()
          }
        ]
      },
      {
        label: 'Tools',
        items: [
          { 
            label: 'Font Family',
            icon: '<i class="fas fa-font"></i>',
            action: () => this.showFontSelector()
          },
          { 
            label: 'Font Size',
            icon: '<i class="fas fa-text-height"></i>',
            action: () => this.showFontSizeSelector()
          },
          { 
            label: 'Line Height',
            icon: '<i class="fas fa-arrows-alt-v"></i>',
            action: () => this.showLineHeightSelector()
          },
          { type: 'separator' },
          { 
            label: 'Uppercase',
            icon: '<i class="fas fa-font"></i>',
            action: () => this.applyCapitalization('uppercase')
          },
          { 
            label: 'Lowercase',
            icon: '<i class="fas fa-font"></i>',
            action: () => this.applyCapitalization('lowercase')
          },
          { 
            label: 'Title Case',
            icon: '<i class="fas fa-font"></i>',
            action: () => this.applyCapitalization('titlecase')
          },
          { 
            label: 'Capitalize First',
            icon: '<i class="fas fa-font"></i>',
            action: () => this.applyCapitalization('capitalize')
          }
        ]
      },
      {
        label: 'View',
        items: [
          { 
            label: 'Dark Theme',
            icon: '<i class="fas fa-moon"></i>',
            action: () => this.toggleTheme()
          },
          { 
            label: 'Light Theme',
            icon: '<i class="fas fa-sun"></i>',
            action: () => {
              if (this.options.theme === 'dark') {
                this.toggleTheme();
              }
            }
          },
          { type: 'separator' },
          { 
            label: 'Zoom In',
            icon: '<i class="fas fa-search-plus"></i>',
            action: () => this.adjustEditorZoom(1.1)
          },
          { 
            label: 'Zoom Out',
            icon: '<i class="fas fa-search-minus"></i>',
            action: () => this.adjustEditorZoom(0.9)
          },
          { 
            label: 'Reset Zoom',
            icon: '<i class="fas fa-search"></i>',
            action: () => this.resetEditorZoom()
          }
        ]
      }
    ];

    // Create dropdown buttons for each menu
    menuConfigs.forEach(menuConfig => {
      const dropdownBtn = this.createDropdownButton(menuConfig.label, menuConfig.items);
      menuBar.appendChild(dropdownBtn);
    });

    return menuBar;
  }

  createDropdownButton(label, items) {
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.display = 'inline-block';

    // Create the button
    const button = document.createElement('button');
    button.className = 'tox-mbtn tox-mbtn--select';
    button.setAttribute('aria-haspopup', 'true');
    button.setAttribute('role', 'menuitem');
    button.setAttribute('type', 'button');
    button.setAttribute('tabindex', '-1');
    button.setAttribute('data-alloy-tabstop', 'true');
    button.setAttribute('unselectable', 'on');
    button.setAttribute('aria-expanded', 'false');

    // Button label
    const labelSpan = document.createElement('span');
    labelSpan.className = 'tox-mbtn__select-label';
    labelSpan.textContent = label;
    button.appendChild(labelSpan);

    // Chevron
    const chevronDiv = document.createElement('div');
    chevronDiv.className = 'tox-mbtn__select-chevron';
    chevronDiv.innerHTML = `
      <svg width="10" height="10" focusable="false">
        <path d="M8.7 2.2c.3-.3.8-.3 1 0 .4.4.4.9 0 1.2L5.7 7.8c-.3.3-.9.3-1.2 0L.2 3.4a.8.8 0 0 1 0-1.2c.3-.3.8-.3 1.1 0L5 6l3.7-3.8Z" fill-rule="nonzero"></path>
      </svg>
    `;
    button.appendChild(chevronDiv);

    // Create dropdown menu
    const menu = document.createElement('div');
    menu.className = 'tox-menu';

    items.forEach(item => {
      if (item.type === 'separator') {
        const separator = document.createElement('div');
        separator.className = 'tox-collection__item-separator';
        menu.appendChild(separator);
      } else {
        const menuItem = document.createElement('div');
        menuItem.className = 'tox-collection__item';
        
        if (item.icon) {
          const iconDiv = document.createElement('div');
          iconDiv.className = 'tox-collection__item-icon';
          iconDiv.innerHTML = item.icon;
          menuItem.appendChild(iconDiv);
        }

        const labelDiv = document.createElement('div');
        labelDiv.className = 'tox-collection__item-label';
        labelDiv.textContent = item.label;
        menuItem.appendChild(labelDiv);

        menuItem.addEventListener('click', (e) => {
          e.stopPropagation();
          this.closeAllDropdowns();
          if (item.action) {
            item.action();
          }
          this.editor.focus();
        });

        menu.appendChild(menuItem);
      }
    });

    // Toggle dropdown on button click
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = button.getAttribute('aria-expanded') === 'true';
      
      this.closeAllDropdowns();
      
      if (!isOpen) {
        button.setAttribute('aria-expanded', 'true');
        menu.classList.add('tox-menu--visible');
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        button.setAttribute('aria-expanded', 'false');
        menu.classList.remove('tox-menu--visible');
      }
    });

    container.appendChild(button);
    container.appendChild(menu);

    // Store menu reference for later cleanup
    if (!this.dropdownMenus[label]) {
      this.dropdownMenus[label] = { button, menu, container };
    }

    return container;
  }

  closeAllDropdowns() {
    Object.values(this.dropdownMenus).forEach(({ button, menu }) => {
      button.setAttribute('aria-expanded', 'false');
      menu.classList.remove('tox-menu--visible');
    });
  }

  // Menu action methods
  createNewDocument() {
    if (confirm('This will clear the current document. Are you sure?')) {
      this.editor.innerHTML = '<p>Start typing here...</p>';
      this.updateStatusbar();
    }
  }

  importDocument() {
    this.savedSelection = this.saveSelection();
    this.showTooltip({
      title: 'Import Document',
      placeholder: 'Paste HTML content to import...',
      confirmText: 'Import',
      showImportOptions: true,
      onSubmit: (content, fileType) => this.importContent(content, fileType)
    });
  }

  exportAsHTML() {
    const htmlContent = this.editor.innerHTML;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  insertImage() {
    this.savedSelection = this.saveSelection();
    this.showTooltip({
      title: 'Insert Image',
      placeholder: 'Paste image URL or select file...',
      confirmText: 'Insert',
      file: true,
      onSubmit: url => this.insertImageWithStyle(url)
    });
  }

  insertLink() {
    this.showTooltip({
      title: 'Insert Link',
      placeholder: 'Enter URL (https://...)',
      confirmText: 'Insert',
      onSubmit: url => document.execCommand('createLink', false, url)
    });
  }

  insertEmoji() {
    this.savedEmojiSelection = this.saveSelection();
    this.showTooltip({
      title: 'Insert Emoji',
      placeholder: 'Search or select emoji...',
      confirmText: 'Insert',
      emojis: true,
      onSubmit: emoji => {
        this.restoreSelection(this.savedEmojiSelection);
        this.editor.focus();
        const sel = window.getSelection();
        if (sel.rangeCount && this.editor.contains(sel.anchorNode)) {
          sel.getRangeAt(0).insertNode(document.createTextNode(emoji));
        } else {
          this.editor.appendChild(document.createTextNode(emoji));
        }
      }
    });
  }

  insertVideo() {
    this.savedSelection = this.saveSelection();
    this.showTooltip({
      title: 'Insert Video',
      placeholder: 'Paste video URL (YouTube, Vimeo, etc.)...',
      confirmText: 'Insert',
      onSubmit: url => this.insertVideo(url)
    });
  }

  // Helper methods for dropdown menu functionalities
  showFontSelector() {
    // Focus on the font selector in toolbar
    const fontSelect = this.wrapper.querySelector('.font-select');
    if (fontSelect) {
      fontSelect.focus();
      fontSelect.click();
    }
  }

  showFontSizeSelector() {
    // Focus on the font size selector in toolbar
    const fontSizeSelect = this.fontSizeSelector;
    if (fontSizeSelect) {
      fontSizeSelect.focus();
      fontSizeSelect.click();
    }
  }

  showLineHeightSelector() {
    // Focus on the line height selector in toolbar
    const lineHeightSelect = this.lineHeightSelector;
    if (lineHeightSelect) {
      lineHeightSelect.focus();
      lineHeightSelect.click();
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
}

export function createEditor(selector, options) {
  return new Editor(selector, options);
} 