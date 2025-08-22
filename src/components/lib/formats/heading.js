import { BlockFormat } from '../core/format.js';
import CustomSelect from '../ui/customselect.js';
import { saveBeforeFormat } from '../utils/history-helper.js';

/**
 * Heading Format - Handles heading and paragraph formatting
 */
class Heading extends BlockFormat {
  static formatName = 'heading';
  static tagName = 'H1'; // Default tag, will be overridden
  
  constructor() {
    super();
    // Create custom select instance if not exists
    if (!Heading.selectInstance) {
      const tagMap = Heading.getTagMap();
      const items = Object.values(tagMap).map(tagData => ({
        value: tagData.tag,
        label: tagData.element,
        title: tagData.title
      }));

      Heading.selectInstance = new CustomSelect({
        items: items,
        displayProperty: 'label',
        valueProperty: 'value',
        className: 'heading-select',
        onItemSelect: (value, item) => {
          Heading.applyTagToCurrentSelection(value);
        }
      });
    }
    this.customSelect = Heading.selectInstance;
  }

  /**
   * Get display name for tag
   * @param {string} tag - HTML tag name
   * @returns {string} Display name
   */
  static getTagMap() {
    return {
      'H1': { tag: 'H1', element: '<h1 style="margin:0">Heading 1</h1>', title: 'Heading 1' },
      'H2': { tag: 'H2', element: '<h2 style="margin:0">Heading 2</h2>', title: 'Heading 2' },
      'H3': { tag: 'H3', element: '<h3 style="margin:0">Heading 3</h3>', title: 'Heading 3' },
      'H4': { tag: 'H4', element: '<h4 style="margin:0">Heading 4</h4>', title: 'Heading 4' },
      'H5': { tag: 'H5', element: '<h5 style="margin:0">Heading 5</h5>', title: 'Heading 5' },
      'H6': { tag: 'H6', element: '<h6 style="margin:0">Heading 6</h6>', title: 'Heading 6' },
      'P': { tag: 'P', element: '<p style="margin:0">Paragraph</p>', title: 'Paragraph' },
      'PRE': { tag: 'PRE', element: '<pre style="margin:0">Code</pre>', title: 'Preformatted' },
      'BLOCKQUOTE': { tag: 'BLOCKQUOTE', element: '<blockquote style="margin:0">Quote</blockquote>', title: 'Quote' }
    };
  }

  static getTagDisplayName(tag) {
    const tagMap = this.getTagMap();
    return tagMap[tag]?.title || 'Paragraph';
  }

  /**
   * Update custom button text based on current tag
   */
  updateButtonText() {
    const currentTag = this.getCurrentTag();
    const displayName = Heading.getTagDisplayName(currentTag || 'P');
    
    const headingButton = document.querySelector('.rich-editor-toolbar-btn.heading-btn');
    if (headingButton && headingButton.updateText) {
      headingButton.updateText(displayName);
    } else if (headingButton) {
      headingButton.textContent = displayName;
    }
  }

  /**
   * Create element with specific tag
   * @param {string} tag - HTML tag name (H1, H2, P, etc.)
   * @returns {HTMLElement}
   */
  static create(tag = 'P') {
    const node = document.createElement(tag.toUpperCase());
    return node;
  }

  /**
   * Static method to apply tag to current selection
   */
  static applyTagToCurrentSelection(tag) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    // Save state before applying format
    saveBeforeFormat();

    const range = selection.getRangeAt(0);
    const headingFormat = new Heading();
    headingFormat.apply(tag);
    
