/**
 * Link Popup Component - Simple link popup
 */
class LinkPopup {
  constructor(options = {}) {
    this.options = {
      onLinkSelect: null,
      editor: null,
      ...options
    };
    
    this.popup = null;
    this.isVisible = false;
    this.urlInput = null;
    this.textInput = null;
    
    this.createPopup();
  }

  createPopup() {
    this.popup = document.createElement('div');
    this.popup.className = 'link-popup';
    
    const content = document.createElement('div');
    content.className = 'link-popup-content';
    
    // title
    const linkTitle = document.createElement('h2');
    linkTitle.textContent = 'Upload link';
    linkTitle.className = 'yjd-input-title';
    //text label 1
    const inputgroup1 = document.createElement('div');
    inputgroup1.className = 'yjd-input-group';
    const textLabel = document.createElement('p');
    textLabel.textContent = 'Your URL';
    textLabel.className = 'yjd-input-label';

    this.urlInput = document.createElement('input');
    this.urlInput.type = 'url';
    this.urlInput.className = 'yjd-input';
    this.urlInput.placeholder = 'Please enter your URL';
    inputgroup1.appendChild(textLabel);
    inputgroup1.appendChild(this.urlInput);
    
    // Text label 2
    const inputgroup2 = document.createElement('div');
    inputgroup2.className = 'yjd-input-group';
    const urlLabel = document.createElement('p');
    urlLabel.textContent = 'Your display text';
    urlLabel.className = 'yjd-input-label';
    
    this.textInput = document.createElement('input');
    this.textInput.type = 'text';
    this.textInput.className = 'yjd-input';
    this.textInput.placeholder = 'Please enter display text';
    inputgroup2.appendChild(urlLabel);
    inputgroup2.appendChild(this.textInput);
    
    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'yjd-button-container';
    
    const okButton = document.createElement('button');
    okButton.type = 'button';
    okButton.className = 'yjd-button-confirm';
    okButton.textContent = 'Add link';
    okButton.onclick = () => {
      this.handleOk();
      // Maintain editor focus after action
      if (this.options.editor) {
        setTimeout(() => this.options.editor.focus(), 0);
      }
    };
    
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'yjd-button-cancel';
    cancelButton.textContent = 'Cancel';
    cancelButton.onclick = () => {
      this.hide();
      // Maintain editor focus after popup close
      if (this.options.editor) {
        setTimeout(() => this.options.editor.focus(), 0);
      }
    };
    
    // Enter key to submit
    this.urlInput.onkeydown = (e) => {
      if (e.key === 'Enter') this.handleOk();
      if (e.key === 'Escape') this.hide();
    };
    
    this.textInput.onkeydown = (e) => {
      if (e.key === 'Enter') this.handleOk();
      if (e.key === 'Escape') this.hide();
    };
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(okButton);
    
    content.appendChild(linkTitle);
    content.appendChild(inputgroup1);
    content.appendChild(inputgroup2);
    content.appendChild(buttonContainer);
    
    this.popup.appendChild(content);
    document.body.appendChild(this.popup);
    
    // Prevent focus loss when clicking on popup
    if (this.options.editor && typeof this.options.editor.preventFocusLoss === 'function') {
      this.options.editor.preventFocusLoss(this.popup);
    }
  }

  handleOk() {
    const url = this.urlInput.value.trim();
    // Kiểm tra rỗng
    if (!url) {
      alert('Please enter a URL');
      this.urlInput.focus();
      return;
    }
    // Kiểm tra định dạng URL
    try {
      new URL(url); // Nếu sai format, sẽ throw
    } catch (e) {
      alert('Please enter a valid URL');
      this.urlInput.focus();
      return;
    }
    
    const text = this.textInput.value.trim();
    
    if (this.options.onLinkSelect) {
      this.options.onLinkSelect({ url, text });
    }
    
    this.hide();
  }

  show(anchor, existingLink = null, selectedText = '') {
    if (!anchor) return;
    
    // Populate fields
    this.urlInput.value = existingLink ? existingLink.url : '';
    // Use selected text if available, otherwise use existing link text or empty
    this.textInput.value = selectedText || (existingLink ? existingLink.text : '');
    
    // Position popup with responsive positioning
    const anchorRect = anchor.getBoundingClientRect();
    const popupWidth = 350; // Estimated popup width
    const popupHeight = 200; // Estimated popup height
    
    let top = anchorRect.bottom + window.scrollY + 5;
    let left = anchorRect.left + window.scrollX;
    
    // Check if popup would overflow right edge
    if (left + popupWidth > window.innerWidth) {
      left = window.innerWidth - popupWidth - 10;
    }
    
    // Check if popup would overflow bottom edge
    if (top + popupHeight > window.innerHeight + window.scrollY) {
      top = anchorRect.top + window.scrollY - popupHeight - 5;
    }
    
    // Ensure popup doesn't go off-screen
    if (left < 0) left = 10;
    if (top < 0) top = 10;
    
    this.popup.style.position = 'absolute';
    this.popup.style.top = `${top}px`;
    this.popup.style.left = `${left}px`;
    this.popup.style.zIndex = '1000';
    
    // Show popup
    this.popup.classList.add('visible');
    this.isVisible = true;
    
    // Focus URL input
    setTimeout(() => this.urlInput.focus(), 100);
    
    // Click outside to close
    setTimeout(() => {
      document.addEventListener('click', this.closeOnClickOutside);
    }, 100);
  }

  hide() {
    this.popup.classList.remove('visible');
    this.isVisible = false;
    document.removeEventListener('click', this.closeOnClickOutside);
  }

  closeOnClickOutside = (e) => {
    if (!this.popup.contains(e.target)) {
      this.hide();
    }
  }

  destroy() {
    document.removeEventListener('click', this.closeOnClickOutside);
    if (this.popup && this.popup.parentNode) {
      this.popup.parentNode.removeChild(this.popup);
    }
  }
}

export default LinkPopup; 