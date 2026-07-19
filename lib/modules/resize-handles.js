import Module from '../core/module.js';
import IconUtils, { registerIcons, S } from '../ui/icons.js';

registerIcons({
  'align-left': S('<line x1="21" x2="3" y1="6" y2="6"/><line x1="15" x2="3" y1="12" y2="12"/><line x1="17" x2="3" y1="18" y2="18"/>'),
  'align-center': S('<line x1="21" x2="3" y1="6" y2="6"/><line x1="17" x2="7" y1="12" y2="12"/><line x1="19" x2="5" y1="18" y2="18"/>'),
  'align-right': S('<line x1="21" x2="3" y1="6" y2="6"/><line x1="21" x2="9" y1="12" y2="12"/><line x1="21" x2="7" y1="18" y2="18"/>')
});

/**
 * Resize Handles Module - Adds resize functionality to images, videos, and tables
 * Creates 4 corner handles for dragging to resize elements
 */
class ResizeHandles extends Module {
  static DEFAULTS = {
    minWidth: 50,
    minHeight: 50,
    maxWidth: 800,
    maxHeight: 600,
    maintainAspectRatio: true, // For images and videos
    snapToGrid: false,
    gridSize: 10
  };

  constructor(editor, options = {}) {
    super(editor, options);
    this.activeElement = null;
    this.handles = [];
    this.isResizing = false;
    this.startX = 0;
    this.startY = 0;
    this.startWidth = 0;
    this.startHeight = 0;
    this.currentHandle = null;
    this.aspectRatio = 1;
    
    this.init();
  }

  init() {
    this.createHandles();
    this.setupEventListeners();
  }

  /**
   * Create resize handles container
   */
  createHandles() {
    this.handlesContainer = document.createElement('div');
    this.handlesContainer.className = 'resize-handles-container';
    this.handlesContainer.style.position = 'absolute';
    this.handlesContainer.style.pointerEvents = 'none';
    this.handlesContainer.style.zIndex = '997'; // Lower than all toolbar elements
    this.handlesContainer.style.display = 'none';

    // Create 4 corner handles
    const handlePositions = [
      { name: 'nw', cursor: 'nw-resize', position: { top: -4, left: -4 } },
      { name: 'ne', cursor: 'ne-resize', position: { top: -4, right: -4 } },
      { name: 'sw', cursor: 'sw-resize', position: { bottom: -4, left: -4 } },
      { name: 'se', cursor: 'se-resize', position: { bottom: -4, right: -4 } }
    ];

    handlePositions.forEach(config => {
      const handle = this.createHandle(config);
      this.handles.push(handle);
      this.handlesContainer.appendChild(handle);
    });

    // Add to editor wrapper but ensure it's behind toolbars
    this.editor.wrapper.appendChild(this.handlesContainer);
    this.createAlignBar();
  }

