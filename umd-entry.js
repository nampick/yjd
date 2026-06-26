/**
 * UMD entry point.
 *
 * For the UMD/CDN build we want the global `yjd` to be the editor class itself,
 * so that `new yjd('#el', {...})` works directly from a <script> tag (as
 * documented in the README). `window.RichEditor` is aliased to it for
 * backward compatibility. The named exports used for extension (Editor, Bold,
 * registry, ...) are attached as static properties so they remain reachable as
 * `yjd.Bold`, `yjd.registry`, etc.
 */
import RichEditor, * as exportsNs from './index.js';

for (const [key, value] of Object.entries(exportsNs)) {
  if (key !== 'default' && !(key in RichEditor)) {
    RichEditor[key] = value;
  }
}

export default RichEditor;
