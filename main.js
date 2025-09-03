//import './lib/styles.css';
import RichEditor from './index.js';
const contentContainer = document.getElementById('content-container');

const editor = new RichEditor('#editor-container', {
  content: "",
  theme: 'light',
  onChange: (content) => {
    // Update the output container with new content
    contentContainer.innerHTML = content;
    console.log('Content changed:', content);
  }
});
