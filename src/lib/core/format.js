/**
 * Base Format class - Inspired by Quill's architecture
 * All text formats should extend this class
 */
export class Format {
  static formatName = '';
  static tagName = '';
  static className = '';

  constructor(domNode) {
    this.domNode = domNode;
  }

  /**
   * Create a new format node
   * @param {*} value - Format value
   * @returns {HTMLElement}
   */
  static create(value) {
    const node = document.createElement(this.tagName);
    if (this.className) {
      node.className = this.className;
    }
    return node;
  }

  getOffsetWithin(container, range) {
    let offset = 0;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    let currentNode;

    while ((currentNode = walker.nextNode())) {
      if (currentNode === range.startContainer) {
        return offset + range.startOffset;
      }
      offset += currentNode.textContent.length;
    }

    return offset;
  }

  /**
   * Check if format is active at current selection
   * @returns {boolean}
   */
} 

/**
 * Inline Format - for formats like bold, italic, underline
 * Handles inline formatting that wraps text within the same line/block
 */
export class InlineFormat extends Format {
  /**
   * Create inline format element
   * @param {*} value - Format value
   * @returns {HTMLElement}
   */
  static create(value) {
    const node = super.create(value);
    return node;
  }

  /**
   * Apply inline format to selection
   * Wraps selected text or inserts format marker at cursor
   * @param {*} value - Format value
   */
  apply(value) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);    
    if (range.collapsed) {
      // No selection - insert format marker at cursor
      const formatNode = this.constructor.create(value);
      formatNode.appendChild(document.createTextNode('\u200B')); // Zero-width space
      range.insertNode(formatNode);
      
      // Position cursor inside the format node
      const newRange = document.createRange();
      newRange.setStart(formatNode.firstChild, 1);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      // Has selection - wrap selected content
      const contents = range.extractContents();
      const formatNode = this.constructor.create(value);
      formatNode.appendChild(contents);
      range.insertNode(formatNode);
      
      // Select the formatted content
      const newRange = document.createRange();
      newRange.selectNodeContents(formatNode);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  }

  /**
   * Remove inline format from selection
   * Unwraps formatted content or removes format at cursor
   */
  remove() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    
    if (range.collapsed) {
      // Handle cursor position
      this.removeAtCursor(range, selection);
    } else {
      // Handle selection
      this.removeFromSelection(range, selection);
    }
  }

  /**
   * Remove format at cursor position
   * @param {Range} range - Current range
   * @param {Selection} selection - Current selection
   */
  removeAtCursor(range, selection) {
    const container = range.startContainer;
    const formatNode = this.findFormatNode(container);
    
    if (!formatNode || !formatNode.parentNode) return;

    const text = formatNode.textContent;
    const absoluteOffset = this.getOffsetWithin(formatNode, range);

    // Split the format node at cursor position
    const beforeText = text.slice(0, absoluteOffset);
    const afterText = text.slice(absoluteOffset);
    
    const fragment = document.createDocumentFragment();
    
    if (beforeText) {
      const beforeNode = formatNode.cloneNode(false);
      beforeNode.textContent = beforeText;
      fragment.appendChild(beforeNode);
    }
    
    // Insert zero-width space as marker
    const zwspNode = document.createTextNode('\u200B');
    fragment.appendChild(zwspNode);
    
    if (afterText) {
      const afterNode = formatNode.cloneNode(false);
      afterNode.textContent = afterText;
      fragment.appendChild(afterNode);
    }

    formatNode.replaceWith(fragment);

    // Position cursor after the marker
    const newRange = document.createRange();
    newRange.setStartAfter(zwspNode);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }

  /**
 * Remove format from selection
 */
  removeFromSelection(range, selection) {
    const formatName = this.constructor.formatName;
    document.execCommand(formatName);
    if(formatName === 'strike'){
      document.execCommand("strikeThrough");
    }
  }



  /**
   * Find the format node containing the given node
   * @param {Node} node - DOM node
   * @returns {Element|null} Format node
   */
  findFormatNode(node) {
    while (node && node !== document.body) {
      if (node.nodeType === Node.ELEMENT_NODE && 
          node.tagName === this.constructor.tagName) {
        return node;
      }
      node = node.parentNode;
    }
    return null;
  }

  /**
   * Find all format nodes within a range
   * @param {Range} range - Selection range
   * @returns {Element[]} Array of format nodes
   */
  findFormatNodesInRange(range) {
    const nodes = [];
    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          if (node.tagName === this.constructor.tagName && 
              range.intersectsNode(node)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      nodes.push(node);
    }

    return nodes;
  }

  /**
   * Check if inline format is active at current selection
   * @returns {boolean}
   */
  isActive() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return false;

    const range = selection.getRangeAt(0);
    let node = range.startContainer;

    const tagName = this.constructor.tagName;
    const altTags = this.constructor.alternativeTagNames || [];
    const formatName = this.constructor.formatName;

    // Đặc biệt với một số lệnh hỗ trợ execCommand
    const commandSupported = ['bold', 'italic', 'underline'];
    if (commandSupported.includes(formatName?.toLowerCase())) {
      try {
        return document.queryCommandState(formatName);
      } catch (e) {
        // fallback nếu execCommand không được hỗ trợ
      }
    }

    // Kiểm tra DOM tag
    while (node && node !== document.body) {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        (node.tagName === tagName ||
        altTags.includes(node.tagName))
      ) {
        return true;
      }
      node = node.parentNode;
    }

    return false;
  }

}

