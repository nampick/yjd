/**
 * Popup Helper Utility
 * Helps popups append to the yjd-rich-editor instead of document.body
 * Now supports multiple editor instances with separate popup containers
 */
import Editor from '../core/editor.js';

/**
 * Get the appropriate container for popups
 * @param {string} editorId - Optional editor instance ID
 * @returns {HTMLElement} Container element for popups
 */
export function getPopupContainer(editorId = null) {
  let editor;
  
  if (editorId) {
    // Get specific editor instance
    editor = Editor.getInstanceById(editorId);
  } else {
    // Try to get current editor instance
    editor = Editor.getCurrentInstance();
  }
  
  if (editor) {
    return editor.getPopupContainer();
  }
  
  // Fallback to document.body if no editor instance
  return document.body;
}

/**
 * Append popup to the appropriate container
 * @param {HTMLElement} popup - Popup element to append
 * @param {string} editorId - Optional editor instance ID
 */
export function appendPopup(popup, editorId = null) {
  const container = getPopupContainer(editorId);
  
  // Remove from current parent if exists
  if (popup.parentNode) {
    popup.parentNode.removeChild(popup);
  }
  
  container.appendChild(popup);
  
  // Note: pointer-events are now controlled by CSS rules
  // Popup containers have pointer-events: none by default
  // Interactive elements inside popups have pointer-events: auto
}

/**
 * Get popup dimensions by temporarily showing it if needed
 * @param {HTMLElement} popup - Popup element
 * @returns {Object} Object with width and height
 */
function getPopupDimensions(popup) {
  if (!popup) return { width: 300, height: 200 };
  
  // Try getBoundingClientRect first
  const rect = popup.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    return { width: rect.width, height: rect.height };
  }
  
  // Try offsetWidth/offsetHeight
  if (popup.offsetWidth > 0 && popup.offsetHeight > 0) {
    return { width: popup.offsetWidth, height: popup.offsetHeight };
  }
  
  // Check if popup is hidden
  const computedStyle = window.getComputedStyle(popup);
  const isHidden = computedStyle.display === 'none' || computedStyle.visibility === 'hidden';
  
  if (isHidden) {
    // Temporarily show popup to get dimensions
    const originalDisplay = popup.style.display;
    const originalVisibility = popup.style.visibility;
    const originalPosition = popup.style.position;
    const originalTop = popup.style.top;
    const originalLeft = popup.style.left;
    const originalZIndex = popup.style.zIndex;
    
    // Make popup visible but off-screen
    popup.style.display = 'block';
    popup.style.visibility = 'visible';
    popup.style.position = 'absolute';
    popup.style.top = '-9999px';
    popup.style.left = '-9999px';
    popup.style.zIndex = '-1';
    
    // Force reflow
    popup.offsetHeight;
    
    // Get dimensions
    const tempRect = popup.getBoundingClientRect();
    const width = tempRect.width > 0 ? tempRect.width : 300;
    const height = tempRect.height > 0 ? tempRect.height : 200;
    
    // Restore original styles
    popup.style.display = originalDisplay;
    popup.style.visibility = originalVisibility;
    popup.style.position = originalPosition;
    popup.style.top = originalTop;
    popup.style.left = originalLeft;
    popup.style.zIndex = originalZIndex;
    
    return { width, height };
  }
  
  // Last resort: try computed styles
  const computedWidth = parseInt(computedStyle.width);
  const computedHeight = parseInt(computedStyle.height);
  
  return {
    width: computedWidth > 0 ? computedWidth : 300,
    height: computedHeight > 0 ? computedHeight : 200
  };
}

/**
 * Calculate position for popup relative to anchor element
 * @param {HTMLElement} anchor - Anchor element
 * @param {HTMLElement} popup - Popup element
 * @param {Object} options - Positioning options
 * @returns {Object} Position object with top and left values
 */
export function calculatePopupPosition(anchor, popup, options = {}) {
  const {
    offsetX = 0,
    offsetY = 5,
    preferTop = false,
    preferLeft = false
  } = options;

  const anchorRect = anchor.getBoundingClientRect();
  const container = getPopupContainer();
  const isInWrapper = container.classList.contains('rich-editor-popup-container');
  
  let top, left;
  
  if (isInWrapper) {
    // Position relative to wrapper
    const wrapperRect = container.getBoundingClientRect();
    
    // Calculate position relative to wrapper
    top = anchorRect.top - wrapperRect.top + anchorRect.height + offsetY;
    left = anchorRect.left - wrapperRect.left + offsetX;
    
    // Get popup dimensions using the helper function
    const { width: popupWidth, height: popupHeight } = getPopupDimensions(popup);

    
    // Check if popup would overflow bottom of wrapper
    if (top + popupHeight > wrapperRect.height && !preferTop) {
      // Try to position above the anchor
      const topPosition = anchorRect.top - wrapperRect.top - popupHeight - offsetY;
      if (topPosition >= 0) {
        top = topPosition;
      } else {
        // If still doesn't fit, try to center it vertically within the wrapper
        top = Math.max(offsetY, (wrapperRect.height - popupHeight) / 2);
      }
    }
    
    // Check if popup would overflow right of wrapper
    if (left + popupWidth + 5 > wrapperRect.width && !preferLeft) {
      left = wrapperRect.width - popupWidth - offsetX -15;
    }
    
    // Ensure popup doesn't go off-screen
    if (left < 0) left = offsetX;
    if (top < 0) top = offsetY;
    
  } else {
    // Fallback to document.body positioning
    top = anchorRect.bottom + window.scrollY + offsetY;
    left = anchorRect.left + window.scrollX + offsetX;

    
    // Get popup dimensions using the helper function
    const { width: popupWidth, height: popupHeight } = getPopupDimensions(popup);
    
    // Check if popup would overflow right edge
    if (left + popupWidth > window.innerWidth && !preferLeft) {
      left = window.innerWidth - popupWidth - offsetX;
    }
    
    // Check if popup would overflow bottom edge
    if (top + popupHeight > window.innerHeight + window.scrollY && !preferTop) {
      // Try to position above the anchor
      const topPosition = anchorRect.top + window.scrollY - popupHeight - offsetY;
      if (topPosition >= window.scrollY) {
        top = topPosition;
      } else {
        // If still doesn't fit, try to center it vertically within the viewport
        top = Math.max(window.scrollY + offsetY, window.scrollY + (window.innerHeight - popupHeight) / 2);
      }
    }
    
    // Ensure popup doesn't go off-screen
    if (left < 0) left = offsetX;
    if (top < 0) top = offsetY;
  }
  
  return { top, left };
}

/**
 * Set popup position
 * @param {HTMLElement} popup - Popup element
 * @param {Object} position - Position object with top and left values
 */
export function setPopupPosition(popup, position) {
  popup.style.position = 'absolute';
  popup.style.top = `${position.top}px`;
  popup.style.left = `${position.left}px`;
  popup.style.zIndex = '1000';
}
