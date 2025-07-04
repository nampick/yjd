/**
 * Tag Popup Component - Popup for inserting custom tags
 */
class TagPopup {
  constructor(options = {}) {
    this.options = {
      onTagInsert: null,
      ...options
    };
    
    this.popup = null;
    this.isVisible = false;
    this.clickOutsideHandler = null;
    this.selectedTagType = 'mention';
    
    this.createTagPopup();
  }

  createTagPopup() {
    this.popup = document.createElement('div');
    this.popup.className = 'tag-popup';
    
    const content = document.createElement('div');
    content.className = 'tag-popup-content';
    
    // Title
    const title = document.createElement('h3');
    title.textContent = 'Insert Tag';
    title.className = 'tag-popup-title';
    content.appendChild(title);
    
    // Tag type selector
    const typeContainer = document.createElement('div');
    typeContainer.className = 'tag-type-container';
    
    const typeLabel = document.createElement('label');
    typeLabel.textContent = 'Tag Type:';
    typeLabel.className = 'tag-input-label';
    
    this.typeSelect = document.createElement('select');
    this.typeSelect.className = 'tag-type-select';
    this.typeSelect.innerHTML = `
      <option value="mention">Mention (@user)</option>
      <option value="hashtag">Hashtag (#topic)</option>
      <option value="custom">Custom (&lt;tag&gt;)</option>
    `;
    this.typeSelect.addEventListener('change', () => this.updateSuggestions());
    
    typeContainer.appendChild(typeLabel);
    typeContainer.appendChild(this.typeSelect);
    content.appendChild(typeContainer);
    
    // Content input
    const contentContainer = document.createElement('div');
    contentContainer.className = 'tag-input-container';
    
    const contentLabel = document.createElement('label');
    contentLabel.textContent = 'Tag Content:';
    contentLabel.className = 'tag-input-label';
    
    this.contentInput = document.createElement('input');
    this.contentInput.type = 'text';
    this.contentInput.className = 'tag-input';
    this.contentInput.placeholder = 'Enter tag content...';
    this.contentInput.addEventListener('input', () => this.updateInsertButton());
    this.contentInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.insertTag();
      }
    });
    
    contentContainer.appendChild(contentLabel);
    contentContainer.appendChild(this.contentInput);
    content.appendChild(contentContainer);
    
    // Suggestions
    this.suggestionsContainer = document.createElement('div');
    this.suggestionsContainer.className = 'tag-suggestions-container';
    
    const suggestionsLabel = document.createElement('label');
    suggestionsLabel.textContent = 'Quick suggestions:';
    suggestionsLabel.className = 'tag-input-label';
    
    this.suggestionsList = document.createElement('div');
    this.suggestionsList.className = 'tag-suggestions-list';
    
    this.suggestionsContainer.appendChild(suggestionsLabel);
    this.suggestionsContainer.appendChild(this.suggestionsList);
    content.appendChild(this.suggestionsContainer);
    
    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'tag-button-container';
    
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'tag-button cancel-button';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => this.hide());
    
    this.insertButton = document.createElement('button');
    this.insertButton.type = 'button';
    this.insertButton.className = 'tag-button insert-button';
    this.insertButton.textContent = 'Insert Tag';
    this.insertButton.disabled = true;
    this.insertButton.addEventListener('click', () => this.insertTag());
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(this.insertButton);
    content.appendChild(buttonContainer);
    
    this.popup.appendChild(content);
    document.body.appendChild(this.popup);
    
    this.updateSuggestions();
  }

  updateSuggestions() {
    this.selectedTagType = this.typeSelect.value;
    this.suggestionsList.innerHTML = '';
    
    const suggestions = this.getSuggestions(this.selectedTagType);
    
    suggestions.forEach(suggestion => {
      const suggestionButton = document.createElement('button');
      suggestionButton.type = 'button';
      suggestionButton.className = 'tag-suggestion-button';
      suggestionButton.textContent = suggestion;
      
      suggestionButton.addEventListener('click', () => {
        this.contentInput.value = suggestion;
        this.updateInsertButton();
        this.contentInput.focus();
      });
      
      this.suggestionsList.appendChild(suggestionButton);
    });
  }

  getSuggestions(tagType) {
    const suggestions = {
      mention: ['john', 'sarah', 'admin', 'team', 'support'],
      hashtag: ['urgent', 'todo', 'done', 'review', 'important'],
      custom: ['note', 'warning', 'tip', 'info', 'success']
    };
    
    return suggestions[tagType] || [];
  }

  updateInsertButton() {
    const hasContent = this.contentInput.value.trim();
    this.insertButton.disabled = !hasContent;
  }

  insertTag() {
    const content = this.contentInput.value.trim();
    
    if (!content) return;
    
    if (this.options.onTagInsert) {
      this.options.onTagInsert(this.selectedTagType, content);
    }
    
    this.hide();
    this.reset();
  }

  reset() {
    this.contentInput.value = '';
    this.typeSelect.value = 'mention';
    this.selectedTagType = 'mention';
    this.updateInsertButton();
    this.updateSuggestions();
  }

  setupClickOutside() {
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler);
    }
    
    this.clickOutsideHandler = (e) => {
      if (!this.popup.contains(e.target)) {
        this.hide();
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', this.clickOutsideHandler);
    }, 100);
  }

  removeClickOutside() {
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler);
      this.clickOutsideHandler = null;
    }
  }

  show(anchor) {
    if (!anchor) return;
    
    const anchorRect = anchor.getBoundingClientRect();
    const popupWidth = 320;
    const popupHeight = 350;
    
    let top = anchorRect.bottom + window.scrollY + 5;
    let left = anchorRect.left + window.scrollX;
    
    if (left + popupWidth > window.innerWidth) {
      left = window.innerWidth - popupWidth - 10;
    }
    
    if (top + popupHeight > window.innerHeight + window.scrollY) {
      top = anchorRect.top + window.scrollY - popupHeight - 5;
    }
    
    if (left < 0) left = 10;
    if (top < 0) top = 10;
    
    this.popup.style.top = `${top}px`;
    this.popup.style.left = `${left}px`;
    
    this.popup.classList.add('visible');
    this.isVisible = true;
    
    this.setupClickOutside();
    
    setTimeout(() => {
      this.contentInput.focus();
    }, 100);
  }

  hide() {
    this.popup.classList.remove('visible');
    this.isVisible = false;
    this.removeClickOutside();
  }

  destroy() {
    this.removeClickOutside();
    
    if (this.popup && this.popup.parentNode) {
      this.popup.parentNode.removeChild(this.popup);
    }
    
    this.popup = null;
    this.isVisible = false;
  }
}

export default TagPopup; 