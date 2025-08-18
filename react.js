import { useEffect, useRef, forwardRef } from 'react';
import RichEditor from './src/index.js';

/**
 * React Rich Editor Component - Simple wrapper
 */
const ReactRichEditor = forwardRef((props, ref) => {
  const editorRef = useRef(null);
  const editorInstanceRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current || editorInstanceRef.current) return;

    // Create editor with all props passed through
    const editor = RichEditor.create(editorRef.current, props);
    editorInstanceRef.current = editor;

    // Expose editor instance via ref
    if (ref) {
      if (typeof ref === 'function') {
        ref(editor);
      } else {
        ref.current = editor;
      }
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
      editorInstanceRef.current = null;
    };
  }, []);

  return <div ref={editorRef} {...props} />;
});

ReactRichEditor.displayName = 'ReactRichEditor';

export default ReactRichEditor;
export { RichEditor };
export * from './src/index.js';
