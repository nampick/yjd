// TagTemplateManager.js - Quản lý tags và templates
import { FormatManager } from './FormatManager.js';
export class TagTemplateManager {
  constructor(editor,toolbarManager) {
    this.editor = editor;
    this.formatManager = new FormatManager(editor,this);
    this.toolbarManager = toolbarManager;
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
    overlay.style.background = this.editor.options.theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.08)';
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
    this.formatManager.restoreSelection(this.savedSelection);
    this.editor.editor.focus();
    
    const sel = window.getSelection();
    const tagText = `{{${tagValue}}}`;
    
    if (sel.rangeCount && this.editor.editor.contains(sel.anchorNode)) {
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
    this.formatManager.restoreSelection(this.savedSelection);
    this.editor.editor.focus();
    
    const sel = window.getSelection();
    
    if (sel.rangeCount && this.editor.editor.contains(sel.anchorNode)) {
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
} 