/**
 * Link Popup Component - Simple link popup
 */
class LinkPopup {
  constructor(options = {}) {
    this.options = {
      onLinkSelect: null,
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
    
    // URL input
    const urlLabel = document.createElement('label');
    urlLabel.textContent = 'URL:';
    urlLabel.className = 'link-input-label';
    
    this.urlInput = document.createElement('input');
    this.urlInput.type = 'url';
    this.urlInput.className = 'link-input';
    this.urlInput.placeholder = 'https://example.com';
    
    // Text input
    const textLabel = document.createElement('label');
    textLabel.textContent = 'Display Text:';
    textLabel.className = 'link-input-label';
    
    this.textInput = document.createElement('input');
    this.textInput.type = 'text';
    this.textInput.className = 'link-input';
    this.textInput.placeholder = 'Link text (optional)';
    
    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'link-button-container';
    
    const okButton = document.createElement('button');
    okButton.type = 'button';
    okButton.className = 'link-button ok-button';
    okButton.textContent = 'OK';
    okButton.onclick = () => this.handleOk();
    
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'link-button cancel-button';
    cancelButton.textContent = 'Cancel';
    cancelButton.onclick = () => this.hide();
    
    // Enter key to submit
    this.urlInput.onkeydown = (e) => {
      if (e.key === 'Enter') this.handleOk();
      if (e.key === 'Escape') this.hide();
    };
    
    this.textInput.onkeydown = (e) => {
      if (e.key === 'Enter') this.handleOk();
      if (e.key === 'Escape') this.hide();
    };
    
    buttonContainer.appendChild(okButton);
    buttonContainer.appendChild(cancelButton);
    
    content.appendChild(urlLabel);
    content.appendChild(this.urlInput);
    content.appendChild(textLabel);
    content.appendChild(this.textInput);
    content.appendChild(buttonContainer);
    
    this.popup.appendChild(content);
    document.body.appendChild(this.popup);
  }

  handleOk() {
    const url = this.urlInput.value.trim();
    if (!url) {
      alert('Please enter a URL');
      this.urlInput.focus();
      return;
    }
    
    const text = this.textInput.value.trim();
    
    if (this.options.onLinkSelect) {
      this.options.onLinkSelect({ url, text });
    }
    
    this.hide();
  }

  show(anchor, existingLink = null) {
    if (!anchor) return;
    
    // Populate fields
    this.urlInput.value = existingLink ? existingLink.url : '';
    this.textInput.value = existingLink ? existingLink.text : '';
    
    // Position popup
    const rect = anchor.getBoundingClientRect();
    this.popup.style.position = 'absolute';
    this.popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
    this.popup.style.left = `${rect.left + window.scrollX}px`;
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