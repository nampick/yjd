// MediaManager.js - Quản lý media (images, videos)
import { FormatManager } from './FormatManager.js';
export class MediaManager {
  constructor(editor,toolbarManager) {
    this.editor = editor;
    this.formatManager = new FormatManager(editor,this);
    this.toolbarManager = toolbarManager;
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
        
        btn.onclick = () => {
          // Khôi phục selection emoji và chèn emoji ngay lập tức
          this.formatManager.restoreSelection(this.savedEmojiSelection);
          this.editor.editor.focus();
          const sel = window.getSelection();
          if (sel.rangeCount && this.editor.editor.contains(sel.anchorNode)) {
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
    this.formatManager.restoreSelection(this.savedSelection);
    this.editor.editor.focus();
    const sel = window.getSelection();
    if (sel.rangeCount && this.editor.editor.contains(sel.anchorNode)) {
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
    this.formatManager.restoreSelection(this.savedSelection);
    this.editor.editor.focus();
    const sel = window.getSelection();
    if (sel.rangeCount && this.editor.editor.contains(sel.anchorNode)) {
      sel.getRangeAt(0).insertNode(wrapper);
    } else {
      this.editor.appendChild(wrapper);
    }
    setTimeout(() => {
      wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.showImgResizeHandles(wrapper);
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

  insertImage() {
    this.savedSelection = this.formatManager.saveSelection();
    this.showImageDropdown();
  }

  insertLink() {
    this.savedSelection = this.formatManager.saveSelection();
    this.showLinkDropdown();
  }

  insertEmoji() {
    this.savedEmojiSelection = this.formatManager.saveSelection();
    this.showEmojiDropdown();
  }

  insertVideo() {
    this.savedSelection = this.formatManager.saveSelection();
    this.showVideoDropdown();
  }

  // Dropdown methods for insert features
  showImageDropdown() {
    const btn = this.editor.toolbarManager.toolbarBtns.image;
    if (!btn) return;

    // Check if dropdown is already visible
    const existingDropdown = document.getElementById('image-dropdown');
    if (existingDropdown) {
      existingDropdown.remove();
      return;
    }

    // Close all other dropdowns first
    this.toolbarManager.closeAllDropdowns();

    const dropdown = document.createElement('div');
    dropdown.id = 'image-dropdown';
    dropdown.style.position = 'fixed';
    dropdown.style.zIndex = '99999';
    dropdown.style.background = this.editor.options.theme === 'dark' ? '#2a2a2a' : '#fff';
    dropdown.style.border = this.editor.options.theme === 'dark' ? '1px solid #404040' : '1px solid #e1e1e1';
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
    urlInput.style.border = this.editor.options.theme === 'dark' ? '1px solid #404040' : '1px solid #ccc';
    urlInput.style.borderRadius = '4px';
    urlInput.style.marginBottom = '8px';
    urlInput.style.background = this.editor.options.theme === 'dark' ? '#1e1e1e' : '#fff';
    urlInput.style.color = this.editor.options.theme === 'dark' ? '#e0e0e0' : '#333';

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
    insertBtn.style.background = this.editor.options.theme === 'dark' ? '#0d7377' : '#007bff';
    insertBtn.style.color = '#fff';
    insertBtn.style.border = 'none';
    insertBtn.style.borderRadius = '4px';
    insertBtn.style.cursor = 'pointer';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.padding = '6px 12px';
    cancelBtn.style.background = this.editor.options.theme === 'dark' ? '#404040' : '#eee';
    cancelBtn.style.color = this.editor.options.theme === 'dark' ? '#e0e0e0' : '#333';
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
        this.formatManager.restoreSelection(this.savedSelection);
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
    const btn = this.editor.toolbarManager.toolbarBtns.link;
    if (!btn) return;

    // Check if dropdown is already visible
    const existingDropdown = document.getElementById('link-dropdown');
    if (existingDropdown) {
      existingDropdown.remove();
      return;
    }

    // Close all other dropdowns first
    this.toolbarManager.closeAllDropdowns();

    const dropdown = document.createElement('div');
    dropdown.id = 'link-dropdown';
    dropdown.style.position = 'fixed';
    dropdown.style.zIndex = '99999';
    dropdown.style.background = this.editor.options.theme === 'dark' ? '#2a2a2a' : '#fff';
    dropdown.style.border = this.editor.options.theme === 'dark' ? '1px solid #404040' : '1px solid #e1e1e1';
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
    urlInput.style.border = this.editor.options.theme === 'dark' ? '1px solid #404040' : '1px solid #ccc';
    urlInput.style.borderRadius = '4px';
    urlInput.style.marginBottom = '8px';
    urlInput.style.background = this.editor.options.theme === 'dark' ? '#1e1e1e' : '#fff';
    urlInput.style.color = this.editor.options.theme === 'dark' ? '#e0e0e0' : '#333';

    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '8px';
    buttonContainer.style.justifyContent = 'flex-end';

    const insertBtn = document.createElement('button');
    insertBtn.textContent = 'Insert';
    insertBtn.style.padding = '6px 12px';
    insertBtn.style.background = this.editor.options.theme === 'dark' ? '#0d7377' : '#007bff';
    insertBtn.style.color = '#fff';
    insertBtn.style.border = 'none';
    insertBtn.style.borderRadius = '4px';
    insertBtn.style.cursor = 'pointer';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.padding = '6px 12px';
    cancelBtn.style.background = this.editor.options.theme === 'dark' ? '#404040' : '#eee';
    cancelBtn.style.color = this.editor.options.theme === 'dark' ? '#e0e0e0' : '#333';
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
        this.formatManager.restoreSelection(this.savedSelection);
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
    const btn = this.editor.toolbarManager.toolbarBtns.emoji;
    if (!btn) return;

    // Check if dropdown is already visible
    const existingDropdown = document.getElementById('emoji-dropdown');
    if (existingDropdown) {
      existingDropdown.remove();
      return;
    }

    // Close all other dropdowns first
    this.toolbarManager.closeAllDropdowns();

    const dropdown = document.createElement('div');
    dropdown.id = 'emoji-dropdown';
    dropdown.style.position = 'fixed';
    dropdown.style.zIndex = '99999';
    dropdown.style.background = this.editor.options.theme === 'dark' ? '#2a2a2a' : '#fff';
    dropdown.style.border = this.editor.options.theme === 'dark' ? '1px solid #404040' : '1px solid #e1e1e1';
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

    const emojis = '😀 😃 😄 😁 😆 😅 😂 😜 😊 🤗 😇 😉 🥳 🤩 😍 😘 🥰 🤔 🤯 😏 😎 🤨 😤 😡 🤬 😱 🥶 🥵 🥺 😭 🙏 👍 👎 👏 🙌 👋 🤝 💪 🧠 🦾 🦿 🦵 🦶 👀'.split(' ');

    emojis.forEach(emoji => {
      const emojiBtn = document.createElement('button');
      emojiBtn.textContent = emoji;
      emojiBtn.style.fontSize = '20px';
      emojiBtn.style.padding = '4px';
      emojiBtn.style.border = 'none';
      emojiBtn.style.background = 'none';
      emojiBtn.style.cursor = 'pointer';
      emojiBtn.style.borderRadius = '4px';

      emojiBtn.onmouseover = () => {
        emojiBtn.style.background = this.editor.options.theme === 'dark' ? '#404040' : '#f0f0f0';
      };

      emojiBtn.onmouseout = () => {
        emojiBtn.style.background = 'transparent';
      };

      emojiBtn.onclick = () => {
        this.formatManager.restoreSelection(this.savedEmojiSelection);
        this.editor.editor.focus();
        const sel = window.getSelection();
        if (sel.rangeCount && this.editor.editor.contains(sel.anchorNode)) {
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
    const btn = this.editor.toolbarManager.toolbarBtns.video;
    if (!btn) return;

    // Check if dropdown is already visible
    const existingDropdown = document.getElementById('video-dropdown');
    if (existingDropdown) {
      existingDropdown.remove();
      return;
    }

    // Close all other dropdowns first
    this.toolbarManager.closeAllDropdowns();

    const dropdown = document.createElement('div');
    dropdown.id = 'video-dropdown';
    dropdown.style.position = 'fixed';
    dropdown.style.zIndex = '99999';
    dropdown.style.background = this.editor.options.theme === 'dark' ? '#2a2a2a' : '#fff';
    dropdown.style.border = this.editor.options.theme === 'dark' ? '1px solid #404040' : '1px solid #e1e1e1';
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
    urlInput.style.border = this.editor.options.theme === 'dark' ? '1px solid #404040' : '1px solid #ccc';
    urlInput.style.borderRadius = '4px';
    urlInput.style.marginBottom = '8px';
    urlInput.style.background = this.editor.options.theme === 'dark' ? '#1e1e1e' : '#fff';
    urlInput.style.color = this.editor.options.theme === 'dark' ? '#e0e0e0' : '#333';

    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '8px';
    buttonContainer.style.justifyContent = 'flex-end';

    const insertBtn = document.createElement('button');
    insertBtn.textContent = 'Insert';
    insertBtn.style.padding = '6px 12px';
    insertBtn.style.background = this.editor.options.theme === 'dark' ? '#0d7377' : '#007bff';
    insertBtn.style.color = '#fff';
    insertBtn.style.border = 'none';
    insertBtn.style.borderRadius = '4px';
    insertBtn.style.cursor = 'pointer';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.padding = '6px 12px';
    cancelBtn.style.background = this.editor.options.theme === 'dark' ? '#404040' : '#eee';
    cancelBtn.style.color = this.editor.options.theme === 'dark' ? '#e0e0e0' : '#333';
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
        this.formatManager.restoreSelection(this.savedSelection);
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
} 