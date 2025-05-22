// Editor.js - Editor library giống TinyMCE/Quill cấu hình được
import '../style.css';

export class Editor {
  constructor(selector, options = {}) {
    this.options = Object.assign({
      toolbar: [
        'bold', 'italic', 'underline', 'strike', 'emoji', 'image', 'link', 'table', 'undo', 'redo'
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
        'image', 'table', 'heading', 'list', 'quote', 'code','video','import'
      ]
    }, options);

    // Validate and adjust dimensions
    this.options.width = Math.min(this.options.width, this.options.maxWidth);
    this.options.height = Math.min(this.options.height, this.options.maxHeight);

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

    // Tính toán lại chiều cao editor-area
    setTimeout(() => this.updateEditorAreaHeight(), 0);
    window.addEventListener('resize', () => this.updateEditorAreaHeight());

    // Thêm block toolbar
    this.createBlockToolbar();
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
    const alignBtns = [
      { icon: '<i class="fas fa-align-left"></i>', title: 'Left', cmd: 'justifyLeft' },
      { icon: '<i class="fas fa-align-center"></i>', title: 'Center', cmd: 'justifyCenter' },
      { icon: '<i class="fas fa-align-right"></i>', title: 'Right', cmd: 'justifyRight' }
    ];

    alignBtns.forEach(btn => {
      const button = this.createBtn(btn.icon, btn.title, btn.cmd);
      toolbar.appendChild(button);
      this.toolbarBtns[btn.cmd] = button;
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

    // Thêm separator
    toolbar.appendChild(this.createSeparator());

    // Chèn nội dung
    const insertBtns = [
      { icon: '<i class="far fa-smile"></i>', title: 'Emoji', cmd: 'emoji' },
      { icon: '<i class="far fa-image"></i>', title: 'Image', cmd: 'image' },
      { icon: '<i class="fas fa-link"></i>', title: 'Link', cmd: 'link' },
      { icon: '<i class="fas fa-table"></i>', title: 'Table', cmd: 'table' },
      { icon: '<i class="fas fa-video"></i>', title: 'Video', cmd: 'video' },
      { icon: '<i class="fas fa-file-import"></i>', title: 'Import', cmd: 'import' }
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
    toolbar.appendChild(viewSourceBtn);
    this.toolbarBtns.viewSource = viewSourceBtn;

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

    this.editor.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
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
    document.addEventListener('selectionchange', () => this.updateStatusbar());

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
    // Breadcrumb
    const sel = window.getSelection();
    let node = sel.anchorNode;
    if (node && node.nodeType === 3) node = node.parentNode;
    let path = [];
    while (node && node !== this.editor && node.nodeType === 1) {
      path.unshift(node.tagName.toLowerCase());
      node = node.parentNode;
    }
    if (this.options.features.breadcrumb && this.statusbarEls.breadcrumb)
      this.statusbarEls.breadcrumb.textContent = path.join(' › ');
    // Wordcount
    if (this.options.features.wordCount && this.statusbarEls.wordcount) {
      const text = this.editor.innerText || '';
      const words = text.trim().split(/\s+/).filter(Boolean);
      this.statusbarEls.wordcount.textContent = words.length + ' words  |  ' + text.length + ' chars';
    }

    // Update toolbar buttons state based on current selection
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (range.collapsed) {
        // No selection, reset all buttons
        Object.values(this.toolbarBtns).forEach(btn => {
          if (btn.tagName === 'BUTTON' || btn.classList.contains('toolbar-btn')) {
            btn._setActive(false);
          }
        });
        return;
      }

      // Check text formatting
      const formatCommands = {
        'bold': 'bold',
        'italic': 'italic',
        'underline': 'underline',
        'strikeThrough': 'strike',
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
        'justifyRight': 'justifyRight'
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

      // Check text formatting
      Object.entries(formatCommands).forEach(([cmd, btnKey]) => {
        if (document.queryCommandState(cmd)) {
          const btn = this.toolbarBtns[btnKey];
          if (btn && (btn.tagName === 'BUTTON' || btn.classList.contains('toolbar-btn'))) {
            btn._setActive(true);
          }
        }
      });

      // Check block formatting
      const blockFormat = document.queryCommandValue('formatBlock').toLowerCase();
      Object.entries(blockCommands).forEach(([tag, btnKey]) => {
        if (blockFormat === tag) {
          const btn = this.toolbarBtns[btnKey];
          if (btn && (btn.tagName === 'BUTTON' || btn.classList.contains('toolbar-btn'))) {
            btn._setActive(true);
          }
        }
      });

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

      // Update font select if exists
      const fontSelect = this.toolbar.querySelector('.font-select');
      if (fontSelect) {
        const currentFont = document.queryCommandValue('fontName');
        if (currentFont) {
          fontSelect.value = currentFont;
        } else {
          fontSelect.value = 'default';
        }
      }
    }
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
    overlay.style.background = 'rgba(0,0,0,0.08)';
    overlay.style.zIndex = 9998;
    overlay.onclick = () => { close(); };

    const tooltip = document.createElement('div');
    tooltip.id = 'custom-tooltip';
    tooltip.style.position = 'fixed';
    tooltip.style.top = '120px';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translateX(-50%)';
    tooltip.style.background = '#fff';
    tooltip.style.border = '1px solid #ccc';
    tooltip.style.borderRadius = '10px';
    tooltip.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
    tooltip.style.padding = '20px 24px 16px 24px';
    tooltip.style.zIndex = 9999;
    tooltip.style.display = 'flex';
    tooltip.style.flexDirection = 'column';
    tooltip.style.gap = '12px';
    tooltip.style.minWidth = '320px';
    tooltip.style.maxWidth = '90vw';

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
        btn.style.border = '1px solid #eee';
        btn.style.borderRadius = '6px';
        btn.style.background = option.id === 'excel' ? '#e0f0ff' : '#fff';
        btn.style.color = option.id === 'excel' ? '#1976d2' : '#333';
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
              el.style.background = opt.id === option.id ? '#e0f0ff' : '#fff';
              el.style.color = opt.id === option.id ? '#1976d2' : '#333';
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
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '5px';
    input.style.outline = 'none';
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
    confirmBtn.style.background = '#007bff';
    confirmBtn.style.color = '#fff';
    confirmBtn.style.border = 'none';
    confirmBtn.style.borderRadius = '4px';
    confirmBtn.style.cursor = 'pointer';
    confirmBtn.style.fontWeight = 'bold';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Đóng';
    closeBtn.style.padding = '8px 18px';
    closeBtn.style.background = '#eee';
    closeBtn.style.color = '#333';
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
      import: '<i class="fas fa-file-import"></i>'
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
    }
  }
}

export function createEditor(selector, options) {
  return new Editor(selector, options);
} 