# React Rich Editor

A powerful and feature-rich React text editor component with extensive formatting options, built for modern web applications.

## Features

✨ **Rich Text Formatting**

- Bold, italic, underline, strikethrough
- Subscript and superscript
- Text color and background color
- Font family and text size
- Text alignment and line height
- Text capitalization

🎯 **Advanced Features**

- Multiple toolbar configurations (toolbar1, toolbar2)
- Lists and indentation
- Links and images
- Tables and video embedding
- Emoji support
- Import/export functionality
- Word count and breadcrumb navigation
- Responsive design

🔧 **Developer Friendly**

- Simple prop-based configuration
- Content change callbacks
- Controlled and uncontrolled modes
- TypeScript support
- Modern React hooks implementation

## Installation

```bash
npm install testyjd-react
```

or

```bash
yarn add testyjd-react
```

## Quick Start

```jsx
import React, { useState } from "react";
import ReactRichEditor from "testyjd-react";

function App() {
  const [content, setContent] = useState("");

  const handleTextChange = (newContent) => {
    console.log("Content changed:", newContent);
    setContent(newContent);
  };

  return (
    <div>
      <h1>My Rich Editor</h1>
      <ReactRichEditor
        width="100%"
        height="400px"
        placeholder="Start typing your content here..."
        content={content}
        onChange={handleTextChange}
      />
    </div>
  );
}

export default App;
```

## Props

| Prop          | Type       | Default             | Description                                   |
| ------------- | ---------- | ------------------- | --------------------------------------------- |
| `width`       | `string`   | `'100%'`            | Width of the editor container                 |
| `height`      | `string`   | `'300px'`           | Height of the editor container                |
| `placeholder` | `string`   | `'Start typing...'` | Placeholder text shown when editor is empty   |
| `content`     | `string`   | `undefined`         | Controlled content value (HTML string)        |
| `toolbar1`    | `array`    | `undefined`         | Custom toolbar configuration (first toolbar)  |
| `toolbar2`    | `array`    | `undefined`         | Custom toolbar configuration (second toolbar) |
| `onChange`    | `function` | `undefined`         | Callback fired when content changes           |

## Usage Examples

### Basic Usage

```jsx
<ReactRichEditor
  width="800px"
  height="500px"
  placeholder="Write something amazing..."
  onChange={(content) => console.log(content)}
/>
```

### Controlled Component

```jsx
const [editorContent, setEditorContent] = useState("<p>Initial content</p>");

<ReactRichEditor
  content={editorContent}
  onChange={setEditorContent}
  width="100%"
  height="400px"
/>;
```

### Custom Toolbar Configuration

```jsx
<ReactRichEditor
  toolbar1={["bold", "italic", "underline", "color"]}
  toolbar2={["heading", "list", "link", "image"]}
  onChange={(content) => handleContentChange(content)}
/>
```

### Full-Featured Editor

```jsx
function RichTextEditor() {
  const [content, setContent] = useState("");

  const handleContentChange = (newContent) => {
    setContent(newContent);
    // Auto-save or other logic here
    console.log("Content updated:", newContent);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <ReactRichEditor
        width="100%"
        height="600px"
        placeholder="Create your masterpiece..."
        content={content}
        onChange={handleContentChange}
      />

      <div style={{ marginTop: "20px" }}>
        <h3>Content Preview:</h3>
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  );
}
```

## Available Toolbar Options

When customizing `toolbar1` or `toolbar2`, you can include any of these options:

### Text Formatting

- `'bold'` - Bold text
- `'italic'` - Italic text
- `'underline'` - Underlined text
- `'strike'` - Strikethrough text
- `'subscript'` - Subscript text
- `'superscript'` - Superscript text

### Colors and Styling

- `'color'` - Text color
- `'background'` - Background color
- `'text-size'` - Font size
- `'font-family'` - Font family
- `'line-height'` - Line height
- `'capitalization'` - Text capitalization

### Layout and Structure

- `'text-align'` - Text alignment
- `'heading'` - Headings (H1-H6)
- `'list'` - Ordered and unordered lists
- `'indent'` - Text indentation

### Media and Links

- `'link'` - Insert links
- `'image'` - Insert images
- `'video'` - Insert videos
- `'emoji'` - Emoji picker

### Advanced Features

- `'table'` - Insert tables
- `'tag'` - Insert tags
- `'import'` - Import content

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

MIT License. See [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/react-rich-editor/issues) page
2. Create a new issue with a detailed description
3. Include code examples and browser information

## Changelog

### v1.3.7

- Simplified component props
- Improved onChange event handling
- Enhanced toolbar customization
- Performance optimizations

---

Made with ❤️ for the React community
