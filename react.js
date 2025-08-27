import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { createEditor } from './src/index.js';

/**
 * React component wrapper for the RichEditor
 * @param {Object} props - Component props
 * @param {string} props.content - Initial content for the editor
 * @param {number} props.height - Editor height in pixels
 * @param {number} props.width - Editor width in pixels
 * @param {string} props.placeholder - Placeholder text
 * @param {Function} props.onChange - Callback function when content changes
 * @param {Array|Object} props.toolbar1 - First toolbar configuration
 * @param {Array|Object} props.toolbar2 - Second toolbar configuration
 * @param {Object} props.options - Additional editor options
 * @param {React.Ref} ref - Forwarded ref
 */
const RichEditor = forwardRef(({
  content,
  height = 400,
  width = 800,
  placeholder = 'Type here...',
  onChange,
  toolbar1,
  toolbar2,
  options = {},
  ...restProps
}, ref) => {
  const containerRef = useRef(null);
  const editorRef = useRef(null);

  // Expose editor methods through ref
  useImperativeHandle(ref, () => ({
    // Get editor content
    getContent: () => {
      return editorRef.current ? editorRef.current.getContent() : '';
    },
    
    // Set editor content
    setContent: (html) => {
      if (editorRef.current) {
        editorRef.current.setContent(html);
      }
    },
    
    // Focus the editor
    focus: () => {
      if (editorRef.current) {
        editorRef.current.focus();
      }
    },
    
    // Get the editor instance
    getEditor: () => editorRef.current,
    
    // Destroy the editor
    destroy: () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    }
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    // Prepare editor options
    const editorOptions = {
      ...options,
      height,
      width,
      placeholder,
      content,
      onChange: (newContent) => {
        if (onChange && typeof onChange === 'function') {
          onChange(newContent);
        }
      }
    };

    // Add toolbar configuration if provided
    if (toolbar1) {
      editorOptions.toolbar1 = toolbar1;
    }
    if (toolbar2) {
      editorOptions.toolbar2 = toolbar2;
    }

    // Create editor instance
    try {
      editorRef.current = createEditor(containerRef.current, editorOptions);
    } catch (error) {
      console.error('Failed to create RichEditor:', error);
    }

    // Cleanup function
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []); // Only run on mount

  // Update content when prop changes
  useEffect(() => {
    if (editorRef.current && content !== undefined) {
      const currentContent = editorRef.current.getContent();
      if (currentContent !== content) {
        editorRef.current.setContent(content);
      }
    }
  }, [content]);

  // Update height when prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.wrapper) {
      editorRef.current.wrapper.style.minHeight = height + 'px';
    }
  }, [height]);

  // Update width when prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.wrapper) {
      editorRef.current.wrapper.style.width = width + 'px';
    }
  }, [width]);

  // Update placeholder when prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.editor) {
      editorRef.current.editor.setAttribute('placeholder', placeholder);
    }
  }, [placeholder]);

  return (
    <div 
      ref={containerRef}
      {...restProps}
    />
  );
});

// Set display name for debugging
RichEditor.displayName = 'RichEditor';

export default RichEditor;
