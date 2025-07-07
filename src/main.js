import './lib/styles.css';
import RichEditor from './lib/index.js';

// Create editor instance
const editor = new RichEditor('#editor-root', {
  toolbar: ['bold', 'italic', 'underline', 'strike', 'subscript', 'superscript', 'color', 'background', 'link', 'image', 'align', 'table'],
  modules: ['history', 'block-toolbar'],
  height: 300,
  theme: 'light',
  placeholder: '🎉 Welcome! Try all formatting options including headings and font sizes...'
});

// Debug info
console.log('✅ Editor created successfully');
console.log('Editor instance:', editor);