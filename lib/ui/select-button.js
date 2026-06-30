import IconUtils from './icons.js';

/**
 * Create Custom Button - Simple utility to create styled button
 * @param {string} text - Button text content
 * @param {Object} options - Button options
 * @param {string} options.width - Button width (e.g., '120px', 'auto')
 * @returns {HTMLElement} Button element
 */
function createCustomButton(text = 'Button', options = {}) {
  const { width = 'auto', icon = null } = options;

  // Create button
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'custom-select-button';

  // Optional leading icon so the control is recognisable at a glance.
  if (icon) {
    const leadIcon = IconUtils.createIconElement(icon);
    leadIcon.className = 'select-lead-icon';
    button.appendChild(leadIcon);
  }

  // Create text span
  const textSpan = document.createElement('span');
  textSpan.textContent = text;
  textSpan.className = 'button-text';

  // Create dropdown icon
  const dropdownIcon = IconUtils.createIconElement('dropdown');
  dropdownIcon.className = 'dropdown-icon';

  // Add text and icon to button
  button.appendChild(textSpan);
  button.appendChild(dropdownIcon);
  
  // Layout only (width is dynamic). Colour, background, border, height and
  // radius are deliberately NOT set inline — they come from the
  // .custom-select-button CSS rule so they read --rte-* tokens and stay
  // theme-aware AND app-overridable. Inline colours used to beat the stylesheet
  // and force a light/white trigger in dark mode.
  button.style.width = width;
  button.style.padding = '0px 5px 0px 8px';
  button.style.fontSize = '14px';
  button.style.fontWeight = '400';
  button.style.cursor = 'pointer';
  button.style.display = 'flex';
  button.style.justifyContent = 'space-between';
  button.style.alignItems = 'center';
  
  // Style the text span to take available space
  textSpan.style.flex = '1';
  textSpan.style.textAlign = 'left';
  
  // Style the dropdown icon
  
  // Add method to update button text
  button.updateText = function(newText) {
    textSpan.textContent = newText;
  };
  
  return button;
}

export default createCustomButton; 