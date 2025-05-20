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
        'image', 'table', 'heading', 'list', 'quote', 'code'
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
      { icon: '<i class="fas fa-table"></i>', title: 'Table', cmd: 'table' }
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
    this.editor.addEventListener('input', () => this.updateStatusbar());
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
      if (e.key === 'Enter') {
        setTimeout(() => {
          const sel = window.getSelection();
          if (sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const node = range.startContainer;
            let block = node.nodeType === 3 ? node.parentNode : node;
            // Kiểm tra block là dòng trống: chỉ chứa <br> hoặc text rỗng
            let isEmptyBlock = false;
            if (block && (block.nodeName === 'DIV' || block.nodeName === 'P')) {
              if (
                block.textContent.trim() === '' ||
                (block.childNodes.length === 1 && block.childNodes[0].nodeName === 'BR')
              ) {
                isEmptyBlock = true;
              }
            }
            // Nếu block là editor-area và chỉ có 1 child là <br> hoặc text rỗng
            if (!isEmptyBlock && block === this.editor) {
              if (
                this.editor.childNodes.length === 1 &&
                (this.editor.firstChild.nodeName === 'BR' || this.editor.textContent.trim() === '')
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
          }
        }, 10);
      } else {
        this.hideBlockToolbar();
      }
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

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.style.padding = '10px';
    input.style.fontSize = '16px';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '5px';
    input.style.outline = 'none';
    tooltip.appendChild(input);

    let fileInput, fileLabel, filePreview;
    if (file) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.style.marginTop = '8px';
      fileLabel = document.createElement('label');
      fileLabel.textContent = 'Chọn file ảnh...';
      fileLabel.style.fontSize = '14px';
      fileLabel.style.marginTop = '4px';
      fileLabel.style.cursor = 'pointer';
      fileLabel.appendChild(fileInput);
      tooltip.appendChild(fileLabel);
      filePreview = document.createElement('img');
      filePreview.style.maxWidth = '100%';
      filePreview.style.maxHeight = '120px';
      filePreview.style.marginTop = '8px';
      filePreview.style.display = 'none';
      tooltip.appendChild(filePreview);
      fileInput.addEventListener('change', async () => {
        if (fileInput.files && fileInput.files[0]) {
          // Hiển thị preview
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
            alert('Upload ảnh thất bại!');
          }
          input.disabled = false;
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
      if (input.value.trim() && input.value !== 'Đang upload...') {
        onSubmit(input.value.trim());
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
      code: '<i class="fas fa-code"></i>'
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
    }
  }
}

export function createEditor(selector, options) {
  return new Editor(selector, options);
} 