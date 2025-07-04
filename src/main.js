import './style.css';
import RichEditor from './lib/index.js';
// Create editor instance with table feature
  const editor = new RichEditor('#test-editor', {
      toolbar: ['bold', 'italic', 'underline', 'strike'],
      height: 300,
      theme: 'light',
      placeholder: '🎉 Click table button (⊞) to insert tables...',
      'table': {
          maxRows: 8,
          maxCols: 6,
          cellPadding: '8px',
          borderStyle: '1px solid #ddd'
      }
  });