    // Update button text after applying
    headingFormat.updateButtonText();
  }

  /**
   * Apply heading format with specified tag
   * @param {string} tag - HTML tag name (H1, H2, P, etc.)
   */
  apply(tag = 'P') {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    // Lưu selection trước khi đổi
    const range = selection.getRangeAt(0);
    const isCollapsed = range.collapsed; // true = không bôi đen gì

    const blocks = this.getBlockElements(range);

    if (blocks.length === 0) {
        // Không có block - tạo mới
        const newBlock = this.createBlockAtCursor(range, tag);
        
        // Sau khi tạo block mới → đặt con trỏ vào block
        const newRange = document.createRange();
        newRange.setStart(newBlock, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
    } else {
      // selection hiện tại
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      const isCollapsed = range.collapsed;

      // đảm bảo blocks là mảng
      const blocksArray = Array.from(blocks);
      console.log(blocks);
      

      // tìm block chứa 1 node
      function findBlockIndex(node, blocks) {
        while (node && node.nodeType !== 9 /*document*/) {
          const idx = blocks.indexOf(node);
          if (idx !== -1) return idx;
          node = node.parentNode;
        }
        return -1;
      }

      // tính số ký tự từ đầu block tới vị trí (sử dụng Range.toString())
      function charOffsetFromBlockStart(block, container, offset) {
        const r = document.createRange();
        r.setStart(block, 0);
        r.setEnd(container, offset);
        return r.toString().length;
      }

      const startBlockIndex = findBlockIndex(range.startContainer, blocksArray);
      const endBlockIndex   = findBlockIndex(range.endContainer,   blocksArray);

      let startCharOffset = 0, endCharOffset = 0;
      if (startBlockIndex !== -1) {
        startCharOffset = charOffsetFromBlockStart(blocksArray[startBlockIndex], range.startContainer, range.startOffset);
      }
      if (!isCollapsed && endBlockIndex !== -1) {
        endCharOffset = charOffsetFromBlockStart(blocksArray[endBlockIndex], range.endContainer, range.endOffset);
      }

      // --- Thực hiện convert và lấy lại node mới trả về (nếu convertBlock trả về node mới)
      const newBlocks = blocksArray.map(b => {
        const newNode = this.convertBlock(b, tag);
        return newNode || b; // nếu convertBlock trả về undefined thì dùng lại b (convert in-place)
      });

      // helper: từ charOffset tìm text node + offset bên trong nó; nếu không tìm thì trả về block để set ở cuối
      function resolvePositionByCharOffset(block, charOffset) {
        const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null, false);
        let node;
        let remaining = charOffset;
        while ((node = walker.nextNode())) {
          const len = node.nodeValue.length;
          if (remaining <= len) return { node, offset: remaining };
          remaining -= len;
        }
        // không tìm text node phù hợp => đặt ở cuối block
        return { node: block, offset: block.childNodes.length };
      }

      // tái tạo range
      const newRange = document.createRange();

      if (isCollapsed) {
        const idx = (startBlockIndex !== -1 ? startBlockIndex : 0);
        const pos = resolvePositionByCharOffset(newBlocks[idx], startCharOffset);
        if (pos.node.nodeType === Node.TEXT_NODE) newRange.setStart(pos.node, pos.offset);
        else newRange.setStart(pos.node, Math.max(0, pos.offset));
        newRange.collapse(true);
      } else {
        if (startBlockIndex === -1 || endBlockIndex === -1) {
          // fallback: nếu không nằm trong blocks thì giữ range cũ (hoặc handle theo logic của bạn)
          selection.removeAllRanges();
          selection.addRange(range);
          return;
        }
        const s = resolvePositionByCharOffset(newBlocks[startBlockIndex], startCharOffset);
        const e = resolvePositionByCharOffset(newBlocks[endBlockIndex],   endCharOffset);

        // setStart/setEnd chấp nhận text node + offset hoặc element + childIndex
        if (s.node.nodeType === Node.TEXT_NODE) newRange.setStart(s.node, s.offset);
        else newRange.setStart(s.node, Math.min(s.offset, s.node.childNodes.length));

        if (e.node.nodeType === Node.TEXT_NODE) newRange.setEnd(e.node, e.offset);
        else newRange.setEnd(e.node, Math.min(e.offset, e.node.childNodes.length));
      }

      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  } 


  /**
   * Create new block at cursor position
   * @param {Range} range - Current range
   * @param {string} tag - HTML tag name
   */
  createBlockAtCursor(range, tag) {
    const blockNode = this.constructor.create(tag);
    
    // Try to preserve style from existing block if cursor is inside one
    const existingBlock = this.getBlockElement(range.startContainer);
    if (existingBlock && existingBlock.style && existingBlock.style.cssText) {
      blockNode.style.cssText = existingBlock.style.cssText;
    }
    
    if (range.collapsed) {
      // No selection - create empty block
      blockNode.appendChild(document.createTextNode(''));
      range.insertNode(blockNode);
      
      // Position cursor inside the block
      const newRange = document.createRange();
      newRange.setStart(blockNode, 0);
      newRange.collapse(true);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      // Has selection - wrap in block
      const contents = range.extractContents();
      blockNode.appendChild(contents);
      range.insertNode(blockNode);
      
      // Select the content in the block
      const newRange = document.createRange();
      newRange.selectNodeContents(blockNode);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  }

  /**
   * Convert existing block to new format
   * @param {Element} block - Block element to convert
   * @param {string} tag - HTML tag name
   * @returns {Element} - The new block element
   */
  convertBlock(block, tag) {
    const newBlock = this.constructor.create(tag);
    
    // Copy all child nodes
    while (block.firstChild) {
      newBlock.appendChild(block.firstChild);
    }
    
    // Copy relevant attributes
    if (block.className && this.shouldPreserveClass(block.className)) {
      newBlock.className = block.className;
    }
    
    // Copy style attributes to preserve formatting like text-align
    if (block.style && block.style.cssText) {
      newBlock.style.cssText = block.style.cssText;
    }
    
    // Replace the block
    block.parentNode.replaceChild(newBlock, block);
    
    return newBlock;
  }

  /**
   * Set cursor at start of block (fallback method)
   * @param {Element} block - Block element
   */
  setCursorAtStartOfBlock(block) {
    const selection = window.getSelection();
    const range = document.createRange();
    
    // Find first text node or position at start of block
    const walker = document.createTreeWalker(
      block,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    const firstTextNode = walker.nextNode();
    if (firstTextNode) {
      range.setStart(firstTextNode, 0);
      range.collapse(true);
    } else {
      range.setStart(block, 0);
      range.collapse(true);
    }

    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Toggle heading format - shows/hides tag picker
   */
  async toggle() {
    if (this.customSelect.isVisible) {
      this.customSelect.hide();
    } else {
      await this.showTagPicker();
    }
  }

  /**
   * Show custom select positioned relative to heading button on toolbar
   */
  async showTagPicker() {
    const headingButton = document.querySelector('.rich-editor-toolbar-btn.heading-btn');
    if (!headingButton) return;
    
    // Update current selection before showing
    const currentTag = this.getCurrentTag();
    if (currentTag) {
      this.customSelect.setCurrentValue(currentTag);
    }
    
    await this.customSelect.show(headingButton);
  }

  /**
   * Check if heading format is active - always return false (no active state)
   * Only update button text to show current tag
   * @param {string} tag - Optional specific tag to check
   * @returns {boolean}
   */
  isActive(tag = null) {
    // Always update button text to show current tag
    this.updateButtonText();
    
    // Never show active state for heading button
    return false;
  }

  /**
   * Get current tag of the selection
   * @returns {string|null} Current tag name or null
   */
  getCurrentTag() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;

    const range = selection.getRangeAt(0);
    const block = this.getBlockElement(range.startContainer);
    
    if (!block) return null;

    const headingTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'PRE', 'BLOCKQUOTE'];
    if (headingTags.includes(block.tagName)) {
      return block.tagName;
    }

    return null;
  }
}

export default Heading; 