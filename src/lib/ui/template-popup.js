/**
 * Template Popup Component - Popup for inserting predefined templates
 */
class TemplatePopup {
  constructor(options = {}) {
    this.options = {
      onTemplateInsert: null,
      ...options
    };
    
    this.popup = null;
    this.isVisible = false;
    this.clickOutsideHandler = null;
    
    this.createTemplatePopup();
  }

  createTemplatePopup() {
    this.popup = document.createElement('div');
    this.popup.className = 'template-popup';
    
    const content = document.createElement('div');
    content.className = 'template-popup-content';
    
    // Title
    const title = document.createElement('h3');
    title.textContent = 'Insert Template';
    title.className = 'template-popup-title';
    content.appendChild(title);
    
    // Template list
    this.templateList = document.createElement('div');
    this.templateList.className = 'template-list';
    this.createTemplateList();
    content.appendChild(this.templateList);
    
    // Preview area
    const previewContainer = document.createElement('div');
    previewContainer.className = 'template-preview-container';
    
    const previewLabel = document.createElement('label');
    previewLabel.textContent = 'Preview:';
    previewLabel.className = 'template-input-label';
    
    this.previewArea = document.createElement('textarea');
    this.previewArea.className = 'template-preview';
    this.previewArea.placeholder = 'Select a template to see preview...';
    this.previewArea.rows = 8;
    this.previewArea.readOnly = true;
    
    previewContainer.appendChild(previewLabel);
    previewContainer.appendChild(this.previewArea);
    content.appendChild(previewContainer);
    
    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'template-button-container';
    
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'template-button cancel-button';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', () => this.hide());
    
    this.insertButton = document.createElement('button');
    this.insertButton.type = 'button';
    this.insertButton.className = 'template-button insert-button';
    this.insertButton.textContent = 'Insert Template';
    this.insertButton.disabled = true;
    this.insertButton.addEventListener('click', () => this.insertTemplate());
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(this.insertButton);
    content.appendChild(buttonContainer);
    
    this.popup.appendChild(content);
    document.body.appendChild(this.popup);
  }

  createTemplateList() {
    const templates = this.getTemplates();
    
    templates.forEach((template, index) => {
      const templateItem = document.createElement('div');
      templateItem.className = 'template-item';
      
      const templateButton = document.createElement('button');
      templateButton.type = 'button';
      templateButton.className = 'template-button-item';
      templateButton.textContent = template.name;
      
      templateButton.addEventListener('click', () => {
        this.selectTemplate(template, templateButton);
      });
      
      templateItem.appendChild(templateButton);
      this.templateList.appendChild(templateItem);
    });
  }

  selectTemplate(template, buttonElement) {
    // Remove previous selection
    this.templateList.querySelectorAll('.template-button-item').forEach(btn => {
      btn.classList.remove('selected');
    });
    
    // Select current template
    buttonElement.classList.add('selected');
    this.selectedTemplate = template;
    
    // Update preview
    this.previewArea.value = template.content;
    
    // Enable insert button
    this.insertButton.disabled = false;
  }

  insertTemplate() {
    if (!this.selectedTemplate) return;
    
    if (this.options.onTemplateInsert) {
      this.options.onTemplateInsert(this.selectedTemplate.content);
    }
    
    this.hide();
    this.reset();
  }

  reset() {
    this.selectedTemplate = null;
    this.previewArea.value = '';
    this.insertButton.disabled = true;
    
    this.templateList.querySelectorAll('.template-button-item').forEach(btn => {
      btn.classList.remove('selected');
    });
  }

  getTemplates() {
    return [
      {
        name: 'Meeting Notes',
        content: `Meeting Notes - [Date]

Attendees:
- 

Agenda:
1. 

Discussion:
- 

Action Items:
- [ ] 

Next Meeting: [Date]`
      },
      {
        name: 'Email Signature',
        content: `Best regards,
[Your Name]
[Your Title]
[Company Name]
[Email] | [Phone]`
      },
      {
        name: 'Project Status',
        content: `Project Status Update

Project: [Project Name]
Date: [Date]

Progress:
✅ Completed:
- 

🔄 In Progress:
- 

📋 Planned:
- 

Issues:
- 

Next Steps:
- `
      },
      {
        name: 'Code Review',
        content: `Code Review Comments

File: [Filename]
Reviewer: [Name]
Date: [Date]

Summary:
- 

Issues Found:
- [ ] 

Suggestions:
- 

Overall Rating: ⭐⭐⭐⭐⭐`
      },
      {
        name: 'Bug Report',
        content: `Bug Report

Title: [Brief description]
Priority: [High/Medium/Low]
Date: [Date]

Steps to Reproduce:
1. 
2. 
3. 

Expected Behavior:
- 

Actual Behavior:
- 

Environment:
- Browser: 
- OS: 
- Version: 

Screenshots/Logs:
- `
      },
      {
        name: 'Thank You Note',
        content: `Dear [Name],

Thank you for [reason]. Your [action/help/support] made a significant difference.

I appreciate [specific detail].

Best regards,
[Your Name]`
      }
    ];
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
    const popupWidth = 450;
    const popupHeight = 500;
    
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

export default TemplatePopup; 