import React, { useEffect, useRef, useState } from 'react';
import EditorToolbar from './EditorToolbar';
import '../style.css';

const RichEditor = ({ value, onChange, theme = 'light' }) => {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const [wordCount, setWordCount] = useState(0);
  const [editorContent, setEditorContent] = useState(value || '');

  useEffect(() => {
    // Set theme
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || '';
      setEditorContent(value || '');
    }
  }, [value]);

  const handleInput = (e) => {
    const newContent = e.target.innerHTML;
    setEditorContent(newContent);
    if (onChange) {
      onChange(newContent);
    }
    updateWordCount(newContent);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
    document.execCommand('insertHTML', false, text);
  };

  const handleSelection = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const breadcrumb = document.getElementById('breadcrumb');
      if (breadcrumb) {
        let element = range.commonAncestorContainer;
        while (element && element.nodeType === Node.TEXT_NODE) {
          element = element.parentNode;
        }
        if (element) {
          breadcrumb.textContent = element.tagName.toLowerCase();
        }
      }
    }
  };

  const updateWordCount = (html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  };

  const handleFormat = (command, value) => {
    if (command === 'createLink') {
      const url = prompt('Enter URL:');
      if (url) {
        document.execCommand(command, false, url);
      }
    } else if (command === 'insertImage') {
      const url = prompt('Enter image URL:');
      if (url) {
        document.execCommand(command, false, url);
      }
    } else if (command === 'insertTable') {
      const rows = prompt('Enter number of rows:', '3');
      const cols = prompt('Enter number of columns:', '3');
      if (rows && cols) {
        const table = document.createElement('table');
        for (let i = 0; i < rows; i++) {
          const tr = document.createElement('tr');
          for (let j = 0; j < cols; j++) {
            const td = document.createElement('td');
            td.innerHTML = '&nbsp;';
            tr.appendChild(td);
          }
          table.appendChild(tr);
        }
        document.execCommand('insertHTML', false, table.outerHTML);
      }
    } else {
      document.execCommand(command, false, value);
    }
  };

  return (
    <div className="editor-wrapper" ref={containerRef} role="application" aria-label="Rich text editor">
      <div className="menu-bar" role="toolbar" aria-label="Editor menu">
        {/* Add menu items here */}
      </div>
      <EditorToolbar onFormat={handleFormat} />
      <div 
        ref={editorRef}
        className="editor-area"
        contentEditable={true}
        role="textbox"
        aria-multiline="true"
        aria-label="Rich text editor"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onMouseUp={handleSelection}
        onKeyUp={handleSelection}
        dangerouslySetInnerHTML={{ __html: editorContent }}
      />
      <div className="editor-statusbar" role="status" aria-live="polite">
        <div id="breadcrumb" aria-label="Current element"></div>
        <div id="wordcount" aria-label="Word count">{wordCount} words</div>
      </div>
    </div>
  );
};

export default RichEditor; 