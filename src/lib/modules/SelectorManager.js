// SelectorManager.js - Quản lý các selector (font, font size, line height)
export class SelectorManager {
  constructor(editor) {
    this.editor = editor;
  }

  // Helper methods for dropdown menu functionalities
  showFontSelector() {
    // Focus on the font selector dropdown button in toolbar
    if (this.fontSelector) {
      this.fontSelector.focus();
      this.fontSelector.click();
    }
  }

  showFontSizeSelector() {
    // Focus on the font size selector dropdown button in toolbar
    if (this.fontSizeSelector) {
      this.fontSizeSelector.focus();
      this.fontSizeSelector.click();
    }
  }

  showLineHeightSelector() {
    // Focus on the line height selector dropdown button in toolbar
    if (this.lineHeightSelector) {
      this.lineHeightSelector.focus();
      this.lineHeightSelector.click();
    }
  }
} 