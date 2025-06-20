/**
 * Tooltip Component - Provides tooltip functionality
 * Extracted from ToolbarManager.js tooltip logic
 */
class Tooltip {
  constructor(options = {}) {
    this.options = {
      placement: 'top',
      offset: 10,
      delay: 500,
      hideDelay: 100,
      ...options
    };
    
    this.tooltip = null;
    this.targetElement = null;
    this.showTimer = null;
    this.hideTimer = null;
    
    this.init();
  }

  /**
   * Initialize tooltip
   */
  init() {
    this.createTooltip();
  }

  /**
   * Create tooltip element
   */
  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'rich-editor-tooltip';

    // Create arrow
    this.arrow = document.createElement('div');
    this.arrow.className = 'rich-editor-tooltip-arrow';
    
    this.tooltip.appendChild(this.arrow);
    document.body.appendChild(this.tooltip);
  }

  /**
   * Attach tooltip to element
   */
  attach(element, content, options = {}) {
    if (!element) return;

    const config = { ...this.options, ...options };
    
    element.addEventListener('mouseenter', () => {
      this.show(element, content, config);
    });

    element.addEventListener('mouseleave', () => {
      this.hide();
    });

    // Store tooltip config on element
    element._tooltipConfig = { content, ...config };
  }

  /**
   * Show tooltip
   */
  show(element, content, config = {}) {
    if (!element || !content) return;
    
    this.targetElement = element;
    
    // Clear any existing timers
    this.clearTimers();
    
    this.showTimer = setTimeout(() => {
      this.tooltip.innerHTML = '';
      this.tooltip.appendChild(this.arrow);
      
      // Set content
      const contentEl = document.createElement('span');
      contentEl.textContent = content;
      this.tooltip.appendChild(contentEl);
      
      // Position tooltip
      this.position(element, config.placement || this.options.placement, config.offset || this.options.offset);
      
      // Show tooltip
      this.tooltip.classList.add('visible');
    }, config.delay || this.options.delay);
  }

  /**
   * Hide tooltip
   */
  hide() {
    this.clearTimers();
    
    this.hideTimer = setTimeout(() => {
      if (this.tooltip) {
        this.tooltip.classList.remove('visible');
      }
      this.targetElement = null;
    }, this.options.hideDelay);
  }

  /**
   * Position tooltip relative to element
   */
  position(element, placement = 'top', offset = 10) {
    if (!element || !this.tooltip) return;

    const rect = element.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();
    
    let top, left;
    
    // Calculate position based on placement
    switch (placement) {
      case 'top':
        top = rect.top - tooltipRect.height - offset + window.scrollY;
        left = rect.left + (rect.width - tooltipRect.width) / 2 + window.scrollX;
        this.positionArrow('bottom');
        break;
        
      case 'bottom':
        top = rect.bottom + offset + window.scrollY;
        left = rect.left + (rect.width - tooltipRect.width) / 2 + window.scrollX;
        this.positionArrow('top');
        break;
        
      case 'left':
        top = rect.top + (rect.height - tooltipRect.height) / 2 + window.scrollY;
        left = rect.left - tooltipRect.width - offset + window.scrollX;
        this.positionArrow('right');
        break;
        
      case 'right':
        top = rect.top + (rect.height - tooltipRect.height) / 2 + window.scrollY;
        left = rect.right + offset + window.scrollX;
        this.positionArrow('left');
        break;
        
      default:
        top = rect.top - tooltipRect.height - offset + window.scrollY;
        left = rect.left + (rect.width - tooltipRect.width) / 2 + window.scrollX;
        this.positionArrow('bottom');
    }

    // Ensure tooltip stays within viewport
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    if (left < 0) {
      left = 5;
    } else if (left + tooltipRect.width > viewport.width) {
      left = viewport.width - tooltipRect.width - 5;
    }

    if (top < 0) {
      top = rect.bottom + offset + window.scrollY;
      this.positionArrow('top');
    } else if (top + tooltipRect.height > viewport.height + window.scrollY) {
      top = rect.top - tooltipRect.height - offset + window.scrollY;
      this.positionArrow('bottom');
    }

    this.tooltip.style.top = Math.max(0, top) + 'px';
    this.tooltip.style.left = Math.max(0, left) + 'px';
    
    // Set data attribute for CSS positioning
    this.tooltip.setAttribute('data-position', placement);
  }

  /**
   * Position arrow based on tooltip placement
   */
  positionArrow(side) {
    // Arrow positioning handled by CSS based on data-position attribute
    // No inline styles needed
  }

  /**
   * Clear all timers
   */
  clearTimers() {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
    
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  /**
   * Update tooltip content
   */
  updateContent(element, newContent) {
    if (element && element._tooltipConfig) {
      element._tooltipConfig.content = newContent;
      
      // If tooltip is currently showing for this element, update it
      if (this.targetElement === element && this.tooltip.style.opacity === '1') {
        const contentEl = this.tooltip.querySelector('span');
        if (contentEl) {
          contentEl.textContent = newContent;
        }
      }
    }
  }

  /**
   * Remove tooltip from element
   */
  detach(element) {
    if (element && element._tooltipConfig) {
      delete element._tooltipConfig;
      
      // Hide tooltip if it's currently showing for this element
      if (this.targetElement === element) {
        this.hide();
      }
    }
  }

  /**
   * Destroy tooltip instance
   */
  destroy() {
    this.clearTimers();
    
    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
    }
    
    this.tooltip = null;
    this.arrow = null;
    this.targetElement = null;
  }

  /**
   * Static method to create and attach tooltip
   */
  static create(element, content, options = {}) {
    const tooltip = new Tooltip(options);
    tooltip.attach(element, content, options);
    return tooltip;
  }
}

export default Tooltip; 