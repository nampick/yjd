# React Rich Editor

A powerful and feature-rich React text editor component with extensive formatting options, built for modern web applications.

## Features

- 🎨 **Rich Formatting**: Bold, italic, underline, strikethrough, subscript, superscript
- 🌈 **Colors & Styling**: Text color, background color, font family, text size, line height
- 📝 **Text Alignment**: Left, center, right, justify alignment
- 📋 **Lists**: Ordered and unordered lists with indentation
- 🔗 **Links**: Insert and edit hyperlinks
- 🖼️ **Media**: Image and video embedding
- 📊 **Tables**: Create and edit tables with toolbar
- 😀 **Emojis**: Built-in emoji picker
- 🏷️ **Tags**: Custom tag system
- 📱 **Responsive**: Mobile-friendly design
- ⌨️ **Keyboard Shortcuts**: Full keyboard support
- 🔄 **Undo/Redo**: History management
- 💾 **Import/Export**: Content import and export functionality

## Installation

Install the package via npm:

```bash
npm install testyjd-react
```

Or using yarn:

```bash
yarn add testyjd-react
```

## Basic Usage

### 1. Import the Component

```jsx
import React from "react";
import ReactRichEditor from "testyjd-react";
// Import CSS styles (required)
import "testyjd-react/dist/assets/styles.css";

function App() {
  return (
    <div className="App">
      <h1>My Rich Text Editor</h1>
      <ReactRichEditor />
    </div>
  );
}

export default App;
```

### 2. Basic Implementation

```jsx
import React, { useRef } from "react";
import ReactRichEditor from "testyjd-react";
import "testyjd-react/dist/assets/styles.css";

function MyEditor() {
  const editorRef = useRef(null);

  const handleSave = () => {
    if (editorRef.current) {
      const content = editorRef.current.getHTML();
      console.log("Editor content:", content);
    }
  };

  return (
    <div>
      <ReactRichEditor
        ref={editorRef}
        width="100%"
        height="400px"
        defaultContent="<p>Start typing here...</p>"
      />
      <button onClick={handleSave}>Save Content</button>
    </div>
  );
}

export default MyEditor;
```

## Configuration & Props

### Component Props

| Prop             | Type      | Default             | Description                                 |
| ---------------- | --------- | ------------------- | ------------------------------------------- |
| `width`          | `string`  | `'100%'`            | Width of the editor container               |
| `height`         | `string`  | `'300px'`           | Height of the editor container              |
| `defaultContent` | `string`  | `''`                | Initial HTML content to display             |
| `style`          | `object`  | `{}`                | Additional CSS styles for the container     |
| `className`      | `string`  | `''`                | CSS class name for the container            |
| `placeholder`    | `string`  | `'Start typing...'` | Placeholder text when editor is empty       |
| `readOnly`       | `boolean` | `false`             | Make the editor read-only                   |
| `theme`          | `string`  | `'default'`         | Editor theme ('default', 'dark', 'minimal') |

### Editor Options

You can pass additional configuration options to customize the editor behavior:

```jsx
<ReactRichEditor
  // Basic props
  width="800px"
  height="500px"
  defaultContent="<h1>Welcome!</h1><p>Start editing...</p>"
  // Editor configuration
  toolbar={{
    show: true,
    items: ["bold", "italic", "underline", "color", "link", "image"],
  }}
  // Formatting options
  formats={{
    bold: true,
    italic: true,
    underline: true,
    strike: true,
    color: true,
    background: true,
    link: true,
    image: true,
    video: true,
    table: true,
    list: true,
    emoji: true,
  }}
  // Modules configuration
  modules={{
    toolbar: true,
    history: true,
    blockToolbar: true,
    tableToolbar: true,
    resizeHandles: true,
  }}
/>
```

## Advanced Usage

### 1. Custom Styling

