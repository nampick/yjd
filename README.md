# Rich Text Editor

A powerful rich text editor with real-time content change tracking.

## Features

- Rich text formatting (Bold, Italic, Underline, Strikethrough, etc.)
- Real-time content change tracking with `onChange` callback
- Modern UI with customizable toolbar
- Support for images, tables, links, and more
- TypeScript support

## Usage

### Basic Usage

```javascript
import RichEditor from "./index.js";

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

### Options

| Option        | Type     | Default        | Description                                   |
| ------------- | -------- | -------------- | --------------------------------------------- |
| `content`     | string   | null           | Initial content for the editor                |
| `height`      | number   | 400            | Editor height in pixels                       |
| `width`       | number   | 800            | Editor width in pixels                        |
| `theme`       | string   | 'light'        | Editor theme                                  |
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

## Events

The editor also supports event listeners:

```javascript
// Listen for text changes
editor.on("text-change", (content) => {
  console.log("Text changed:", content);
});

// Remove event listener
editor.off("text-change", handler);
```

## Methods

- `getContent()` - Get current HTML content
- `setContent(content)` - Set editor content
- `focus()` - Focus the editor
- `on(event, handler)` - Add event listener
- `off(event, handler)` - Remove event listener

## Example

See `index.html` and `main.js` for a complete working example that demonstrates the `onChange` functionality with real-time output display.