/**
 * Block Format - for formats like headers, paragraphs, alignment
 * Handles block-level formatting that affects entire blocks/paragraphs
 */
export class BlockFormat extends Format {
  /**
   * Create block format element
   * @param {*} value - Format value
   * @returns {HTMLElement}
   */
  static create(value) {
    const node = super.create(value);
    return node;
  }

  /**
   * Apply block format to selection
   * Converts current block(s) or creates new block
   * @param {*} value - Format value
   */
  apply(value) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const blocks = this.getBlockElements(range);

    if (blocks.length === 0) {
      // No block found - create new one
      this.createBlockAtCursor(range, value);
    } else {
      // Convert existing blocks
      blocks.forEach(block => {
        this.convertBlock(block, value);
      });
    }
  }

  /**
   * Remove block format from selection
   * Converts blocks back to default (paragraph) or removes formatting
   */
  remove() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const blocks = this.getBlockElements(range);

    blocks.forEach(block => {
      this.removeBlockFormat(block);
    });
  }

  /**
   * Create new block at cursor position
   * @param {Range} range - Current range
   * @param {*} value - Format value
   */
  createBlockAtCursor(range, value) {
    const blockNode = this.constructor.create(value);
    
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
   * @param {*} value - Format value
   */
  convertBlock(block, value) {
    const newBlock = this.constructor.create(value);
    
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
  }

  /**
   * Remove block format (convert to paragraph)
   * @param {Element} block - Block element
   */
  removeBlockFormat(block) {
    const paragraph = document.createElement('P');
    
    // Move all child nodes to paragraph
    while (block.firstChild) {
      paragraph.appendChild(block.firstChild);
    }
    
    // Copy style attributes to preserve formatting like text-align
    if (block.style && block.style.cssText) {
      paragraph.style.cssText = block.style.cssText;
    }
    
    // Replace the block
    block.parentNode.replaceChild(paragraph, block);
  }

  /**
   * Get block elements in range
   * @param {Range} range - Selection range
   * @returns {Element[]} Array of block elements
   */
  getBlockElements(range) {
    const blocks = [];
    let startBlock = this.getBlockElement(range.startContainer);
    let endBlock = this.getBlockElement(range.endContainer);

    // Nếu endBlock ngay sau startBlock và selection kết thúc ở vị trí 0 của endBlock
    if (startBlock && endBlock && startBlock.nextElementSibling === endBlock) {
        const endAtStartOfEndBlock =
            range.endContainer === endBlock &&
            range.endOffset === 0;
        if (endAtStartOfEndBlock) {
            endBlock = startBlock;
        }
    }

    if (startBlock === endBlock) {
        if (startBlock) blocks.push(startBlock);
    } else {
        // Multiple blocks
        let current = startBlock;
        while (current && current !== endBlock) {
            if (this.isBlockElement(current)) {
                blocks.push(current);
            }
            current = this.getNextBlockElement(current);
        }
        if (endBlock && this.isBlockElement(endBlock)) {
            blocks.push(endBlock);
        }
    }

    return blocks.filter((block, index, self) =>
        self.indexOf(block) === index
    );
  }

  /**
   * Get block element containing node
   * @param {Node} node - DOM node
   * @returns {Element|null} Block element
   */
  getBlockElement(node) {
    while (node && node.nodeType !== Node.ELEMENT_NODE) {
      node = node.parentNode;
    }

    while (node && node !== document.body) {
      if (this.isBlockElement(node)) {
        return node;
      }
      node = node.parentNode;
    }

    return null;
  }

  /**
   * Check if element is a block element
   * @param {Element} element - DOM element
   * @returns {boolean}
   */
  isBlockElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
    
    const blockTags = [
      'P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 
      'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'LI', 'SECTION', 'ARTICLE'
    ];
    return blockTags.includes(element.tagName.toUpperCase());
  }

  /**
   * Get next block element
   * @param {Element} element - Current element
   * @returns {Element|null} Next block element
   */
  getNextBlockElement(element) {
    let next = element.nextElementSibling;
    while (next) {
      if (this.isBlockElement(next)) {
        return next;
      }
      next = next.nextElementSibling;
    }
    return null;
  }

  /**
   * Check if block format is active at current selection
   * @param {*} value - Optional specific value to check
   * @returns {boolean}
   */
  isActive(value = null) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return false;

    const range = selection.getRangeAt(0);
    const block = this.getBlockElement(range.startContainer);
    
    if (!block) return false;

    // Check if block matches our format
    if (block.tagName === this.constructor.tagName) {
      return value ? this.hasValue(block, value) : true;
    }

    return false;
  }

  /**
   * Check if block has specific value
   * Override in subclasses for specific value checking
   * @param {Element} block - Block element
   * @param {*} value - Value to check
   * @returns {boolean}
   */
  hasValue(block, value) {
    return true; // Default implementation
  }

  /**
   * Check if class should be preserved during conversion
   * Override in subclasses for specific class handling
   * @param {string} className - Class name
   * @returns {boolean}
   */
  shouldPreserveClass(className) {
    return false; // Default: don't preserve classes
  }
} 