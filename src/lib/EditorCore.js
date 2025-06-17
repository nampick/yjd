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
    //this.toolbarManager = new ToolbarManager(this, this.options);
    // this.tableManager = new TableManager(this);
    // this.formatManager = new FormatManager(this);
    // this.blockManager = new BlockManager(this);
    // this.mediaManager = new MediaManager(this);
    // this.importExportManager = new ImportExportManager(this);
    // this.themeManager = new ThemeManager(this);
    // this.tagTemplateManager = new TagTemplateManager(this);
    // this.selectorManager = new SelectorManager(this);
    
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
    // ✅ tạo toolbar sau khi editor sẵn sàng
    this.toolbarManager = new ToolbarManager(this, this.options,this.wrapper);
    this.tableManager = new TableManager(this);
    this.formatManager = new FormatManager(this);
    this.blockManager = new BlockManager(this);
    this.mediaManager = new MediaManager(this);
    this.importExportManager = new ImportExportManager(this);
    this.themeManager = new ThemeManager(this);
    this.tagTemplateManager = new TagTemplateManager(this);
    this.selectorManager = new SelectorManager(this);

    this.toolbar = this.toolbarManager.createToolbar();
    this.wrapper.insertBefore(this.toolbar, this.editor); // hoặc append nếu bạn muốn ở dưới

    // Thêm block toolbar
    this.blockManager.createBlockToolbar();


    // Table popup và các phần tử liên quan (nếu bật table)
    if (this.options.features.table) {
      this.tableManager.createTableUI();
    }


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
        setTimeout(() => this.themeManager.updateEditorContentTheme(), 100);
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
        this.toolbarManager.closeAllDropdowns();
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
      this.blockManager.updateIndentButtonState();
      this.blockManager.updateHeadingSelector();
      this.formatManager.updateFontSizeDisplay();
      this.formatManager.updateLineHeightDisplay();
      this.toolbarManager.updateFormatButtonStates(); // Thêm cập nhật trạng thái nút format
      this.toolbarManager.updateColorButtonStates(); // Thêm cập nhật màu sắc
      
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
          this.toolbarManager.blockManager.updateIndentButtonState();
          this.toolbarManager.blockManager.updateHeadingSelector();
          this.toolbarManager.formatManager.updateFontSizeDisplay();
          this.toolbarManager.formatManager.updateLineHeightDisplay();
          this.toolbarManager.updateFormatButtonStates(); // Thêm cập nhật trạng thái nút format
          this.toolbarManager.updateColorButtonStates(); // Thêm cập nhật màu sắc
        }, 1);
      }
    });

    // Thêm event listeners cho mouse và keyboard để cập nhật trạng thái ngay lập tức
    this.editor.addEventListener('mouseup', () => {
      setTimeout(() => {
        this.toolbarManager.updateFormatButtonStates();
        this.toolbarManager.updateColorButtonStates();
      }, 10);
    });

    this.editor.addEventListener('keyup', (e) => {
      // Chỉ cập nhật khi không phải là các phím điều hướng
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
        setTimeout(() => {
          this.toolbarManager.updateFormatButtonStates();
          this.toolbarManager.updateColorButtonStates();
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
      this.toolbarManager.blockManager.updateIndentDecreaseButtonVisibility(); // This will also update the increase button
      this.toolbarManager.blockManager.updateIndentButtonState(); // Update indent button state
      this.toolbarManager.blockManager.updateHeadingSelector(); // Update heading selector
      this.formatManager.updateFontSizeDisplay(); // Update font size display
      this.formatManager.updateLineHeightDisplay(); // Update line height display
    });

    // Lắng nghe click vào ảnh trong editor
    this.editor.addEventListener('mousedown', e => {
      if (e.target.tagName === 'IMG' && e.target.getAttribute('data-resizable') === 'true') {
        this.showImgResizeHandles(e.target);
      } else {
        this.mediaManager.removeImgResizeHandles();
      }
    });

    // Khi click ra ngoài editor và ngoài handle, ẩn handle
    document.addEventListener('mousedown', e => {
      if (!this.editor.contains(e.target) && !e.target.classList.contains('img-resize-handle')) {
        this.mediaManager.removeImgResizeHandles();
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
        this.tableManager.showTableToolbar(table);
        this.tableManager.addTableResizeHandles(table);
      } else {
        // Ẩn toolbar nếu click ra ngoài bảng
        this.tableManager.tableToolbar.style.display = 'none';
        this.selectedTable = null;
        this.selectedCell = null;
        this.tableManager.removeTableResizeHandles();
      }
    });

    // Ẩn handle khi scroll hoặc resize
    window.addEventListener('scroll', () => {
      this.mediaManager.removeImgResizeHandles();
      this.tableManager.removeTableResizeHandles();
      // Ẩn toolbar khi scroll
      if (this.tableToolbar) {
        this.tableManager.tableToolbar.style.display = 'none';
      }
    });
    window.addEventListener('resize', () => {
      this.mediaManager.removeImgResizeHandles();
      this.tableManager.removeTableResizeHandles();
      // Ẩn toolbar khi resize
      if (this.tableToolbar) {
        this.tableManager.tableToolbar.style.display = 'none';
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
              this.blockManager.showBlockToolbar(rect);
            } else {
              this.blockManager.hideBlockToolbar();
            }
          }
        }, 0);
      } else {
        this.blockManager.hideBlockToolbar();
      }
    });
    // Ẩn toolbar khi click ra ngoài hoặc nhập nội dung
    this.editor.addEventListener('input', () => {
      // Luôn ẩn toolbar khi có input
      this.blockManager.hideBlockToolbar();
    });
    document.addEventListener('mousedown', e => {
      // Chỉ ẩn nếu click ra ngoài toolbar và ngoài editor-area
      if (
        this.blockToolbar &&
        !this.blockToolbar.contains(e.target) &&
        !this.editor.contains(e.target)
      ) {
        this.blockManager.hideBlockToolbar();
      }
    });

    // Hiển thị toolbar khi select text
    this.editor.addEventListener('mouseup', e => {
      setTimeout(() => {
        const sel = window.getSelection();
        if (sel.rangeCount > 0 && sel.type == 'Range') {
          const range = sel.getRangeAt(0);
          if (!range.collapsed) {
            const rect = range.getBoundingClientRect();
            this.blockManager.showBlockToolbar({
              left: rect.left + (rect.width / 2),
              top: rect.top - 10
            });
          } else {
            this.blockManager.hideBlockToolbar();
          }
        } else {
          this.blockManager.hideBlockToolbar();
        }
      }, 0); // delay để đợi browser cập nhật selection
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
              this.blockManager.showBlockToolbar({
                left: rect.left + (rect.width / 2),
                top: rect.top - 10
              });
            } else {
              this.blockManager.hideBlockToolbar();
            }
          }
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
      this.toolbarManager.updateMoreOptionsButtonState();

      // Get the current block element at cursor position
      const currentBlock = this.blockManager.getBlockElementAtCaret();
      
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
} 