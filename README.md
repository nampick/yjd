# YJD React Rich Editor

A professional-grade React rich text editor component with extensive formatting options, built for modern web applications and commercial use.

## Features

✨ **Rich Text Formatting**

- Bold, italic, underline, strikethrough
- Subscript and superscript
- Text color and background color
- Font family and text size
- Text alignment and line height
- Text capitalization

🎯 **Advanced Features**

- Modular architecture with extensible formats
- Lists and indentation controls
- Links and images with popup interfaces
- Tables with dedicated toolbar
- Video embedding support
- Emoji picker integration
- Content import functionality
- Word count and breadcrumb navigation
- Responsive design with resize handles

🔧 **Developer Friendly**

- Registry-based module system
- Extensible format and module architecture
- Event-driven content change callbacks
- TypeScript support with full type definitions
- Modern React integration with hooks
- Customizable UI components

## Installation

```bash
npm install @oix1987/yjd-react
```

or

```bash
yarn add @oix1987/yjd-react
```

## Quick Start

```jsx
import React, { useState, useEffect, useRef } from "react";
import RichEditor from "@oix1987/yjd-react";

function App() {
  const [content, setContent] = useState("");
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      const editor = RichEditor.create(editorRef.current, {
        placeholder: "Start typing your content here...",
        height: 400,
        width: "100%",
        content: content,
        onChange: (newContent) => {
          console.log("Content changed:", newContent);
          setContent(newContent);
        },
      });
    }
  }, []);

  return (
    <div>
      <h1>My Rich Editor</h1>
      <div ref={editorRef}></div>
    </div>
  );
}

export default App;
```

## Configuration Options

| Option        | Type       | Default             | Description                                 |
| ------------- | ---------- | ------------------- | ------------------------------------------- |
| `width`       | `string`   | `800`               | Width of the editor container               |
| `height`      | `number`   | `400`               | Height of the editor container              |
| `placeholder` | `string`   | `'Start typing...'` | Placeholder text shown when editor is empty |
| `content`     | `string`   | `null`              | Initial content value (HTML string)         |
| `theme`       | `string`   | `'light'`           | Editor theme (light/dark)                   |
| `maxWidth`    | `number`   | `1200`              | Maximum width of the editor                 |
| `maxHeight`   | `number`   | `800`               | Maximum height of the editor                |
| `features`    | `object`   | See below           | Feature configuration object                |
| `onChange`    | `function` | `undefined`         | Callback fired when content changes         |

### Features Configuration

```javascript
features: {
  emoji: true,        // Enable emoji picker
  image: true,        // Enable image insertion
  table: true,        // Enable table functionality
  wordCount: true,    // Show word count
  breadcrumb: true    // Show breadcrumb navigation
}
```

## Usage Examples

### Basic Usage

```jsx
import RichEditor from "@oix1987/yjd-react";
import { useRef, useEffect } from "react";

function MyEditor() {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      const editor = RichEditor.create(editorRef.current, {
        width: "800px",
        height: 500,
        placeholder: "Write something amazing...",
        onChange: (content) => console.log(content),
      });
    }
  }, []);

  return <div ref={editorRef}></div>;
}
```

### Controlled Component

```jsx
import RichEditor from "@oix1987/yjd-react";
import { useRef, useEffect, useState } from "react";

function ControlledEditor() {
  const [editorContent, setEditorContent] = useState("<p>Initial content</p>");
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      const editor = RichEditor.create(editorRef.current, {
        content: editorContent,
        onChange: setEditorContent,
        width: "100%",
        height: 400,
      });
    }
  }, []);

  return <div ref={editorRef}></div>;
}
```

### Advanced Configuration

```jsx
import RichEditor from "@oix1987/yjd-react";
import { useRef, useEffect } from "react";

function AdvancedEditor() {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      const editor = RichEditor.create(editorRef.current, {
        width: "100%",
        height: 600,
        theme: "light",
        maxWidth: 1200,
        maxHeight: 800,
        features: {
          emoji: true,
          image: true,
          table: true,
          wordCount: true,
          breadcrumb: true,
        },
        onChange: (content) => handleContentChange(content),
      });
    }
  }, []);

  return <div ref={editorRef}></div>;
}
```

