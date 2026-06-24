# @oix1987/yjd - Professional Rich Text Editor

A powerful, commercial-grade rich text editor with real-time content change tracking for web applications. Built with vanilla JavaScript for maximum performance and compatibility.

## 🚀 Features

- **Rich Text Formatting**: Bold, Italic, Underline, Strikethrough, Subscript, Superscript
- **Advanced Formatting**: Text alignment, line height, font family, text size, background colors
- **Content Management**: Images, tables, links, lists, emojis, videos
- **Real-time Tracking**: `onChange` callback for live content monitoring
- **Modern UI**: Customizable toolbar with intuitive controls
- **TypeScript Support**: Full type definitions included
- **Lightweight**: Pure JavaScript implementation, no heavy dependencies
- **Cross-browser**: Compatible with all modern browsers

## 📦 Installation

```bash
npm install @oix1987/yjd
```

## 💻 Usage

### Basic Implementation

```javascript
import RichEditor from "@oix1987/yjd";

const editor = new RichEditor("#editor-container", {
  content: "<p>Initial content</p>",
  height: 400,
  width: 800,
  theme: "light",
  placeholder: "Start typing...",
  onChange: (content) => {
    // Handle content changes here
    console.log("Content changed:", content);
    // Update your output container
    document.getElementById("output").innerHTML = content;
  },
});
```

### CDN Usage

```html
<!-- Using jsDelivr CDN -->
<script src="https://cdn.jsdelivr.net/npm/@oix1987/yjd@1.0.2/dist/rich-editor.min.js"></script>
<script>
  const editor = new RichEditor("#editor-container", {
    // configuration options
  });
</script>
```

### Alternative CDN

```html
<!-- Using unpkg CDN -->
<script src="https://unpkg.com/@oix1987/yjd@1.0.2/dist/rich-editor.min.js"></script>
```

## ⚙️ Configuration Options

| Option        | Type     | Default        | Description                                   |
| ------------- | -------- | -------------- | --------------------------------------------- |
| `content`     | string   | null           | Initial content for the editor                |
| `height`      | number   | 400            | Editor height in pixels                       |
| `width`       | number   | 800            | Editor width in pixels                        |
| `theme`       | string   | 'light'        | Editor theme (light/dark)                     |
| `placeholder` | string   | 'Type here...' | Placeholder text                              |
| `onChange`    | function | undefined      | Callback function called when content changes |

### onChange Callback

The `onChange` callback receives the current HTML content as a parameter:

```javascript
onChange: (content) => {
  // content is the HTML string of the editor content
  console.log("New content:", content);

  // Example: Update an output container
  document.getElementById("output").innerHTML = content;

  // Example: Send to server
  fetch("/api/save-content", {
    method: "POST",
    body: JSON.stringify({ content }),
    headers: { "Content-Type": "application/json" },
  });
};
```

## 🎯 Events

The editor supports comprehensive event handling:

```javascript
// Listen for text changes
editor.on("text-change", (content) => {
  console.log("Text changed:", content);
});

// Listen for focus events
editor.on("focus", () => {
  console.log("Editor focused");
});

// Remove event listener
editor.off("text-change", handler);
```

## 🔧 API Methods

| Method                | Description              | Parameters                         | Returns  |
| --------------------- | ------------------------ | ---------------------------------- | -------- |
| `getContent()`        | Get current HTML content | -                                  | `string` |
| `setContent(content)` | Set editor content       | `content: string`                  | `void`   |
| `focus()`             | Focus the editor         | -                                  | `void`   |
| `on(event, handler)`  | Add event listener       | `event: string, handler: function` | `void`   |
| `off(event, handler)` | Remove event listener    | `event: string, handler: function` | `void`   |

## 📦 Project Info

- **Author**: Oix1987
- **License**: ISC
- **Version**: 1.0.2

## 📄 License

Copyright (c) 2024 Oix1987

This software is released under the **ISC License** — a permissive open-source
license. You are free to use, copy, modify, and distribute it, provided the
copyright notice and this permission notice are preserved. The software is
provided "as is", without warranty of any kind.

## 🆘 Support

For technical support or feature requests, please contact the author or open an issue.

See `index.html` and `main.js` for a complete working example that demonstrates the `onChange` functionality with real-time output display.
