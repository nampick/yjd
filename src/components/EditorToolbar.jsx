import React from 'react';

const EditorToolbar = ({ onFormat }) => {
  const handleFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    if (onFormat) {
      onFormat(command, value);
    }
  };

  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting options">
      <button onClick={() => handleFormat('bold')} title="Bold" aria-label="Bold">
        <i className="fas fa-bold" aria-hidden="true"></i>
      </button>
      <button onClick={() => handleFormat('italic')} title="Italic" aria-label="Italic">
        <i className="fas fa-italic" aria-hidden="true"></i>
      </button>
      <button onClick={() => handleFormat('underline')} title="Underline" aria-label="Underline">
        <i className="fas fa-underline" aria-hidden="true"></i>
      </button>
      <button onClick={() => handleFormat('strikeThrough')} title="Strike" aria-label="Strike through">
        <i className="fas fa-strikethrough" aria-hidden="true"></i>
      </button>
      
      <div className="tox-collection__item-separator" role="separator"></div>
      
      <button onClick={() => handleFormat('justifyLeft')} title="Align Left" aria-label="Align left">
        <i className="fas fa-align-left" aria-hidden="true"></i>
      </button>
      <button onClick={() => handleFormat('justifyCenter')} title="Align Center" aria-label="Align center">
        <i className="fas fa-align-center" aria-hidden="true"></i>
      </button>
      <button onClick={() => handleFormat('justifyRight')} title="Align Right" aria-label="Align right">
        <i className="fas fa-align-right" aria-hidden="true"></i>
      </button>
      
      <div className="tox-collection__item-separator" role="separator"></div>
      
      <button onClick={() => handleFormat('insertUnorderedList')} title="Bullet List" aria-label="Bullet list">
        <i className="fas fa-list-ul" aria-hidden="true"></i>
      </button>
      <button onClick={() => handleFormat('insertOrderedList')} title="Numbered List" aria-label="Numbered list">
        <i className="fas fa-list-ol" aria-hidden="true"></i>
      </button>
      
      <div className="tox-collection__item-separator" role="separator"></div>
      
      <select 
        className="block-format-select"
        onChange={(e) => handleFormat('formatBlock', e.target.value)}
        aria-label="Block format"
      >
        <option value="p">Paragraph</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="h4">Heading 4</option>
        <option value="h5">Heading 5</option>
        <option value="h6">Heading 6</option>
        <option value="pre">Code Block</option>
      </select>
      
      <div className="tox-collection__item-separator" role="separator"></div>
      
      <button onClick={() => handleFormat('createLink')} title="Insert Link" aria-label="Insert link">
        <i className="fas fa-link" aria-hidden="true"></i>
      </button>
      <button onClick={() => handleFormat('insertImage')} title="Insert Image" aria-label="Insert image">
        <i className="fas fa-image" aria-hidden="true"></i>
      </button>
      <button onClick={() => handleFormat('insertTable')} title="Insert Table" aria-label="Insert table">
        <i className="fas fa-table" aria-hidden="true"></i>
      </button>
    </div>
  );
};

export default EditorToolbar; 