```jsx
<ReactRichEditor
  width="100%"
  height="600px"
  style={{
    border: "2px solid #007bff",
    borderRadius: "8px",
    backgroundColor: "#f8f9fa",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  }}
  className="my-custom-editor"
/>
```

### 2. Event Handling

```jsx
import React, { useRef, useState } from "react";
import ReactRichEditor from "testyjd-react";

function EditorWithEvents() {
  const editorRef = useRef(null);
  const [content, setContent] = useState("");

  const handleContentChange = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.getHTML();
      setContent(newContent);
    }
  };

  return (
    <div>
      <ReactRichEditor
        ref={editorRef}
        defaultContent="<p>Type something...</p>"
        onChange={handleContentChange}
      />

      <div>
        <h3>Live Preview:</h3>
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  );
}
```

### 3. Programmatic Control

```jsx
import React, { useRef } from "react";
import ReactRichEditor from "testyjd-react";

function ProgrammaticEditor() {
  const editorRef = useRef(null);

  const insertText = () => {
    if (editorRef.current) {
      editorRef.current.insertText("Hello World!");
    }
  };

  const formatBold = () => {
    if (editorRef.current) {
      editorRef.current.format("bold", true);
    }
  };

  const getContent = () => {
    if (editorRef.current) {
      const html = editorRef.current.getHTML();
      const text = editorRef.current.getText();
      console.log("HTML:", html);
      console.log("Text:", text);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "10px" }}>
        <button onClick={insertText}>Insert Text</button>
        <button onClick={formatBold}>Make Bold</button>
        <button onClick={getContent}>Get Content</button>
      </div>

      <ReactRichEditor ref={editorRef} height="300px" />
    </div>
  );
}
```

## API Reference

### Editor Instance Methods

When you get a reference to the editor, you can use these methods:

| Method                | Parameters                 | Description                  |
| --------------------- | -------------------------- | ---------------------------- |
| `getHTML()`           | -                          | Get the HTML content         |
| `getText()`           | -                          | Get the plain text content   |
| `setHTML(html)`       | `html: string`             | Set the HTML content         |
| `insertText(text)`    | `text: string`             | Insert text at cursor        |
| `format(name, value)` | `name: string, value: any` | Apply formatting             |
| `getFormat()`         | -                          | Get current format at cursor |
| `focus()`             | -                          | Focus the editor             |
| `blur()`              | -                          | Remove focus from editor     |
| `enable(enabled)`     | `enabled: boolean`         | Enable/disable editor        |

### Available Formats

- `bold` - Bold text
- `italic` - Italic text
- `underline` - Underlined text
- `strike` - Strikethrough text
- `color` - Text color
- `background` - Background color
- `font-family` - Font family
- `text-size` - Font size
- `line-height` - Line height
- `text-align` - Text alignment
- `list` - Lists (ordered/unordered)
- `indent` - Text indentation
- `link` - Hyperlinks
- `image` - Images
- `video` - Videos
- `table` - Tables
- `emoji` - Emojis
- `tag` - Custom tags

## Styling

The editor comes with default styles, but you can customize the appearance:

```css
/* Custom editor styles */
.my-custom-editor {
  font-family: "Inter", sans-serif;
}

.my-custom-editor .toolbar {
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.my-custom-editor .editor-content {
  padding: 20px;
  min-height: 200px;
}

.my-custom-editor .editor-content p {
  margin-bottom: 16px;
  line-height: 1.6;
}
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## TypeScript Support

The package includes TypeScript definitions:

```typescript
import React, { useRef } from "react";
import ReactRichEditor from "testyjd-react";

interface EditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

const TypedEditor: React.FC<EditorProps> = ({
  initialContent,
  onContentChange,
}) => {
  const editorRef = useRef<any>(null);

  return (
    <ReactRichEditor
      ref={editorRef}
      defaultContent={initialContent}
      onChange={onContentChange}
    />
  );
};
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please file an issue on the [GitHub repository](https://github.com/nampick/richeditor/issues).

---

Made with ❤️ for the React community
