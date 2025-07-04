import { InlineFormat } from '../core/format.js';
import TemplatePopup from '../ui/template-popup.js';

class Template extends InlineFormat {
  static formatName = 'template';
  static tagName = 'DIV';
  static className = 'template-content';

  constructor() {
    super();
    if (!Template.templatePopupInstance) {
      Template.templatePopupInstance = new TemplatePopup({
        onTemplateInsert: (templateContent) => {
          Template.insertTemplateAtCurrentPosition(templateContent);
        }
      });
    }
    this.templatePopup = Template.templatePopupInstance;
  }

  static create(content) {
    const div = document.createElement('DIV');
    div.className = 'template-content';
    div.innerHTML = content;
    return div;
  }

  static insertTemplateAtCurrentPosition(content) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    try {
      const range = selection.getRangeAt(0);
      
      // Create template elements
      const lines = content.split('\n');
      const fragment = document.createDocumentFragment();
      
      lines.forEach((line, index) => {
        if (line.trim()) {
          const div = document.createElement('div');
          div.textContent = line;
          fragment.appendChild(div);
        }
        
        if (index < lines.length - 1) {
          fragment.appendChild(document.createElement('br'));
        }
      });
      
      // Insert template at cursor position
      range.deleteContents();
      range.insertNode(fragment);
      
      // Position cursor after the template
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      
    } catch (error) {
      console.error('Error inserting template:', error);
    }
  }

  apply(content) {
    if (content) {
      Template.insertTemplateAtCurrentPosition(content);
    } else {
      this.showTemplatePopup();
    }
  }

  toggle() {
    if (this.templatePopup.isVisible) {
      this.templatePopup.hide();
    } else {
      this.showTemplatePopup();
    }
  }

  showTemplatePopup() {
    const templateButton = document.querySelector('.rich-editor-toolbar-btn.template-btn');
    if (!templateButton) return;
    
    this.templatePopup.show(templateButton);
  }

  isActive() {
    return false; // Templates don't have an "active" state
  }

  static getTemplates() {
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
}

export default Template; 