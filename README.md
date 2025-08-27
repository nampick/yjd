# Rich Editor Vue Component

A powerful and customizable rich text editor component for Vue 3 applications. This component provides a comprehensive WYSIWYG editing experience with extensive formatting options, toolbar customization, and seamless Vue integration.

## Features

- 🎨 **Rich Text Formatting**: Bold, italic, underline, strikethrough, subscript, superscript
- 🌈 **Color & Styling**: Text color, background color, font family, text size, line height
- 📝 **Text Structure**: Headings (H1-H6), text alignment, lists, indentation
- 🔗 **Media & Links**: Links, images, videos, tables, emojis
- 🛠 **Toolbar Customization**: Configurable toolbar with custom button groups
- 📱 **Responsive Design**: Modern, clean UI that works on all devices
- ⚡ **Vue 3 Integration**: Full Vue 3 composition API support with reactive content
- 🎯 **Event Handling**: Real-time content change detection and custom callbacks
- 🔄 **History Management**: Undo/redo functionality
- 📊 **Code View**: Toggle between WYSIWYG and HTML source code view

## Installation

```bash
npm install testyjdvue
```

## Quick Start

```vue
<template>
  <div>
    <RichEditorComponent
      v-model:content="content"
      @update:content="handleContentChange"
      @ready="handleEditorReady"
      :height="500"
      :width="800"
      placeholder="Start typing..."
      :toolbar1="['bold', 'italic', 'underline', 'strike']"
      :toolbar2="['color', 'background', 'text-size', 'link']"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import RichEditorComponent from "testyjdvue";

const content = ref("<p>Welcome to Rich Editor!</p>");

const handleContentChange = (newContent) => {
  console.log("Content changed:", newContent);
};

const handleEditorReady = (editor) => {
  console.log("Editor ready:", editor);
};
</script>
```

## Props

| Prop          | Type     | Default          | Description                                         |
| ------------- | -------- | ---------------- | --------------------------------------------------- |
| `content`     | String   | `null`           | Initial HTML content for the editor                 |
| `height`      | Number   | `400`            | Editor height in pixels                             |
| `width`       | Number   | `800`            | Editor width in pixels                              |
| `placeholder` | String   | `"Type here..."` | Placeholder text when editor is empty               |
| `onChange`    | Function | `null`           | Custom callback function for content changes        |
| `toolbar1`    | Array    | `null`           | Custom toolbar configuration for first toolbar row  |
| `toolbar2`    | Array    | `null`           | Custom toolbar configuration for second toolbar row |

## Toolbar Configuration

You can customize the toolbar by passing arrays with group structures:

```vue
<template>
  <RichEditorComponent :toolbar1="toolbar1" :toolbar2="toolbar2" />
</template>

<script setup>
// Proper toolbar configuration with groups
const toolbar1 = [
  { group: "text-format", items: ["bold", "italic", "underline", "strike"] },
  { group: "more", items: ["more"] },
];

const toolbar2 = [
  { group: "colors", items: ["color", "background"] },
  { group: "structure", items: ["heading", "text-align"] },
];
</script>
```

### Simple Array Format (Legacy Support)

For backward compatibility, you can still use simple arrays:

```vue
<RichEditorComponent
  :toolbar1="['bold', 'italic', 'underline', 'strike']"
  :toolbar2="['color', 'background', 'heading', 'text-align']"
/>
```

### Available Toolbar Buttons

**Text Formatting:**

- `bold`, `italic`, `underline`, `strike`
- `subscript`, `superscript`

**Colors & Styling:**

- `color`, `background`
- `font-family`, `text-size`, `line-height`
- `capitalization`

**Structure & Layout:**

- `heading`, `text-align`, `list`
- `indent-increase`, `indent-decrease`

**Media & Interactive:**

- `link`, `image`, `video`, `table`
- `emoji`

**Tools:**

- `undo`, `redo`, `code-view`

## Events

| Event            | Payload  | Description                              |
| ---------------- | -------- | ---------------------------------------- |
| `update:content` | `string` | Emitted when editor content changes      |
| `ready`          | `editor` | Emitted when editor is fully initialized |

## Methods

Access editor methods through the component reference:

```vue
<template>
  <RichEditorComponent ref="editorRef" />
</template>

<script setup>
import { ref } from "vue";

const editorRef = ref(null);

// Get current content
const getContent = () => {
  return editorRef.value.getContent();
};

// Set new content
const setContent = (htmlContent) => {
  editorRef.value.setContent(htmlContent);
};

// Focus the editor
const focusEditor = () => {
  editorRef.value.focus();
};

// Get editor instance
const getEditor = () => {
  return editorRef.value.getEditor();
};
</script>
```

## Development

### Project Setup

```bash
npm install
```

### Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Requirements

- Vue 3.x
- Node.js ^20.19.0 || >=22.12.0

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