  /**
   * Small align bar shown above a selected image (left / center / right).
   */
  createAlignBar() {
    const bar = document.createElement('div');
    bar.className = 'yjd-image-align-bar';
    bar.style.display = 'none';
    [
      { align: 'left', icon: 'align-left', title: 'Align left' },
      { align: 'center', icon: 'align-center', title: 'Align center' },
      { align: 'right', icon: 'align-right', title: 'Align right' }
    ].forEach(({ align, icon, title }) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'yjd-image-align-btn';
      b.dataset.align = align;
      b.title = title;
      b.setAttribute('aria-label', title);
      b.innerHTML = `<span class="icon">${IconUtils.getIcon(icon)}</span>`;
      // pointerdown+preventDefault so the click doesn't blur/clear the selection.
      b.addEventListener('pointerdown', (e) => e.preventDefault());
      b.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.applyImageAlign(align);
      });
      bar.appendChild(b);
    });
    this.alignBar = bar;
    this.handlesContainer.appendChild(bar);
  }

  /**
   * Keep the align bar inside the editor's visible band (between the toolbar and
   * the status bar) so it's never hidden under either. Preference: just above the
   * image, else just below it, else clamped into the visible band (over the image).
   */
  positionAlignBar() {
    if (!this.alignBar || this.alignBar.style.display === 'none' || !this.activeElement) return;
    const imgR = this.activeElement.getBoundingClientRect();
    const wrap = this.editor.wrapper;
    const area = this.editor.editor.getBoundingClientRect();
    const toolbar = wrap.querySelector('.rich-editor-toolbar-container');
    const statusbar = wrap.querySelector('.rich-editor-statusbar');
    const topBound = toolbar ? toolbar.getBoundingClientRect().bottom : area.top;
    const botBound = statusbar ? statusbar.getBoundingClientRect().top : area.bottom;
    const barH = this.alignBar.offsetHeight || 40;
    const gap = 6;
    let vTop = imgR.top - barH - gap;                 // prefer above the image
    if (vTop < topBound + gap) vTop = imgR.bottom + gap; // no room above → below
    // Never let it slip under the toolbar (top) or status bar (bottom).
    vTop = Math.max(topBound + gap, Math.min(vTop, botBound - barH - gap));
    this.alignBar.classList.remove('below'); // positioned via inline top now
    this.alignBar.style.top = (vTop - imgR.top) + 'px'; // offset from image top
  }

  /** Reflect the active image's alignment on the align-bar buttons. */
  updateAlignBar() {
    if (!this.alignBar || !this.activeElement) return;
    const el = this.activeElement;
    let current = 'left';
    if (el.style.float === 'right') current = 'right';
    else if (el.style.float === 'left') current = 'left';
    else if (el.style.display === 'block' && /auto/.test(el.style.marginLeft + el.style.marginRight)) current = 'center';
    this.alignBar.querySelectorAll('.yjd-image-align-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.align === current);
    });
  }

  /** Apply an alignment (left/center/right) to the active image. */
  applyImageAlign(align) {
    const el = this.activeElement;
    if (!el) return;
    const h = this.editor.getModule('history');
    if (h && typeof h.saveBeforeFormat === 'function') h.saveBeforeFormat();
    // Reset first
    el.style.float = '';
    el.style.display = '';
    el.style.margin = '';
    if (align === 'left') {
      el.style.float = 'left';
      el.style.margin = '4px 16px 8px 0';
    } else if (align === 'right') {
      el.style.float = 'right';
      el.style.margin = '4px 0 8px 16px';
    } else if (align === 'center') {
      el.style.display = 'block';
      el.style.margin = '8px auto';
    }
    this.updateAlignBar();
    this.updateHandlePosition();
    if (typeof this.editor.onContentChange === 'function') this.editor.onContentChange();
  }

  /**
   * Create individual resize handle
   */
  createHandle(config) {
    const handle = document.createElement('div');
    handle.className = `resize-handle resize-handle-${config.name}`;
    handle.style.position = 'absolute';
    handle.style.width = '8px';
    handle.style.height = '8px';
    handle.style.backgroundColor = '#3b82f6';
    handle.style.border = '1px solid #fff';
    handle.style.borderRadius = '50%';
    handle.style.cursor = config.cursor;
    handle.style.pointerEvents = 'auto';
    handle.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    handle.style.zIndex = '999'; // Lower than toolbars
    handle.dataset.handle = config.name;

    // Position handle
    Object.entries(config.position).forEach(([key, value]) => {
      handle.style[key] = value + 'px';
    });

    // Add event listeners
    handle.addEventListener('mousedown', (e) => this.handleMouseDown(e, config.name));
    
    return handle;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Keep references so listeners can be removed in destroy() (the document/
    // window handlers would otherwise leak across editor create/destroy cycles).
    this._onEditorClick = (e) => this.handleElementClick(e);
    this._onDocClick = (e) => {
      if (!this.isClickOnResizableElement(e) && !this.isClickOnHandle(e)) {
        this.hideHandles();
      }
    };
    this._onDocMousemove = (e) => this.handleMouseMove(e);
    this._onDocMouseup = (e) => this.handleMouseUp(e);
    this._onWindowScroll = () => {
      if (this.activeElement) this.updateHandlePosition();
    };
    this._onEditorScroll = () => {
      if (this.activeElement) this.updateHandlePosition();
    };

    this.editor.editor.addEventListener('click', this._onEditorClick);
    document.addEventListener('click', this._onDocClick);
    document.addEventListener('mousemove', this._onDocMousemove);
    document.addEventListener('mouseup', this._onDocMouseup);
    window.addEventListener('scroll', this._onWindowScroll);
    this.editor.editor.addEventListener('scroll', this._onEditorScroll);

    // Listen for DOM changes to update handles
    this.setupMutationObserver();
  }

  /**
   * Handle click on resizable elements
   */
  handleElementClick(e) {
    const target = e.target;
    
    // Debug logging
   
    
    // Find the actual resizable element
    let resizableElement = this.findResizableElement(target);
    
    if (resizableElement) {
      e.preventDefault();
      e.stopPropagation();
      this.showHandles(resizableElement);
    }
  }

  /**
   * Find the actual resizable element from a clicked target
   */
  findResizableElement(target) {
    // If target is already resizable, return it
    if (this.isResizableElement(target)) {
      return target;
    }
    
    // If target is inside a table (td, th, tr, tbody), find the table
    if (target.tagName === 'TD' || target.tagName === 'TH' || 
        target.tagName === 'TR' || target.tagName === 'TBODY') {
      let parent = target.parentElement;
      while (parent && parent.tagName !== 'TABLE') {
        parent = parent.parentElement;
      }
      if (parent && this.isResizableElement(parent)) {
        return parent;
      }
    }
    
    // Check if any parent is resizable
    let parent = target.parentElement;
    while (parent && parent !== this.editor.wrapper) {
      if (this.isResizableElement(parent)) {
        return parent;
      }
      parent = parent.parentElement;
    }
    
    return null;
  }

  /**
   * Check if element is resizable
   */
  isResizableElement(element) {
    // Debug logging

    
    const isImage = element.classList.contains('inserted-image');
    const isVideo = element.classList.contains('inserted-video');
    const isTable = element.classList.contains('rich-editor-table');
    

    
    return isImage || isVideo || isTable;
  }

  /**
   * Check if click is on resizable element
   */
  isClickOnResizableElement(e) {
    return this.isResizableElement(e.target);
  }

  /**
   * Check if click is on resize handle
   */
  isClickOnHandle(e) {
    return e.target.classList.contains('resize-handle');
  }

  /**
   * Show resize handles for element
   */
  showHandles(element) {
    
    
    this.activeElement = element;
    this.updateHandlePosition();
    this.handlesContainer.style.display = 'block';

    // Align bar only for images.
    if (this.alignBar) {
      const isImg = element.classList.contains('inserted-image');
      this.alignBar.style.display = isImg ? 'flex' : 'none';
      if (isImg) { this.updateAlignBar(); this.positionAlignBar(); }
    }

    // Store aspect ratio for images and videos
    if (element.classList.contains('inserted-image') || element.classList.contains('inserted-video')) {
      this.aspectRatio = element.offsetWidth / element.offsetHeight;
    }
    
    // For tables, ensure they have proper positioning and setup size monitoring
    if (element.classList.contains('rich-editor-table')) {
      element.style.position = 'relative';
      element.style.display = 'table';
      
      // Store initial dimensions for comparison
      this.lastTableWidth = element.offsetWidth;
      this.lastTableHeight = element.offsetHeight;
      
      // Setup periodic size checking for tables
      this.setupTableSizeMonitoring(element);
    }
    

  }

  /**
   * Hide resize handles
   */
  hideHandles() {
    // Clear table size monitoring
    if (this.tableSizeInterval) {
      clearInterval(this.tableSizeInterval);
      this.tableSizeInterval = null;
    }
    
    this.activeElement = null;
    this.handlesContainer.style.display = 'none';
    if (this.alignBar) this.alignBar.style.display = 'none';
  }

  /**
   * Update handle position based on active element
   */
  updateHandlePosition() {
    if (!this.activeElement) return;

    // Check if element still exists in DOM
    if (!document.body.contains(this.activeElement)) {
      this.hideHandles();
      return;
    }

    const elementRect = this.activeElement.getBoundingClientRect();
    const editorRect = this.editor.wrapper.getBoundingClientRect();
    const scrollTop = this.editor.wrapper.scrollTop || 0;
    const scrollLeft = this.editor.wrapper.scrollLeft || 0;

    // Position handles container
    const top = elementRect.top - editorRect.top + scrollTop;
    const left = elementRect.left - editorRect.left + scrollLeft;
    const width = elementRect.width;
    const height = elementRect.height;
    const bottom = top + height;
    this.handlesContainer.style.top = top + 'px';
    this.handlesContainer.style.left = left + 'px';
    this.handlesContainer.style.width = width + 'px';
    this.handlesContainer.style.height = height + 'px';
    this.positionAlignBar();
 
    if(bottom < 0){
      this.hideHandles();
      return;
    }
    if(top > editorRect.height){
      this.hideHandles();
      return;
    }
  }

  /**
   * Handle mouse down on resize handle
   */
  handleMouseDown(e, handleName) {
    e.preventDefault();
    e.stopPropagation();

    this.isResizing = true;
    this.currentHandle = handleName;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.startWidth = this.activeElement.offsetWidth;
    this.startHeight = this.activeElement.offsetHeight;
    // Snapshot the editor's content-box height so the height cap is stable while
    // the (auto-height) editor reflows during the drag.
    this._startAreaClientH = this.editor && this.editor.editor ? this.editor.editor.clientHeight : 0;

    // Store initial position
    const elementRect = this.activeElement.getBoundingClientRect();
    this.startLeft = elementRect.left;
    this.startTop = elementRect.top;

    // Add resizing class for styling
    this.activeElement.classList.add('resizing');
    document.body.style.cursor = e.target.style.cursor;
    document.body.style.userSelect = 'none';
  }

  /**
   * Handle mouse move during resize
   */
  handleMouseMove(e) {
    if (!this.isResizing || !this.activeElement) return;

    // Coalesce rapid mousemove events into one layout pass per animation frame —
    // the resize math below calls getComputedStyle + getBoundingClientRect, which
    // are layout-heavy to run on every one of the ~60+ events/sec a drag emits.
    this._pendingMove = { clientX: e.clientX, clientY: e.clientY };
    if (this._moveRaf) return;
    this._moveRaf = requestAnimationFrame(() => {
      this._moveRaf = null;
      if (this._pendingMove) this._applyMouseMove(this._pendingMove);
    });
  }

  /**
   * Apply a resize for the latest pointer position (throttled by handleMouseMove).
   */
  _applyMouseMove(e) {
    if (!this.isResizing || !this.activeElement) return;

    const deltaX = e.clientX - this.startX;
    const deltaY = e.clientY - this.startY;

    let newWidth = this.startWidth;
    let newHeight = this.startHeight;

    // Calculate new dimensions based on handle position
    switch (this.currentHandle) {
      case 'nw':
        newWidth = this.startWidth - deltaX;
        newHeight = this.startHeight - deltaY;
        break;
      case 'ne':
        newWidth = this.startWidth + deltaX;
        newHeight = this.startHeight - deltaY;
        break;
      case 'sw':
        newWidth = this.startWidth - deltaX;
        newHeight = this.startHeight + deltaY;
        break;
      case 'se':
        newWidth = this.startWidth + deltaX;
        newHeight = this.startHeight + deltaY;
        break;
    }

    // Never let an element grow past the editor's content box (inner width/height
    // minus padding) — otherwise tables/images overflow, and a tall image keeps
    // pushing the auto-height editor taller. Height uses the box captured at
    // resize start so growth isn't self-reinforcing as the editor reflows.
    let maxW = this.options.maxWidth;
    let maxH = this.options.maxHeight;
    const area = this.editor && this.editor.editor;
    if (area) {
      const cs = getComputedStyle(area);
      const availW = area.clientWidth
        - (parseFloat(cs.paddingLeft) || 0)
        - (parseFloat(cs.paddingRight) || 0);
      if (availW > 0) maxW = Math.min(maxW, availW);
      const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
      const availH = (this._startAreaClientH || area.clientHeight) - padY;
      if (availH > 0) maxH = Math.min(maxH, availH);
    }

    // Apply constraints
    newWidth = Math.max(this.options.minWidth, Math.min(maxW, newWidth));
    newHeight = Math.max(this.options.minHeight, Math.min(maxH, newHeight));

    // Maintain aspect ratio for images and videos
    if ((this.activeElement.classList.contains('inserted-image') ||
         this.activeElement.classList.contains('inserted-video')) &&
        this.options.maintainAspectRatio) {

      const ratioByWidth = newWidth / this.aspectRatio;
      const ratioByHeight = newHeight * this.aspectRatio;

      if (Math.abs(newWidth - ratioByHeight) < Math.abs(newHeight - ratioByWidth)) {
        newWidth = ratioByHeight;
      } else {
        newHeight = ratioByWidth;
      }
      // Aspect-ratio math can push width back over the limit — re-clamp.
      if (newWidth > maxW) {
        newWidth = maxW;
        newHeight = newWidth / this.aspectRatio;
      }
      // ...and can push height over the limit — re-clamp (width follows).
      if (newHeight > maxH) {
        newHeight = maxH;
        newWidth = newHeight * this.aspectRatio;
      }
    }

    // Snap to grid if enabled
    if (this.options.snapToGrid) {
      newWidth = Math.round(newWidth / this.options.gridSize) * this.options.gridSize;
      newHeight = Math.round(newHeight / this.options.gridSize) * this.options.gridSize;
    }

    // Apply new dimensions
    this.applyDimensions(newWidth, newHeight);
    this.updateHandlePosition();

    // Notify the editor so onChange fires and a live preview / autosave / word
    // count reflects the resize as it happens (this loop is already rAF-throttled).
    if (typeof this.editor.onContentChange === 'function') this.editor.onContentChange();

    // Emit resize event
    this.emit('element-resize', {
      element: this.activeElement,
      width: newWidth,
      height: newHeight,
      handle: this.currentHandle
    });
  }

  /**
   * Handle mouse up - end resize
   */
  handleMouseUp(e) {
    if (!this.isResizing) return;

    this.isResizing = false;
    this.currentHandle = null;

    // Flush/cancel any frame queued by handleMouseMove so we don't apply a stale
    // resize after the drag ends.
    if (this._moveRaf) {
      cancelAnimationFrame(this._moveRaf);
      this._moveRaf = null;
    }
    this._pendingMove = null;

    // Remove resizing class
    if (this.activeElement) {
      this.activeElement.classList.remove('resizing');
    }
    
    // Reset cursor
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    // Final change notification so the committed size reaches onChange/autosave.
    if (this.activeElement && typeof this.editor.onContentChange === 'function') {
      this.editor.onContentChange();
    }

    // Emit resize complete event
    this.emit('element-resize-complete', {
      element: this.activeElement,
      width: this.activeElement.offsetWidth,
      height: this.activeElement.offsetHeight
    });
  }

  /**
   * Apply dimensions to element
   */
  applyDimensions(width, height) {
    if (!this.activeElement) return;

    if (this.activeElement.classList.contains('rich-editor-table')) {
      // For tables, set both width and height
      this.activeElement.style.width = width + 'px';
      this.activeElement.style.minWidth = width + 'px';
      this.activeElement.style.height = height + 'px';
      this.activeElement.style.minHeight = height + 'px';
      
      // Calculate cell dimensions
      const rows = this.activeElement.querySelectorAll('tr');
      const cols = rows.length > 0 ? rows[0].querySelectorAll('td, th').length : 0;
      
      if (rows.length > 0 && cols > 0) {
        const cellWidth = Math.floor(width / cols);
        const cellHeight = Math.floor(height / rows.length);
        
        // Apply dimensions to all cells
        const cells = this.activeElement.querySelectorAll('td, th');
        cells.forEach(cell => {
          cell.style.minWidth = cellWidth + 'px';
          cell.style.minHeight = cellHeight + 'px';
          cell.style.height = cellHeight + 'px';
        });
      }
    } else {
      // For images and videos (including iframes)
      this.activeElement.style.width = width + 'px';
      this.activeElement.style.height = height + 'px';
      
      // If it's an iframe, update its attributes too
      if (this.activeElement.tagName === 'IFRAME') {
        this.activeElement.width = width;
        this.activeElement.height = height;
      }
    }
  }

  /**
   * Get current active element
   */
  getActiveElement() {
    return this.activeElement;
  }

  /**
   * Set active element programmatically
   */
  setActiveElement(element) {
    if (this.isResizableElement(element)) {
      this.showHandles(element);
    }
  }

  /**
   * Check and update handles if active element has changed
   */
  checkAndUpdateHandles() {
    if (this.activeElement) {
      // Check if element still exists and is still resizable
      if (!document.body.contains(this.activeElement) || !this.isResizableElement(this.activeElement)) {
        this.hideHandles();
        return;
      }
      
      // Update position if element still exists
      this.updateHandlePosition();
      
      // For tables, also check if size has changed due to content
      if (this.activeElement.classList.contains('rich-editor-table')) {
        this.checkTableSizeChange();
      }
    }
  }

  /**
   * Force refresh handles for current active element
   */
  refreshHandles() {
    if (this.activeElement && document.body.contains(this.activeElement)) {
      this.updateHandlePosition();
    }
  }

  /**
   * Setup periodic monitoring for table size changes
   */
  setupTableSizeMonitoring(tableElement) {
    // Clear any existing interval
    if (this.tableSizeInterval) {
      clearInterval(this.tableSizeInterval);
    }
    
    // Check table size every 100ms
    this.tableSizeInterval = setInterval(() => {
      if (this.activeElement && this.activeElement.classList.contains('rich-editor-table')) {
        this.checkTableSizeChange();
      } else {
        // Clear interval if no longer monitoring a table
        clearInterval(this.tableSizeInterval);
        this.tableSizeInterval = null;
      }
    }, 100);
  }

  /**
   * Check if table size has changed and update handles accordingly
   */
  checkTableSizeChange() {
    if (!this.activeElement || !this.activeElement.classList.contains('rich-editor-table')) {
      return;
    }
    
    const currentWidth = this.activeElement.offsetWidth;
    const currentHeight = this.activeElement.offsetHeight;
    
    // Check if dimensions have changed significantly (more than 1px to avoid floating point issues)
    if (Math.abs(currentWidth - this.lastTableWidth) > 1 || 
        Math.abs(currentHeight - this.lastTableHeight) > 1) {
      
      // Update stored dimensions
      this.lastTableWidth = currentWidth;
      this.lastTableHeight = currentHeight;
      
      // Update handle positions
      this.updateHandlePosition();
      
      // Emit size change event
      this.emit('table-size-changed', {
        element: this.activeElement,
        width: currentWidth,
        height: currentHeight,
        previousWidth: this.lastTableWidth,
        previousHeight: this.lastTableHeight
      });
    }
  }

  /**
   * Setup mutation observer to watch for DOM changes
   */
  setupMutationObserver() {
    if (typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        
        mutations.forEach((mutation) => {
          // Check if active element was removed or modified
          if (this.activeElement) {
            if (mutation.type === 'childList') {
              // Check if active element was removed
              if (mutation.removedNodes) {
                for (let node of mutation.removedNodes) {
                  if (node === this.activeElement || node.contains(this.activeElement)) {
                    shouldUpdate = true;
                    break;
                  }
                }
              }
              
              // Check if active element was modified
              if (mutation.target === this.activeElement || 
                  (mutation.target.nodeType === Node.ELEMENT_NODE && 
                   this.activeElement.contains(mutation.target))) {
                shouldUpdate = true;
              }
            }
            
            // Check for text content changes that might affect table size
            if (mutation.type === 'characterData' && this.activeElement.classList.contains('rich-editor-table')) {
              // Check if the text change is within the active table
              let target = mutation.target;
              while (target && target !== this.activeElement) {
                target = target.parentNode;
              }
              if (target === this.activeElement) {
                shouldUpdate = true;
              }
            }
            
            // Check for attribute changes that might affect size
            if (mutation.type === 'attributes' && this.activeElement.classList.contains('rich-editor-table')) {
              const attributeName = mutation.attributeName;
              // Monitor changes to style attributes that affect size
              if (attributeName === 'style' || attributeName === 'class') {
                shouldUpdate = true;
              }
            }
          }
        });
        
        if (shouldUpdate) {
          // Use setTimeout to ensure DOM is fully updated
          setTimeout(() => {
            this.checkAndUpdateHandles();
          }, 0);
        }
      });
      
      // Start observing the editor content with more comprehensive monitoring
      this.mutationObserver.observe(this.editor.editor, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
        characterData: true, // Monitor text content changes
        characterDataOldValue: true
      });
    }
  }

  /**
   * Enable/disable aspect ratio maintenance
   */
  setMaintainAspectRatio(maintain) {
    this.options.maintainAspectRatio = maintain;
  }

  /**
   * Set resize constraints
   */
  setConstraints(minWidth, minHeight, maxWidth, maxHeight) {
    this.options.minWidth = minWidth || this.options.minWidth;
    this.options.minHeight = minHeight || this.options.minHeight;
    this.options.maxWidth = maxWidth || this.options.maxWidth;
    this.options.maxHeight = maxHeight || this.options.maxHeight;
  }

  /**
   * Destroy module
   */
  destroy() {
    this.hideHandles();

    // Cancel any queued resize frame.
    if (this._moveRaf) {
      cancelAnimationFrame(this._moveRaf);
      this._moveRaf = null;
    }

    // Remove global event listeners
    if (this._onDocClick) {
      this.editor.editor.removeEventListener('click', this._onEditorClick);
      document.removeEventListener('click', this._onDocClick);
      document.removeEventListener('mousemove', this._onDocMousemove);
      document.removeEventListener('mouseup', this._onDocMouseup);
      window.removeEventListener('scroll', this._onWindowScroll);
      this.editor.editor.removeEventListener('scroll', this._onEditorScroll);
      this._onEditorClick = this._onDocClick = this._onDocMousemove = null;
      this._onDocMouseup = this._onWindowScroll = this._onEditorScroll = null;
    }

    if (this.handlesContainer) {
      this.handlesContainer.remove();
    }

    // Clear table size monitoring
    if (this.tableSizeInterval) {
      clearInterval(this.tableSizeInterval);
      this.tableSizeInterval = null;
    }
    
    // Disconnect mutation observer
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    
    super.destroy();
  }
}

export default ResizeHandles; 