### Full-Featured Editor

```jsx
import RichEditor from "@oix1987/yjd-react";
import { useRef, useEffect, useState } from "react";

function RichTextEditor() {
  const [content, setContent] = useState("");
  const editorRef = useRef(null);

  const handleContentChange = (newContent) => {
    setContent(newContent);
    // Auto-save or other logic here
    console.log("Content updated:", newContent);
  };

  useEffect(() => {
    if (editorRef.current) {
      const editor = RichEditor.create(editorRef.current, {
        width: "100%",
        height: 600,
        placeholder: "Create your masterpiece...",
        content: content,
        onChange: handleContentChange,
        features: {
          emoji: true,
          image: true,
          table: true,
          wordCount: true,
          breadcrumb: true,
        },
      });
    }
  }, []);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <div ref={editorRef}></div>

      <div style={{ marginTop: "20px" }}>
        <h3>Content Preview:</h3>
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  );
}
```

## Available Formats and Modules

The editor includes a comprehensive set of built-in formats and modules:

### Text Formatting Formats

- **Bold** - Bold text formatting
- **Italic** - Italic text formatting
- **Underline** - Underlined text
- **Strike** - Strikethrough text
- **Subscript** - Subscript text
- **Superscript** - Superscript text

### Colors and Styling Formats

- **Color** - Text color picker
- **Background** - Background color picker
- **TextSize** - Font size control
- **FontFamily** - Font family selection
- **LineHeight** - Line height control
- **Capitalization** - Text capitalization options

### Layout and Structure Formats

- **TextAlign** - Text alignment controls
- **Heading** - Heading levels (H1-H6)
- **List** - Ordered and unordered lists
- **Indent** - Text indentation controls

### Media and Links Formats

- **Link** - Insert and edit links
- **Image** - Insert and manage images
- **Video** - Insert videos
- **Emoji** - Emoji picker integration

### Advanced Features

- **Table** - Insert and edit tables
- **Tag** - Insert custom tags
- **Import** - Content import functionality

### Built-in Modules

- **Toolbar** - Main toolbar functionality
- **History** - Undo/redo functionality
- **BlockToolbar** - Block-level formatting toolbar
- **TableToolbar** - Table-specific toolbar
- **CodeView** - HTML code view
- **ResizeHandles** - Editor resize functionality

## Event Handling

The `onChange` callback receives the updated content as an HTML string:

```jsx
const handleContentChange = (content) => {
  // content is an HTML string
  console.log("New content:", content);

  // You can parse or process the content as needed
  const textOnly = content.replace(/<[^>]*>/g, ""); // Strip HTML tags
  console.log("Text only:", textOnly);
};

<ReactRichEditor onChange={handleContentChange} />;
```

## Styling

The editor comes with built-in styles, but you can customize the appearance:

```jsx
<ReactRichEditor
  width="100%"
  height="500px"
  style={{
    border: "2px solid #e1e5e9",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  }}
/>
```

## Requirements

- React 16.8.0 or higher
- React DOM 16.8.0 or higher

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

ISC License. See [LICENSE](LICENSE) file for details.

## Commercial Licensing

For commercial use, enterprise support, or custom licensing options, please contact:

- **Author**: Oix1987
- **Email**: [Contact for commercial licensing]
- **Repository**: [GitHub Repository](https://github.com/yourusername/react-rich-editor.git)

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/react-rich-editor/issues) page
2. Create a new issue with a detailed description
3. Include code examples and browser information
4. For commercial support, contact the author directly

## Changelog

### v1.0.1

- Initial release of YJD React Rich Editor
- Modular architecture with extensible formats
- Comprehensive formatting options
- React integration with hooks
- TypeScript support
- Commercial licensing available

---

Made with ❤️ for the React community
