//import './lib/styles.css';
import RichEditor from './index.js';

// Create editor instance with custom toolbar configuration
const editor = new RichEditor('#editor-container', {
  content: '<p>Hello World v123 123 13</p>',
  height: 600,
  theme: 'light',
  placeholder: '🎉 Welcome! Try basic formatting: Bold, Italic, Underline, Strikethrough',
  // toolbar1: [
  //   { group: 'text-format', items: ['bold', 'italic', 'underline', 'strike'] },
  //   { group: 'more', items: ['more'] }
  // ],
  // toolbar2: [
  //   { group: 'structure', items: ['list'] },
  //   { group: 'table', items: ['table'] }
  // ]
});

// Debug info
console.log('✅ Editor created successfully');
console.log('Editor instance:', editor);