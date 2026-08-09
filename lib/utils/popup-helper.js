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
  const isPortal = container.classList && container.classList.contains('yjd-popup-portal');

  let top, left;

  if (isPortal) {
    // Portaled to <body> with position:fixed → viewport-relative coordinates,
    // immune to any host ancestor's overflow/transform/stacking. Clamp to the
    // VIEWPORT (not the editor box), so a wide popover on a narrow embedded
    // editor uses the whole screen instead of being squeezed into the editor.
    const { width: popupWidth, height: popupHeight } = getPopupDimensions(popup);
    const vw = window.innerWidth, vh = window.innerHeight;
    left = anchorRect.left + offsetX;
    const below = anchorRect.bottom + offsetY;
    const above = anchorRect.top - popupHeight - offsetY;
    const inPrompt = !!(anchor.closest && anchor.closest('[data-layout="prompt"]'));
    if (preferTop || (inPrompt && above >= 0)) {
      top = above >= 0 ? above : below;
    } else if (below + popupHeight > vh) {
      top = above >= 0 ? above : Math.max(offsetY, vh - popupHeight - offsetY);
    } else {
      top = below;
    }
    if (left + popupWidth + 5 > vw && !preferLeft) left = vw - popupWidth - offsetX - 8;
    if (left < offsetX) left = offsetX;
    if (top < 0) top = offsetY;
    // Keep it anchored while the page/containers scroll or the window resizes.
    registerFixedPopup(popup, anchor, options);
    return { top, left };
  }

  if (isInWrapper) {
    // Position relative to wrapper
    const wrapperRect = container.getBoundingClientRect();
    const { width: popupWidth, height: popupHeight } = getPopupDimensions(popup);
    left = anchorRect.left - wrapperRect.left + offsetX;

    const below = anchorRect.top - wrapperRect.top + anchorRect.height + offsetY;
    const above = anchorRect.top - wrapperRect.top - popupHeight - offsetY;
    // In the prompt layout the toolbar is a BOTTOM bar, so open popovers ABOVE
    // the anchor (toward the viewport top) whenever there's room there — opening
    // below would run off the bottom of the screen. The popup-container is
    // overflow:visible, so a container-negative `top` (extending above the pill)
    // is fine and must NOT be clamped back into the pill.
    const inPrompt = !!(anchor.closest && anchor.closest('[data-layout="prompt"]'));

    if (preferTop || (inPrompt && anchorRect.top - popupHeight - offsetY >= 0)) {
      top = above;
    } else if (below + popupHeight > wrapperRect.height) {
      // Overflows below within the container: flip above only if it fits there,
      // otherwise keep it below (extends past the editor, stays on its trigger).
      top = above >= 0 ? above : below;
    } else {
      top = below;
    }

    // Check if popup would overflow right of wrapper
    if (left + popupWidth + 5 > wrapperRect.width && !preferLeft) {
      left = wrapperRect.width - popupWidth - offsetX -15;
    }

    // Ensure popup doesn't go off-screen (but keep an intentional upward opening).
    if (left < 0) left = offsetX;
    if (top < 0 && !inPrompt && !preferTop) top = offsetY;
    
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
  // A portaled popover (living under the body-level .yjd-popup-portal) is
  // fixed-positioned in viewport coordinates; an in-wrapper one is absolute.
  const fixed = !!(popup.closest && popup.closest('.yjd-popup-portal'));
  popup.style.position = fixed ? 'fixed' : 'absolute';
  popup.style.top = `${position.top}px`;
  popup.style.left = `${position.left}px`;
  popup.style.zIndex = fixed ? '2147483000' : '1000';
}

/* ---------------------------------------------------------------------------
 * Fixed (portaled) popovers must re-anchor when the page — or any scroll
 * container between the anchor and the viewport — scrolls or the window
 * resizes. One shared, capture-phase listener repositions every visible fixed
 * popover and self-cleans entries whose popover was hidden or removed.
 * ------------------------------------------------------------------------- */
const _fixedPopups = new Set();
let _fixedListening = false;

function _isPopupVisible(popup) {
  if (!popup || !popup.isConnected) return false;
  const cs = window.getComputedStyle(popup);
  if (cs.display === 'none' || cs.visibility === 'hidden') return false;
  const r = popup.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

function _repositionFixed() {
  for (const entry of [..._fixedPopups]) {
    const { popup, anchor, options } = entry;
    if (!_isPopupVisible(popup) || !anchor || !anchor.isConnected) {
      _fixedPopups.delete(entry);
      continue;
    }
    const pos = calculatePopupPosition(anchor, popup, options);
    popup.style.top = `${pos.top}px`;
    popup.style.left = `${pos.left}px`;
  }
  if (!_fixedPopups.size && _fixedListening) {
    window.removeEventListener('scroll', _repositionFixed, true);
    window.removeEventListener('resize', _repositionFixed);
    _fixedListening = false;
  }
}

function registerFixedPopup(popup, anchor, options) {
  // Replace any stale entry for this popup, then (re)arm the shared listeners.
  for (const e of [..._fixedPopups]) if (e.popup === popup) _fixedPopups.delete(e);
  _fixedPopups.add({ popup, anchor, options });
  if (!_fixedListening && typeof window !== 'undefined') {
    // capture:true catches scrolls on nested host scroll containers too.
    window.addEventListener('scroll', _repositionFixed, true);
    window.addEventListener('resize', _repositionFixed);
    _fixedListening = true;
  }
}
