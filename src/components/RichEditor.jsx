import React, { useEffect, useRef } from 'react';
import { Editor } from '../lib/Editor';

const RichEditor = ({ 
  value,
  onChange,
  options = {},
  className,
  style
}) => {
  const editorRef = useRef(null);
  const editorInstanceRef = useRef(null);

  useEffect(() => {
    // Initialize editor
    if (editorRef.current && !editorInstanceRef.current) {
      editorInstanceRef.current = new Editor(editorRef.current, {
        ...options,
        onChange: (content) => {
          if (onChange) {
            onChange(content);
          }
        }
      });
    }

    // Cleanup
    return () => {
      if (editorInstanceRef.current) {
        // Add cleanup logic if needed
        editorInstanceRef.current = null;
      }
    };
  }, []);

  // Update content when value prop changes
  useEffect(() => {
    if (editorInstanceRef.current && value !== undefined) {
      editorInstanceRef.current.importContent(value);
    }
  }, [value]);

  return (
    <div 
      ref={editorRef}
      className={className}
      style={style}
    />
  );
};

export default RichEditor; 