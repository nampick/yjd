import IconUtils from './icons.js';

/**
 * Create Custom Button - Simple utility to create styled button
 * @param {string} text - Button text content
 * @param {Object} options - Button options
 * @param {string} options.width - Button width (e.g., '120px', 'auto')
 * @returns {HTMLElement} Button element
 */
function createCustomButton(text = 'Button', options = {}) {
  const { width = 'auto' } = options;

  // Create button
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'custom-select-button';
  
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
  
  // Apply styles
  button.style.width = width;
  button.style.padding = '0px 5px 0px 8px';
  button.style.setProperty('height', '32px', 'important');
  button.style.setProperty('borderRadius', '6px', 'important');
  button.style.setProperty('alignItems', 'center', 'important');
  button.style.fontSize = '14px';
  button.style.fontWeight = '400';
  button.style.color = '#374151';
  button.style.background = '#FFFFFF';
  button.style.cursor = 'pointer';
  button.style.border = '1px solid #d1d5db';
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