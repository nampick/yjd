// ImportExportManager.js - Quản lý import/export functionality
import { FormatManager } from './FormatManager.js';
export class ImportExportManager {
  constructor(editor,toolbarManager) {
    this.editor = editor;
    this.formatManager = new FormatManager(editor,this);
    this.toolbarManager = toolbarManager;
  }

  importContent(content, fileType = 'html') {
    try {
      // Khôi phục selection
      this.restoreSelection(this.savedSelection);
      this.editor.editor.focus();
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

  // Menu action methods
  createNewDocument() {
    if (confirm('This will clear the current document. Are you sure?')) {
      this.editor.innerHTML = '<p>Start typing here...</p>';
      this.updateStatusbar();
    }
  }

  importDocument() {
    this.savedSelection = this.formatManager.saveSelection();
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

  showImportDropdown() {
    const btn = this.toolbarManager.toolbarBtns.import;
    if (!btn) return;

    // Check if dropdown is already visible
    const existingDropdown = document.getElementById('import-dropdown');
    if (existingDropdown) {
      existingDropdown.remove();
      return;
    }

    // Close all other dropdowns first
    this.toolbarManager.closeAllDropdowns();

    const dropdown = document.createElement('div');
    dropdown.id = 'import-dropdown';
    dropdown.style.position = 'fixed';
    dropdown.style.zIndex = '99999';
    dropdown.style.background = this.editor.options.theme === 'dark' ? '#2a2a2a' : '#fff';
    dropdown.style.border = this.editor.options.theme === 'dark' ? '1px solid #404040' : '1px solid #e1e1e1';
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
    fileTypeLabel.style.color = this.editor.options.theme === 'dark' ? '#e0e0e0' : '#333';

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
      btn.style.border = this.editor.options.theme === 'dark' ? '1px solid #404040' : '1px solid #ddd';
      btn.style.borderRadius = '6px';
      btn.style.background = type.id === 'html' ? 
        (this.editor.options.theme === 'dark' ? '#0d7377' : '#007bff') : 
        (this.editor.options.theme === 'dark' ? '#2a2a2a' : '#fff');
      btn.style.color = type.id === 'html' ? '#fff' : 
        (this.editor.options.theme === 'dark' ? '#e0e0e0' : '#333');
      btn.style.cursor = 'pointer';
      btn.style.fontSize = '14px';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.gap = '6px';

      btn.onclick = () => {
        selectedFileType = type.id;
        
        // Update button styles
        fileTypes.forEach(ft => {
          const button = fileTypeButtons.querySelector(`[data-type="${ft.id}"]`);
          if (button) {
            button.style.background = ft.id === type.id ? 
              (this.editor.options.theme === 'dark' ? '#0d7377' : '#007bff') : 
              (this.editor.options.theme === 'dark' ? '#2a2a2a' : '#fff');
            button.style.color = ft.id === type.id ? '#fff' : 
              (this.editor.options.theme === 'dark' ? '#e0e0e0' : '#333');
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
    textInput.style.border = this.editor.options.theme === 'dark' ? '1px solid #404040' : '1px solid #ccc';
    textInput.style.borderRadius = '4px';
    textInput.style.marginBottom = '8px';
    textInput.style.background = this.editor.options.theme === 'dark' ? '#1e1e1e' : '#fff';
    textInput.style.color = this.editor.options.theme === 'dark' ? '#e0e0e0' : '#333';
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
    importBtn.style.background = this.editor.options.theme === 'dark' ? '#0d7377' : '#007bff';
    importBtn.style.color = '#fff';
    importBtn.style.border = 'none';
    importBtn.style.borderRadius = '4px';
    importBtn.style.cursor = 'pointer';
    importBtn.style.fontWeight = '500';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.padding = '8px 16px';
    cancelBtn.style.background = this.editor.options.theme === 'dark' ? '#404040' : '#eee';
    cancelBtn.style.color = this.editor.options.theme === 'dark' ? '#e0e0e0' : '#333';
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
} 