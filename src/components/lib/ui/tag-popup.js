/**
 * Tag Popup Component - Popup for inserting custom tags
 */
import { appendPopup, calculatePopupPosition, setPopupPosition } from '../utils/popup-helper.js';

class TagPopup {
  constructor(options = {}) {
    this.options = {
      onTagInsert: null,
      editor: null,
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
    title.textContent = 'Insert tags';
    title.className = 'yjd-input-title';
    content.appendChild(title);
    
    // Tag type selector
    const group1 = document.createElement('div');
    group1.className = 'yjd-input-group';
    
    const typeLabel = document.createElement('label');
    typeLabel.textContent = 'Type';
    typeLabel.className = 'yjd-input-label';
    
    this.typeSelect = document.createElement('select');
    this.typeSelect.className = 'yjd-select-input';
    this.typeSelect.innerHTML = `
      <option value="mention">Mention</option>
      <option value="hashtag">Hashtag</option>
      <option value="custom">Custom</option>
    `;
    this.typeSelect.addEventListener('change', () => this.updateSuggestions());
    
    group1.appendChild(typeLabel);
    group1.appendChild(this.typeSelect);
    content.appendChild(group1);
    
    // Content input
    const group2 = document.createElement('div');
    group2.className = 'yjd-input-group';
    
    const contentLabel = document.createElement('label');
    contentLabel.textContent = 'Content';
    contentLabel.className = 'yjd-input-label';
    
    this.contentInput = document.createElement('input');
    this.contentInput.type = 'text';
    this.contentInput.className = 'yjd-input';
    this.contentInput.placeholder = 'Please enter tag content';
    this.contentInput.addEventListener('input', () => this.updateInsertButton());
    this.contentInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.insertTag();
      }
    });
    
    group2.appendChild(contentLabel);
    group2.appendChild(this.contentInput);
    content.appendChild(group2);
    
    // Suggestions
    const group3 = document.createElement('div');
    group3.className = 'yjd-input-group';
    this.suggestionsContainer = document.createElement('div');
    this.suggestionsContainer.className = 'tag-suggestions-container';
    
    const suggestionsLabel = document.createElement('label');
    suggestionsLabel.textContent = 'Suggestions';
    suggestionsLabel.className = 'yjd-input-label';
    
    this.suggestionsList = document.createElement('div');
    this.suggestionsList.className = 'yjd-suggestions-list';
    
    this.suggestionsContainer.appendChild(this.suggestionsList);
    group3.appendChild(suggestionsLabel);
    group3.appendChild(this.suggestionsContainer);
    content.appendChild(group3);
    
    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'yjd-button-container';
    
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'yjd-button-cancel';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => this.hide());
    
    this.insertButton = document.createElement('button');
    this.insertButton.type = 'button';
    this.insertButton.className = 'yjd-button-confirm';
    this.insertButton.textContent = 'Insert Tag';
    this.insertButton.disabled = true;
    this.insertButton.addEventListener('click', () => this.insertTag());
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(this.insertButton);
    content.appendChild(buttonContainer);
    
    this.popup.appendChild(content);
    appendPopup(this.popup);
    
    // Prevent focus loss when clicking on popup
    if (this.options.editor && typeof this.options.editor.preventFocusLoss === 'function') {
      this.options.editor.preventFocusLoss(this.popup);
    }
    
    this.updateSuggestions();
  }

  updateSuggestions() {
    this.selectedTagType = this.typeSelect.value;
    this.suggestionsList.innerHTML = '';
    
    const suggestions = this.getSuggestions(this.selectedTagType);
    
    suggestions.forEach(suggestion => {
      const suggestionButton = document.createElement('button');
      suggestionButton.type = 'button';
      suggestionButton.className = 'yjd-suggestion-button';
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
      mention: ['john', 'admin', 'team', 'support'],
      hashtag: ['urgent', 'done',  'important'],
      custom: ['warning',  'info', 'success']
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
    
    // Calculate and set popup position
    const position = calculatePopupPosition(anchor, this.popup, {
      offsetY: 5,
      offsetX: 0
    });
    setPopupPosition(this.popup, position);
    
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