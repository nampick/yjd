import React, { useState } from 'react';
import RichEditor from './components/RichEditor';
import './style.css';

function App() {
  const [content, setContent] = useState('');
  const [theme, setTheme] = useState('light');

  const handleChange = (html) => {
    setContent(html);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '20px', textAlign: 'right' }}>
        <button 
          onClick={toggleTheme}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            background: theme === 'light' ? '#fff' : '#333',
            color: theme === 'light' ? '#333' : '#fff',
            cursor: 'pointer'
          }}
        >
          Toggle {theme === 'light' ? 'Dark' : 'Light'} Theme
        </button>
      </div>
      
      <RichEditor 
        value={content}
        onChange={handleChange}
        theme={theme}
      />

      <div style={{ marginTop: '20px' }}>
        <h3>HTML Output:</h3>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '15px',
          borderRadius: '4px',
          overflow: 'auto'
        }}>
          {content}
        </pre>
      </div>
    </div>
  );
}

export default App; 