//import './lib/styles.css';
import RichEditor from './index.js';

// Create editor instance with custom toolbar configuration
const contentContainer = document.getElementById('content-container');

const editor = new RichEditor('#editor-container', {
  content: contentContainer.innerHTML,
  height: 500,
  width: 1000,
  theme: 'light',
  placeholder: '🎉 Welcome! Try basic formatting: Bold, Italic, Underline, Strikethrough',
  // Add onChange callback to handle content changes
  onChange: (content) => {
    // Update the output container with new content
    contentContainer.innerHTML = content;
    console.log('Content changed:', content);
  },
  // toolbar1: [
  //   { group: 'text-format', items: ['bold', 'italic', 'underline', 'strike'] },
  //   { group: 'more', items: ['more'] }
  // ],
  // toolbar2: [
  //   { group: 'structure', items: ['list'] },
  //   { group: 'table', items: ['table'] }
  // ]
});
