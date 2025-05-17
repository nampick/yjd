import './style.css';
import { createEditor } from './lib/Editor.js';

createEditor('#editor-root', {
  toolbar: [
    'bold', 'italic', 'underline', 'strike', 'emoji', 'image', 'link', 'table', 'undo', 'redo'
  ],
  placeholder: 'Soạn nội dung ở đây... (Configurable)',
  theme: 'light',
  height: 550,
  features: {
    emoji: true,
    image: true,
    table: true,
    wordCount: true,
    breadcrumb: true
  }
}); 