//import './lib/styles.css';
import RichEditor from './index.js';

// Create editor instance
const editor = new RichEditor('#editor-container', {
  content: '<p>Hello World v123 123 13</p>',
  modules: ['history', 'block-toolbar'],
  height: 600,
  theme: 'light',
  placeholder: '🎉 Welcome! Try all formatting options including headings and font sizes...'
});

// Debug info
console.log('✅ Editor created successfully');
console.log('Editor instance:', editor);