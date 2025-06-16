// ToolbarManager.js - Quản lý toolbar và các nút bấm
export class ToolbarManager {
  constructor(editor, options = {}) {
  this.editor = editor;
  this.options = {
    theme: 'light', // hoặc 'dark' nếu muốn mặc định là dark
    ...options
  };
  this.toolbarBtns = {};
}

  createCheckmarkSVG() {
    // Create checkmark SVG logic
  }

  updateDropdownCheckmarks(dropdown, selectedValue, getValueFromItem) {
    // Update dropdown checkmarks logic
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
      item.style.padding = '4px 4px';
      item.style.borderRadius = '3px';
      item.style.alignItems = 'center';
      item.style.cursor = 'pointer';
      item.style.fontSize = '14px';
      item.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#374151';
   
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
        headingDropdown.style.top = (rect.bottom + 1) + 'px';
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
      item.style.padding = '4px 4px';
      item.style.borderRadius = '3px';
      item.style.alignItems = 'center';
      item.style.cursor = 'pointer';
      item.style.fontSize = '14px';
      item.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#374151';
      

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
        fontSizeDropdown.style.top = (rect.bottom + 1) + 'px';
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
    const typeindents = document.createElement('div');
    typeindents.style.gap = '12px';
    typeindents.style.alignItems = 'center';
    typeindents.style.display = 'flex';

    indentBtns.forEach(btn => {
      const button = this.createBtn(btn.icon, btn.title, btn.cmd);
      typeindents.appendChild(button);
      this.toolbarBtns[btn.cmd] = button;
    });
    toolbar2.appendChild(typeindents);
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
      item.style.padding = '4px 4px';
      item.style.borderRadius = '3px';
      item.style.alignItems = 'center';
      item.style.cursor = 'pointer';
      item.style.fontSize = '14px';
      item.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#374151';
      item.style.fontFamily = font.value === 'default' ? 'inherit' : font.value;
      
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
        fontDropdown.style.top = (rect.bottom + 1) + 'px';
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
      item.style.padding = '4px 4px';
      item.style.borderRadius = '3px';
      item.style.alignItems = 'center';
      item.style.justifyItems = 'center';
      item.style.cursor = 'pointer';
      item.style.fontSize = '14px';
      item.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#374151';
      
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
        lineHeightDropdown.style.top = (rect.bottom + 1) + 'px';
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
      item.style.padding = '4px 4px';
      item.style.borderRadius = '3px';
      item.style.alignItems = 'center';
      item.style.cursor = 'pointer';
      item.style.fontSize = '14px';
      item.style.color = this.options.theme === 'dark' ? '#e0e0e0' : '#374151';
      
     
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
        capitalizationDropdown.style.top = (rect.bottom + 1) + 'px';
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

    
    
    const insertBtns = [
      { icon: '<i class="far fa-smile"></i>', title: 'Emoji', cmd: 'emoji' },
      { icon: '<i class="far fa-image"></i>', title: 'Image', cmd: 'image' },
      { icon: '<i class="fas fa-video"></i>', title: 'Video', cmd: 'video' },
    ];
    const typeinsertbtns = document.createElement('div');
    typeinsertbtns.style.gap = '12px';
    typeinsertbtns.style.alignItems = 'center';
    typeinsertbtns.style.display = 'flex';
    insertBtns.forEach(btn => {
      const button = this.createBtn(btn.icon, btn.title, btn.cmd);
        typeinsertbtns.appendChild(button);
      this.toolbarBtns[btn.cmd] = button;
    });
    toolbar2.appendChild(typeinsertbtns);
    
    // Chèn nội dung
    const insertBtns1 = [
      { icon: '<i class="fas fa-file-import"></i>', title: 'Import', cmd: 'import' },
      { icon: '<i class="fas fa-tags"></i>', title: 'Insert Tags', cmd: 'insertTags' },
      { icon: '<i class="fas fa-file-alt"></i>', title: 'Insert Template', cmd: 'insertTemplate' }
    ];

    insertBtns1.forEach(btn => {
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

  toggleToolbar2() {
    // Toggle second toolbar logic
  }

  updateMoreOptionsButtonState() {
    // Update more options button state logic
  }

  addToolbar2RowSeparators() {
    // Add toolbar row separators logic
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
    // Create separator logic
  }

  updateFormatButtonStates() {
    // Update format button states logic
  }

  checkFormatByStyle(cmd, range) {
    // Check format by style logic
  }

  updateColorButtonStates(range) {
    // Update color button states logic
  }

  showColorPicker(btn, type) {
    // Show color picker logic
  }

  createDropdownButton(label, items) {
    // Create dropdown button logic
  }

  closeAllDropdowns() {
    // Close all dropdowns logic
  }
} 