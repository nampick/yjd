/**
 * Responsive Popup Positioning Utility
 * Handles positioning of popups to ensure they stay within viewport on mobile devices
 */
export class PopupPositioning {
  /**
   * Calculate optimal position for popup to stay within viewport
   * @param {HTMLElement} anchor - The anchor element
   * @param {HTMLElement} popup - The popup element
   * @param {Object} options - Positioning options
   * @returns {Object} - Calculated position {top, left, transform}
   */
  static calculatePosition(anchor, popup, options = {}) {
    const {
      offsetX = 0,
      offsetY = 5,
      preferredPosition = 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
      maxWidth = null,
      maxHeight = null
    } = options;

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // Get anchor dimensions
    const anchorRect = anchor.getBoundingClientRect();
    
    // Get popup dimensions (measure if not already rendered)
    let popupWidth = popup.offsetWidth;
    let popupHeight = popup.offsetHeight;
    
    // If popup is not yet visible, temporarily show it to measure
    let wasVisible = popup.classList.contains('visible');
    if (!wasVisible) {
      popup.style.visibility = 'hidden';
      popup.style.position = 'absolute';
      popup.style.top = '0';
      popup.style.left = '0';
      popup.classList.add('visible');
    }
    
    // Measure popup dimensions
    popupWidth = popup.offsetWidth;
    popupHeight = popup.offsetHeight;
    
    // Apply max constraints
    if (maxWidth && popupWidth > maxWidth) {
      popupWidth = maxWidth;
    }
    if (maxHeight && popupHeight > maxHeight) {
      popupHeight = maxHeight;
    }
    
    // Hide popup if it was hidden before
    if (!wasVisible) {
      popup.classList.remove('visible');
      popup.style.visibility = '';
    }

    // Calculate base positions for different orientations
    const positions = {
      'bottom-right': {
        top: anchorRect.bottom + scrollY + offsetY,
        left: anchorRect.left + scrollX + offsetX
      },
      'bottom-left': {
        top: anchorRect.bottom + scrollY + offsetY,
        left: anchorRect.right + scrollX - popupWidth - offsetX
      },
      'top-right': {
        top: anchorRect.top + scrollY - popupHeight - offsetY,
        left: anchorRect.left + scrollX + offsetX
      },
      'top-left': {
        top: anchorRect.top + scrollY - popupHeight - offsetY,
        left: anchorRect.right + scrollX - popupWidth - offsetX
      }
    };

    // Start with preferred position
    let position = positions[preferredPosition];
    let transform = '';

    // Check if popup fits in preferred position
    const fitsInPreferred = this.checkFitsInViewport(position, popupWidth, popupHeight, viewportWidth, viewportHeight, scrollX, scrollY);

    if (!fitsInPreferred) {
      // Try alternative positions
      const alternativePositions = this.getAlternativePositions(preferredPosition);
      
      for (const altPosition of alternativePositions) {
        const testPosition = positions[altPosition];
        if (this.checkFitsInViewport(testPosition, popupWidth, popupHeight, viewportWidth, viewportHeight, scrollX, scrollY)) {
          position = testPosition;
          break;
        }
      }

      // If no position fits, use the best available with adjustments
      if (!this.checkFitsInViewport(position, popupWidth, popupHeight, viewportWidth, viewportHeight, scrollX, scrollY)) {
        position = this.adjustToFitViewport(position, popupWidth, popupHeight, viewportWidth, viewportHeight, scrollX, scrollY);
      }
    }

    // For mobile devices, add additional constraints
    if (viewportWidth <= 768) {
      position = this.applyMobileConstraints(position, popupWidth, popupHeight, viewportWidth, viewportHeight, scrollX, scrollY);
    }

    return {
      top: position.top,
      left: position.left,
      transform: transform
    };
  }

  /**
   * Check if position fits within viewport
   */
  static checkFitsInViewport(position, width, height, viewportWidth, viewportHeight, scrollX, scrollY) {
    const right = position.left + width;
    const bottom = position.top + height;
    
    return position.left >= scrollX &&
           position.top >= scrollY &&
           right <= scrollX + viewportWidth &&
           bottom <= scrollY + viewportHeight;
  }

  /**
   * Get alternative positions to try
   */
  static getAlternativePositions(preferredPosition) {
    const alternatives = {
      'bottom-right': ['bottom-left', 'top-right', 'top-left'],
      'bottom-left': ['bottom-right', 'top-left', 'top-right'],
      'top-right': ['top-left', 'bottom-right', 'bottom-left'],
      'top-left': ['top-right', 'bottom-left', 'bottom-right']
    };
    
    return alternatives[preferredPosition] || ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
  }

  /**
   * Adjust position to fit within viewport
   */
  static adjustToFitViewport(position, width, height, viewportWidth, viewportHeight, scrollX, scrollY) {
    let { top, left } = position;

    // Adjust horizontal position
    if (left < scrollX) {
      left = scrollX + 10;
    } else if (left + width > scrollX + viewportWidth) {
      left = scrollX + viewportWidth - width - 10;
    }

    // Adjust vertical position
    if (top < scrollY) {
      top = scrollY + 10;
    } else if (top + height > scrollY + viewportHeight) {
      top = scrollY + viewportHeight - height - 10;
    }

    return { top, left };
  }

  /**
   * Apply mobile-specific constraints
   */
  static applyMobileConstraints(position, width, height, viewportWidth, viewportHeight, scrollX, scrollY) {
    let { top, left } = position;

    // On mobile, prefer center positioning if popup is too large
    if (width > viewportWidth * 0.9) {
      left = scrollX + (viewportWidth - width) / 2;
    }

    if (height > viewportHeight * 0.8) {
      top = scrollY + (viewportHeight - height) / 2;
    }

    // Ensure minimum margins
    const minMargin = 10;
    if (left < scrollX + minMargin) left = scrollX + minMargin;
    if (top < scrollY + minMargin) top = scrollY + minMargin;
    if (left + width > scrollX + viewportWidth - minMargin) {
      left = scrollX + viewportWidth - width - minMargin;
    }
    if (top + height > scrollY + viewportHeight - minMargin) {
      top = scrollY + viewportHeight - height - minMargin;
    }

    return { top, left };
  }

  /**
   * Apply calculated position to popup element
   */
  static applyPosition(popup, position) {
    popup.style.position = 'absolute';
    popup.style.top = `${position.top}px`;
    popup.style.left = `${position.left}px`;
    
    if (position.transform) {
      popup.style.transform = position.transform;
    }
  }

  /**
   * Check if device is mobile
   */
  static isMobile() {
    return window.innerWidth <= 768;
  }

  /**
   * Get recommended max dimensions for mobile
   */
  static getMobileMaxDimensions() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    return {
      maxWidth: Math.min(viewportWidth * 0.95, 350),
      maxHeight: Math.min(viewportHeight * 0.8, 400)
    };
  }
} 