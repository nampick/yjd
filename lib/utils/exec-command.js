/**
 * execCommand wrapper — single migration point for the deprecated
 * document.execCommand / queryCommand* family.
 *
 * document.execCommand is deprecated. It still works in every current browser
 * and remains the most reliable way to toggle inline formatting across complex
 * selections, so we keep using it for now — but ONLY through this module.
 * Centralizing it here means:
 *   - consistent try/catch (these APIs throw in detached/edge cases),
 *   - one place to add feature detection or a fallback,
 *   - one place to perform a future Range-API migration without touching every
 *     format file.
 *
 * Prefer these helpers over calling document.execCommand directly.
 */

/**
 * Execute a formatting command.
 * @param {string} command - execCommand command name (e.g. 'bold', 'foreColor')
 * @param {string|null} [value] - command value, when applicable
 * @returns {boolean} true if the command ran without throwing
 */
export function execFormat(command, value = null) {
  try {
    // Omit the value argument when none is given. Passing null explicitly makes
    // some commands stringify it (e.g. insertHorizontalRule would set id="null").
    return value == null
      ? document.execCommand(command, false)
      : document.execCommand(command, false, value);
  } catch (e) {
    console.warn(`execCommand('${command}') failed:`, e);
    return false;
  }
}

/**
 * Enable/disable styleWithCSS (so commands emit inline styles instead of
 * deprecated presentational tags like <font>). Safe to call before each
 * styling command.
 * @param {boolean} [enabled=true]
 */
export function setStyleWithCSS(enabled = true) {
  return execFormat('styleWithCSS', enabled);
}

/**
 * Query whether a command is currently active for the selection.
 * @param {string} command
 * @returns {boolean}
 */
export function queryFormatState(command) {
  try {
    return document.queryCommandState(command);
  } catch (e) {
    return false;
  }
}

/**
 * Query the current value of a command for the selection.
 * @param {string} command
 * @returns {string} empty string if unsupported/unavailable
 */
export function queryFormatValue(command) {
  try {
    return document.queryCommandValue(command) || '';
  } catch (e) {
    return '';
  }
}

export default { execFormat, setStyleWithCSS, queryFormatState, queryFormatValue };
