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
    window.addEventListener('resize', () => {
      this.updateEditorAreaHeight();
      // Re-add toolbar2 separators on resize
      setTimeout(() => this.addToolbar2RowSeparators(), 100);
    });

    // Thêm block toolbar
    this.createBlockToolbar();

    // Apply initial theme
    this.applyTheme();
    
    // Setup content observer to update theme when content changes
    this.setupContentObserver();
    
    // Add global click handler to close all dropdowns when clicking outside
    this.addGlobalClickHandler();
    
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

  addGlobalClickHandler() {
    // Add global click handler to close dropdowns when clicking outside
    document.addEventListener('mousedown', (e) => {
      // Check if click is inside any dropdown or toolbar button
      const clickedInsideDropdown = e.target.closest('#image-dropdown, #link-dropdown, #emoji-dropdown, #video-dropdown, #import-dropdown, .heading-dropdown, .fontsize-dropdown, .font-dropdown, .lineheight-dropdown, .capitalization-dropdown');
      const clickedInsideToolbarButton = e.target.closest('.toolbar button, .toolbar .custom-select-button');
      const clickedInsideColorPicker = this.colorPicker && this.colorPicker.contains(e.target);

      // If clicked outside all dropdowns and toolbar buttons, close all dropdowns
      if (!clickedInsideDropdown && !clickedInsideToolbarButton && !clickedInsideColorPicker) {
        this.closeAllDropdowns();
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

  // Helper function to create checkmark SVG
  createCheckmarkSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '10');
    svg.setAttribute('height', '11');
    svg.setAttribute('viewBox', '0 0 10 11');
    svg.setAttribute('fill', 'none');
    svg.style.marginLeft = '8px';
    svg.style.flexShrink = '0';

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('clip-path', 'url(#clip0_4_79)');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M9.68012 2.27338C9.93724 2.52649 9.93724 2.93753 9.68012 3.19063L4.41429 8.37417C4.15717 8.62728 3.73961 8.62728 3.48249 8.37417L0.849578 5.7824C0.592458 5.5293 0.592458 5.11826 0.849578 4.86516C1.1067 4.61205 1.52426 4.61205 1.78138 4.86516L3.94942 6.99729L8.75037 2.27338C9.00749 2.02028 9.42505 2.02028 9.68217 2.27338H9.68012Z');
    path.setAttribute('fill', 'black');

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPath.setAttribute('id', 'clip0_4_79');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '9.21519');
    rect.setAttribute('height', '10.3671');
    rect.setAttribute('fill', 'white');
    rect.setAttribute('transform', 'translate(0.658203 0.139252)');

    clipPath.appendChild(rect);
    defs.appendChild(clipPath);
    g.appendChild(path);
    svg.appendChild(g);
    svg.appendChild(defs);

    return svg;
  }

  // Helper function to update dropdown item checkmarks
  updateDropdownCheckmarks(dropdown, selectedValue, getValueFromItem) {
    const items = dropdown.querySelectorAll('.heading-dropdown-item, .font-dropdown-item, .fontsize-dropdown-item, .lineheight-dropdown-item, .capitalization-dropdown-item');
    
    items.forEach(item => {
      // Remove existing checkmark
      const existingCheckmark = item.querySelector('svg');
      if (existingCheckmark) {
        existingCheckmark.remove();
      }
      
      // Get item value
      const itemValue = getValueFromItem(item);
      
      // Add checkmark if this is the selected item
      if (itemValue === selectedValue) {
        const checkmark = this.createCheckmarkSVG();
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.justifyContent = 'space-between';
        item.appendChild(checkmark);
      } else {
        // Reset display if no checkmark
        item.style.display = 'block';
        item.style.justifyContent = 'flex-start';
      }
    });
  }

  createToolbar() {
    // Tạo container chứa cả 2 toolbar
    const toolbarContainer = document.createElement('div');
    toolbarContainer.className = 'toolbar-container';
    toolbarContainer.style.display = 'flex';
    toolbarContainer.style.flexDirection = 'column';
    toolbarContainer.style.width = '100%';
    toolbarContainer.style.borderTopLeftRadius = '6px';
    toolbarContainer.style.borderTopRightRadius = '6px';

    // ============ TOOLBAR 1 - Basic formatting ============
    const toolbar1 = document.createElement('div');
    toolbar1.className = 'toolbar toolbar-primary';
    toolbar1.style.padding = '8px 16px';
    toolbar1.style.display = 'flex';
    toolbar1.style.justifyContent = 'space-between';
    toolbar1.style.gap = '20px';
    toolbar1.style.flexWrap = 'wrap';
    toolbar1.style.background = '#FCFCFC';
    toolbar1.style.alignItems = 'center';
    toolbar1.style.minHeight = '48px';
    toolbar1.style.paddingBottom = '8px';
    toolbar1.style.boxSizing = 'border-box';
    toolbar1.style.width = '100%';
    toolbar1.style.overflow = 'hidden';

    // Lưu các nút để có thể truy cập sau này

    // B, I, U buttons
    const basicFormatBtns = [
      { icon: '<i class="fas fa-bold"></i>', title: 'Bold', cmd: 'bold' },
      { icon: '<i class="fas fa-italic"></i>', title: 'Italic', cmd: 'italic' },
      { icon: '<i class="fas fa-underline"></i>', title: 'Underline', cmd: 'underline' },
      { icon: '<i class="fas fa-strikethrough"></i>', title: 'Strike', cmd: 'strikeThrough' }
    ];
    const typeibiu = document.createElement('div');
    typeibiu.style.gap = '12px';
    typeibiu.style.alignItems = 'center';
    typeibiu.style.display = 'flex';
    basicFormatBtns.forEach(btn => {
      const button = this.createBtn(btn.icon, btn.title, btn.cmd);
      typeibiu.appendChild(button);
      this.toolbarBtns[btn.cmd] = button;
    });
    toolbar1.appendChild(typeibiu);

    // Superscript and Subscript
    const typesup = document.createElement('div');
    typesup.style.gap = '12px';
    typesup.style.alignItems = 'center';
    typesup.style.display = 'flex'; 
    const scriptBtns = [
      { icon: '<i class="fas fa-superscript"></i>', title: 'Superscript', cmd: 'superscript' },
      { icon: '<i class="fas fa-subscript"></i>', title: 'Subscript', cmd: 'subscript' }
    ];

    scriptBtns.forEach(btn => {
      const button = this.createBtn(btn.icon, btn.title, btn.cmd);
      typesup.appendChild(button);
      this.toolbarBtns[btn.cmd] = button;
    });
    toolbar1.appendChild(typesup);
    // Text Color and Background Color buttons
    const typecolor = document.createElement('div');
    typecolor.style.gap = '12px';
    typecolor.style.alignItems = 'center';
    typecolor.style.display = 'flex';

    const textColorBtn = this.createColorBtn('<i class="fas fa-font"></i>', 'Text Color', 'textColor');
    typecolor.appendChild(textColorBtn);
    this.toolbarBtns.textColor = textColorBtn;

    const bgColorBtn = this.createColorBtn('<i class="fas fa-fill-drip"></i>', 'Background Color', 'bgColor');
    typecolor.appendChild(bgColorBtn);
    this.toolbarBtns.bgColor = bgColorBtn;
    toolbar1.appendChild(typecolor);

    
    // Link button
    const linkBtn = this.createBtn('<i class="fas fa-link"></i>', 'Link', 'link');
    toolbar1.appendChild(linkBtn);
    this.toolbarBtns.link = linkBtn;


    // Heading/Block selector (custom button + dropdown)
    const headingDropdownWrapper = document.createElement('div');
    headingDropdownWrapper.className = 'heading-dropdown-wrapper';
    headingDropdownWrapper.style.position = 'relative';
    headingDropdownWrapper.style.display = 'inline-block';

    // Button để mở dropdown
    const headingBtn = this.createBtn('Paragraph');
    headingBtn.className = 'custom-select-button';
    headingBtn.style.width = '120px';
    headingBtn.style.padding = '0px 5px 0px 8px';
    headingBtn.style.setProperty('height', '32px', 'important');
    headingBtn.style.setProperty('borderRadius', '6px', 'important');
    headingBtn.style.setProperty('alignItems', 'center', 'important');
    headingBtn.style.fontSize = '14px';
    headingBtn.style.fontWeight = '400';
    headingBtn.style.color = '#374151';
    headingBtn.style.background = '#FFFFFF';
    headingBtn.style.cursor = 'pointer';
    
    // Override event handlers để giữ nguyên border
    headingBtn.onmouseover = () => {
      headingBtn.style.setProperty('background', '#f8f9fa', 'important');
    };
    
    headingBtn.onmouseout = () => {
      headingBtn.style.setProperty('background', '#FFFFFF', 'important');
    };
    
    
    // Thêm icon dropdown SVG
    const dropdownIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    dropdownIcon.setAttribute('width', '12');
    dropdownIcon.setAttribute('height', '12');
    dropdownIcon.setAttribute('viewBox', '0 0 8 7');
    dropdownIcon.setAttribute('fill', 'none');
    dropdownIcon.style.marginLeft = 'auto';
    dropdownIcon.style.opacity = '0.7';

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('clip-path', 'url(#clip0_4_66)');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M3.81655 5.55897C3.98745 5.72987 4.26499 5.72987 4.43589 5.55897L7.06089 2.93397C7.23179 2.76307 7.23179 2.48553 7.06089 2.31464C6.88999 2.14374 6.61245 2.14374 6.44155 2.31464L4.12554 4.63065L1.80952 2.316C1.63862 2.1451 1.36108 2.1451 1.19019 2.316C1.01929 2.4869 1.01929 2.76444 1.19019 2.93534L3.81519 5.56034L3.81655 5.55897Z');
    path.setAttribute('fill', '#CCCCCC');

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPath.setAttribute('id', 'clip0_4_66');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '7');
    rect.setAttribute('height', '7');
    rect.setAttribute('fill', 'white');
    rect.setAttribute('transform', 'translate(0.625488)');

    clipPath.appendChild(rect);
    defs.appendChild(clipPath);
    g.appendChild(path);
    dropdownIcon.appendChild(g);
    dropdownIcon.appendChild(defs);
    
    headingBtn.appendChild(dropdownIcon);

    // Dropdown div
    const headingDropdown = document.createElement('div');
    headingDropdown.className = 'heading-dropdown';
    headingDropdown.style.display = 'none';
    headingDropdown.style.position = 'fixed';
    headingDropdown.style.zIndex = '99999';
    headingDropdown.style.border = '1px solid #E1E1E1 !important';
    headingDropdown.style.borderRadius = '3px !important';
    headingDropdown.style.background = this.options.theme === 'dark' ? '#2a2a2a' : '#fff';
    headingDropdown.style.fontSize = '12px !important';
    headingDropdown.style.fontWeight = '400 !important';
    headingDropdown.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
    headingDropdown.style.padding = '6px 0';
    headingDropdown.style.minWidth = '180px';

    headingDropdown.style.maxHeight = '320px';
    headingDropdown.style.overflowY = 'auto';

    const headingOptions = [
      { value: 'P', text: '<p style="margin:0;font-size:15px;">Paragraph</p>', displayText: 'Paragraph' },
      { value: 'H1', text: '<h1 style="margin:0;">Heading 1</h1>', displayText: 'Heading 1' },
      { value: 'H2', text: '<h2 style="margin:0;">Heading 2</h2>', displayText: 'Heading 2' },
      { value: 'H3', text: '<h3 style="margin:0;">Heading 3</h3>', displayText: 'Heading 3' },
      { value: 'H4', text: '<h4 style="margin:0;">Heading 4</h4>', displayText: 'Heading 4' },
      { value: 'H5', text: '<h5 style="margin:0;">Heading 5</h5>', displayText: 'Heading 5' },
      { value: 'H6', text: '<h6 style="margin:0;">Heading 6</h6>', displayText: 'Heading 6' },
      { value: 'PRE', text: '<pre style="margin:0;">Code Block</pre>', displayText: 'Code Block' },
      { value: 'BLOCKQUOTE', text: '<blockquote style="margin:0;">Quote</blockquote>', displayText: 'Quote' }
    ];

    headingOptions.forEach(option => {
      const item = document.createElement('div');
      item.className = 'heading-dropdown-item';
      item.innerHTML = option.text;
      item.style.padding = '2px';
      item.style.minHeight='20px';

      item.style.cursor = 'pointer';
      item.style.fontSize = '14px';
      item.style.transition = 'background 0.18s';
      item.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#374151';
      item.addEventListener('mouseover', () => {
        item.style.background = this.options.theme === 'dark' ? '#404040' : '#f0f4fa';
      });
      item.addEventListener('mouseout', () => {
        item.style.background = 'transparent';
      });
      item.addEventListener('click', () => {
        headingDropdown.style.display = 'none';
        
        // Update checkmarks for all items
        this.updateDropdownCheckmarks(headingDropdown, option.value, (item) => {
          // Get value from the option that created this item
          const itemIndex = Array.from(headingDropdown.children).indexOf(item);
          return headingOptions[itemIndex]?.value;
        });
        
        // Cập nhật text của nút (giữ lại dropdown icon)
        const textNode = headingBtn.firstChild;
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          textNode.textContent = option.displayText;
        } else {
          // Nếu không tìm thấy text node, tạo lại nội dung button
          headingBtn.innerHTML = option.displayText;
          const dropdownIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          dropdownIcon.setAttribute('width', '8');
          dropdownIcon.setAttribute('height', '7');
          dropdownIcon.setAttribute('viewBox', '0 0 8 7');
          dropdownIcon.setAttribute('fill', 'none');
          dropdownIcon.style.marginLeft = 'auto';
          dropdownIcon.style.opacity = '0.7';

          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          g.setAttribute('clip-path', 'url(#clip0_4_66_alt)');

          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', 'M3.81655 5.55897C3.98745 5.72987 4.26499 5.72987 4.43589 5.55897L7.06089 2.93397C7.23179 2.76307 7.23179 2.48553 7.06089 2.31464C6.88999 2.14374 6.61245 2.14374 6.44155 2.31464L4.12554 4.63065L1.80952 2.316C1.63862 2.1451 1.36108 2.1451 1.19019 2.316C1.01929 2.4869 1.01929 2.76444 1.19019 2.93534L3.81519 5.56034L3.81655 5.55897Z');
          path.setAttribute('fill', '#CCCCCC');

          const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
          const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
          clipPath.setAttribute('id', 'clip0_4_66_alt');
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('width', '7');
          rect.setAttribute('height', '7');
          rect.setAttribute('fill', 'white');
          rect.setAttribute('transform', 'translate(0.625488)');

          clipPath.appendChild(rect);
          defs.appendChild(clipPath);
          g.appendChild(path);
          dropdownIcon.appendChild(g);
          dropdownIcon.appendChild(defs);
          
          headingBtn.appendChild(dropdownIcon);
        }
        
        if (this.savedHeadingSelection) {
          this.restoreSelection(this.savedHeadingSelection);
        }
        console.log('Applying heading:', option.value); // Debug log
        this.applyHeadingToSelection(option.value);
      });
      headingDropdown.appendChild(item);
    });

    // Hiển thị dropdown khi bấm nút
    headingBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Check if dropdown is already visible
      const isVisible = headingDropdown.style.display === 'block';
      
      // Close all dropdowns first (including insert dropdowns)
      this.closeAllDropdowns();
      
      // If it wasn't visible, show it
      if (!isVisible) {
        // Save selection trước khi hiển thị dropdown
        this.savedHeadingSelection = this.saveSelection();
        
        // Get current heading to show checkmark
        const block = this.getBlockElementAtCaret();
        const currentHeading = block ? block.tagName.toUpperCase() : 'P';
        
        // Update checkmarks before showing dropdown
        this.updateDropdownCheckmarks(headingDropdown, currentHeading, (item) => {
          const itemIndex = Array.from(headingDropdown.children).indexOf(item);
          return headingOptions[itemIndex]?.value;
        });
        
        // Tính toán vị trí xuất hiện của dropdown
        const rect = headingBtn.getBoundingClientRect();
        headingDropdown.style.display = 'block';
        headingDropdown.style.top = (rect.bottom + 5) + 'px';
        headingDropdown.style.left = rect.left + 'px';
      }
    });

    // Ẩn dropdown khi click ra ngoài
    document.addEventListener('mousedown', (e) => {
      if (!headingDropdown.contains(e.target) && e.target !== headingBtn) {
        headingDropdown.style.display = 'none';
      }
    });

    headingDropdownWrapper.appendChild(headingBtn);
    headingDropdownWrapper.appendChild(headingDropdown);
    toolbar1.appendChild(headingDropdownWrapper);
    this.headingSelector = headingBtn; // Để updateHeadingSelector không lỗi
    
    // Lưu reference để có thể cập nhật button text từ bên ngoài
    this.headingButton = headingBtn;
    this.headingOptions = headingOptions;
    // Font size dropdown
    const fontSizeDropdownWrapper = document.createElement('div');
    fontSizeDropdownWrapper.className = 'fontsize-dropdown-wrapper';
    fontSizeDropdownWrapper.style.position = 'relative';
    fontSizeDropdownWrapper.style.display = 'inline-block';

    const fontSizeBtn = this.createBtn('16px');
    fontSizeBtn.className = 'custom-select-button';
    fontSizeBtn.style.width = '80px';
    fontSizeBtn.style.padding = '0px 5px 0px 8px';
    fontSizeBtn.style.setProperty('height', '32px', 'important');
    fontSizeBtn.style.setProperty('borderRadius', '6px', 'important');
    fontSizeBtn.style.setProperty('alignItems', 'center', 'important');
    fontSizeBtn.style.fontSize = '14px';
    fontSizeBtn.style.fontWeight = '400';
    fontSizeBtn.style.color = '#374151';
    fontSizeBtn.style.background = '#FFFFFF';
    fontSizeBtn.style.cursor = 'pointer';
    
    fontSizeBtn.onmouseover = () => {
      fontSizeBtn.style.setProperty('background', '#f8f9fa', 'important');
    };
    
    fontSizeBtn.onmouseout = () => {
      fontSizeBtn.style.setProperty('background', '#FFFFFF', 'important');
    };

    // Add dropdown icon
    const fontSizeDropdownIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    fontSizeDropdownIcon.setAttribute('width', '12');
    fontSizeDropdownIcon.setAttribute('height', '12');
    fontSizeDropdownIcon.setAttribute('viewBox', '0 0 8 7');
    fontSizeDropdownIcon.setAttribute('fill', 'none');
    fontSizeDropdownIcon.style.marginLeft = 'auto';
    fontSizeDropdownIcon.style.opacity = '0.7';

    const fontSizeG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    fontSizeG.setAttribute('clip-path', 'url(#clip0_fontsize)');

    const fontSizePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    fontSizePath.setAttribute('d', 'M3.81655 5.55897C3.98745 5.72987 4.26499 5.72987 4.43589 5.55897L7.06089 2.93397C7.23179 2.76307 7.23179 2.48553 7.06089 2.31464C6.88999 2.14374 6.61245 2.14374 6.44155 2.31464L4.12554 4.63065L1.80952 2.316C1.63862 2.1451 1.36108 2.1451 1.19019 2.316C1.01929 2.4869 1.01929 2.76444 1.19019 2.93534L3.81519 5.56034L3.81655 5.55897Z');
    fontSizePath.setAttribute('fill', '#CCCCCC');

    const fontSizeDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const fontSizeClipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    fontSizeClipPath.setAttribute('id', 'clip0_fontsize');
    const fontSizeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    fontSizeRect.setAttribute('width', '7');
    fontSizeRect.setAttribute('height', '7');
    fontSizeRect.setAttribute('fill', 'white');
    fontSizeRect.setAttribute('transform', 'translate(0.625488)');

    fontSizeClipPath.appendChild(fontSizeRect);
    fontSizeDefs.appendChild(fontSizeClipPath);
    fontSizeG.appendChild(fontSizePath);
    fontSizeDropdownIcon.appendChild(fontSizeG);
    fontSizeDropdownIcon.appendChild(fontSizeDefs);
    
    fontSizeBtn.appendChild(fontSizeDropdownIcon);

    // Font size dropdown
    const fontSizeDropdown = document.createElement('div');
    fontSizeDropdown.className = 'fontsize-dropdown';
    fontSizeDropdown.style.display = 'none';
    fontSizeDropdown.style.position = 'fixed';
    fontSizeDropdown.style.zIndex = '99999';
    fontSizeDropdown.style.border = '1px solid #E1E1E1 !important';
    fontSizeDropdown.style.borderRadius = '3px !important';
    fontSizeDropdown.style.background = this.options.theme === 'dark' ? '#2a2a2a' : '#fff';
    fontSizeDropdown.style.fontSize = '12px !important';
    fontSizeDropdown.style.fontWeight = '400 !important';
    fontSizeDropdown.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
    fontSizeDropdown.style.padding = '6px 0';
    fontSizeDropdown.style.minWidth = '100px';
    fontSizeDropdown.style.maxHeight = '320px';
    fontSizeDropdown.style.overflowY = 'auto';

    const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 44, 48, 54, 60, 66, 72];

    fontSizes.forEach(size => {
      const item = document.createElement('div');
      item.className = 'fontsize-dropdown-item';
      item.textContent = size + 'px';
      item.style.padding = '2px';
      item.style.minHeight='20px';

      item.style.cursor = 'pointer';
      item.style.fontSize = '14px';
      item.style.transition = 'background 0.18s';
      item.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#374151';
      
      item.addEventListener('mouseover', () => {
        item.style.background = this.options.theme === 'dark' ? '#404040' : '#f0f4fa';
      });
      item.addEventListener('mouseout', () => {
        item.style.background = 'transparent';
      });
      item.addEventListener('click', () => {
        fontSizeDropdown.style.display = 'none';
        
        // Update checkmarks for all items
        this.updateDropdownCheckmarks(fontSizeDropdown, size + 'px', (item) => {
          return item.textContent;
        });
        
        // Update button text
        const textNode = fontSizeBtn.firstChild;
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          textNode.textContent = size + 'px';
        } else {
          fontSizeBtn.innerHTML = size + 'px';
          fontSizeBtn.appendChild(fontSizeDropdownIcon.cloneNode(true));
        }
        
        if (this.savedFontSizeSelection) {
          this.restoreSelection(this.savedFontSizeSelection);
        }
        
        this.setFontSize(size);
      });
      fontSizeDropdown.appendChild(item);
    });

    fontSizeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Check if dropdown is already visible
      const isVisible = fontSizeDropdown.style.display === 'block';
      
      // Close all dropdowns first (including insert dropdowns)
      this.closeAllDropdowns();
      
      // If it wasn't visible, show it
      if (!isVisible) {
        this.savedFontSizeSelection = this.saveSelection();
        
        // Get current font size to show checkmark
        const currentSize = fontSizeBtn.textContent || '16px';
        
        // Update checkmarks before showing dropdown
        this.updateDropdownCheckmarks(fontSizeDropdown, currentSize, (item) => {
          return item.textContent;
        });
        
        const rect = fontSizeBtn.getBoundingClientRect();
        fontSizeDropdown.style.display = 'block';
        fontSizeDropdown.style.top = (rect.bottom + 5) + 'px';
        fontSizeDropdown.style.left = rect.left + 'px';
      }
    });

    document.addEventListener('mousedown', (e) => {
      if (!fontSizeDropdown.contains(e.target) && e.target !== fontSizeBtn) {
        fontSizeDropdown.style.display = 'none';
      }
    });

    fontSizeDropdownWrapper.appendChild(fontSizeBtn);
    fontSizeDropdownWrapper.appendChild(fontSizeDropdown);
    toolbar1.appendChild(fontSizeDropdownWrapper);
    this.fontSizeSelector = fontSizeBtn;

    // Insert Table button
    const tableBtn = this.createBtn('<i class="fas fa-table"></i>', 'Insert Table', 'table');
    toolbar1.appendChild(tableBtn);
    this.toolbarBtns.table = tableBtn;


    // Align Justify button
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
    alignMenu.style.width = '98px';
    alignMenu.style.height = '115px';
    alignMenu.style.padding = '0';
    alignMenu.style.transition = 'all 0.2s ease';
    alignMenu.style.opacity = '0';
    alignMenu.style.pointerEvents = 'none';

    const alignOptions = [
      { icon: '<i class="fas fa-align-left"></i>', title: 'Left', cmd: 'justifyLeft' },
      { icon: '<i class="fas fa-align-center"></i>', title: 'Center', cmd: 'justifyCenter' },
      { icon: '<i class="fas fa-align-right"></i>', title: 'Right', cmd: 'justifyRight' },
      { icon: '<i class="fas fa-align-justify"></i>', title: 'Justify', cmd: 'justifyFull' }
    ];

    alignOptions.forEach((option, index) => {
      // Create button completely from scratch without createBtn
      const button = document.createElement('button');
      button.title = option.title;
      button.classList.add('align-dropdown-btn');
      
      // Create icon element
      const iconElement = document.createElement('i');
      iconElement.className = option.icon.match(/class="([^"]+)"/)[1];
      iconElement.style.marginLeft = '7px';
      
      // Create text element  
      const textElement = document.createElement('span');
      textElement.textContent = option.title;
      
      button.appendChild(iconElement);
      button.appendChild(textElement);
      
      // Apply styles directly - no inheritance from createBtn
      button.style.setProperty('width', '90px', 'important');
      button.style.setProperty('height', '24px', 'important');
      button.style.setProperty('min-width', 'auto', 'important');
      button.style.setProperty('min-height', 'auto', 'important');
      button.style.flexShrink = '0';
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'flex-start';
      button.style.setProperty('border', 'none', 'important');
      button.style.setProperty('outline', 'none', 'important');
      button.style.setProperty('box-shadow', 'none', 'important');
      button.style.setProperty('background', 'transparent', 'important');
      button.style.setProperty('background-color', 'transparent', 'important');
      button.style.cursor = 'pointer';
      button.style.transition = 'all 0.2s ease';
      button.style.color = '#374151';
      button.style.fontSize = '14px';
      button.style.gap = '5px';
      button.style.padding = '0px';
      button.style.outline = 'none';
      
      // Add spacing: 7px top for first item, 4px left/right for all items
      if (index === 0) {
        button.style.margin = '7px 4px 2px 4px';
        // Set first option as active by default
        button.classList.add('active');
        button.style.setProperty('background-color', '#EEE', 'important');
        button.style.setProperty('color', '#252424', 'important');
      } else {
        button.style.margin = '0px 4px 2px 4px';
      }
      
      button.addEventListener('mouseover', () => {
        button.style.setProperty('background-color', '#EEE', 'important');
        button.style.setProperty('color', '#252424', 'important');
      });
      
      button.addEventListener('mouseout', () => {
        // Keep #EEE if active, otherwise transparent
        if (!button.classList.contains('active')) {
          button.style.setProperty('background-color', 'transparent', 'important');
          button.style.setProperty('color', '#252424', 'important');
          button.style.setProperty('border', 'none', 'important');
        } else {
          button.style.setProperty('background-color', '#EEE', 'important');
          button.style.setProperty('color', '#252424', 'important');
        }
      });
      
      button.addEventListener('click', () => {
        // Remove active state from all buttons
        alignMenu.querySelectorAll('button').forEach(btn => {
          btn.classList.remove('active');
          btn.style.setProperty('background-color', 'transparent', 'important');
        });
        
        // Set active state for clicked button
        button.classList.add('active');
        button.style.setProperty('background-color', '#EEE', 'important');
        button.style.setProperty('color', '#252424', 'important');
        button.style.setProperty('border', 'none', 'important');
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
    toolbar1.appendChild(alignDropdown);

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
          alignMenu.style.pointerEvents = 'auto';
        });
      } else {
        alignMenu.style.opacity = '0';
        alignMenu.style.pointerEvents = 'none';
        setTimeout(() => {
          alignMenu.style.display = 'none';
        }, 200);
      }
    });

    // Thêm sự kiện click cho document để đóng dropdown khi click ra ngoài
    document.addEventListener('click', () => {
      alignMenu.style.opacity = '0';
      alignMenu.style.pointerEvents = 'none';
      setTimeout(() => {
        alignMenu.style.display = 'none';
      }, 200);
    });

    const unredo = document.createElement('div'); 
    unredo.style.gap = '12px';
    unredo.style.display = 'flex';
    // Undo and Redo buttons
    const undoBtn = this.createBtn('<i class="fas fa-undo"></i>', 'Undo', 'undo');
    unredo.appendChild(undoBtn);
    this.toolbarBtns.undo = undoBtn;

    const redoBtn = this.createBtn('<i class="fas fa-redo"></i>', 'Redo', 'redo');
    unredo.appendChild(redoBtn);
    this.toolbarBtns.redo = redoBtn;
    toolbar1.appendChild(unredo);
    // More options button (3 dots)
    const moreBtn = this.createBtn('<i class="fas fa-ellipsis-h"></i>', 'More Options');
    moreBtn.className = 'more-options-btn';
    toolbar1.appendChild(moreBtn);
    this.toolbarBtns.moreOptions = moreBtn;

    // ============ TOOLBAR 2 - Extended options ============
    const toolbar2 = document.createElement('div');
    toolbar2.className = 'toolbar toolbar-secondary';
    toolbar2.style.padding = '8px 16px';
    toolbar2.style.display = 'flex';
    toolbar2.style.gap = '20px';
    toolbar2.style.flexWrap = 'wrap';
    toolbar2.style.background = '#FCFCFC';
    toolbar2.style.alignItems = 'center';
    toolbar2.style.minHeight = '48px';
    toolbar2.style.paddingBottom = '8px';
    toolbar2.style.boxSizing = 'border-box';
    toolbar2.style.width = '100%';
    toolbar2.style.overflow = 'hidden';

    // Danh sách dropdown
    const listDropdown = document.createElement('div');
    listDropdown.className = 'toolbar-dropdown';
    listDropdown.style.position = 'relative';
    listDropdown.style.display = 'inline-block';

    const listBtn = this.createBtn('<i class="fas fa-list-ul"></i>', 'Lists');
    listDropdown.appendChild(listBtn);
    this.toolbarBtns['listDropdown'] = listBtn;

    const listMenu = document.createElement('div');
    listMenu.className = 'dropdown-menu';
    listMenu.style.display = 'none';
    listMenu.style.position = 'fixed';
    listMenu.style.zIndex = '999999';
    listMenu.style.backgroundColor = '#fff';
    listMenu.style.border = '1px solid #d1d5db';
    listMenu.style.borderRadius = '8px';
    listMenu.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    listMenu.style.width = 'auto';
    listMenu.style.height = 'auto';
    listMenu.style.padding = '12px';
    listMenu.style.transition = 'all 0.2s ease';
    listMenu.style.opacity = '0';
    listMenu.style.transform = 'translateY(-10px)';
    listMenu.style.pointerEvents = 'none';

    const listOptions = [
      { icon: '<i class="fas fa-list-ul"></i>', title: 'Unordered List', cmd: 'insertUnorderedList' },
      { icon: '<i class="fas fa-list-ol"></i>', title: 'Ordered List', cmd: 'insertOrderedList' },
      { icon: '<i class="fas fa-tasks"></i>', title: 'Task List', cmd: 'insertUnorderedList' },
      { icon: '<i class="fas fa-tasks"></i>', title: 'Task List', cmd: 'insertUnorderedList' },
      { icon: '<i class="fas fa-tasks"></i>', title: 'Task List', cmd: 'insertUnorderedList' },
    ];

    listOptions.forEach((option, index) => {
      const button = document.createElement('button');
      button.title = option.title;
      button.classList.add('list-dropdown-btn');
      
      const iconElement = document.createElement('i');
      iconElement.className = option.icon.match(/class="([^"]+)"/)[1];
      iconElement.style.fontSize = '16px';
      
      button.appendChild(iconElement);
      // No text element - only icon
      
      // Apply grid button styles
      button.style.setProperty('width', '32px', 'important');
      button.style.setProperty('height', '32px', 'important');
      button.style.setProperty('min-width', '32px', 'important');
      button.style.setProperty('min-height', '32px', 'important');
      button.style.flexShrink = '0';
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center';
      button.style.setProperty('border', 'none', 'important');
      button.style.setProperty('outline', 'none', 'important');
      button.style.setProperty('box-shadow', 'none', 'important');
      button.style.setProperty('background', 'transparent', 'important');
      button.style.setProperty('background-color', 'transparent', 'important');
      button.style.cursor = 'pointer';
      button.style.transition = 'all 0.2s ease';
      button.style.color = '#374151';
      button.style.padding = '0px';
      button.style.margin = '0';
      button.style.outline = 'none';
      button.style.borderRadius = '4px';
      
      // Grid handles spacing automatically, no manual margins needed
      
      button.addEventListener('mouseover', () => {
        button.style.setProperty('background-color', '#EEE', 'important');
        button.style.setProperty('color', '#252424', 'important');
      });
      
      button.addEventListener('mouseout', () => {
        if (!button.classList.contains('active')) {
          button.style.setProperty('background-color', 'transparent', 'important');
          button.style.setProperty('color', '#252424', 'important');
          button.style.setProperty('border', 'none', 'important');
        } else {
          button.style.setProperty('background-color', '#EEE', 'important');
          button.style.setProperty('color', '#252424', 'important');
        }
      });
      
      button.addEventListener('click', () => {
        // Remove active state from all buttons
        listMenu.querySelectorAll('button').forEach(btn => {
          btn.classList.remove('active');
          btn.style.setProperty('background-color', 'transparent', 'important');
        });
        
        // Set active state for clicked button
        button.classList.add('active');
        button.style.setProperty('background-color', '#EEE', 'important');
        button.style.setProperty('color', '#252424', 'important');
        button.style.setProperty('border', 'none', 'important');
        
        // Execute command
        document.execCommand(option.cmd, false, null);
        
        // Update main button icon
        listBtn.innerHTML = option.icon;
          
        // Close menu
        listMenu.style.display = 'none';
        listMenu.style.opacity = '0';
        listMenu.style.transform = 'translateY(-10px)';
        listMenu.style.pointerEvents = 'none';
        
        // Focus back to editor
        this.editor.focus();
      });
      
      // Store button reference for status updates (avoid duplicates)
      if (index < 2) { // Only store first two unique commands
        this.toolbarBtns[option.cmd] = button;
      }
      
      listMenu.appendChild(button);
    });

    // Append listMenu to document.body to avoid z-index issues
    document.body.appendChild(listMenu);
    
    // Store reference for cleanup
    this.listMenu = listMenu;
    
    toolbar2.appendChild(listDropdown);

    // Add click event for dropdown button
    listBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = listMenu.style.display === 'grid' || listMenu.style.display === 'block';
      
      if (!isVisible) {
        // Calculate position
        const btnRect = listBtn.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Calculate menu dimensions
        const menuHeight = 120; // Approximate height
        const menuWidth = 150; // Approximate width
        
        // Position below button by default
        let top = btnRect.bottom + 5;
        let left = btnRect.left;
        
        // Adjust if menu would go below viewport
        if (top + menuHeight > viewportHeight) {
          top = btnRect.top - menuHeight - 5;
        }
        
        // Adjust if menu would go beyond right edge
        if (left + menuWidth > viewportWidth) {
          left = viewportWidth - menuWidth - 10;
        }
        
        // Ensure menu doesn't go beyond left edge
        if (left < 10) {
          left = 10;
        }
        
        listMenu.style.top = top + 'px';
        listMenu.style.left = left + 'px';
        
        // Set up grid layout and show
        listMenu.style.gridTemplateColumns = 'repeat(3, 32px)';
        listMenu.style.gap = '12px 16px';
        listMenu.style.display = 'grid';
        listMenu.style.transform = 'translateY(0)';
        requestAnimationFrame(() => {
          listMenu.style.opacity = '1';
          listMenu.style.pointerEvents = 'auto';
        });
      } else {
        listMenu.style.opacity = '0';
        listMenu.style.transform = 'translateY(-10px)';
        listMenu.style.pointerEvents = 'none';
        setTimeout(() => {
          listMenu.style.display = 'none';
        }, 200);
      }
    });

    // Add document click event to close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      // Check if click is outside both the button and the menu
      if (!listBtn.contains(e.target) && !listMenu.contains(e.target)) {
        listMenu.style.opacity = '0';
        listMenu.style.transform = 'translateY(-10px)';
        listMenu.style.pointerEvents = 'none';
        setTimeout(() => {
          listMenu.style.display = 'none';
        }, 200);
      }
    });
    
    // Thêm nút indentIncrease và indentDecrease
    const indentBtns = [
      { icon: '<i class="fas fa-indent"></i>', title: 'Increase Indent', cmd: 'indentIncrease' },
      { icon: '<i class="fas fa-outdent"></i>', title: 'Decrease Indent', cmd: 'indentDecrease' }
    ];

    indentBtns.forEach(btn => {
      const button = this.createBtn(btn.icon, btn.title, btn.cmd);
      toolbar2.appendChild(button);
      this.toolbarBtns[btn.cmd] = button;
    });

    // Font selector dropdown
    const fontDropdownWrapper = document.createElement('div');
    fontDropdownWrapper.className = 'font-dropdown-wrapper';
    fontDropdownWrapper.style.position = 'relative';
    fontDropdownWrapper.style.display = 'inline-block';

    const fontBtn = this.createBtn('Default');
    fontBtn.className = 'custom-select-button';
    fontBtn.style.width = '170px';
    fontBtn.style.padding = '0px 5px 0px 8px';
    fontBtn.style.setProperty('height', '32px', 'important');
    fontBtn.style.setProperty('borderRadius', '6px', 'important');
    fontBtn.style.setProperty('alignItems', 'center', 'important');
    fontBtn.style.fontSize = '14px';
    fontBtn.style.fontWeight = '400';
    fontBtn.style.color = '#374151';
    fontBtn.style.background = '#FFFFFF';
    fontBtn.style.cursor = 'pointer';
    
    fontBtn.onmouseover = () => {
      fontBtn.style.setProperty('background', '#f8f9fa', 'important');
    };
    
    fontBtn.onmouseout = () => {
      fontBtn.style.setProperty('background', '#FFFFFF', 'important');
    };

    // Add dropdown icon
    const fontDropdownIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    fontDropdownIcon.setAttribute('width', '12');
    fontDropdownIcon.setAttribute('height', '12');
    fontDropdownIcon.setAttribute('viewBox', '0 0 8 7');
    fontDropdownIcon.setAttribute('fill', 'none');
    fontDropdownIcon.style.marginLeft = 'auto';
    fontDropdownIcon.style.opacity = '0.7';

    const fontG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    fontG.setAttribute('clip-path', 'url(#clip0_font)');

    const fontPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    fontPath.setAttribute('d', 'M3.81655 5.55897C3.98745 5.72987 4.26499 5.72987 4.43589 5.55897L7.06089 2.93397C7.23179 2.76307 7.23179 2.48553 7.06089 2.31464C6.88999 2.14374 6.61245 2.14374 6.44155 2.31464L4.12554 4.63065L1.80952 2.316C1.63862 2.1451 1.36108 2.1451 1.19019 2.316C1.01929 2.4869 1.01929 2.76444 1.19019 2.93534L3.81519 5.56034L3.81655 5.55897Z');
    fontPath.setAttribute('fill', '#CCCCCC');

    const fontDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const fontClipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    fontClipPath.setAttribute('id', 'clip0_font');
    const fontRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    fontRect.setAttribute('width', '7');
    fontRect.setAttribute('height', '7');
    fontRect.setAttribute('fill', 'white');
    fontRect.setAttribute('transform', 'translate(0.625488)');

    fontClipPath.appendChild(fontRect);
    fontDefs.appendChild(fontClipPath);
    fontG.appendChild(fontPath);
    fontDropdownIcon.appendChild(fontG);
    fontDropdownIcon.appendChild(fontDefs);
    
    fontBtn.appendChild(fontDropdownIcon);

    // Font dropdown
    const fontDropdown = document.createElement('div');
    fontDropdown.className = 'font-dropdown';
    fontDropdown.style.display = 'none';
    fontDropdown.style.position = 'fixed';
    fontDropdown.style.zIndex = '99999';
    fontDropdown.style.border = '1px solid #E1E1E1 !important';
    fontDropdown.style.borderRadius = '3px !important';
    fontDropdown.style.background = this.options.theme === 'dark' ? '#2a2a2a' : '#fff';
    fontDropdown.style.fontSize = '12px !important';
    fontDropdown.style.fontWeight = '400 !important';
    fontDropdown.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
    fontDropdown.style.transform = 'translateY(0)';
    fontDropdown.style.padding = '6px 0';
    fontDropdown.style.minWidth = '140px';
    fontDropdown.style.maxHeight = '320px';
    fontDropdown.style.overflowY = 'auto';

    const fonts = [
      { value: 'default', text: 'Default' },
      { value: 'Arial', text: 'Arial' },
      { value: 'Times New Roman', text: 'Times New Roman' },
      { value: 'Courier New', text: 'Courier New' },
      { value: 'Georgia', text: 'Georgia' },
      { value: 'Verdana', text: 'Verdana' }
    ];

    fonts.forEach(font => {
      const item = document.createElement('div');
      item.className = 'font-dropdown-item';
      item.textContent = font.text;
      item.style.padding = '2px';
      item.style.minHeight='20px';

      item.style.cursor = 'pointer';
      item.style.fontSize = '14px';
      item.style.transition = 'background 0.18s';
      item.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#374151';
      item.style.fontFamily = font.value === 'default' ? 'inherit' : font.value;
      
      item.addEventListener('mouseover', () => {
        item.style.background = this.options.theme === 'dark' ? '#404040' : '#f0f4fa';
      });
      item.addEventListener('mouseout', () => {
        item.style.background = 'transparent';
      });
      item.addEventListener('click', () => {
        fontDropdown.style.display = 'none';
        
        // Update checkmarks for all items
        this.updateDropdownCheckmarks(fontDropdown, font.text, (item) => {
          return item.textContent;
        });
        
        // Update button text
        const textNode = fontBtn.firstChild;
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          textNode.textContent = font.text;
        } else {
          fontBtn.innerHTML = font.text;
          fontBtn.appendChild(fontDropdownIcon.cloneNode(true));
        }
        
        if (this.savedFontSelection) {
          this.restoreSelection(this.savedFontSelection);
        }
        
        if (font.value === 'default') {
          document.execCommand('removeFormat');
        } else {
          document.execCommand('fontName', false, font.value);
        }
      });
      fontDropdown.appendChild(item);
    });

    fontBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Check if dropdown is already visible
      const isVisible = fontDropdown.style.display === 'block';
      
      // Close all dropdowns first (including insert dropdowns)
      this.closeAllDropdowns();
      
      // If it wasn't visible, show it
      if (!isVisible) {
        this.savedFontSelection = this.saveSelection();
        
        // Get current font to show checkmark
        const currentFont = fontBtn.textContent || 'Default';
        
        // Update checkmarks before showing dropdown
        this.updateDropdownCheckmarks(fontDropdown, currentFont, (item) => {
          return item.textContent;
        });
        
        const rect = fontBtn.getBoundingClientRect();
        fontDropdown.style.display = 'block';
        fontDropdown.style.top = (rect.bottom + 5) + 'px';
        fontDropdown.style.left = rect.left + 'px';
      }
    });

    document.addEventListener('mousedown', (e) => {
      if (!fontDropdown.contains(e.target) && e.target !== fontBtn) {
        fontDropdown.style.display = 'none';
      }
    });

    fontDropdownWrapper.appendChild(fontBtn);
    document.body.appendChild(fontDropdown);
    toolbar2.appendChild(fontDropdownWrapper);
    this.fontSelector = fontBtn;

    // Line height dropdown
    const lineHeightDropdownWrapper = document.createElement('div');
    lineHeightDropdownWrapper.className = 'lineheight-dropdown-wrapper';
    lineHeightDropdownWrapper.style.position = 'relative';
    lineHeightDropdownWrapper.style.display = 'inline-block';

    const lineHeightBtn = this.createBtn('Line Height');
    lineHeightBtn.className = 'custom-select-button';
    lineHeightBtn.style.width = '120px';
    lineHeightBtn.style.padding = '0px 5px 0px 8px';
    lineHeightBtn.style.setProperty('height', '32px', 'important');
    lineHeightBtn.style.setProperty('borderRadius', '6px', 'important');
    lineHeightBtn.style.setProperty('alignItems', 'center', 'important');
    lineHeightBtn.style.fontSize = '14px';
    lineHeightBtn.style.fontWeight = '400';
    lineHeightBtn.style.color = '#374151';
    lineHeightBtn.style.background = '#FFFFFF';
    lineHeightBtn.style.cursor = 'pointer';
    
    lineHeightBtn.onmouseover = () => {
      lineHeightBtn.style.setProperty('background', '#f8f9fa', 'important');
    };
    
    lineHeightBtn.onmouseout = () => {
      lineHeightBtn.style.setProperty('background', '#FFFFFF', 'important');
    };

    // Add dropdown icon
    const lineHeightDropdownIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    lineHeightDropdownIcon.setAttribute('width', '12');
    lineHeightDropdownIcon.setAttribute('height', '12');
    lineHeightDropdownIcon.setAttribute('viewBox', '0 0 8 7');
    lineHeightDropdownIcon.setAttribute('fill', 'none');
    lineHeightDropdownIcon.style.marginLeft = 'auto';
    lineHeightDropdownIcon.style.opacity = '0.7';

    const lineHeightG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    lineHeightG.setAttribute('clip-path', 'url(#clip0_lineheight)');

    const lineHeightPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    lineHeightPath.setAttribute('d', 'M3.81655 5.55897C3.98745 5.72987 4.26499 5.72987 4.43589 5.55897L7.06089 2.93397C7.23179 2.76307 7.23179 2.48553 7.06089 2.31464C6.88999 2.14374 6.61245 2.14374 6.44155 2.31464L4.12554 4.63065L1.80952 2.316C1.63862 2.1451 1.36108 2.1451 1.19019 2.316C1.01929 2.4869 1.01929 2.76444 1.19019 2.93534L3.81519 5.56034L3.81655 5.55897Z');
    lineHeightPath.setAttribute('fill', '#CCCCCC');

    const lineHeightDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const lineHeightClipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    lineHeightClipPath.setAttribute('id', 'clip0_lineheight');
    const lineHeightRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    lineHeightRect.setAttribute('width', '7');
    lineHeightRect.setAttribute('height', '7');
    lineHeightRect.setAttribute('fill', 'white');
    lineHeightRect.setAttribute('transform', 'translate(0.625488)');

    lineHeightClipPath.appendChild(lineHeightRect);
    lineHeightDefs.appendChild(lineHeightClipPath);
    lineHeightG.appendChild(lineHeightPath);
    lineHeightDropdownIcon.appendChild(lineHeightG);
    lineHeightDropdownIcon.appendChild(lineHeightDefs);
    
    lineHeightBtn.appendChild(lineHeightDropdownIcon);

    // Line height dropdown
    const lineHeightDropdown = document.createElement('div');
    lineHeightDropdown.className = 'lineheight-dropdown';
    lineHeightDropdown.style.display = 'none';
    lineHeightDropdown.style.position = 'fixed';
    lineHeightDropdown.style.zIndex = '99999';
    lineHeightDropdown.style.border = '1px solid #E1E1E1 !important';
    lineHeightDropdown.style.borderRadius = '3px !important';
    lineHeightDropdown.style.background = this.options.theme === 'dark' ? '#2a2a2a' : '#fff';
    lineHeightDropdown.style.fontSize = '12px !important';
    lineHeightDropdown.style.fontWeight = '400 !important';
    lineHeightDropdown.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
    lineHeightDropdown.style.padding = '6px 0';
    lineHeightDropdown.style.minWidth = '120px';
    lineHeightDropdown.style.maxHeight = '320px';
    lineHeightDropdown.style.overflowY = 'auto';

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
      const item = document.createElement('div');
      item.className = 'lineheight-dropdown-item';
      item.textContent = lineHeight.text;
      item.style.padding = '2px';
      item.style.minHeight='20px';
      item.style.justifyItems = 'center';
      item.style.cursor = 'pointer';
      item.style.fontSize = '14px';
      item.style.transition = 'background 0.18s';
      item.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#374151';
      
      item.addEventListener('mouseover', () => {
        item.style.background = this.options.theme === 'dark' ? '#404040' : '#f0f4fa';
      });
      item.addEventListener('mouseout', () => {
        item.style.background = 'transparent';
      });
      item.addEventListener('click', () => {
        lineHeightDropdown.style.display = 'none';
        
        // Update checkmarks for all items
        this.updateDropdownCheckmarks(lineHeightDropdown, lineHeight.text, (item) => {
          return item.textContent;
        });
        
        // Update button text
        const textNode = lineHeightBtn.firstChild;
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          textNode.textContent = lineHeight.text;
        } else {
          lineHeightBtn.innerHTML = lineHeight.text;
          lineHeightBtn.appendChild(lineHeightDropdownIcon.cloneNode(true));
        }
        
        if (this.savedLineHeightSelection) {
          this.restoreSelection(this.savedLineHeightSelection);
        }
        
        if (lineHeight.value === 'default') {
          this.removeLineHeight();
        } else {
          this.applyLineHeight(lineHeight.value);
        }
      });
      lineHeightDropdown.appendChild(item);
    });

    lineHeightBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Check if dropdown is already visible
      const isVisible = lineHeightDropdown.style.display === 'block';
      
      // Close all dropdowns first (including insert dropdowns)
      this.closeAllDropdowns();
      
      // If it wasn't visible, show it
      if (!isVisible) {
        this.savedLineHeightSelection = this.saveSelection();
        
        // Get current line height to show checkmark
        const currentLineHeight = lineHeightBtn.textContent || 'Line Height';
        
        // Update checkmarks before showing dropdown
        this.updateDropdownCheckmarks(lineHeightDropdown, currentLineHeight, (item) => {
          return item.textContent;
        });
        
        const rect = lineHeightBtn.getBoundingClientRect();
        lineHeightDropdown.style.display = 'block';
        lineHeightDropdown.style.top = (rect.bottom + 5) + 'px';
        lineHeightDropdown.style.left = rect.left + 'px';
      }
    });

    document.addEventListener('mousedown', (e) => {
      if (!lineHeightDropdown.contains(e.target) && e.target !== lineHeightBtn) {
        lineHeightDropdown.style.display = 'none';
      }
    });

    lineHeightDropdownWrapper.appendChild(lineHeightBtn);
    document.body.appendChild(lineHeightDropdown); // ✅ đúng

    toolbar2.appendChild(lineHeightDropdownWrapper);
    this.lineHeightSelector = lineHeightBtn;

    // Capitalization dropdown
    const capitalizationDropdownWrapper = document.createElement('div');
    capitalizationDropdownWrapper.className = 'capitalization-dropdown-wrapper';
    capitalizationDropdownWrapper.style.position = 'relative';
    capitalizationDropdownWrapper.style.display = 'inline-block';

    const capitalizationBtn = this.createBtn('Capitalization');
    capitalizationBtn.className = 'custom-select-button';
    capitalizationBtn.style.width = '130px';
    capitalizationBtn.style.padding = '0px 5px 0px 8px';
    capitalizationBtn.style.setProperty('height', '32px', 'important');
    capitalizationBtn.style.setProperty('borderRadius', '6px', 'important');
    capitalizationBtn.style.setProperty('alignItems', 'center', 'important');
    capitalizationBtn.style.fontSize = '14px';
    capitalizationBtn.style.fontWeight = '400';
    capitalizationBtn.style.color = '#374151';
    capitalizationBtn.style.background = '#FFFFFF';
    capitalizationBtn.style.cursor = 'pointer';
    
    capitalizationBtn.onmouseover = () => {
      capitalizationBtn.style.setProperty('background', '#f8f9fa', 'important');
    };
    
    capitalizationBtn.onmouseout = () => {
      capitalizationBtn.style.setProperty('background', '#FFFFFF', 'important');
    };

    // Add dropdown icon
    const capitalizationDropdownIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    capitalizationDropdownIcon.setAttribute('width', '12');
    capitalizationDropdownIcon.setAttribute('height', '12');
    capitalizationDropdownIcon.setAttribute('viewBox', '0 0 8 7');
    capitalizationDropdownIcon.setAttribute('fill', 'none');
    capitalizationDropdownIcon.style.marginLeft = 'auto';
    capitalizationDropdownIcon.style.opacity = '0.7';

    const capitalizationG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    capitalizationG.setAttribute('clip-path', 'url(#clip0_capitalization)');

    const capitalizationPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    capitalizationPath.setAttribute('d', 'M3.81655 5.55897C3.98745 5.72987 4.26499 5.72987 4.43589 5.55897L7.06089 2.93397C7.23179 2.76307 7.23179 2.48553 7.06089 2.31464C6.88999 2.14374 6.61245 2.14374 6.44155 2.31464L4.12554 4.63065L1.80952 2.316C1.63862 2.1451 1.36108 2.1451 1.19019 2.316C1.01929 2.4869 1.01929 2.76444 1.19019 2.93534L3.81519 5.56034L3.81655 5.55897Z');
    capitalizationPath.setAttribute('fill', '#CCCCCC');

    const capitalizationDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const capitalizationClipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    capitalizationClipPath.setAttribute('id', 'clip0_capitalization');
    const capitalizationRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    capitalizationRect.setAttribute('width', '7');
    capitalizationRect.setAttribute('height', '7');
    capitalizationRect.setAttribute('fill', 'white');
    capitalizationRect.setAttribute('transform', 'translate(0.625488)');

    capitalizationClipPath.appendChild(capitalizationRect);
    capitalizationDefs.appendChild(capitalizationClipPath);
    capitalizationG.appendChild(capitalizationPath);
    capitalizationDropdownIcon.appendChild(capitalizationG);
    capitalizationDropdownIcon.appendChild(capitalizationDefs);
    
    capitalizationBtn.appendChild(capitalizationDropdownIcon);

    // Capitalization dropdown
    const capitalizationDropdown = document.createElement('div');
    capitalizationDropdown.className = 'capitalization-dropdown';
    capitalizationDropdown.style.display = 'none';
    capitalizationDropdown.style.position = 'fixed';
    capitalizationDropdown.style.zIndex = '99999';
    capitalizationDropdown.style.border = '1px solid #E1E1E1 !important';
    capitalizationDropdown.style.borderRadius = '3px !important';
    capitalizationDropdown.style.background = this.options.theme === 'dark' ? '#2a2a2a' : '#fff';
    capitalizationDropdown.style.fontSize = '12px !important';
    capitalizationDropdown.style.fontWeight = '400 !important';
    capitalizationDropdown.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
    capitalizationDropdown.style.padding = '6px 0';
    capitalizationDropdown.style.minWidth = '150px';
    capitalizationDropdown.style.maxHeight = '320px';
    capitalizationDropdown.style.overflowY = 'auto';

    const capitalizationOptions = [
      { value: 'default', text: 'Capitalization' },
      { value: 'lowercase', text: 'lowercase' },
      { value: 'uppercase', text: 'UPPERCASE' },
      { value: 'titlecase', text: 'Title Case' },
      { value: 'capitalize', text: 'Capitalize First' }
    ];

    capitalizationOptions.forEach(option => {
      const item = document.createElement('div');
      item.className = 'capitalization-dropdown-item';
      item.textContent = option.text;
      item.style.padding = '2px';
      item.style.minHeight='20px';

      item.style.cursor = 'pointer';
      item.style.fontSize = '14px';
      item.style.transition = 'background 0.18s';
      item.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#374151';
      
      item.addEventListener('mouseover', () => {
        item.style.background = this.options.theme === 'dark' ? '#404040' : '#f0f4fa';
      });
      item.addEventListener('mouseout', () => {
        item.style.background = 'transparent';
      });
      item.addEventListener('click', () => {
        capitalizationDropdown.style.display = 'none';
        
        // Update checkmarks for all items
        this.updateDropdownCheckmarks(capitalizationDropdown, option.text, (item) => {
          return item.textContent;
        });
        
        if (this.savedCapitalizationSelection) {
          this.restoreSelection(this.savedCapitalizationSelection);
        }
        
        if (option.value === 'default') {
          // Reset to default without applying
          return;
        }
        
        this.applyCapitalization(option.value);
        
        // Reset button text after applying
        setTimeout(() => {
          const textNode = capitalizationBtn.firstChild;
          if (textNode && textNode.nodeType === Node.TEXT_NODE) {
            textNode.textContent = 'Capitalization';
          } else {
            capitalizationBtn.innerHTML = 'Capitalization';
            capitalizationBtn.appendChild(capitalizationDropdownIcon.cloneNode(true));
          }
        }, 100);
      });
      capitalizationDropdown.appendChild(item);
    });

    capitalizationBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Check if dropdown is already visible
      const isVisible = capitalizationDropdown.style.display === 'block';
      
      // Close all dropdowns first (including insert dropdowns)
      this.closeAllDropdowns();
      
      // If it wasn't visible, show it
      if (!isVisible) {
        this.savedCapitalizationSelection = this.saveSelection();
        
        // Get current capitalization to show checkmark (default to first option)
        const currentCapitalization = 'Capitalization';
        
        // Update checkmarks before showing dropdown
        this.updateDropdownCheckmarks(capitalizationDropdown, currentCapitalization, (item) => {
          return item.textContent;
        });
        
        const rect = capitalizationBtn.getBoundingClientRect();
        capitalizationDropdown.style.display = 'block';
        capitalizationDropdown.style.top = (rect.bottom + 5) + 'px';
        capitalizationDropdown.style.left = rect.left + 'px';
      }
    });

    document.addEventListener('mousedown', (e) => {
      if (!capitalizationDropdown.contains(e.target) && e.target !== capitalizationBtn) {
        capitalizationDropdown.style.display = 'none';
      }
    });

    capitalizationDropdownWrapper.appendChild(capitalizationBtn);
    document.body.appendChild(capitalizationDropdown); // ✅ đúng

    toolbar2.appendChild(capitalizationDropdownWrapper);
    this.capitalizationSelector = capitalizationBtn;

  

    // Chèn nội dung
    const insertBtns = [
      { icon: '<i class="far fa-smile"></i>', title: 'Emoji', cmd: 'emoji' },
      { icon: '<i class="far fa-image"></i>', title: 'Image', cmd: 'image' },
      { icon: '<i class="fas fa-video"></i>', title: 'Video', cmd: 'video' },
      { icon: '<i class="fas fa-file-import"></i>', title: 'Import', cmd: 'import' },
      { icon: '<i class="fas fa-tags"></i>', title: 'Insert Tags', cmd: 'insertTags' },
      { icon: '<i class="fas fa-file-alt"></i>', title: 'Insert Template', cmd: 'insertTemplate' }
    ];

    insertBtns.forEach(btn => {
      const button = this.createBtn(btn.icon, btn.title, btn.cmd);
      toolbar2.appendChild(button);
      this.toolbarBtns[btn.cmd] = button;
    });

    // Thêm nút View Source
    const viewSourceBtn = this.createBtn('<i class="fas fa-code"></i>', 'View Source', 'viewSource');
    viewSourceBtn.onclick = () => this.toggleSourceView();
    toolbar2.appendChild(viewSourceBtn);

    // Theme toggle button
    const themeBtn = document.createElement('button');
    themeBtn.className = 'editor-btn theme-toggle';
    themeBtn.innerHTML = this.options.theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    themeBtn.title = this.options.theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme';
    themeBtn.style.padding = '8px 12px';
    themeBtn.style.borderRadius = '6px';
    themeBtn.style.background = this.options.theme === 'dark' ? '#2a2a2a' : '#ffffff';
    themeBtn.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#333333';
    themeBtn.style.cursor = 'pointer';
    themeBtn.style.fontSize = '14px';
    themeBtn.style.transition = 'all 0.2s ease';

    themeBtn.onclick = () => {
      this.toggleTheme();
    };

    themeBtn.onmouseover = () => {
      themeBtn.style.background = this.options.theme === 'dark' ? '#404040' : '#f5f5f5';
    };

    themeBtn.onmouseout = () => {
      themeBtn.style.background = this.options.theme === 'dark' ? '#2a2a2a' : '#ffffff';
    };

    toolbar2.appendChild(themeBtn);
    this.themeToggleBtn = themeBtn;

    // Store toolbar references
    this.toolbar1 = toolbar1;
    this.toolbar2 = toolbar2;
    this.toolbarContainer = toolbarContainer;
    
    // Add row separators to toolbar2 when it wraps to multiple lines
    this.addToolbar2RowSeparators();

    // Initially hide toolbar2
    toolbar2.style.display = 'none';

    // Add event listener to more button to toggle toolbar2
    moreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleToolbar2();
    });

    // Update format button states
    this.updateFormatButtonStates();

    // Add toolbars to container
    toolbarContainer.appendChild(toolbar1);
    
    // Add horizontal separator between toolbar1 and toolbar2
    const toolbarSeparator = document.createElement('div');
    toolbarSeparator.className = 'toolbar-separator';
    toolbarSeparator.style.width = '100%';
    toolbarSeparator.style.height = '1px';
    toolbarSeparator.style.background = this.options.theme === 'dark' ? '#404040' : '#e5e7eb';
    toolbarSeparator.style.margin = '0';
    toolbarSeparator.style.boxSizing = 'border-box';
    toolbarSeparator.style.display = 'none';
    
    // Store reference for theme updates
    this.toolbarSeparator = toolbarSeparator;
    
    toolbarContainer.appendChild(toolbarSeparator);
    toolbarContainer.appendChild(toolbar2);

    return toolbarContainer;
  }

  // Add method to toggle toolbar2 visibility
  toggleToolbar2() {
    const isOpening = this.toolbar2.style.display === 'none' || this.toolbar2.style.display === '';

    this.toolbar2.style.display = isOpening ? 'flex' : 'none';
    this.toolbarSeparator.style.display = isOpening ? 'block' : 'none';

    // Cập nhật trạng thái active cho more-options-btn
    this.updateMoreOptionsButtonState();

    // Thêm dòng phân cách nếu mở
    if (isOpening) {
      setTimeout(() => this.addToolbar2RowSeparators(), 10);
    }
  }

  // Method để duy trì trạng thái active của more-options-btn
  updateMoreOptionsButtonState() {
    const moreOptionsBtn = this.toolbarBtns.moreOptions;
    if (moreOptionsBtn) {
      const isToolbar2Visible = this.toolbar2.style.display === 'flex';
      if (isToolbar2Visible) {
        moreOptionsBtn.classList.add('active');
      } else {
        moreOptionsBtn.classList.remove('active');
      }
    }
  }


  // Add horizontal separators between rows in toolbar2
  addToolbar2RowSeparators() {
    if (!this.toolbar2 || this.toolbar2.style.display === 'none') return;
    
    // Remove existing separators
    const existingSeparators = this.toolbar2.querySelectorAll('.toolbar-row-separator');
    existingSeparators.forEach(sep => sep.remove());
    
    // Wait for layout to complete
    setTimeout(() => {
      const children = Array.from(this.toolbar2.children);
      if (children.length === 0) return;
      
      let currentRowY = null;
      let rowElements = [];
      const rows = [];
      
      // Group elements by row based on their Y position
      children.forEach(child => {
        if (child.classList.contains('toolbar-row-separator')) return; // Skip separators
        
        const rect = child.getBoundingClientRect();
        const childY = Math.round(rect.top + rect.height / 2); // Use center point for better accuracy with alignItems: center
        
        if (currentRowY === null || Math.abs(childY - currentRowY) > 10) {
          // New row detected (increased tolerance for center alignment)
          if (rowElements.length > 0) {
            rows.push([...rowElements]);
          }
          rowElements = [child];
          currentRowY = childY;
        } else {
          // Same row
          rowElements.push(child);
        }
      });
      
      // Add the last row
      if (rowElements.length > 0) {
        rows.push(rowElements);
      }
      
      // Add separators between rows (not after the last row)
      for (let i = 0; i < rows.length - 1; i++) {
        const currentRow = rows[i];
        const nextRow = rows[i + 1];
        
                 if (currentRow.length > 0 && nextRow.length > 0) {
           // Calculate separator position with center alignment
           const currentRowBottom = Math.max(...currentRow.map(el => el.getBoundingClientRect().bottom));
           const nextRowTop = Math.min(...nextRow.map(el => el.getBoundingClientRect().top));
           const toolbar2Rect = this.toolbar2.getBoundingClientRect();
           
           // Position separator exactly in the middle of the gap between rows
           const gapMiddle = (currentRowBottom + nextRowTop) / 2;
           const separatorTop = gapMiddle - toolbar2Rect.top;
           
           const separator = document.createElement('div');
           separator.className = 'toolbar-row-separator';
           separator.style.position = 'absolute';
           separator.style.left = '-16px';
           separator.style.right = '-16px';
          separator.style.top = separatorTop + 'px';
          separator.style.height = '1px';
          separator.style.background = this.options.theme === 'dark' ? '#404040' : '#e5e7eb';
          separator.style.pointerEvents = 'none';
          separator.style.zIndex = '0';
          
          this.toolbar2.appendChild(separator);
        }
      }
    }, 50);
  }

  createBtn(icon, title, cmd, value = null) {
    const btn = document.createElement('button');
    btn.innerHTML = icon;
    btn.title = title;
    btn.classList.add('toolbar-btn');
    btn.style.borderRadius = '3px';
    btn.style.background = this.options?.theme === 'dark' ? '#2a2a2a' : '#fff';
    btn.style.color = this.options?.theme === 'dark' ? '#e0e0e0' : '#374151';
    btn.style.cursor = 'pointer';
    btn.style.transition = 'all 0.18s cubic-bezier(.4,0,.2,1)';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.height = '14px';
    btn.style.fontSize = '14px';
    btn.style.boxSizing = 'border-box';
    btn.style.margin = '0';
    btn.style.marginTop = '0';
    btn.style.marginBottom = '0';
    btn.style.backgroundClip = 'padding-box';

    // CSS cho trạng thái active
    btn._setActive = function(active) {
      if (active) {
        btn.classList.add('active');
        const isDark = this.options?.theme === 'dark';
        btn.style.background = isDark ? '#3a4a6b' : '#e0f0ff';
        btn.style.color = isDark ? '#66ccff' : '#1976d2';
        btn.style.borderColor = isDark ? '#4a5a7b' : '#90caf9';
        btn.style.boxShadow = isDark ? '0 2px 8px rgba(102, 204, 255, 0.15)' : '0 2px 8px rgba(25, 118, 210, 0.08)';
      } else {
        btn.classList.remove('active');
        const isDark = this.options?.theme === 'dark';
        btn.style.background = isDark ? '#2a2a2a' : '#fff';
        btn.style.color = isDark ? '#e0e0e0' : '#374151';
        btn.style.borderColor = 'transparent';
        btn.style.boxShadow = 'none';
      }
    }.bind(this);

    btn.onmouseover = () => {
      if (!btn.classList.contains('active')) {
        const isDark = this.options?.theme === 'dark';
        btn.style.background = isDark ? '#3a3a3a' : '#e9ecef';
        btn.style.color = isDark ? '#e0e0e0' : '#374151';
        btn.style.borderColor = isDark ? '#4a5a7b' : '#b6d4fe';
        btn.style.boxShadow = isDark ? '0 2px 8px rgba(102, 204, 255, 0.12)' : '0 2px 8px rgba(25, 118, 210, 0.06)';
      }
    };

    btn.onmouseout = () => {
      if (btn.classList.contains('active')) {
        const isDark = this.options?.theme === 'dark';
        btn.style.background = isDark ? '#3a4a6b' : '#e0f0ff';
        btn.style.color = isDark ? '#66ccff' : '#1976d2';
        btn.style.borderColor = isDark ? '#4a5a7b' : '#90caf9';
        btn.style.boxShadow = isDark ? '0 2px 8px rgba(102, 204, 255, 0.15)' : '0 2px 8px rgba(25, 118, 210, 0.08)';
      } else {
        const isDark = this.options?.theme === 'dark';
        btn.style.background = isDark ? '#2a2a2a' : '#fff';
        btn.style.color = isDark ? '#e0e0e0' : '#374151';
        btn.style.borderColor = 'transparent';
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
      // Handle format commands (bold, italic, underline, strikeThrough) with custom logic
      if (['bold', 'italic', 'underline', 'strikeThrough', 'superscript', 'subscript'].includes(cmd)) {
        this.handleFormatCommand(cmd, btn);
        return;
      }
      if (cmd === 'emoji') {
        this.insertEmoji();
        return;
      }
      if (cmd === 'image') {
        this.insertImage();
        return;
      }
      if (cmd === 'video') {
        this.insertVideo();
        return;
      }
      if (cmd === 'import') {
        this.importDocument();
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
        this.insertLink();
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

  createColorBtn(icon, title, cmd) {
    const btn = this.createBtn(icon, title, cmd);
    
    // Store the current color for this button
    btn._currentColor = cmd === 'textColor' ? '#000000' : 'transparent';
    
    // Override hover behavior for color buttons to preserve color
    btn.onmouseover = () => {
      if (!btn.classList.contains('active')) {
        const isDark = this.options?.theme === 'dark';
        btn.style.background = isDark ? '#3a3a3a' : '#e9ecef';
        btn.style.boxShadow = isDark ? '0 2px 8px rgba(102, 204, 255, 0.12)' : '0 2px 8px rgba(25, 118, 210, 0.06)';
        
        // Preserve current color for text color or background color
        if (cmd === 'textColor') {
          btn.style.setProperty('color', btn._currentColor, 'important');
        } else if (cmd === 'bgColor') {
          btn.style.setProperty('background-color', btn._currentColor, 'important');
        }
      }
    };

    btn.onmouseout = () => {
      if (btn.classList.contains('active')) {
        const isDark = this.options?.theme === 'dark';
        btn.style.background = isDark ? '#3a4a6b' : '#e0f0ff';
        btn.style.boxShadow = isDark ? '0 2px 8px rgba(102, 204, 255, 0.15)' : '0 2px 8px rgba(25, 118, 210, 0.08)';
      } else {
        const isDark = this.options?.theme === 'dark';
        btn.style.background = isDark ? '#2a2a2a' : '#fff';
        btn.style.boxShadow = 'none';
      }
      
      // Preserve current color for text color or background color
      if (cmd === 'textColor') {
        btn.style.setProperty('color', btn._currentColor, 'important');
      } else if (cmd === 'bgColor') {
        btn.style.setProperty('background-color', btn._currentColor, 'important');
        if (btn._currentColor === 'transparent') {
        }
      }
    };
    
    // Set initial colors for icons
    if (cmd === 'textColor') {
      btn.style.setProperty('color', '#000000', 'important');
    } else if (cmd === 'bgColor') {
      btn.style.setProperty('background-color', 'transparent', 'important');
    }
    
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
    // Đường kẻ ngang chia cắt
    const divider = document.createElement('div');
    divider.style.marginLeft = '-8px';
    divider.style.marginRight = '-8px';
    divider.style.height = '1px';
    divider.style.background = '#eee';
    this.tablePopup.appendChild(divider);

    this.tableSizeLabel = document.createElement('div');
    this.tableSizeLabel.className = 'table-size-label';
    this.tableSizeLabel.style.marginTop = '4px';
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
    this.tableToolbar.style.borderRadius = '6px';
    this.tableToolbar.style.padding = '8px';
    this.tableToolbar.style.fontSize = '12px';
    this.tableToolbar.style.boxShadow = '0 4px 24px rgba(0,0,0,0.13)';
    this.tableToolbar.style.zIndex = 100;
    this.tableToolbar.style.gap = '4px';
    this.tableToolbar.style.flexWrap = 'nowrap';
    
    // Thêm mũi tên (mặc định hướng xuống)
    if (!this.tableToolbar.arrow) {
      const arrow = document.createElement('div');
      arrow.className = 'table-toolbar-arrow';
      arrow.style.position = 'absolute';
      arrow.style.left = '50%';
      arrow.style.bottom = '-8px';
      arrow.style.transform = 'translateX(-50%)';
      arrow.style.borderLeft = '6px solid transparent';
      arrow.style.borderRight = '6px solid transparent';
      arrow.style.borderTop = '8px solid #fff';
      arrow.style.filter = 'drop-shadow(0px 1px 1px rgba(0,0,0,0.08))';
      this.tableToolbar.appendChild(arrow);
      this.tableToolbar.arrow = arrow;
    }
    
    // Xóa cũ nếu có
    if (this.tableToolbar.parentNode) this.tableToolbar.parentNode.removeChild(this.tableToolbar);
    document.body.appendChild(this.tableToolbar);
    
    this.createTableToolbarButtons();

    this.wrapper.appendChild(this.tableToolbar);
  }

  createTableToolbarButtons() {
    // Xóa tất cả nút cũ (trừ arrow)
    const arrow = this.tableToolbar.arrow;
    this.tableToolbar.innerHTML = '';
    if (arrow) {
      this.tableToolbar.appendChild(arrow);
    }
    
    const buttons = [
      { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="14" viewBox="0 0 18 14" fill="none">
  <g clip-path="url(#clip0_23_620)">
    <path d="M17.2744 10.9348V2.16365C17.2744 0.994844 16.3413 0.0475311 15.1901 0.0475311H2.35536C1.20413 0.0475311 0.274414 0.991437 0.274414 2.16024V10.9382C0.274414 12.1036 1.20413 13.0509 2.35536 13.0509H15.1935C16.3447 13.0509 17.2744 12.1036 17.2744 10.9382V10.9348ZM2.31844 7.60218H7.66178V10.8803H2.31844V7.60218ZM15.0827 10.8803H9.74273V7.60218H15.0827V10.8803ZM15.0827 5.48947H9.74273V2.21477H15.0827V5.48947ZM2.31844 2.21477H7.66178V5.48947H2.31844V2.21477Z" fill="#454545"/>
  </g>
  <defs>
    <clipPath id="clip0_23_620">
      <rect width="17" height="13" fill="white" transform="translate(0.274414 0.0475311)"/>
    </clipPath>
  </defs>
</svg>`, title: 'Thêm dòng trên', cmd: 'addRowAbove' },
      { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="14" viewBox="0 0 18 14" fill="none">
  <path d="M15.3864 0.0123596H2.37934C1.21636 0.0123596 0.274414 0.964798 0.274414 2.1365V10.962C0.274414 12.1337 1.21636 13.0827 2.37934 13.0827H15.3864C16.5528 13.0827 17.4981 12.1337 17.4981 10.9586V2.13993C17.4981 0.964798 16.5528 0.0123596 15.3864 0.0123596ZM15.2776 5.48374H13.2542C13.4209 6.18265 13.4209 6.9124 13.2542 7.60789H15.2776V10.9037H10.1257C9.31642 11.1367 8.45609 11.1367 7.64676 10.9037H2.34534V7.60789H4.51488C4.34825 6.9124 4.34825 6.18265 4.51488 5.48374H2.34534V2.19132H7.66037C8.46289 1.96178 9.31302 1.96178 10.1155 2.19132H15.2776V5.48374Z" fill="#454545"/>
  <path d="M12.2715 5.48376C12.1083 4.9493 11.8158 4.44567 11.3942 4.02084C10.9521 3.57546 10.4284 3.27396 9.86732 3.11294C9.18041 2.9108 8.4425 2.92793 7.75899 3.15748C7.25231 3.32535 6.77624 3.61657 6.37497 4.02084C5.95331 4.44567 5.66086 4.9493 5.49764 5.48376C5.28 6.17239 5.28 6.91927 5.49424 7.6079C5.65746 8.14579 5.95331 8.65284 6.37497 9.07767C6.79664 9.5025 7.25231 9.77316 7.75899 9.94103C8.4425 10.1706 9.18041 10.1877 9.86732 9.98557C10.4284 9.82455 10.9521 9.52306 11.3942 9.07767C11.8362 8.63229 12.1117 8.14579 12.2749 7.6079C12.4891 6.91927 12.4891 6.17239 12.2715 5.48376ZM10.3774 7.59077C10.3774 7.59077 10.3876 7.60105 10.391 7.6079C10.5032 7.73467 10.4964 7.92995 10.3774 8.05329C10.2516 8.18005 10.0441 8.18005 9.91833 8.05329L9.86732 8.0019L8.88457 7.01177L7.8508 8.05329C7.8236 8.0807 7.793 8.10468 7.75899 8.11838C7.63997 8.1732 7.49375 8.15264 7.39173 8.05329C7.27271 7.92995 7.26591 7.73467 7.37813 7.6079C7.38153 7.60105 7.38493 7.59762 7.39173 7.59077L8.42549 6.54926L7.39173 5.50774C7.39173 5.50774 7.37813 5.49404 7.37133 5.48376C7.26591 5.357 7.27271 5.16514 7.39173 5.04523C7.49375 4.94587 7.63997 4.92531 7.75899 4.98013C7.793 4.99384 7.8236 5.01782 7.8508 5.04523L8.88457 6.08674L9.86732 5.09662L9.91833 5.04523C10.0441 4.91846 10.2516 4.91846 10.3774 5.04523C10.4964 5.16514 10.5032 5.357 10.3978 5.48376C10.391 5.49404 10.3842 5.50089 10.3774 5.50774L9.34364 6.54926L10.3774 7.59077Z" fill="#454545"/>
</svg>`, title: 'Thêm cột trái', cmd: 'addColLeft' },
      { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="16" viewBox="0 0 18 16" fill="none">
  <path d="M2.83001 13.0703H5.22738C5.07436 12.6215 4.98935 12.1385 4.98935 11.6383C4.98935 11.3847 5.00975 11.1346 5.05396 10.8914H2.79261V7.59554H7.65876C8.17564 7.3797 8.74013 7.25979 9.33522 7.25979C9.93032 7.25979 10.4948 7.3797 11.0117 7.59554H15.7248V10.8914H13.6165C13.6607 11.1346 13.6811 11.3847 13.6811 11.6383C13.6811 12.1385 13.5961 12.6215 13.4431 13.0703H15.837C17.0034 13.0703 17.9454 12.1179 17.9454 10.9428V2.12416C17.9454 0.949028 17.0034 1.52588e-05 15.837 1.52588e-05H2.83001C1.66703 1.52588e-05 0.72168 0.949028 0.72168 2.12073V10.9462C0.72168 12.1179 1.66703 13.0703 2.83001 13.0703ZM10.3146 2.17898H15.7248V5.4714H10.3146V2.17898ZM2.79261 2.17898H8.20625V5.4714H2.79261V2.17898Z" fill="#454545"/>
  <path d="M6.2135 13.0703C6.75079 14.2625 7.94777 15.095 9.33519 15.095C10.7226 15.095 11.9196 14.2625 12.4569 13.0703C12.6575 12.6351 12.7663 12.1486 12.7663 11.6382C12.7663 11.3812 12.7391 11.1311 12.6847 10.8913C12.4195 9.66135 11.5013 8.67807 10.3145 8.32177C10.0051 8.22926 9.67524 8.17787 9.33519 8.17787C8.94072 8.17787 8.55987 8.24639 8.20621 8.36973C7.09424 8.7603 6.24071 9.71274 5.98567 10.8913C5.93126 11.1311 5.90405 11.3812 5.90405 11.6382C5.90405 12.1486 6.01287 12.6351 6.2135 13.0703ZM7.60772 11.3195H9.02234V9.89774C9.02234 9.72302 9.16176 9.58255 9.33519 9.58255C9.50861 9.58255 9.64803 9.72302 9.64803 9.89774V11.3195H11.0627C11.2361 11.3195 11.3755 11.4634 11.3755 11.6382C11.3755 11.8129 11.2361 11.9534 11.0627 11.9534H9.64803V13.3752C9.64803 13.5499 9.50861 13.6938 9.33519 13.6938C9.16176 13.6938 9.02234 13.5499 9.02234 13.3752V11.9534H7.60772C7.43429 11.9534 7.29487 11.8129 7.29487 11.6382C7.29487 11.4634 7.43429 11.3195 7.60772 11.3195Z" fill="#454545"/>
</svg>`, title: 'Thêm cột phải', cmd: 'addColRight' },
      { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="14" viewBox="0 0 19 14" fill="none">
  <path d="M18.169 2.13993V10.9586C18.169 12.1337 17.2271 13.0827 16.0607 13.0827H3.05365C1.89066 13.0827 0.945312 12.1337 0.945312 10.962V2.1365C0.945312 0.964798 1.89066 0.0123596 3.05365 0.0123596H7.45053C7.10367 0.204218 6.77723 0.450893 6.48478 0.745532C6.06311 1.17036 5.74346 1.66371 5.53263 2.19132H3.01624V5.48374H5.53263C5.74346 6.01135 6.05971 6.50813 6.48478 6.93638C6.74662 7.20019 7.03226 7.42288 7.33831 7.60789H3.01624V10.9037H8.42988V8.0704C9.12019 8.25541 9.8445 8.26911 10.5382 8.10466V10.9037H15.9485V7.60789H11.7794C12.0855 7.42288 12.3711 7.20019 12.6329 6.93638C13.058 6.50813 13.3743 6.01135 13.5851 5.48374H15.9485V2.19132H13.5851C13.3743 1.66371 13.0546 1.17036 12.6329 0.745532C12.3405 0.450893 12.014 0.204218 11.6672 0.0123596H16.0607C17.2271 0.0123596 18.169 0.964798 18.169 2.13993Z" fill="#454545"/>
  <path d="M12.5751 2.19137C12.4221 1.90701 12.2249 1.63635 11.9869 1.39653C10.6436 0.04324 8.4707 0.04324 7.1309 1.39653C6.89286 1.63635 6.69563 1.90701 6.5426 2.19137C5.98832 3.21575 5.98832 4.4594 6.53921 5.48379C6.69223 5.77158 6.88946 6.04223 7.1309 6.28548C8.4707 7.63534 10.6436 7.63534 11.9869 6.28548C12.2283 6.04223 12.4255 5.77158 12.5785 5.48379C13.1294 4.4594 13.1294 3.21575 12.5751 2.19137ZM10.5382 4.3806L11.0007 4.84655C11.1231 4.96988 11.1231 5.16859 11.0007 5.29536C10.8783 5.41869 10.681 5.41869 10.5586 5.29536L9.55887 4.2881L8.55912 5.29536C8.52171 5.33304 8.47751 5.36045 8.4299 5.37073C8.32108 5.40842 8.20207 5.38101 8.11705 5.29536C7.99463 5.16859 7.99463 4.96988 8.11705 4.84655L8.4299 4.53135L9.1134 3.83929L8.11705 2.83546C7.99463 2.71212 7.99463 2.50999 8.11705 2.38665C8.20207 2.301 8.32108 2.27359 8.4299 2.31128C8.47751 2.32156 8.52171 2.34896 8.55912 2.38665L9.55887 3.39391L10.5586 2.38665C10.681 2.26331 10.8783 2.26331 11.0007 2.38665C11.1231 2.50999 11.1231 2.71212 11.0007 2.83546L10.5382 3.3014L10.0009 3.83929L10.5382 4.3806Z" fill="#454545"/>
</svg>`, title: 'Xóa dòng', cmd: 'deleteRow' },
      { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="14" viewBox="0 0 19 14" fill="none">
  <path d="M16.4982 0.0123596H3.49115C2.32476 0.0123596 1.38281 0.964798 1.38281 2.1365V2.78402C2.03231 2.39346 2.79063 2.17076 3.60336 2.17076C3.73938 2.17076 3.872 2.17762 4.00462 2.19132H9.0136V5.48717H7.82001C7.90503 5.82977 7.94924 6.18265 7.94924 6.54924C7.94924 6.91583 7.90503 7.27213 7.82001 7.61131H9.0136V10.9037H4.04883C3.9026 10.9209 3.75298 10.9277 3.60336 10.9277C2.79063 10.9277 2.03231 10.705 1.38281 10.3145V10.9586C1.38281 12.1303 2.32476 13.0827 3.49115 13.0827H16.4982C17.6612 13.0827 18.6065 12.1337 18.6065 10.962V2.1365C18.6065 0.964798 17.6612 0.0123596 16.4982 0.0123596ZM16.5356 10.9037H11.1219V7.61131H16.5356V10.9037ZM16.5356 5.48717H11.1219V2.19132H16.5356V5.48717Z" fill="#454545"/>
  <path d="M6.87164 5.48725C6.42617 4.09627 5.13057 3.08902 3.60373 3.08902C2.75699 3.08902 1.98167 3.39736 1.38318 3.91469C0.638465 4.54509 0.169189 5.49067 0.169189 6.54932C0.169189 7.60796 0.638465 8.55012 1.38318 9.18052C1.98167 9.69785 2.75699 10.0062 3.60373 10.0062C5.13057 10.0062 6.42617 8.99894 6.87164 7.61139C6.97706 7.27906 7.03486 6.91933 7.03486 6.54932C7.03486 6.17931 6.97706 5.81957 6.87164 5.48725ZM5.3278 6.86451H3.91658V8.28632C3.91658 8.46105 3.77715 8.60494 3.60373 8.60494C3.4303 8.60494 3.28748 8.46105 3.28748 8.28632V6.86451H1.87626C1.70284 6.86451 1.56341 6.72405 1.56341 6.54932C1.56341 6.37459 1.70284 6.2307 1.87626 6.2307H3.28748V4.80889C3.28748 4.63416 3.4303 4.4937 3.60373 4.4937C3.77715 4.4937 3.91658 4.63416 3.91658 4.80889V6.2307H5.3278C5.50123 6.2307 5.64405 6.37459 5.64405 6.54932C5.64405 6.72405 5.50123 6.86451 5.3278 6.86451Z" fill="#454545"/>
</svg>`, title: 'Xóa cột', cmd: 'deleteCol' },
      { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="14" viewBox="0 0 20 14" fill="none">
  <path d="M2.71478 13.0827H15.7218C16.8882 13.0827 17.8301 12.1303 17.8301 10.9586V10.311C17.1806 10.7016 16.4223 10.9243 15.6096 10.9243C15.4736 10.9243 15.3409 10.9174 15.2083 10.9037H10.1993V7.60789H11.3929C11.3079 7.26528 11.2637 6.9124 11.2637 6.54581C11.2637 6.17923 11.3079 5.82292 11.3929 5.48374H10.1993V2.19132H15.1641C15.3103 2.17419 15.46 2.16734 15.6096 2.16734C16.4223 2.16734 17.1806 2.39003 17.8301 2.7806V2.1365C17.8301 0.964798 16.8882 0.0123596 15.7218 0.0123596H2.71478C1.5518 0.0123596 0.606445 0.961372 0.606445 2.13308V10.9586C0.606445 12.1303 1.5518 13.0827 2.71478 13.0827ZM2.67737 2.19132H8.09102V5.48374H2.67737V2.19132ZM2.67737 7.60789H8.09102V10.9037H2.67737V7.60789Z" fill="#454545"/>
  <path d="M12.3419 7.60796C12.7874 8.99894 14.083 10.0062 15.6098 10.0062C16.4566 10.0062 17.2319 9.69785 17.8304 9.18052C18.5751 8.55012 19.0444 7.60454 19.0444 6.54589C19.0444 5.48725 18.5751 4.54509 17.8304 3.91469C17.2319 3.39736 16.4566 3.08902 15.6098 3.08902C14.083 3.08902 12.7874 4.09627 12.3419 5.48382C12.2365 5.81615 12.1787 6.17588 12.1787 6.54589C12.1787 6.9159 12.2365 7.27564 12.3419 7.60796ZM13.8858 6.2307H15.297V4.80889C15.297 4.63416 15.4364 4.49027 15.6098 4.49027C15.7833 4.49027 15.9261 4.63416 15.9261 4.80889V6.2307H17.3373C17.5107 6.2307 17.6502 6.37116 17.6502 6.54589C17.6502 6.72062 17.5107 6.86451 17.3373 6.86451H15.9261V8.28632C15.9261 8.46105 15.7833 8.60152 15.6098 8.60152C15.4364 8.60152 15.297 8.46105 15.297 8.28632V6.86451H13.8858C13.7124 6.86451 13.5695 6.72062 13.5695 6.54589C13.5695 6.37116 13.7124 6.2307 13.8858 6.2307Z" fill="#454545"/>
</svg>`, title: 'Merge cells', cmd: 'mergeCells' },
      { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="14" viewBox="0 0 19 14" fill="none">
  <path d="M16.5185 0.0123596H3.51142C2.34844 0.0123596 1.40649 0.964798 1.40649 2.1365V2.69495C2.18522 2.27012 3.06596 2.10224 3.92289 2.19132H8.89106V5.48374H7.69069C7.86412 6.17923 7.86412 6.9124 7.69069 7.60789H8.89106V10.9037H3.89228C3.04215 10.986 2.17501 10.8181 1.40649 10.3967V10.962C1.40649 12.1337 2.34844 13.0827 3.51142 13.0827H16.5185C17.6848 13.0827 18.6302 12.1303 18.6302 10.9586V2.13993C18.6302 0.964798 17.6848 0.0123596 16.5185 0.0123596ZM16.4096 10.9037H10.9994V7.60789H16.4096V10.9037ZM16.4096 5.48374H10.9994V2.19132H16.4096V5.48374Z" fill="#454545"/>
  <path d="M6.74518 5.48377C6.58195 4.97671 6.30312 4.50049 5.90185 4.09965C5.23195 3.42472 4.35801 3.08554 3.47727 3.08554C2.74616 3.08554 2.01504 3.31851 1.40634 3.78788C1.28052 3.88038 1.16151 3.98659 1.04929 4.09965C-0.290519 5.44951 -0.290519 7.64217 1.04929 8.99203C1.16151 9.10509 1.28052 9.2113 1.40634 9.3038C2.01504 9.77317 2.74616 10.0061 3.47727 10.0061C4.35801 10.0061 5.23195 9.66696 5.90185 8.99203C6.30312 8.59119 6.58195 8.11496 6.74518 7.60791C6.96281 6.91928 6.96281 6.1724 6.74518 5.48377ZM4.9191 7.55309C4.9191 7.55309 4.9497 7.58736 4.9633 7.60791C5.03812 7.72782 5.02451 7.89227 4.9191 7.99848C4.79668 8.12182 4.59605 8.12182 4.47363 7.99848L4.08596 7.60791L3.47727 6.99465L2.47752 7.99848C2.3551 8.12182 2.15787 8.12182 2.03205 7.99848C1.90963 7.87514 1.90963 7.67643 2.03205 7.55309L3.0318 6.54584L2.03205 5.53858C1.90963 5.41525 1.90963 5.21654 2.03205 5.0932C2.15787 4.96986 2.3551 4.96986 2.47752 5.0932L3.47727 6.09703L4.47363 5.0932C4.59605 4.96986 4.79668 4.96986 4.9191 5.0932C5.02451 5.19941 5.03812 5.36386 4.9633 5.48377C4.9497 5.50432 4.9361 5.52145 4.9191 5.53858L3.91934 6.54584L4.9191 7.55309Z" fill="#454545"/>
</svg>`, title: 'Split cells', cmd: 'splitCells' },
      { icon: '<i class="fas fa-times"></i>', title: 'Xóa bảng', cmd: 'deleteTable' }
    ];

    buttons.forEach(btn => {
      const button = this.createTableToolbarButton(btn.cmd, btn.icon, btn.title);
      this.tableToolbar.appendChild(button);
    });
  }

  createTableToolbarButton(cmd, icon, title) {
    const button = document.createElement('button');
    button.innerHTML = icon;
    button.title = title;
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.padding = '4px 8px';
    button.style.borderRadius = '4px';
    button.style.setProperty('border', 'none', 'important');
    button.style.background = '#fff';
    button.style.cursor = 'pointer';
    button.onclick = e => {
      e.preventDefault();
      this.handleTableCommand(cmd);
    };
    return button;
  }

  createSplitTableToolbar(buttons, splitIndex) {
    // Tạo toolbar cho phần đầu
    const firstPart = buttons.slice(0, splitIndex);
    const secondPart = buttons.slice(splitIndex);
    
    // Tạo toolbar trên
    this.tableToolbar.style.flexDirection = 'column';
    this.tableToolbar.style.gap = '4px';
    
    const topRow = document.createElement('div');
    topRow.style.display = 'flex';
    topRow.style.gap = '4px';
    topRow.style.alignItems = 'center';
    
    const bottomRow = document.createElement('div');
    bottomRow.style.display = 'flex';
    bottomRow.style.gap = '4px';
    bottomRow.style.alignItems = 'center';
    
    // Tạo nút cho hàng trên
    firstPart.forEach(btn => {
      const button = this.createTableToolbarButton(btn.cmd, btn.icon, btn.title);
      topRow.appendChild(button);
    });
    
    // Tạo nút cho hàng dưới
    secondPart.forEach(btn => {
      const button = this.createTableToolbarButton(btn.cmd, btn.icon, btn.title);
      bottomRow.appendChild(button);
    });
    
    this.tableToolbar.appendChild(topRow);
    this.tableToolbar.appendChild(bottomRow);
  }

  showTableToolbar(table) {
    if (!this.tableToolbar || !table) return;
    
    // Lấy thông tin về editor-area
    const editorArea = this.editor;
    const editorRect = editorArea.getBoundingClientRect();
    const tableRect = table.getBoundingClientRect();
    
    // Reset toolbar style về mặc định
    this.tableToolbar.style.flexDirection = 'row';
    this.tableToolbar.style.gap = '4px';
    
    // Tạo lại nút toolbar bình thường
    this.createTableToolbarButtons();
    // const editorArea = this.editor;
    //   const editorRect = editorArea.getBoundingClientRect();
    
    // Tính toán kích thước toolbar
    this.tableToolbar.style.display = 'flex';
    this.tableToolbar.style.opacity = '0';
    this.tableToolbar.style.visibility = 'hidden';
    const toolbarRect = this.tableToolbar.getBoundingClientRect();
    const toolbarWidth = toolbarRect.width;
    const toolbarHeight = toolbarRect.height;
    this.tableToolbar.style.visibility = 'visible';

    
    
    // Tính toán vị trí mặc định (phía trên, căn giữa bảng)
    let left = editorRect.right - toolbarWidth - editorRect.left - 20;
    let top = tableRect.top - toolbarHeight - 55;
    let arrowLeft = '50%';
    let arrowDirection = 'down'; // mũi tên hướng xuống
    
    // Trường hợp 1: Vượt quá lề trái
    // if (left < editorRect.left) {
    //   left = editorRect.left + 10; // Đặt toolbar bên trong editor-area
    //   arrowLeft = '10%'; // Mũi tên ở 10%
    // }
    
    // Trường hợp 2: Vượt quá lề phải  
    if (left + toolbarWidth > editorRect.right) {
      left = editorRect.right - toolbarWidth - editorRect.left - 20; // Đặt toolbar bên trong editor-area
      arrowLeft = '90%'; // Mũi tên ở 90%
    }

    // Trường hợp 3: Vượt quá lề trên
    if (top < editorRect.top + window.scrollY) {
      top = tableRect.bottom - 16; // Hiển thị phía dưới
      arrowDirection = 'up'; // Mũi tên hướng lên
    }
    
    // Trường hợp 4: Toolbar quá rộng so với editor-area
    if (toolbarWidth > editorRect.width - 20) {
      // Chia làm 2 hàng
      const buttons = [
        { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="14" viewBox="0 0 18 14" fill="none">
  <g clip-path="url(#clip0_23_620)">
    <path d="M17.2744 10.9348V2.16365C17.2744 0.994844 16.3413 0.0475311 15.1901 0.0475311H2.35536C1.20413 0.0475311 0.274414 0.991437 0.274414 2.16024V10.9382C0.274414 12.1036 1.20413 13.0509 2.35536 13.0509H15.1935C16.3447 13.0509 17.2744 12.1036 17.2744 10.9382V10.9348ZM2.31844 7.60218H7.66178V10.8803H2.31844V7.60218ZM15.0827 10.8803H9.74273V7.60218H15.0827V10.8803ZM15.0827 5.48947H9.74273V2.21477H15.0827V5.48947ZM2.31844 2.21477H7.66178V5.48947H2.31844V2.21477Z" fill="#454545"/>
  </g>
  <defs>
    <clipPath id="clip0_23_620">
      <rect width="17" height="13" fill="white" transform="translate(0.274414 0.0475311)"/>
    </clipPath>
  </defs>
</svg>`, title: 'Thêm dòng trên', cmd: 'addRowAbove' },
        { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="14" viewBox="0 0 18 14" fill="none">
  <g clip-path="url(#clip0_23_631)">
    <path d="M17.2744 10.9348V2.16365C17.2744 0.994844 16.3413 0.0475311 15.1901 0.0475311H2.35536C1.20413 0.0475311 0.274414 0.991437 0.274414 2.16024V10.9382C0.274414 12.1036 1.20413 13.0509 2.35536 13.0509H15.1935C16.3447 13.0509 17.2744 12.1036 17.2744 10.9382V10.9348ZM2.31844 7.60218H7.66178V10.8803H2.31844V7.60218ZM15.0827 10.8803H9.74273V7.60218H15.0827V10.8803ZM15.0827 5.48947H9.74273V2.21477H15.0827V5.48947ZM2.31844 2.21477H7.66178V5.48947H2.31844V2.21477Z" fill="#454545"/>
  </g>
  <defs>
    <clipPath id="clip0_23_631">
      <rect width="17" height="13" fill="white" transform="translate(0.274414 0.0475311)"/>
    </clipPath>
  </defs>
</svg>`, title: 'Thêm dòng dưới', cmd: 'addRowBelow' },
        { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="14" viewBox="0 0 18 14" fill="none">
  <g clip-path="url(#clip0_23_642)">
    <path d="M10.9348 0.274414H2.16365C0.994844 0.274414 0.0475311 1.20756 0.0475311 2.35879H13.0509C13.0509 1.20756 12.1036 0.274414 10.9382 0.274414H10.9348ZM7.60218 15.0827V9.74273H10.8803V15.0827H7.60218ZM10.8803 2.31844V7.66178H7.60218V2.31844H10.8803ZM5.48947 2.31844V7.66178H2.21477V2.31844H5.48947ZM2.21477 9.74273H5.48947V15.0827H2.21477V9.74273Z" fill="#454545"/>
  </g>
  <defs>
    <clipPath id="clip0_23_642">
      <rect width="17" height="13" fill="white" transform="translate(0.0475311 0.274414)"/>
    </clipPath>
  </defs>
</svg>`, title: 'Thêm cột trái', cmd: 'addColLeft' },
        { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="14" viewBox="0 0 18 14" fill="none">
  <g clip-path="url(#clip0_23_653)">
    <path d="M10.9348 0.274414H2.16365C0.994844 0.274414 0.0475311 1.20756 0.0475311 2.35879H13.0509C13.0509 1.20756 12.1036 0.274414 10.9382 0.274414H10.9348ZM7.60218 15.0827V9.74273H10.8803V15.0827H7.60218ZM10.8803 2.31844V7.66178H7.60218V2.31844H10.8803ZM5.48947 2.31844V7.66178H2.21477V2.31844H5.48947ZM2.21477 9.74273H5.48947V15.0827H2.21477V9.74273Z" fill="#454545"/>
  </g>
  <defs>
    <clipPath id="clip0_23_653">
      <rect width="17" height="13" fill="white" transform="translate(0.0475311 0.274414)"/>
    </clipPath>
  </defs>
</svg>`, title: 'Thêm cột phải', cmd: 'addColRight' },
        { icon: '<i class="fas fa-minus"></i>', title: 'Xóa dòng', cmd: 'deleteRow' },
        { icon: '<i class="fas fa-minus"></i>', title: 'Xóa cột', cmd: 'deleteCol' },
        { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="14" viewBox="0 0 19 14" fill="none">
  <path d="M16.5185 0.0123596H3.51142C2.34844 0.0123596 1.40649 0.964798 1.40649 2.1365V2.69495C2.18522 2.27012 3.06596 2.10224 3.92289 2.19132H8.89106V5.48374H7.69069C7.86412 6.17923 7.86412 6.9124 7.69069 7.60789H8.89106V10.9037H3.89228C3.04215 10.986 2.17501 10.8181 1.40649 10.3967V10.962C1.40649 12.1337 2.34844 13.0827 3.51142 13.0827H16.5185C17.6848 13.0827 18.6302 12.1303 18.6302 10.9586V2.13993C18.6302 0.964798 17.6848 0.0123596 16.5185 0.0123596ZM16.4096 10.9037H10.9994V7.60789H16.4096V10.9037ZM16.4096 5.48374H10.9994V2.19132H16.4096V5.48374Z" fill="#454545"/>
  <path d="M6.74518 5.48377C6.58195 4.97671 6.30312 4.50049 5.90185 4.09965C5.23195 3.42472 4.35801 3.08554 3.47727 3.08554C2.74616 3.08554 2.01504 3.31851 1.40634 3.78788C1.28052 3.88038 1.16151 3.98659 1.04929 4.09965C-0.290519 5.44951 -0.290519 7.64217 1.04929 8.99203C1.16151 9.10509 1.28052 9.2113 1.40634 9.3038C2.01504 9.77317 2.74616 10.0061 3.47727 10.0061C4.35801 10.0061 5.23195 9.66696 5.90185 8.99203C6.30312 8.59119 6.58195 8.11496 6.74518 7.60791C6.96281 6.91928 6.96281 6.1724 6.74518 5.48377ZM4.9191 7.55309C4.9191 7.55309 4.9497 7.58736 4.9633 7.60791C5.03812 7.72782 5.02451 7.89227 4.9191 7.99848C4.79668 8.12182 4.59605 8.12182 4.47363 7.99848L4.08596 7.60791L3.47727 6.99465L2.47752 7.99848C2.3551 8.12182 2.15787 8.12182 2.03205 7.99848C1.90963 7.87514 1.90963 7.67643 2.03205 7.55309L3.0318 6.54584L2.03205 5.53858C1.90963 5.41525 1.90963 5.21654 2.03205 5.0932C2.15787 4.96986 2.3551 4.96986 2.47752 5.0932L3.47727 6.09703L4.47363 5.0932C4.59605 4.96986 4.79668 4.96986 4.9191 5.0932C5.02451 5.19941 5.03812 5.36386 4.9633 5.48377C4.9497 5.50432 4.9361 5.52145 4.9191 5.53858L3.91934 6.54584L4.9191 7.55309Z" fill="#454545"/>
</svg>`, title: 'Merge cells', cmd: 'mergeCells' },
        { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="14" viewBox="0 0 19 14" fill="none">
  <path d="M16.5185 0.0123596H3.51142C2.34844 0.0123596 1.40649 0.964798 1.40649 2.1365V2.69495C2.18522 2.27012 3.06596 2.10224 3.92289 2.19132H8.89106V5.48374H7.69069C7.86412 6.17923 7.86412 6.9124 7.69069 7.60789H8.89106V10.9037H3.89228C3.04215 10.986 2.17501 10.8181 1.40649 10.3967V10.962C1.40649 12.1337 2.34844 13.0827 3.51142 13.0827H16.5185C17.6848 13.0827 18.6302 12.1303 18.6302 10.9586V2.13993C18.6302 0.964798 17.6848 0.0123596 16.5185 0.0123596ZM16.4096 10.9037H10.9994V7.60789H16.4096V10.9037ZM16.4096 5.48374H10.9994V2.19132H16.4096V5.48374Z" fill="#454545"/>
  <path d="M6.74518 5.48377C6.58195 4.97671 6.30312 4.50049 5.90185 4.09965C5.23195 3.42472 4.35801 3.08554 3.47727 3.08554C2.74616 3.08554 2.01504 3.31851 1.40634 3.78788C1.28052 3.88038 1.16151 3.98659 1.04929 4.09965C-0.290519 5.44951 -0.290519 7.64217 1.04929 8.99203C1.16151 9.10509 1.28052 9.2113 1.40634 9.3038C2.01504 9.77317 2.74616 10.0061 3.47727 10.0061C4.35801 10.0061 5.23195 9.66696 5.90185 8.99203C6.30312 8.59119 6.58195 8.11496 6.74518 7.60791C6.96281 6.91928 6.96281 6.1724 6.74518 5.48377ZM4.9191 7.55309C4.9191 7.55309 4.9497 7.58736 4.9633 7.60791C5.03812 7.72782 5.02451 7.89227 4.9191 7.99848C4.79668 8.12182 4.59605 8.12182 4.47363 7.99848L4.08596 7.60791L3.47727 6.99465L2.47752 7.99848C2.3551 8.12182 2.15787 8.12182 2.03205 7.99848C1.90963 7.87514 1.90963 7.67643 2.03205 7.55309L3.0318 6.54584L2.03205 5.53858C1.90963 5.41525 1.90963 5.21654 2.03205 5.0932C2.15787 4.96986 2.3551 4.96986 2.47752 5.0932L3.47727 6.09703L4.47363 5.0932C4.59605 4.96986 4.79668 4.96986 4.9191 5.0932C5.02451 5.19941 5.03812 5.36386 4.9633 5.48377C4.9497 5.50432 4.9361 5.52145 4.9191 5.53858L3.91934 6.54584L4.9191 7.55309Z" fill="#454545"/>
</svg>`, title: 'Split cells', cmd: 'splitCells' },
        { icon: '<i class="fas fa-times"></i>', title: 'Xóa bảng', cmd: 'deleteTable' }
      ];
      
      const splitIndex = Math.ceil(buttons.length / 2);
      
      // Xóa nội dung cũ
      const arrow = this.tableToolbar.arrow;
      this.tableToolbar.innerHTML = '';
      if (arrow) {
        this.tableToolbar.appendChild(arrow);
      }
      
      this.createSplitTableToolbar(buttons, splitIndex);
      
      // Tính lại kích thước sau khi chia
      const newToolbarRect = this.tableToolbar.getBoundingClientRect();
      const newToolbarHeight = newToolbarRect.height;
      
      // Cập nhật vị trí với chiều cao mới
      if (arrowDirection === 'down') {
        top = tableRect.top + window.scrollY - newToolbarHeight - 10;
      } else {
        top = tableRect.bottom + window.scrollY + 10;
      }
      
      // Đảm bảo toolbar nằm trong editor-area
      //left = Math.max(editorRect.left + 10, Math.min(left, editorRect.right - newToolbarRect.width - 10));
    }
    
    // Cập nhật vị trí mũi tên
    if (this.tableToolbar.arrow) {
      this.tableToolbar.arrow.style.left = arrowLeft;
      
      if (arrowDirection === 'up') {
        // Mũi tên hướng lên
        this.tableToolbar.arrow.style.bottom = 'auto';
        this.tableToolbar.arrow.style.top = '-8px';
        this.tableToolbar.arrow.style.borderTop = 'none';
        this.tableToolbar.arrow.style.borderBottom = '8px solid #fff';
        this.tableToolbar.arrow.style.borderLeft = '6px solid transparent';
        this.tableToolbar.arrow.style.borderRight = '6px solid transparent';
      } else {
        // Mũi tên hướng xuống (mặc định)
        this.tableToolbar.arrow.style.top = 'auto';
        this.tableToolbar.arrow.style.bottom = '-8px';
        this.tableToolbar.arrow.style.borderBottom = 'none';
        this.tableToolbar.arrow.style.borderTop = '8px solid #fff';
        this.tableToolbar.arrow.style.borderLeft = '6px solid transparent';
        this.tableToolbar.arrow.style.borderRight = '6px solid transparent';
      }
    }
    
    // Áp dụng vị trí cuối cùng
    this.tableToolbar.style.left = left + 'px';
    this.tableToolbar.style.top = top + 'px';
    this.tableToolbar.style.opacity = '1';
  }

  hideTableToolbar() {
    if (this.tableToolbar) {
      this.tableToolbar.style.display = 'none';
      this.tableToolbar.style.opacity = '0';
    }
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

  // Thêm method mới để update trạng thái active của các nút format
  updateFormatButtonStates() {
    if (!this.toolbarBtns || !this.editor) return;
    
    // Kiểm tra xem có selection trong editor không
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    if (!this.editor.contains(range.commonAncestorContainer) && 
        !this.editor.contains(range.commonAncestorContainer.parentNode)) {
      return;
    }

    // Danh sách các command cần kiểm tra
    const formatCommands = ['bold', 'italic', 'underline', 'strikeThrough', 'superscript', 'subscript'];
    
    formatCommands.forEach(cmd => {
      if (this.toolbarBtns[cmd] && !this.toolbarBtns[cmd].classList.contains('more-options-btn')) {
        try {
          const isActive = document.queryCommandState(cmd);
          this.toolbarBtns[cmd]._setActive(isActive);
        } catch (e) {
          // Fallback: kiểm tra style computed
          const isActive = this.checkFormatByStyle(cmd, range);
          this.toolbarBtns[cmd]._setActive(isActive);
        }
      }
    });

    // Update màu cho nút text color và background color
    this.updateColorButtonStates(range);
  }

  // Helper method để kiểm tra format bằng computed style
  checkFormatByStyle(cmd, range) {
    const node = range.startContainer.nodeType === 3 ? 
                  range.startContainer.parentNode : 
                  range.startContainer;
    
    if (!node || !node.style) return false;
    
    const computedStyle = window.getComputedStyle(node);
    
    switch (cmd) {
      case 'bold':
        return computedStyle.fontWeight === 'bold' || 
               computedStyle.fontWeight === '700' || 
               parseInt(computedStyle.fontWeight) >= 700 ||
               node.tagName === 'B' || node.tagName === 'STRONG';
      case 'italic':
        return computedStyle.fontStyle === 'italic' ||
               node.tagName === 'I' || node.tagName === 'EM';
      case 'underline':
        return computedStyle.textDecoration.includes('underline') ||
               node.tagName === 'U';
      case 'strikeThrough':
        return computedStyle.textDecoration.includes('line-through') ||
               node.tagName === 'STRIKE' || node.tagName === 'S';
      case 'superscript':
        return computedStyle.verticalAlign === 'super' ||
               node.tagName === 'SUP';
      case 'subscript':
        return computedStyle.verticalAlign === 'sub' ||
               node.tagName === 'SUB';
      default:
        return false;
    }
  }

  // Method để update màu hiện tại cho nút text color và background color
  updateColorButtonStates(range) {
    if (!this.toolbarBtns || !this.editor) return;
    
    // Lấy range nếu không được truyền vào
    if (!range) {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      range = selection.getRangeAt(0);
    }
    
    // Lấy node hiện tại
    const node = range.startContainer.nodeType === 3 ? 
                  range.startContainer.parentNode : 
                  range.startContainer;
    
    if (!node) return;
    
    // Update text color - change icon text color
    if (this.toolbarBtns.textColor) {
      const textColor = this.getCurrentTextColor(node);
      this.toolbarBtns.textColor.style.setProperty('color', textColor, 'important');
      this.toolbarBtns.textColor._currentColor = textColor; // Store current color
    }
    
    // Update background color - change icon background color
    if (this.toolbarBtns.bgColor) {
      const bgColor = this.getCurrentBackgroundColor(node);
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        this.toolbarBtns.bgColor.style.setProperty('background-color', bgColor, 'important');
        this.toolbarBtns.bgColor.style.setProperty('border', 'none', 'important');
        this.toolbarBtns.bgColor._currentColor = bgColor; // Store current color
      } else {
        this.toolbarBtns.bgColor.style.setProperty('background-color', 'transparent', 'important');
        this.toolbarBtns.bgColor._currentColor = 'transparent'; // Store current color
      }
    }
  }

  // Helper method để lấy màu text hiện tại
  getCurrentTextColor(node) {
    if (!node) return '#000000';
    
    // Kiểm tra style inline trước
    if (node.style && node.style.color) {
      return this.normalizeColor(node.style.color);
    }
    
    // Kiểm tra computed style
    const computedStyle = window.getComputedStyle(node);
    if (computedStyle.color) {
      return this.normalizeColor(computedStyle.color);
    }
    
    // Traverse lên parent để tìm màu
    let parent = node.parentNode;
    while (parent && parent !== this.editor) {
      if (parent.style && parent.style.color) {
        return this.normalizeColor(parent.style.color);
      }
      const parentComputed = window.getComputedStyle(parent);
      if (parentComputed.color && parentComputed.color !== 'rgb(0, 0, 0)') {
        return this.normalizeColor(parentComputed.color);
      }
      parent = parent.parentNode;
    }
    
    return '#000000'; // Default
  }

  // Helper method để lấy màu background hiện tại
  getCurrentBackgroundColor(node) {
    if (!node) return 'transparent';
    
    // Kiểm tra style inline trước
    if (node.style && node.style.backgroundColor) {
      return this.normalizeColor(node.style.backgroundColor);
    }
    
    // Kiểm tra computed style
    const computedStyle = window.getComputedStyle(node);
    if (computedStyle.backgroundColor && 
        computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
        computedStyle.backgroundColor !== 'transparent') {
      return this.normalizeColor(computedStyle.backgroundColor);
    }
    
    // Traverse lên parent để tìm background color
    let parent = node.parentNode;
    while (parent && parent !== this.editor) {
      if (parent.style && parent.style.backgroundColor) {
        const bgColor = this.normalizeColor(parent.style.backgroundColor);
        if (bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
          return bgColor;
        }
      }
      const parentComputed = window.getComputedStyle(parent);
      if (parentComputed.backgroundColor && 
          parentComputed.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
          parentComputed.backgroundColor !== 'transparent') {
        return this.normalizeColor(parentComputed.backgroundColor);
      }
      parent = parent.parentNode;
    }
    
    return 'transparent';
  }

  // Helper method để normalize màu về hex format
  normalizeColor(color) {
    if (!color) return '#000000';
    
    // Nếu đã là hex thì return luôn
    if (color.startsWith('#')) return color;
    
    // Convert rgb/rgba to hex
    if (color.startsWith('rgb')) {
      const matches = color.match(/\d+/g);
      if (matches && matches.length >= 3) {
        const r = parseInt(matches[0]);
        const g = parseInt(matches[1]);
        const b = parseInt(matches[2]);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      }
    }
    
    return color;
  }

  // Method để apply background color sử dụng style thay vì execCommand
  applyBackgroundColor(color) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    
    // Nếu không có text được chọn
    if (range.collapsed) {
      // Tạo span để wrap text sẽ được nhập
      const span = document.createElement('span');
      span.style.backgroundColor = color === 'transparent' ? '' : color;
      span.textContent = '\u200B'; // Zero-width space
      range.insertNode(span);
      
      // Di chuyển cursor vào trong span
      range.setStart(span, 1);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // Nếu có text được chọn
      const contents = range.extractContents();
      const span = document.createElement('span');
      span.style.backgroundColor = color === 'transparent' ? '' : color;
      span.appendChild(contents);
      range.insertNode(span);
    }
    
    // Giữ selection
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Update button background color immediately
    if (this.toolbarBtns.bgColor) {
      if (color && color !== 'transparent') {
        this.toolbarBtns.bgColor.style.setProperty('background-color', color, 'important');
        this.toolbarBtns.bgColor._currentColor = color; // Store current color
      } else {
        this.toolbarBtns.bgColor.style.setProperty('background-color', 'transparent', 'important');
        this.toolbarBtns.bgColor._currentColor = 'transparent'; // Store current color
      }
    }
  }

  // Method để apply text color và update indicator
  applyTextColor(color) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    
    // Nếu không có text được chọn
    if (range.collapsed) {
      // Tạo span để wrap text sẽ được nhập
      const span = document.createElement('span');
      span.style.color = color;
      span.textContent = '\u200B'; // Zero-width space
      range.insertNode(span);
      
      // Di chuyển cursor vào trong span
      range.setStart(span, 1);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // Nếu có text được chọn
      const contents = range.extractContents();
      const span = document.createElement('span');
      span.style.color = color;
      span.appendChild(contents);
      range.insertNode(span);
      
      // Giữ selection
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    // Update button text color immediately
    if (this.toolbarBtns.textColor) {
      this.toolbarBtns.textColor.style.setProperty('color', color, 'important');
      this.toolbarBtns.textColor._currentColor = color; // Store current color
    }
  }

  bindEvents() {
    this.editor.addEventListener('input', () => {
      this.updateStatusbar();
      this.updateIndentButtonState();
      this.updateHeadingSelector();
      this.updateFontSizeDisplay();
      this.updateLineHeightDisplay();
      this.updateFormatButtonStates(); // Thêm cập nhật trạng thái nút format
      this.updateColorButtonStates(); // Thêm cập nhật màu sắc
      
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
          //this.updateStatusbar(); // Thêm để cập nhật breadcrumb khi di chuyển cursor
          this.updateIndentButtonState();
          this.updateHeadingSelector();
          this.updateFontSizeDisplay();
          this.updateLineHeightDisplay();
          this.updateFormatButtonStates(); // Thêm cập nhật trạng thái nút format
          this.updateColorButtonStates(); // Thêm cập nhật màu sắc
        }, 1);
      }
    });

    // Thêm event listeners cho mouse và keyboard để cập nhật trạng thái ngay lập tức
    this.editor.addEventListener('mouseup', () => {
      setTimeout(() => {
        this.updateFormatButtonStates();
        this.updateColorButtonStates();
      }, 10);
    });

    this.editor.addEventListener('keyup', (e) => {
      // Chỉ cập nhật khi không phải là các phím điều hướng
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
        setTimeout(() => {
          this.updateFormatButtonStates();
          this.updateColorButtonStates();
        }, 10);
      }
    });

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
        
        // Hiển thị toolbar với logic 4 trường hợp
        this.showTableToolbar(table);
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
      // Luôn ẩn toolbar khi có input
      this.hideBlockToolbar();
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
      } else {
        this.hideBlockToolbar();
      }
    });

    // Thêm support cho keyboard selection (Shift + Arrow keys)
    this.editor.addEventListener('keyup', e => {
      if (e.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        setTimeout(() => {
          const sel = window.getSelection();
          if (sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            if (!range.collapsed) { // Có text được select bằng keyboard
              const rect = range.getBoundingClientRect();
              this.showBlockToolbar({
                left: rect.left + (rect.width / 2),
                top: rect.top - 10
              });
            } else {
              this.hideBlockToolbar();
            }
          }
        }, 10);
      }
    });

    // Thêm sự kiện con lăn chuột để tắt các toolbar
    this.editor.addEventListener('wheel', () => {
      // Tắt block-toolbar
      this.hideBlockToolbar();
      
      // Tắt table-toolbar
      this.hideTableToolbar();
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
        if (btn && (btn.tagName === 'BUTTON' || btn.classList.contains('toolbar-btn')) && typeof btn._setActive === 'function') {
          btn._setActive(false);
        }
      });

      // Duy trì trạng thái more-options-btn
      this.updateMoreOptionsButtonState();

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

  // Handle format commands with immediate button state updates
  handleFormatCommand(cmd, btn) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) {
      this.editor.focus();
      return;
    }

    // Save current selection
    this.savedSelection = this.saveSelection();

    // Execute the command
    document.execCommand(cmd, false, null);

    // Immediately update button active state
    // For empty paragraphs like <p><br></p>, queryCommandState might not work correctly
    // So we'll check for actual formatting and update the button state
    setTimeout(() => {
      const isActive = document.queryCommandState(cmd);
      btn._setActive(isActive);
      
      // Also update all other buttons of the same command type if any
      const allButtons = this.toolbar.querySelectorAll('button');
      allButtons.forEach(button => {
        const buttonTitle = button.title.toLowerCase();
        const cmdMap = {
          'bold': 'Bold',
          'italic': 'Italic', 
          'underline': 'Underline',
          'strikeThrough': 'Strike Through',
          'superscript': 'Superscript',
          'subscript': 'Subscript'
        };
        
        if (cmdMap[cmd] && buttonTitle.includes(cmdMap[cmd].toLowerCase())) {
          button._setActive(isActive);
        }
      });
    }, 10);

    // Focus back to editor
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
    tooltip.style.padding = '12px';
    tooltip.style.zIndex = 9999;
    tooltip.style.display = 'flex';
    tooltip.style.flexDirection = 'column';
    //tooltip.style.gap = '12px';
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
    if (!emojis) {
      tooltip.appendChild(input);
    }

    let fileInput, fileInputWrapper, fileLabel, filePreview;
    if (file || showImportOptions) {
      fileInputWrapper = document.createElement('div');
      fileInputWrapper.style.marginTop = '8px';
      
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.style.width = '90%';
      
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
        filePreview.style.maxWidth = '80%';
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
      emojiBox.style.display = 'grid';
      emojiBox.style.gridTemplateColumns = 'repeat(10, 1fr)';
      emojiBox.style.gap = '8px';
      emojiList.forEach(emo => {
        const btn = document.createElement('button');
        btn.textContent = emo;
        btn.style.fontSize = '24px';
        btn.style.padding = '4px';
        btn.style.border = 'none';
        btn.style.background = 'none';
        btn.style.cursor = 'pointer';
        btn.style.borderRadius = '4px';
        btn.style.transition = 'background-color 0.2s ease';
        
        // Thêm hover effect
        btn.addEventListener('mouseenter', () => {
          btn.style.backgroundColor = '#EEEEEE';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.backgroundColor = 'transparent';
        });
        
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
      tooltip.appendChild(emojiBox);
      
      // Thêm dòng hướng dẫn
      const hintText = document.createElement('div');
      hintText.innerHTML = 'Get more emojis with <span style="border-radius: 2.2px; background: #EEE; padding: 2px 4px;">⌘</span> <span style="color: #000;">+</span> <span style="border-radius: 2.2px; background: #EEE; padding: 2px 4px;">CTRL</span> <span style="color: #000;">+</span> <span style="border-radius: 2.2px; background: #EEE; padding: 2px 4px;">SPACE</span>';
      hintText.style.color = '#71787C';
      hintText.style.fontStyle = 'normal';
      hintText.style.marginTop = '12px';
      hintText.style.fontWeight = '400';
      hintText.style.lineHeight = 'normal';
      hintText.style.textAlign = 'center';
      tooltip.appendChild(hintText);
    }

    if (!emojis) {
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
    }

    function close() {
      overlay.remove();
      tooltip.remove();
      if (onClose) onClose();
    }

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
    img.style.maxWidth = '80%';
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

    // Close all dropdowns first
    this.closeAllDropdowns();
    // Danh sách màu phổ biến
    const palette = [
      '#000000', '#333333', '#666666', '#999999', '#cccccc', '#eeeeee',
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
    paletteDiv.style.padding = '8px'; // Item cách box 8px
    paletteDiv.style.display = 'grid';
    paletteDiv.style.gridTemplateColumns = 'repeat(6, 1fr)'; // 6 cột
    paletteDiv.style.columnGap = '4px'; // Item ngang cách nhau 4px
    paletteDiv.style.rowGap = '6px'; // Item dọc cách nhau 6px
    paletteDiv.style.width = 'auto';

    palette.forEach(color => {
      const colorBtn = document.createElement('button');
      colorBtn.style.width = '24px';
      colorBtn.style.height = '24px';
      colorBtn.style.borderRadius = '50%'; // Hình tròn
      colorBtn.style.background = color;
      colorBtn.style.cursor = 'pointer';
      colorBtn.style.setProperty('border', 'none', 'important');
      colorBtn.style.outline = 'none';
      colorBtn.style.transition = 'all 0.15s ease';
      colorBtn.style.padding = '0';
      colorBtn.style.margin = '0';
      colorBtn.title = color;
      colorBtn.onclick = e => {
        e.preventDefault();
        this.restoreSelection && this.restoreSelection(this.savedColorSelection);
        if (type === 'textColor') {
          this.applyTextColor(color);
        } else {
          this.applyBackgroundColor(color);
        }
        paletteDiv.remove();
        this.colorPicker = null;
      };
      colorBtn.onmouseover = () => {
        colorBtn.style.transform = 'scale(1.1)';
        colorBtn.style.boxShadow = '0 0 0 2px #007bff44';
      };
      colorBtn.onmouseout = () => {
        colorBtn.style.transform = 'scale(1)';
        colorBtn.style.boxShadow = 'none';
      };
      paletteDiv.appendChild(colorBtn);
    });

    // Đường kẻ ngang chia cắt
    const divider = document.createElement('div');
    //divider.style.marginTop = '8px';
    divider.style.gridColumn = '1 / -1'; // Spanning toàn bộ 6 cột
    divider.style.marginLeft = '-8px';
    divider.style.marginRight = '-8px';
    divider.style.height = '1px';
    divider.style.background = '#eee';
    paletteDiv.appendChild(divider);

    // Container cho 4 nút tùy chọn
    const optionsContainer = document.createElement('div');
    //optionsContainer.style.marginTop = '8px';
    optionsContainer.style.gridColumn = '1 / -1'; // Spanning toàn bộ 6 cột
    optionsContainer.style.display = 'flex';
    optionsContainer.style.gap = '4px';

    // Nút no color (SVG với đường kẻ chéo)
    const noColorBtn = document.createElement('button');
    noColorBtn.style.width = '24px';
    noColorBtn.style.height = '24px';
    noColorBtn.style.border = '1px solid #eee';
    noColorBtn.style.borderRadius = '50%'; // Hình tròn
    noColorBtn.style.background = '#fff';
    noColorBtn.style.cursor = 'pointer';
    noColorBtn.style.display = 'flex';
    noColorBtn.style.alignItems = 'center';
    noColorBtn.style.justifyContent = 'center';
    noColorBtn.style.padding = '0';
    noColorBtn.style.margin = '0';

    noColorBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none">
      <line x1="1.24715" y1="6.41398" x2="21.5343" y2="18.1268" stroke="#EA6666" stroke-width="0.842105"/>
      <circle cx="11.7127" cy="11.7128" r="11.2918" transform="rotate(90 11.7127 11.7128)" stroke="#D7D7D7" stroke-width="0.842105"/>
    </svg>
    `;

    noColorBtn.title = 'No Color';
    noColorBtn.onmouseover = () => {
        noColorBtn.style.transform = 'scale(1.1)';
        noColorBtn.style.boxShadow = '0 0 0 2px #007bff44';
      };
      noColorBtn.onmouseout = () => {
        noColorBtn.style.transform = 'scale(1)';
        noColorBtn.style.boxShadow = 'none';
      };
    noColorBtn.onclick = e => {
      e.preventDefault();
      paletteDiv.remove();
      this.restoreSelection && this.restoreSelection(this.savedColorSelection);
      if (type === 'textColor') {
        this.applyTextColor('transparent');
      } else {
        this.applyBackgroundColor('transparent');
      }
      this.colorPicker = null;
    };

    // Nút màu đen
    const blackBtn = document.createElement('button');
    blackBtn.style.width = '24px';
    blackBtn.style.height = '24px';
    blackBtn.style.border = '1px solid #eee';
    blackBtn.style.borderRadius = '4px';
    blackBtn.style.background = '#000000';
    blackBtn.style.cursor = 'pointer';
    blackBtn.title = 'Black';
    blackBtn.style.borderRadius = '50%'; // Hình tròn
    blackBtn.onmouseover = () => {
        blackBtn.style.transform = 'scale(1.1)';
        blackBtn.style.boxShadow = '0 0 0 2px #007bff44';
      };
      blackBtn.onmouseout = () => {
        blackBtn.style.transform = 'scale(1)';
        blackBtn.style.boxShadow = 'none';
      };
    blackBtn.onclick = e => {
      e.preventDefault();
      paletteDiv.remove();
      this.restoreSelection && this.restoreSelection(this.savedColorSelection);
      if (type === 'textColor') {
        this.applyTextColor('#000000');
      } else {
        this.applyBackgroundColor('#000000');
      }
      this.colorPicker = null;
    };

    // Nút màu trắng
    const whiteBtn = document.createElement('button');
    whiteBtn.style.width = '24px';
    whiteBtn.style.height = '24px';
    whiteBtn.style.border = '1px solid #eee';
    whiteBtn.style.borderRadius = '4px';
    whiteBtn.style.background = '#ffffff';
    whiteBtn.style.cursor = 'pointer';
    whiteBtn.style.borderRadius = '50%'; // Hình tròn
    whiteBtn.title = 'White';
    whiteBtn.onmouseover = () => {
        whiteBtn.style.transform = 'scale(1.1)';
        whiteBtn.style.boxShadow = '0 0 0 2px #007bff44';
      };
      whiteBtn.onmouseout = () => {
        whiteBtn.style.transform = 'scale(1)';
        whiteBtn.style.boxShadow = 'none';
      };
    whiteBtn.onclick = e => {
      e.preventDefault();
      paletteDiv.remove();
      this.restoreSelection && this.restoreSelection(this.savedColorSelection);
      if (type === 'textColor') {
        this.applyTextColor('#ffffff');
      } else {
        this.applyBackgroundColor('#ffffff');
      }
      this.colorPicker = null;
    };

    // Nút custom color (SVG chỉ có vòng tròn)
    const customBtn = document.createElement('button');
    customBtn.style.width = '24px';
    customBtn.style.height = '24px';
    customBtn.style.border = '1px solid #eee';
    customBtn.style.borderRadius = '4px';
    customBtn.style.background = '#fff';
    customBtn.style.cursor = 'pointer';
    customBtn.style.display = 'flex';
    customBtn.style.alignItems = 'center';
    customBtn.style.justifyContent = 'center';
    customBtn.style.borderRadius = '50%'; // Hình tròn
    customBtn.style.padding = '0';
    customBtn.style.margin = '0';
    customBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16" fill="none">
      <g clip-path="url(#clip0_6_132)">
        <path d="M16.07 7.7128C16.07 7.73944 16.07 7.76609 16.07 7.79273C16.0582 8.87332 15.0753 9.60753 13.9947 9.60753H11.0963C10.3118 9.60753 9.67527 10.244 9.67527 11.0286C9.67527 11.1292 9.68711 11.2269 9.70487 11.3217C9.76704 11.6237 9.89731 11.9138 10.0246 12.2069C10.2052 12.6154 10.3828 13.021 10.3828 13.4503C10.3828 14.3917 9.74336 15.2473 8.80191 15.2858C8.69829 15.2888 8.59468 15.2917 8.4881 15.2917C4.30487 15.2917 0.912109 11.899 0.912109 7.7128C0.912109 3.52661 4.30487 0.13385 8.49106 0.13385C12.6772 0.13385 16.07 3.52661 16.07 7.7128ZM4.70158 8.66017C4.70158 8.40891 4.60177 8.16794 4.42411 7.99028C4.24644 7.81261 4.00547 7.7128 3.75421 7.7128C3.50296 7.7128 3.26199 7.81261 3.08432 7.99028C2.90666 8.16794 2.80685 8.40891 2.80685 8.66017C2.80685 8.91142 2.90666 9.15239 3.08432 9.33006C3.26199 9.50772 3.50296 9.60753 3.75421 9.60753C4.00547 9.60753 4.24644 9.50772 4.42411 9.33006C4.60177 9.15239 4.70158 8.91142 4.70158 8.66017ZM4.70158 5.81806C4.95284 5.81806 5.19381 5.71825 5.37147 5.54058C5.54914 5.36292 5.64895 5.12195 5.64895 4.87069C5.64895 4.61943 5.54914 4.37847 5.37147 4.2008C5.19381 4.02314 4.95284 3.92332 4.70158 3.92332C4.45033 3.92332 4.20936 4.02314 4.03169 4.2008C3.85403 4.37847 3.75421 4.61943 3.75421 4.87069C3.75421 5.12195 3.85403 5.36292 4.03169 5.54058C4.20936 5.71825 4.45033 5.81806 4.70158 5.81806ZM9.43843 2.97596C9.43843 2.7247 9.33861 2.48373 9.16095 2.30606C8.98328 2.1284 8.74231 2.02859 8.49106 2.02859C8.2398 2.02859 7.99883 2.1284 7.82117 2.30606C7.6435 2.48373 7.54369 2.7247 7.54369 2.97596C7.54369 3.22721 7.6435 3.46818 7.82117 3.64585C7.99883 3.82351 8.2398 3.92332 8.49106 3.92332C8.74231 3.92332 8.98328 3.82351 9.16095 3.64585C9.33861 3.46818 9.43843 3.22721 9.43843 2.97596ZM12.2805 5.81806C12.5318 5.81806 12.7728 5.71825 12.9504 5.54058C13.1281 5.36292 13.2279 5.12195 13.2279 4.87069C13.2279 4.61943 13.1281 4.37847 12.9504 4.2008C12.7728 4.02314 12.5318 3.92332 12.2805 3.92332C12.0293 3.92332 11.7883 4.02314 11.6106 4.2008C11.433 4.37847 11.3332 4.61943 11.3332 4.87069C11.3332 5.12195 11.433 5.36292 11.6106 5.54058C11.7883 5.71825 12.0293 5.81806 12.2805 5.81806Z" fill="#454545"/>
      </g>
      <defs>
        <clipPath id="clip0_6_132">
          <rect width="15.1579" height="15.1579" fill="white" transform="translate(0.912109 0.13385)"/>
        </clipPath>
      </defs>
    </svg>`;
    customBtn.title = 'Custom Color';
    customBtn.onmouseover = () => {
        customBtn.style.transform = 'scale(1.1)';
        customBtn.style.boxShadow = '0 0 0 2px #007bff44';
      };
      customBtn.onmouseout = () => {
        customBtn.style.transform = 'scale(1)';
        customBtn.style.boxShadow = 'none';
      };
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
          this.applyTextColor(color);
        } else {
          this.applyBackgroundColor(color);
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

    // Thêm tất cả nút vào container
    optionsContainer.appendChild(noColorBtn);
    optionsContainer.appendChild(blackBtn);
    optionsContainer.appendChild(whiteBtn);
    optionsContainer.appendChild(customBtn);
    paletteDiv.appendChild(optionsContainer);

    document.body.appendChild(paletteDiv);
    this.colorPicker = paletteDiv;
    // Lưu selection để áp dụng màu đúng vùng chọn
    this.savedColorSelection = this.saveSelection();
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
    this.blockToolbar.style.borderRadius = '6.9px';
    this.blockToolbar.style.boxSizing = 'border-box';
    this.blockToolbar.style.boxShadow = '0 4px 24px rgba(0,0,0,0.13)';
    this.blockToolbar.style.padding = '12px';
    this.blockToolbar.style.gap = '28px';
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
    this.blockToolbar.style.flexWrap = 'nowrap';
    
    // Thêm mũi tên (mặc định hướng xuống)
    if (!this.blockToolbar.arrow) {
      const arrow = document.createElement('div');
      arrow.className = 'block-toolbar-arrow';
      arrow.style.position = 'absolute';
      arrow.style.left = '50%';
      arrow.style.bottom = '-8px';
      arrow.style.transform = 'translateX(-50%)';
      arrow.style.borderLeft = '6px solid transparent';
      arrow.style.borderRight = '6px solid transparent';
      arrow.style.borderTop = '8px solid #fff';
      arrow.style.setProperty('borderTop', '8px solid #fff', 'important');
      arrow.style.filter = 'drop-shadow(0px 1px 1px rgba(0,0,0,0.08))';
      this.blockToolbar.appendChild(arrow);
      this.blockToolbar.arrow = arrow;
    }
    
    // Xóa cũ nếu có
    if (this.blockToolbar.parentNode) this.blockToolbar.parentNode.removeChild(this.blockToolbar);
    document.body.appendChild(this.blockToolbar);
    
    this.createBlockToolbarButtons();
  }

  createBlockToolbarButtons() {
    // Xóa tất cả nút cũ (trừ arrow)
    const arrow = this.blockToolbar.arrow;
    this.blockToolbar.innerHTML = '';
    if (arrow) {
      this.blockToolbar.appendChild(arrow);
    }
    
    const features = this.options.blockToolbarFeatures;
    const icons = {
      bold: '<i class="fas fa-bold"></i>',
      italic: '<i class="fas fa-italic"></i>',
      underline: '<i class="fas fa-underline"></i>',
      strikeThrough: '<i class="fas fa-strikethrough"></i>',
      code: '<i class="fas fa-code"></i>',
      fontFamily: '<i class="fas fa-font"></i>'
    };
    
    features.forEach(f => {
      const btn = document.createElement('button');
      btn.innerHTML = icons[f] || f;
      btn.title = f.charAt(0).toUpperCase() + f.slice(1);
      btn.style.background = '#fff';
      btn.style.border = 'none';
      btn.style.borderRadius = '8px';
      btn.style.height = '14px';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.fontSize = '14px';
      btn.style.color = '#374151';
      btn.style.cursor = 'pointer';
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
  }

  createSplitToolbar(features, splitIndex) {
    // Tạo toolbar cho phần đầu
    const firstPart = features.slice(0, splitIndex);
    const secondPart = features.slice(splitIndex);
    
    // Tạo toolbar trên
    this.blockToolbar.style.flexDirection = 'column';
    this.blockToolbar.style.gap = '8px';
    
    const topRow = document.createElement('div');
    topRow.style.display = 'flex';
    topRow.style.gap = '28px';
    topRow.style.alignItems = 'center';
    
    const bottomRow = document.createElement('div');
    bottomRow.style.display = 'flex';
    bottomRow.style.gap = '28px';
    bottomRow.style.alignItems = 'center';
    
    const icons = {
      bold: '<i class="fas fa-bold"></i>',
      italic: '<i class="fas fa-italic"></i>',
      underline: '<i class="fas fa-underline"></i>',
      strikeThrough: '<i class="fas fa-strikethrough"></i>',
      code: '<i class="fas fa-code"></i>',
      fontFamily: '<i class="fas fa-font"></i>'
    };
    
    // Tạo nút cho hàng trên
    firstPart.forEach(f => {
      const btn = this.createToolbarButton(f, icons[f] || f);
      topRow.appendChild(btn);
    });
    
    // Tạo nút cho hàng dưới
    secondPart.forEach(f => {
      const btn = this.createToolbarButton(f, icons[f] || f);
      bottomRow.appendChild(btn);
    });
    
    this.blockToolbar.appendChild(topRow);
    this.blockToolbar.appendChild(bottomRow);
  }

  createToolbarButton(feature, icon) {
    const btn = document.createElement('button');
    btn.innerHTML = icon;
    btn.title = feature.charAt(0).toUpperCase() + feature.slice(1);
    btn.style.background = '#fff';
    btn.style.border = 'none';
    btn.style.borderRadius = '8px';
    btn.style.height = '14px';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.fontSize = '14px';
    btn.style.color = '#374151';
    btn.style.cursor = 'pointer';
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
      this.handleBlockToolbarAction(feature);
      this.hideBlockToolbar();
    };
    return btn;
  }

  showBlockToolbar(rect) {
    if (!this.blockToolbar) return;
    
    // Clear timeout hiện tại nếu có
    if (this.blockToolbarTimeout) {
      clearTimeout(this.blockToolbarTimeout);
    }
    
    // Delay 0.5s trước khi hiện toolbar
    this.blockToolbarTimeout = setTimeout(() => {
      // Lấy thông tin về editor-area
      const editorArea = this.editor;
      const editorRect = editorArea.getBoundingClientRect();
      
      // Reset toolbar style về mặc định
      this.blockToolbar.style.flexDirection = 'row';
      this.blockToolbar.style.gap = '28px';
      
      // Tạo lại nút toolbar bình thường
      this.createBlockToolbarButtons();
      
      // Tính toán kích thước toolbar
      this.blockToolbar.style.display = 'flex';
      this.blockToolbar.style.opacity = '0';
      this.blockToolbar.style.visibility = 'hidden';
      const toolbarRect = this.blockToolbar.getBoundingClientRect();
      const toolbarWidth = toolbarRect.width;
      const toolbarHeight = toolbarRect.height;
      this.blockToolbar.style.visibility = 'visible';
      
      // Tính toán vị trí mặc định (phía trên)
      let left = rect.left - 160;
      let top = rect.top + window.scrollY - toolbarHeight - 10;
      let arrowLeft = '50%';
      let arrowDirection = 'down'; // mũi tên hướng xuống
      
      // Trường hợp 1: Vượt quá lề trái
      if (left < editorRect.left) {
        left =  rect.left -30; // Đặt toolbar bên trong editor-area
        arrowLeft = '10%'; // Mũi tên ở 10%
      }
      
      // Trường hợp 2: Vượt quá lề phải  
      if (left + toolbarWidth > editorRect.right) {
        left = editorRect.right + (rect.left - editorRect.right) - toolbarWidth + 30; // Đặt toolbar bên trong editor-area
        arrowLeft = '90%'; // Mũi tên ở 90%
      }
      
      // Trường hợp 3: Vượt quá lề trên
      if (top < editorRect.top + window.scrollY) {
        top = rect.top + window.scrollY+toolbarHeight + 10; // Hiển thị phía dưới
        arrowDirection = 'up'; // Mũi tên hướng lên
      }
      
      // Trường hợp 4: Toolbar quá rộng so với editor-area
      if (toolbarWidth > editorRect.width - 20) {
        // Chia làm 2 hàng
        const features = this.options.blockToolbarFeatures;
        const splitIndex = Math.ceil(features.length / 2);
        
        // Xóa nội dung cũ
        const arrow = this.blockToolbar.arrow;
        this.blockToolbar.innerHTML = '';
        if (arrow) {
          this.blockToolbar.appendChild(arrow);
        }
        
        this.createSplitToolbar(features, splitIndex);
        
        // Tính lại kích thước sau khi chia
        const newToolbarRect = this.blockToolbar.getBoundingClientRect();
        const newToolbarHeight = newToolbarRect.height;
        
        // Cập nhật vị trí với chiều cao mới
        if (arrowDirection === 'down') {
          top = rect.top + window.scrollY - newToolbarHeight - 10;
        } else {
          top = rect.bottom + window.scrollY + 10;
        }
        
        // Đảm bảo toolbar nằm trong editor-area
        left = Math.max(editorRect.left + 10, Math.min(left, editorRect.right - newToolbarRect.width - 10));
      }
      console.log("rect.left",rect.left);
      console.log("editorRect.right",editorRect.right);
      console.log("editorRect.left",editorRect.left);
      
      // Cập nhật vị trí mũi tên
      if (this.blockToolbar.arrow) {
        this.blockToolbar.arrow.style.left = arrowLeft;
        
        if (arrowDirection === 'up') {
          // Mũi tên hướng lên
          this.blockToolbar.arrow.style.bottom = 'auto';
          this.blockToolbar.arrow.style.top = '-8px';
          this.blockToolbar.arrow.style.borderTop = 'none';
          this.blockToolbar.arrow.style.borderBottom = '8px solid #fff';
          this.blockToolbar.arrow.style.borderLeft = '6px solid transparent';
          this.blockToolbar.arrow.style.borderRight = '6px solid transparent';
        } else {
          // Mũi tên hướng xuống (mặc định)
          this.blockToolbar.arrow.style.top = 'auto';
          this.blockToolbar.arrow.style.bottom = '-8px';
          this.blockToolbar.arrow.style.borderBottom = 'none';
          this.blockToolbar.arrow.style.borderTop = '8px solid #fff';
          this.blockToolbar.arrow.style.borderLeft = '6px solid transparent';
          this.blockToolbar.arrow.style.borderRight = '6px solid transparent';
        }
      }
      
      // Áp dụng vị trí cuối cùng
      this.blockToolbar.style.left = left + 'px';
      this.blockToolbar.style.top = top + 'px';
      
      setTimeout(() => {
        this.blockToolbar.style.opacity = '1';
        this.blockToolbar.style.pointerEvents = 'auto';
      }, 10);
    }, 500); // Delay 0.5s
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
    if (type === 'bold') {
      document.execCommand('bold');
    } else if (type === 'italic') {
      document.execCommand('italic');
    } else if (type === 'underline') {
      document.execCommand('underline');
    } else if (type === 'strikethrough') {
      document.execCommand('strikeThrough');
    } else if (type === 'fontFamily') {
      document.execCommand('fontFamily');
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
    
    // Nếu block là chính editor hoặc không tìm thấy block hợp lệ
    if (block === this.editor || !block) {
      // Tạo một thẻ P mặc định nếu cần
      if (this.editor.innerHTML.trim() === '' || this.editor.innerHTML === '<br>') {
        const p = document.createElement('P');
        p.innerHTML = '<br>';
        this.editor.appendChild(p);
        
        // Đặt selection vào thẻ P mới tạo
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(p);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        return p;
      }
      
      // Nếu editor có nội dung nhưng không có block element, wrap trong P
      const firstChild = this.editor.firstChild;
      if (firstChild && firstChild.nodeType === 3) {
        const p = document.createElement('P');
        while (this.editor.firstChild) {
          p.appendChild(this.editor.firstChild);
        }
        this.editor.appendChild(p);
        return p;
      }
      
      return null;
    }
    
    return block;
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
    // Cập nhật trạng thái hiển thị của nút indentDecrease
    this.updateIndentDecreaseButtonVisibility();
    
    // Cập nhật trạng thái hiển thị của nút indentIncrease  
    this.updateIndentIncreaseButtonVisibility();
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
    decreaseButton.style.cursor = shouldShow ? 'pointer' : 'not-allowed';
    decreaseButton.style.opacity = shouldShow ? '1' : '0.5';
    
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
    increaseButton.style.cursor = shouldHide ? 'not-allowed' : 'pointer';
    increaseButton.style.opacity = shouldHide ? '0.5' : '1';
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
    console.log('applyHeadingToSelection called with:', tagName); // Debug log
    const sel = window.getSelection();
    console.log('Selection range count:', sel.rangeCount); // Debug log
    if (!sel.rangeCount) return;
    
    const range = sel.getRangeAt(0);
    console.log('Range collapsed:', range.collapsed); // Debug log
    
    // Nếu không có selection (chỉ có caret), áp dụng cho block hiện tại
    if (range.collapsed) {
      const block = this.getBlockElementAtCaret();
      console.log('Current block:', block, 'tagName:', block?.tagName); // Debug log
      this.changeBlockTag(block, tagName);
    } else {
      // Nếu có selection, tìm tất cả các blocks trong vùng chọn
      const blocks = this.getBlocksInSelection();
      console.log('Selected blocks:', blocks.length); // Debug log
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
    // Đổi text trên button theo block hiện tại
    let label = 'Paragraph';
    if (tagName === 'H1') label = 'Heading 1';
    else if (tagName === 'H2') label = 'Heading 2';
    else if (tagName === 'H3') label = 'Heading 3';
    else if (tagName === 'H4') label = 'Heading 4';
    else if (tagName === 'H5') label = 'Heading 5';
    else if (tagName === 'H6') label = 'Heading 6';
    else if (tagName === 'PRE') label = 'Code Block';
    else if (tagName === 'BLOCKQUOTE') label = 'Quote';
    
    // Kiểm tra nếu con trỏ không nằm trong editor-area thì không làm gì
    const editorArea = document.querySelector('.editor-area'); // hoặc this.editorArea nếu có
    const selection = window.getSelection();
    if (!selection.rangeCount || !editorArea.contains(selection.getRangeAt(0).startContainer)) {
      return;
    }

    // ✅ Cập nhật text mà vẫn giữ dropdown icon
    const textNode = this.headingSelector.firstChild;
    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
      textNode.textContent = label;
    } else {
      // Tạo lại nội dung button với dropdown icon
      this.headingSelector.innerHTML = label;

      const dropdownIcon = document.createElement('span');
      dropdownIcon.innerHTML = '▼';
      dropdownIcon.style.fontSize = '10px';
      dropdownIcon.style.opacity = '0.7';
      dropdownIcon.style.marginLeft = 'auto';

      this.headingSelector.appendChild(dropdownIcon);
    }

  }
  
  // Điều chỉnh font size
  adjustFontSize(delta) {
    const currentText = this.fontSizeSelector.textContent || '16px';
    const currentSize = parseInt(currentText) || 16;
    const newSize = Math.max(8, Math.min(72, currentSize + delta));
    
    // Update button text
    const textNode = this.fontSizeSelector.firstChild;
    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
      textNode.textContent = newSize + 'px';
    } else {
      this.fontSizeSelector.innerHTML = newSize + 'px';
      // Re-add dropdown icon
      const dropdownIcon = this.fontSizeSelector.querySelector('svg');
      if (dropdownIcon) {
        this.fontSizeSelector.appendChild(dropdownIcon);
      }
    }
    
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
    
    // Kiểm tra nếu con trỏ không nằm trong editor-area thì không thay đổi gì cả
    const editorArea = document.querySelector('.editor-area'); // Hoặc this.editorArea nếu bạn đã lưu nó trong class

    const selection = window.getSelection();
    if (!selection.rangeCount || !editorArea.contains(selection.getRangeAt(0).startContainer)) {
      return;
    }

    // ✅ Tiếp tục cập nhật nút font size
    const textNode = this.fontSizeSelector.firstChild;
    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
      textNode.textContent = closestSize + 'px';
    } else {
      // Lưu lại dropdown icon (nếu có) trước khi ghi đè nội dung
      const dropdownIcon = this.fontSizeSelector.querySelector('svg');
      this.fontSizeSelector.innerHTML = closestSize + 'px';
      if (dropdownIcon) {
        this.fontSizeSelector.appendChild(dropdownIcon);
      }
    }

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
    
    // Kiểm tra nếu con trỏ không nằm trong editor-area thì không làm gì
    const editorArea = document.querySelector('.editor-area'); // sửa theo context của bạn
    const selection = window.getSelection();
    if (!selection.rangeCount || !editorArea.contains(selection.getRangeAt(0).startContainer)) {
      return;
    }

    // ✅ Tiếp tục cập nhật nội dung nút line height
    const displayText = closestLineHeight === 'default' ? 'Line Height' : closestLineHeight;
    const textNode = this.lineHeightSelector.firstChild;
    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
      textNode.textContent = displayText;
    } else {
      // Lưu icon trước khi ghi đè
      const dropdownIcon = this.lineHeightSelector.querySelector('svg');
      this.lineHeightSelector.innerHTML = displayText;
      if (dropdownIcon) {
        this.lineHeightSelector.appendChild(dropdownIcon);
      }
    }
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
        tagBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      };

      tagBtn.onmouseout = () => {
        tagBtn.style.background = '#fff';
        tagBtn.style.borderColor = '#e5e7eb';
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
      categoryBtn.style.padding = '8px';
      categoryBtn.style.border = 'none';
      categoryBtn.style.background = 'transparent';
      categoryBtn.style.textAlign = 'left';
      categoryBtn.style.cursor = 'pointer';
      categoryBtn.style.display = 'flex';
      categoryBtn.style.alignItems = 'center';
      //categoryBtn.style.gap = '12px';
      categoryBtn.style.borderRadius = '8px';
      //categoryBtn.style.margin = '4px 16px';
      categoryBtn.style.transition = 'all 0.2s ease';
      categoryBtn.style.fontSize = '14px';
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
            " onmouseover=" this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'" onmouseout=" this.style.boxShadow='none'">
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

    // Apply theme to toolbar separator
    if (this.toolbarSeparator) {
      this.toolbarSeparator.style.background = isDark ? '#404040' : '#e5e7eb';
    }

    // Update toolbar2 row separators theme
    const rowSeparators = this.toolbar2?.querySelectorAll('.toolbar-row-separator');
    if (rowSeparators) {
      rowSeparators.forEach(separator => {
        separator.style.background = isDark ? '#404040' : '#e5e7eb';
      });
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
        arrow.style.borderTop = isDark ? '8px solid #2a2a2a' : '8px solid #fff';
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

    // Update custom insert dropdowns
    const insertDropdowns = document.querySelectorAll('#image-dropdown, #link-dropdown, #emoji-dropdown, #video-dropdown');
    insertDropdowns.forEach(dropdown => {
      dropdown.style.background = isDark ? '#2a2a2a' : '#fff';
      dropdown.style.border = isDark ? '1px solid #404040' : '1px solid #e1e1e1';
      dropdown.style.boxShadow = isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.18)';
      
      // Update inputs in dropdown
      const inputs = dropdown.querySelectorAll('input');
      inputs.forEach(input => {
        input.style.background = isDark ? '#1e1e1e' : '#fff';
        input.style.color = isDark ? '#e0e0e0' : '#333';
        input.style.border = isDark ? '1px solid #404040' : '1px solid #ccc';
      });
      
      // Update buttons in dropdown
      const buttons = dropdown.querySelectorAll('button');
      buttons.forEach(btn => {
        if (btn.textContent === 'Insert') {
          btn.style.background = isDark ? '#0d7377' : '#007bff';
        } else if (btn.textContent === 'Cancel') {
          btn.style.background = isDark ? '#404040' : '#eee';
          btn.style.color = isDark ? '#e0e0e0' : '#333';
        } else {
          // For emoji buttons
          btn.style.background = 'transparent';
        }
      });
    });
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
      
      // Close all dropdowns first
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
    // Close TinyMCE-style dropdowns
    if (this.dropdownMenus) {
      Object.values(this.dropdownMenus).forEach(({ button, menu }) => {
        button.setAttribute('aria-expanded', 'false');
        menu.classList.remove('tox-menu--visible');
      });
    }
    
    // Close heading dropdown
    const headingDropdown = document.querySelector('.heading-dropdown');
    if (headingDropdown) {
      headingDropdown.style.display = 'none';
    }
    
    // Close font size dropdown
    const fontSizeDropdown = document.querySelector('.fontsize-dropdown');
    if (fontSizeDropdown) {
      fontSizeDropdown.style.display = 'none';
    }
    
    // Close font dropdown
    const fontDropdown = document.querySelector('.font-dropdown');
    if (fontDropdown) {
      fontDropdown.style.display = 'none';
    }
    
    // Close line height dropdown
    const lineHeightDropdown = document.querySelector('.lineheight-dropdown');
    if (lineHeightDropdown) {
      lineHeightDropdown.style.display = 'none';
    }
    
    // Close capitalization dropdown
    const capitalizationDropdown = document.querySelector('.capitalization-dropdown');
    if (capitalizationDropdown) {
      capitalizationDropdown.style.display = 'none';
    }
    
    // Close text alignment dropdown
    const alignMenu = document.querySelector('.dropdown-menu');
    if (alignMenu) {
      alignMenu.style.opacity = '0';
      alignMenu.style.pointerEvents = 'none';
      alignMenu.style.display = 'none';
    }
    
    // Close list dropdown
    if (this.listMenu) {
      this.listMenu.style.opacity = '0';
      this.listMenu.style.pointerEvents = 'none';
      this.listMenu.style.display = 'none';
    }

    // Close custom insert dropdowns
    const imageDropdown = document.getElementById('image-dropdown');
    if (imageDropdown) {
      imageDropdown.remove();
    }

    const linkDropdown = document.getElementById('link-dropdown');
    if (linkDropdown) {
      linkDropdown.remove();
    }

    const emojiDropdown = document.getElementById('emoji-dropdown');
    if (emojiDropdown) {
      emojiDropdown.remove();
    }

    const videoDropdown = document.getElementById('video-dropdown');
    if (videoDropdown) {
      videoDropdown.remove();
    }

    const importDropdown = document.getElementById('import-dropdown');
    if (importDropdown) {
      importDropdown.remove();
    }

    // Close color picker
    if (this.colorPicker) {
      this.colorPicker.remove();
      this.colorPicker = null;
    }
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
    this.showImportDropdown();
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
    this.showImageDropdown();
  }

  insertLink() {
    this.savedSelection = this.saveSelection();
    this.showLinkDropdown();
  }

  insertEmoji() {
    this.savedEmojiSelection = this.saveSelection();
    this.showEmojiDropdown();
  }

  insertVideo() {
    this.savedSelection = this.saveSelection();
    this.showVideoDropdown();
  }

  // Dropdown methods for insert features
  showImageDropdown() {
    const btn = this.toolbarBtns.image;
    if (!btn) return;

    // Check if dropdown is already visible
    const existingDropdown = document.getElementById('image-dropdown');
    if (existingDropdown) {
      existingDropdown.remove();
      return;
    }

    // Close all other dropdowns first
    this.closeAllDropdowns();

    const dropdown = document.createElement('div');
    dropdown.id = 'image-dropdown';
    dropdown.style.position = 'fixed';
    dropdown.style.zIndex = '99999';
    dropdown.style.background = this.options.theme === 'dark' ? '#2a2a2a' : '#fff';
    dropdown.style.border = this.options.theme === 'dark' ? '1px solid #404040' : '1px solid #e1e1e1';
    dropdown.style.borderRadius = '8px';
    dropdown.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
    dropdown.style.padding = '8px';
    dropdown.style.minWidth = '300px';
    dropdown.style.display = 'none';

    // URL input
    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.placeholder = 'Paste image URL...';
    urlInput.style.width = '90%';
    urlInput.style.padding = '8px';
    urlInput.style.border = this.options.theme === 'dark' ? '1px solid #404040' : '1px solid #ccc';
    urlInput.style.borderRadius = '4px';
    urlInput.style.marginBottom = '8px';
    urlInput.style.background = this.options.theme === 'dark' ? '#1e1e1e' : '#fff';
    urlInput.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#333';

    // File input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.width = '90%';
    fileInput.style.marginBottom = '8px';

    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '8px';
    buttonContainer.style.justifyContent = 'flex-end';

    const insertBtn = document.createElement('button');
    insertBtn.textContent = 'Insert';
    insertBtn.style.padding = '6px 12px';
    insertBtn.style.background = this.options.theme === 'dark' ? '#0d7377' : '#007bff';
    insertBtn.style.color = '#fff';
    insertBtn.style.border = 'none';
    insertBtn.style.borderRadius = '4px';
    insertBtn.style.cursor = 'pointer';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.padding = '6px 12px';
    cancelBtn.style.background = this.options.theme === 'dark' ? '#404040' : '#eee';
    cancelBtn.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#333';
    cancelBtn.style.border = 'none';
    cancelBtn.style.borderRadius = '4px';
    cancelBtn.style.cursor = 'pointer';

    buttonContainer.appendChild(insertBtn);
    buttonContainer.appendChild(cancelBtn);

    dropdown.appendChild(urlInput);
    dropdown.appendChild(fileInput);
    dropdown.appendChild(buttonContainer);

    // Position dropdown below button with boundary checking
    const rect = btn.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const dropdownHeight = 150; // Estimated height
    const dropdownWidth = 300; // minWidth set above
    
    let top = rect.bottom + 5;
    let left = rect.left;
    
    // Check if dropdown would go below viewport
    if (top + dropdownHeight > viewportHeight) {
      top = rect.top - dropdownHeight - 5; // Show above button
    }
    
    // Check if dropdown would go beyond right edge
    if (left + dropdownWidth > viewportWidth) {
      left = viewportWidth - dropdownWidth - 10;
    }
    
    // Ensure dropdown doesn't go beyond left edge
    if (left < 10) {
      left = 10;
    }
    
    dropdown.style.top = top + 'px';
    dropdown.style.left = left + 'px';
    dropdown.style.display = 'block';

    document.body.appendChild(dropdown);

    // Event handlers
    insertBtn.onclick = () => {
      const url = urlInput.value.trim();
      if (url) {
        this.restoreSelection(this.savedSelection);
        this.insertImageWithStyle(url);
        dropdown.remove();
      }
    };

    cancelBtn.onclick = () => dropdown.remove();

    fileInput.onchange = () => {
      if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          urlInput.value = e.target.result;
        };
        reader.readAsDataURL(fileInput.files[0]);
      }
    };

    urlInput.focus();
  }

  showLinkDropdown() {
    const btn = this.toolbarBtns.link;
    if (!btn) return;

    // Check if dropdown is already visible
    const existingDropdown = document.getElementById('link-dropdown');
    if (existingDropdown) {
      existingDropdown.remove();
      return;
    }

    // Close all other dropdowns first
    this.closeAllDropdowns();

    const dropdown = document.createElement('div');
    dropdown.id = 'link-dropdown';
    dropdown.style.position = 'fixed';
    dropdown.style.zIndex = '99999';
    dropdown.style.background = this.options.theme === 'dark' ? '#2a2a2a' : '#fff';
    dropdown.style.border = this.options.theme === 'dark' ? '1px solid #404040' : '1px solid #e1e1e1';
    dropdown.style.borderRadius = '8px';
    dropdown.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
    dropdown.style.padding = '8px';
    dropdown.style.minWidth = '300px';
    dropdown.style.display = 'none';

    // URL input
    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.placeholder = 'Enter URL (https://...)';
    urlInput.style.width = '90%';  
    urlInput.style.padding = '8px';
    urlInput.style.border = this.options.theme === 'dark' ? '1px solid #404040' : '1px solid #ccc';
    urlInput.style.borderRadius = '4px';
    urlInput.style.marginBottom = '8px';
    urlInput.style.background = this.options.theme === 'dark' ? '#1e1e1e' : '#fff';
    urlInput.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#333';

    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '8px';
    buttonContainer.style.justifyContent = 'flex-end';

    const insertBtn = document.createElement('button');
    insertBtn.textContent = 'Insert';
    insertBtn.style.padding = '6px 12px';
    insertBtn.style.background = this.options.theme === 'dark' ? '#0d7377' : '#007bff';
    insertBtn.style.color = '#fff';
    insertBtn.style.border = 'none';
    insertBtn.style.borderRadius = '4px';
    insertBtn.style.cursor = 'pointer';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.padding = '6px 12px';
    cancelBtn.style.background = this.options.theme === 'dark' ? '#404040' : '#eee';
    cancelBtn.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#333';
    cancelBtn.style.border = 'none';
    cancelBtn.style.borderRadius = '4px';
    cancelBtn.style.cursor = 'pointer';

    buttonContainer.appendChild(insertBtn);
    buttonContainer.appendChild(cancelBtn);

    dropdown.appendChild(urlInput);
    dropdown.appendChild(buttonContainer);

    // Position dropdown below button with boundary checking
    const rect = btn.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const dropdownHeight = 120; // Estimated height for link dropdown
    const dropdownWidth = 300; // minWidth set above
    
    let top = rect.bottom + 5;
    let left = rect.left;
    
    // Check if dropdown would go below viewport
    if (top + dropdownHeight > viewportHeight) {
      top = rect.top - dropdownHeight - 5; // Show above button
    }
    
    // Check if dropdown would go beyond right edge
    if (left + dropdownWidth > viewportWidth) {
      left = viewportWidth - dropdownWidth - 10;
    }
    
    // Ensure dropdown doesn't go beyond left edge
    if (left < 10) {
      left = 10;
    }
    
    dropdown.style.top = top + 'px';
    dropdown.style.left = left + 'px';
    dropdown.style.display = 'block';

    document.body.appendChild(dropdown);

    // Event handlers
    insertBtn.onclick = () => {
      const url = urlInput.value.trim();
      if (url) {
        this.restoreSelection(this.savedSelection);
        document.execCommand('createLink', false, url);
        dropdown.remove();
      }
    };

    cancelBtn.onclick = () => dropdown.remove();

    // Enter key handler
    urlInput.onkeydown = (e) => {
      if (e.key === 'Enter') insertBtn.click();
      if (e.key === 'Escape') cancelBtn.click();
    };

    urlInput.focus();
  }

  showEmojiDropdown() {
    const btn = this.toolbarBtns.emoji;
    if (!btn) return;

    // Check if dropdown is already visible
    const existingDropdown = document.getElementById('emoji-dropdown');
    if (existingDropdown) {
      existingDropdown.remove();
      return;
    }

    // Close all other dropdowns first
    this.closeAllDropdowns();

    const dropdown = document.createElement('div');
    dropdown.id = 'emoji-dropdown';
    dropdown.style.position = 'fixed';
    dropdown.style.zIndex = '99999';
    dropdown.style.background = this.options.theme === 'dark' ? '#2a2a2a' : '#fff';
    dropdown.style.border = this.options.theme === 'dark' ? '1px solid #404040' : '1px solid #e1e1e1';
    dropdown.style.borderRadius = '8px';
    dropdown.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
    dropdown.style.padding = '8px';
    dropdown.style.minWidth = '300px';
    dropdown.style.overflowY = 'auto';
    dropdown.style.display = 'none';

    // Emoji grid
    const emojiGrid = document.createElement('div');
    emojiGrid.style.display = 'grid';
    emojiGrid.style.gridTemplateColumns = 'repeat(10, 1fr)';
    emojiGrid.style.gap = '4px';

    const emojis = '😀 😃 😄 😁 😆 😅 😂 😊 😇 😉 😍 😘 😜 🤗 🤔 🤩 🤨 🥳 🥰 😎 😏 😤 😱 😭 😡 🤬 🥶 🥵 🤯 🥳 🥺 🙏 👍 👎 👏 🙌 💪 🤝 🧠 🦾 🦿 🦵 🦶 👀 👋'.split(' ');

    emojis.forEach(emoji => {
      const emojiBtn = document.createElement('button');
      emojiBtn.textContent = emoji;
      emojiBtn.style.fontSize = '20px';
      emojiBtn.style.padding = '4px';
      emojiBtn.style.border = 'none';
      emojiBtn.style.background = 'none';
      emojiBtn.style.cursor = 'pointer';
      emojiBtn.style.borderRadius = '4px';
      emojiBtn.style.transition = 'background 0.2s';

      emojiBtn.onmouseover = () => {
        emojiBtn.style.background = this.options.theme === 'dark' ? '#404040' : '#f0f0f0';
      };

      emojiBtn.onmouseout = () => {
        emojiBtn.style.background = 'transparent';
      };

      emojiBtn.onclick = () => {
        this.restoreSelection(this.savedEmojiSelection);
        this.editor.focus();
        const sel = window.getSelection();
        if (sel.rangeCount && this.editor.contains(sel.anchorNode)) {
          sel.getRangeAt(0).insertNode(document.createTextNode(emoji));
        } else {
          this.editor.appendChild(document.createTextNode(emoji));
        }
        dropdown.remove();
      };

      emojiGrid.appendChild(emojiBtn);
      
    });
    
    dropdown.appendChild(emojiGrid);
    // Thêm dòng hướng dẫn
      const hintText = document.createElement('div');
      hintText.innerHTML = 'Get more emojis with <span style="border-radius: 2.2px; background: #EEE; padding: 2px 4px;">⌘</span> <span style="color: #000;">+</span> <span style="border-radius: 2.2px; background: #EEE; padding: 2px 4px;">CTRL</span> <span style="color: #000;">+</span> <span style="border-radius: 2.2px; background: #EEE; padding: 2px 4px;">SPACE</span>';
      hintText.style.color = '#71787C';
      hintText.style.fontStyle = 'normal';
      hintText.style.marginTop = '12px';
      hintText.style.fontWeight = '400';
      hintText.style.lineHeight = 'normal';
      hintText.style.textAlign = 'center';
      dropdown.appendChild(hintText);
    // Position dropdown below button with boundary checking
    const rect = btn.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const dropdownHeight = 200; // maxHeight set above
    const dropdownWidth = 300; // minWidth set above
    
    let top = rect.bottom + 5;
    let left = rect.left;
    
    // Check if dropdown would go below viewport
    if (top + dropdownHeight > viewportHeight) {
      top = rect.top - dropdownHeight - 5; // Show above button
    }
    
    // Check if dropdown would go beyond right edge
    if (left + dropdownWidth > viewportWidth) {
      left = viewportWidth - dropdownWidth - 10;
    }
    
    // Ensure dropdown doesn't go beyond left edge
    if (left < 10) {
      left = 10;
    }
    
    dropdown.style.top = top + 'px';
    dropdown.style.left = left + 'px';
    dropdown.style.display = 'block';

    document.body.appendChild(dropdown);
  }

  showVideoDropdown() {
    const btn = this.toolbarBtns.video;
    if (!btn) return;

    // Check if dropdown is already visible
    const existingDropdown = document.getElementById('video-dropdown');
    if (existingDropdown) {
      existingDropdown.remove();
      return;
    }

    // Close all other dropdowns first
    this.closeAllDropdowns();

    const dropdown = document.createElement('div');
    dropdown.id = 'video-dropdown';
    dropdown.style.position = 'fixed';
    dropdown.style.zIndex = '99999';
    dropdown.style.background = this.options.theme === 'dark' ? '#2a2a2a' : '#fff';
    dropdown.style.border = this.options.theme === 'dark' ? '1px solid #404040' : '1px solid #e1e1e1';
    dropdown.style.borderRadius = '8px';
    dropdown.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
    dropdown.style.padding = '12px';
    dropdown.style.minWidth = '300px';
    dropdown.style.display = 'none';

    // URL input
    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.placeholder = 'Paste video URL (YouTube, Vimeo, etc.)...';
    urlInput.style.width = '90%';
    urlInput.style.padding = '8px';
    urlInput.style.border = this.options.theme === 'dark' ? '1px solid #404040' : '1px solid #ccc';
    urlInput.style.borderRadius = '4px';
    urlInput.style.marginBottom = '8px';
    urlInput.style.background = this.options.theme === 'dark' ? '#1e1e1e' : '#fff';
    urlInput.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#333';

    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '8px';
    buttonContainer.style.justifyContent = 'flex-end';

    const insertBtn = document.createElement('button');
    insertBtn.textContent = 'Insert';
    insertBtn.style.padding = '6px 12px';
    insertBtn.style.background = this.options.theme === 'dark' ? '#0d7377' : '#007bff';
    insertBtn.style.color = '#fff';
    insertBtn.style.border = 'none';
    insertBtn.style.borderRadius = '4px';
    insertBtn.style.cursor = 'pointer';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.padding = '6px 12px';
    cancelBtn.style.background = this.options.theme === 'dark' ? '#404040' : '#eee';
    cancelBtn.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#333';
    cancelBtn.style.border = 'none';
    cancelBtn.style.borderRadius = '4px';
    cancelBtn.style.cursor = 'pointer';

    buttonContainer.appendChild(insertBtn);
    buttonContainer.appendChild(cancelBtn);

    dropdown.appendChild(urlInput);
    dropdown.appendChild(buttonContainer);

    // Position dropdown
    const rect = btn.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + 5) + 'px';
    dropdown.style.left = rect.left + 'px';
    dropdown.style.display = 'block';

    document.body.appendChild(dropdown);

    // Event handlers
    insertBtn.onclick = () => {
      const url = urlInput.value.trim();
      if (url) {
        this.restoreSelection(this.savedSelection);
        this.insertVideo(url);
        dropdown.remove();
      }
    };

    cancelBtn.onclick = () => dropdown.remove();

    // Enter key handler
    urlInput.onkeydown = (e) => {
      if (e.key === 'Enter') insertBtn.click();
      if (e.key === 'Escape') cancelBtn.click();
    };

    urlInput.focus();
  }

  showImportDropdown() {
    const btn = this.toolbarBtns.import;
    if (!btn) return;

    // Check if dropdown is already visible
    const existingDropdown = document.getElementById('import-dropdown');
    if (existingDropdown) {
      existingDropdown.remove();
      return;
    }

    // Close all other dropdowns first
    this.closeAllDropdowns();

    const dropdown = document.createElement('div');
    dropdown.id = 'import-dropdown';
    dropdown.style.position = 'fixed';
    dropdown.style.zIndex = '99999';
    dropdown.style.background = this.options.theme === 'dark' ? '#2a2a2a' : '#fff';
    dropdown.style.border = this.options.theme === 'dark' ? '1px solid #404040' : '1px solid #e1e1e1';
    dropdown.style.borderRadius = '8px';
    dropdown.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
    dropdown.style.padding = '12px';
    dropdown.style.minWidth = '320px';
    dropdown.style.display = 'none';

    // File type selector
    const fileTypeContainer = document.createElement('div');
    fileTypeContainer.style.marginBottom = '12px';

    const fileTypeLabel = document.createElement('div');
    fileTypeLabel.textContent = 'Select import type:';
    fileTypeLabel.style.fontSize = '14px';
    fileTypeLabel.style.fontWeight = '500';
    fileTypeLabel.style.marginBottom = '8px';
    fileTypeLabel.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#333';

    const fileTypeButtons = document.createElement('div');
    fileTypeButtons.style.display = 'flex';
    fileTypeButtons.style.gap = '8px';
    fileTypeButtons.style.flexWrap = 'wrap';

    let selectedFileType = 'html';
    const fileTypes = [
      { id: 'html', label: 'HTML', icon: '<i class="fas fa-code"></i>' },
      { id: 'excel', label: 'Excel', icon: '<i class="fas fa-file-excel"></i>' },
      { id: 'pdf', label: 'PDF', icon: '<i class="fas fa-file-pdf"></i>' },
      { id: 'doc', label: 'Word', icon: '<i class="fas fa-file-word"></i>' }
    ];

    fileTypes.forEach(type => {
      const btn = document.createElement('button');
      btn.innerHTML = `${type.icon} ${type.label}`;
      btn.dataset.type = type.id;
      btn.style.padding = '8px 12px';
      btn.style.border = this.options.theme === 'dark' ? '1px solid #404040' : '1px solid #ddd';
      btn.style.borderRadius = '6px';
      btn.style.background = type.id === 'html' ? 
        (this.options.theme === 'dark' ? '#0d7377' : '#007bff') : 
        (this.options.theme === 'dark' ? '#2a2a2a' : '#fff');
      btn.style.color = type.id === 'html' ? '#fff' : 
        (this.options.theme === 'dark' ? '#e0e0e0' : '#333');
      btn.style.cursor = 'pointer';
      btn.style.fontSize = '14px';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.gap = '6px';
      btn.style.transition = 'all 0.2s';

      btn.onclick = () => {
        selectedFileType = type.id;
        
        // Update button styles
        fileTypes.forEach(ft => {
          const button = fileTypeButtons.querySelector(`[data-type="${ft.id}"]`);
          if (button) {
            button.style.background = ft.id === type.id ? 
              (this.options.theme === 'dark' ? '#0d7377' : '#007bff') : 
              (this.options.theme === 'dark' ? '#2a2a2a' : '#fff');
            button.style.color = ft.id === type.id ? '#fff' : 
              (this.options.theme === 'dark' ? '#e0e0e0' : '#333');
          }
        });

        // Update input visibility and placeholder
        if (type.id === 'html') {
          textInput.style.display = 'block';
          fileInput.style.display = 'none';
          textInput.placeholder = 'Paste HTML content to import...';
        } else {
          textInput.style.display = 'none';
          fileInput.style.display = 'block';
          fileInput.accept = type.id === 'excel' ? '.xlsx,.xls' : 
                           type.id === 'pdf' ? '.pdf' : 
                           type.id === 'doc' ? '.doc,.docx' : '*';
        }
      };

      fileTypeButtons.appendChild(btn);
    });

    fileTypeContainer.appendChild(fileTypeLabel);
    fileTypeContainer.appendChild(fileTypeButtons);

    // Text input (for HTML)
    const textInput = document.createElement('textarea');
    textInput.placeholder = 'Paste HTML content to import...';
    textInput.style.width = '90%';
    textInput.style.height = '80px';
    textInput.style.padding = '8px';
    textInput.style.border = this.options.theme === 'dark' ? '1px solid #404040' : '1px solid #ccc';
    textInput.style.borderRadius = '4px';
    textInput.style.marginBottom = '8px';
    textInput.style.background = this.options.theme === 'dark' ? '#1e1e1e' : '#fff';
    textInput.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#333';
    textInput.style.resize = 'vertical';
    textInput.style.fontFamily = 'monospace';
    textInput.style.fontSize = '12px';

    // File input (for other file types)
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.style.width = '90%';
    fileInput.style.marginBottom = '8px';
    fileInput.style.display = 'none';

    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '8px';
    buttonContainer.style.justifyContent = 'flex-end';

    const importBtn = document.createElement('button');
    importBtn.textContent = 'Import';
    importBtn.style.padding = '8px 16px';
    importBtn.style.background = this.options.theme === 'dark' ? '#0d7377' : '#007bff';
    importBtn.style.color = '#fff';
    importBtn.style.border = 'none';
    importBtn.style.borderRadius = '4px';
    importBtn.style.cursor = 'pointer';
    importBtn.style.fontWeight = '500';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.padding = '8px 16px';
    cancelBtn.style.background = this.options.theme === 'dark' ? '#404040' : '#eee';
    cancelBtn.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#333';
    cancelBtn.style.border = 'none';
    cancelBtn.style.borderRadius = '4px';
    cancelBtn.style.cursor = 'pointer';

    buttonContainer.appendChild(importBtn);
    buttonContainer.appendChild(cancelBtn);

    dropdown.appendChild(fileTypeContainer);
    dropdown.appendChild(textInput);
    dropdown.appendChild(fileInput);
    dropdown.appendChild(buttonContainer);

    // Position dropdown below button
    const rect = btn.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + 5) + 'px';
    dropdown.style.left = rect.left + 'px';
    dropdown.style.display = 'block';

    document.body.appendChild(dropdown);

    // Event handlers
    importBtn.onclick = () => {
      if (selectedFileType === 'html') {
        const content = textInput.value.trim();
        if (content) {
          this.restoreSelection(this.savedSelection);
          this.importContent(content, selectedFileType);
          dropdown.remove();
        } else {
          textInput.focus();
        }
      } else {
        if (fileInput.files && fileInput.files[0]) {
          const file = fileInput.files[0];
          const reader = new FileReader();
          reader.onload = (e) => {
            this.restoreSelection(this.savedSelection);
            this.importContent(e.target.result, selectedFileType);
            dropdown.remove();
          };
          reader.readAsDataURL(file);
        } else {
          fileInput.focus();
        }
      }
    };

    cancelBtn.onclick = () => dropdown.remove();

    // Enter key handler for textarea
    textInput.onkeydown = (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        importBtn.click();
      }
      if (e.key === 'Escape') {
        cancelBtn.click();
      }
    };

    textInput.focus();
  }

  // Helper methods for dropdown menu functionalities
  showFontSelector() {
    // Focus on the font selector dropdown button in toolbar
    if (this.fontSelector) {
      this.fontSelector.focus();
      this.fontSelector.click();
    }
  }

  showFontSizeSelector() {
    // Focus on the font size selector dropdown button in toolbar
    if (this.fontSizeSelector) {
      this.fontSizeSelector.focus();
      this.fontSizeSelector.click();
    }
  }

  showLineHeightSelector() {
    // Focus on the line height selector dropdown button in toolbar
    if (this.lineHeightSelector) {
      this.lineHeightSelector.focus();
      this.lineHeightSelector.click();
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

  // Cleanup method to remove dynamically created elements
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
    this.closeAllDropdowns();
    
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

export function createEditor(selector, options) {
  return new Editor(selector, options);
}