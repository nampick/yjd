import { useEffect, useRef, forwardRef, useCallback } from 'react';
import RichEditor from './src/index.js';

/**
 * React Rich Editor Component - Feature-rich wrapper with props support
 */
const ReactRichEditor = forwardRef((props, ref) => {
  const {
    width = '100%',
    height = '300px',
    placeholder = 'Start typing...',
    content,
    toolbar1,
    toolbar2,
    onChange
  } = props;

  // Validate props
  if (toolbar1 !== undefined && !Array.isArray(toolbar1)) {
    console.warn('ReactRichEditor: toolbar1 prop should be an array of strings. Received:', typeof toolbar1, toolbar1);
  }
  
  if (toolbar2 !== undefined && !Array.isArray(toolbar2)) {
    console.warn('ReactRichEditor: toolbar2 prop should be an array of strings. Received:', typeof toolbar2, toolbar2);
  }

  const editorRef = useRef(null);
  const editorInstanceRef = useRef(null);
  const lastContentRef = useRef(content);

  // Handle content changes with debouncing
  const handleContentChange = useCallback(() => {
    if (editorInstanceRef.current && onChange) {
      try {
        const newContent = editorInstanceRef.current.getContent();
        
        // Only call onChange if content actually changed
        if (newContent !== lastContentRef.current) {
          lastContentRef.current = newContent;
          onChange(newContent);
        }
      } catch (error) {
        console.warn('ReactRichEditor: Error in onChange handler:', error);
      }
    }
  }, [onChange]);

  // Debounced version for frequent events
  const debouncedContentChange = useCallback(() => {
    if (handleContentChange.timeoutId) {
      clearTimeout(handleContentChange.timeoutId);
    }
    handleContentChange.timeoutId = setTimeout(handleContentChange, 100);
  }, [handleContentChange]);



  useEffect(() => {
    if (!editorRef.current || editorInstanceRef.current) return;

    try {
      // Prepare modules configuration - load full feature set
      const modulesToLoad = ['toolbar', 'history', 'block-toolbar', 'table-toolbar', 'code-view', 'resize-handles'];

      // Prepare formats configuration - load full feature set
      const formatsToLoad = [
        'bold', 'italic', 'underline', 'strike', 'subscript', 'superscript',
        'color', 'background', 'text-align', 'text-size', 'link',
        'heading', 'font-family', 'line-height', 'capitalization',
        'list', 'indent', 'emoji', 'image', 'video', 'table', 'tag', 'import'
      ];

      // Prepare editor options
      const editorOptions = {
        placeholder,
        // Pass toolbar1 and toolbar2 if they're defined and are arrays
        ...(toolbar1 && Array.isArray(toolbar1) && { toolbar1 }),
        ...(toolbar2 && Array.isArray(toolbar2) && { toolbar2 }),
        modules: modulesToLoad,
        formats: formatsToLoad,
        theme: 'default',
        readOnly: false,
        // Enable features for statusbar
        features: {
          emoji: true,
          image: true,
          table: true,
          wordCount: true,
          breadcrumb: true
        }
      };

      // Create editor instance
      const editor = RichEditor.create(editorRef.current, editorOptions);
      editorInstanceRef.current = editor;

      // Set initial content
      if (content) {
        editor.setContent(content);
      }

      // Setup event listeners
      if (onChange) {
        // Use editor's built-in event system (immediate)
        editor.on('text-change', handleContentChange);
        
        // Use debounced version for frequent DOM events
        editor.editor.addEventListener('input', debouncedContentChange);
        
        // Listen to paste events (immediate after delay)
        editor.editor.addEventListener('paste', () => {
          setTimeout(handleContentChange, 10); // Delay to allow paste to complete
        });
        
        // Listen to key events (debounced)
        editor.editor.addEventListener('keyup', debouncedContentChange);
        
        console.log('🎯 onChange event listeners setup successfully');
      }



      // Expose editor instance via ref
      if (ref) {
        if (typeof ref === 'function') {
          ref(editor);
        } else {
          ref.current = editor;
        }
      }

      return () => {
        try {
          // Cleanup event listeners
          if (onChange) {
            editor.off && editor.off('text-change', handleContentChange);
            editor.editor && editor.editor.removeEventListener('input', debouncedContentChange);
            editor.editor && editor.editor.removeEventListener('keyup', debouncedContentChange);
            
            // Clear any pending debounced calls
            if (handleContentChange.timeoutId) {
              clearTimeout(handleContentChange.timeoutId);
            }
          }
          


          if (editorRef.current) {
            editorRef.current.innerHTML = '';
          }
          editorInstanceRef.current = null;
        } catch (error) {
          console.warn('ReactRichEditor cleanup error:', error);
        }
      };
    } catch (error) {
      console.error('ReactRichEditor initialization error:', error);
      return () => {
        editorInstanceRef.current = null;
      };
    }
  }, [placeholder, toolbar1, toolbar2, handleContentChange, debouncedContentChange]);

  // Update content when prop changes (but avoid infinite loops)
  useEffect(() => {
    if (editorInstanceRef.current && content !== undefined && content !== lastContentRef.current) {
      const currentContent = editorInstanceRef.current.getContent();
      if (currentContent !== content) {
        // Save current cursor position
        const selection = window.getSelection();
        let range = null;
        let cursorOffset = 0;
        
        if (selection && selection.rangeCount > 0) {
          range = selection.getRangeAt(0);
          // Calculate cursor position relative to editor content
          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(editorInstanceRef.current.editor);
          preCaretRange.setEnd(range.endContainer, range.endOffset);
          cursorOffset = preCaretRange.toString().length;
        }

        // Set content without triggering onChange
        editorInstanceRef.current.setContent(content);
        lastContentRef.current = content;

        // Restore cursor position after a short delay
        setTimeout(() => {
          if (editorInstanceRef.current && cursorOffset > 0) {
            try {
              const editor = editorInstanceRef.current.editor;
              const textNodes = [];
              
              // Collect all text nodes
              const walker = document.createTreeWalker(
                editor,
                NodeFilter.SHOW_TEXT,
                null,
                false
              );
              
              let node;
              while (node = walker.nextNode()) {
                textNodes.push(node);
              }
              
              // Find the correct position
              let currentOffset = 0;
              let targetNode = null;
              let targetOffset = 0;
              
              for (const textNode of textNodes) {
                const nodeLength = textNode.textContent.length;
                if (currentOffset + nodeLength >= cursorOffset) {
                  targetNode = textNode;
                  targetOffset = cursorOffset - currentOffset;
                  break;
                }
                currentOffset += nodeLength;
              }
              
              // Set cursor position
              if (targetNode) {
                const newRange = document.createRange();
                newRange.setStart(targetNode, Math.min(targetOffset, targetNode.textContent.length));
                newRange.collapse(true);
                
                const newSelection = window.getSelection();
                newSelection.removeAllRanges();
                newSelection.addRange(newRange);
              }
            } catch (error) {
              console.warn('Failed to restore cursor position:', error);
            }
          }
        }, 10);
      }
    }
  }, [content]);

  // Container styles - ensure width/height have units
  const containerStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };

  return (
    <div 
      ref={editorRef}
      style={containerStyle}
    />
  );
});

ReactRichEditor.displayName = 'ReactRichEditor';

export default ReactRichEditor;
export { RichEditor };
export * from './src/index.js';
