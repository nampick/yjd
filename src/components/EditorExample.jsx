import React, { useState } from 'react';
import RichEditor from './RichEditor';

const EditorExample = () => {
  const [content, setContent] = useState('');

  const handleChange = (newContent) => {
    setContent(newContent);
  };

  return (
    <div className="editor-container">
      <h1>Rich Editor Example</h1>
      
      <RichEditor
        value={content}
        onChange={handleChange}
        options={{
          // You can pass any options supported by the Editor class
          height: '500px',
          // Add other options as needed
        }}
        className="my-editor"
        style={{ border: '1px solid #ccc' }}
      />

      <div className="preview">
        <h2>Preview:</h2>
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  );
};

export default EditorExample; 