# YJD Vue3 Rich Editor

A powerful and professional rich text editor component for Vue 3 applications with real-time content change tracking. Built for modern web applications requiring advanced text editing capabilities.

## 🚀 Features

- 🎨 **Rich Text Formatting**: Bold, italic, underline, strikethrough, subscript, superscript
- 🌈 **Advanced Styling**: Text color, background color, font family, text size, line height
- 📝 **Document Structure**: Headings (H1-H6), text alignment, lists, indentation
- 🔗 **Media Integration**: Links, images, videos, tables, emojis
- 🛠 **Customizable Toolbars**: Dual toolbar system with flexible configuration
- 📱 **Responsive Design**: Modern, professional UI that works on all devices
- ⚡ **Vue 3 Optimized**: Full Vue 3 composition API support with reactive content
- 🎯 **Real-time Tracking**: Advanced content change detection and custom callbacks
- 🔄 **History Management**: Complete undo/redo functionality
- 📊 **Code View**: Toggle between WYSIWYG and HTML source code view
- 🎭 **Theme Support**: Multiple themes and customization options

## 📦 Installation

```bash
npm install @oix1987/yjd-vue3
```

## 🔧 Quick Start

```vue
<template>
  <div>
    <YjdRichEditor
      v-model:content="content"
      @update:content="handleContentChange"
      @ready="handleEditorReady"
      :height="500"
      :width="800"
      placeholder="Start creating amazing content..."
      :toolbar1="toolbar1"
      :toolbar2="toolbar2"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import YjdRichEditor from "@oix1987/yjd-vue3";

const content = ref("<p>Welcome to YJD Rich Editor!</p>");

// Professional toolbar configuration
const toolbar1 = [
  { group: "text-format", items: ["bold", "italic", "underline", "strike"] },
  { group: "more", items: ["more"] },
];

const toolbar2 = [
  { group: "colors", items: ["color", "background"] },
  { group: "structure", items: ["text-size", "link"] },
];

const handleContentChange = (newContent) => {
  console.log("Content changed:", newContent);
  // Your business logic here
};

const handleEditorReady = (editor) => {
  console.log("Editor ready:", editor);
  // Initialize your application logic
};
</script>
```

## 📋 API Reference

### Props

| Prop          | Type     | Default          | Description                                         |
| ------------- | -------- | ---------------- | --------------------------------------------------- |
| `content`     | String   | `null`           | Initial HTML content for the editor                 |
| `height`      | Number   | `400`            | Editor height in pixels                             |
| `width`       | Number   | `800`            | Editor width in pixels                              |
| `placeholder` | String   | `"Type here..."` | Placeholder text when editor is empty               |
| `onChange`    | Function | `null`           | Custom callback function for content changes        |
| `toolbar1`    | Array    | `null`           | Custom toolbar configuration for first toolbar row  |
| `toolbar2`    | Array    | `null`           | Custom toolbar configuration for second toolbar row |

### Events

| Event            | Payload  | Description                              |
| ---------------- | -------- | ---------------------------------------- |
| `update:content` | `string` | Emitted when editor content changes      |
| `ready`          | `editor` | Emitted when editor is fully initialized |

## 🎛️ Toolbar Configuration

### Professional Group Structure

```vue
<script setup>
// Advanced toolbar configuration
const toolbar1 = [
  { group: "text-format", items: ["bold", "italic", "underline", "strike"] },
  { group: "script", items: ["subscript", "superscript"] },
  { group: "more", items: ["more"] },
];

const toolbar2 = [
  { group: "colors", items: ["color", "background"] },
  { group: "structure", items: ["heading", "text-align"] },
  { group: "media", items: ["link", "image", "table"] },
];
</script>
```

### Available Toolbar Items

**Text Formatting:**

- `bold`, `italic`, `underline`, `strike`
- `subscript`, `superscript`

**Colors & Styling:**

- `color`, `background`
- `font-family`, `text-size`, `line-height`
- `capitalization`

**Document Structure:**

- `heading`, `text-align`, `list`
- `indent-increase`, `indent-decrease`

**Media & Interactive:**

- `link`, `image`, `video`, `table`
- `emoji`

**Tools & Actions:**

- `undo`, `redo`, `code-view`
- `more` (expands toolbar options)

## 🔧 Advanced Usage

### Component Methods

```vue
<template>
  <YjdRichEditor ref="editorRef" />
</template>

<script setup>
import { ref } from "vue";

const editorRef = ref(null);

// Get current content
const getCurrentContent = () => {
  return editorRef.value.getContent();
};

// Set new content programmatically
const setEditorContent = (htmlContent) => {
  editorRef.value.setContent(htmlContent);
};

// Focus the editor
const focusEditor = () => {
  editorRef.value.focus();
};

// Access the core editor instance
const getEditorInstance = () => {
  return editorRef.value.getEditor();
};
</script>
```

### Real-time Content Tracking

```vue
<script setup>
const handleContentChange = (content) => {
  // Real-time content tracking
  console.log("Content length:", content.length);

  // Auto-save functionality
  if (content.length > 0) {
    autoSave(content);
  }

  // Content validation
  validateContent(content);
};

const autoSave = (content) => {
  // Implement your auto-save logic
  localStorage.setItem("draft", content);
};

const validateContent = (content) => {
  // Implement content validation
  const wordCount = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  console.log("Word count:", wordCount);
};
</script>
```

## Development

### Project Setup

```bash
# Clone the repository
git clone https://github.com/oix1987/yjd-vue3.git

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build Commands

```bash
# Build library for production
npm run build

# Build demo application
npm run build:demo

# Run linter
npm run lint
```

## 🌐 Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 📋 Requirements

- **Vue.js**: 3.0.0 or higher
- **Node.js**: ^20.19.0 || >=22.12.0
- **Modern Browser**: ES6+ support required

## 📄 License

ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Oix1987**

- Professional Vue.js Developer
- Rich Text Editor Specialist

## 🤝 Commercial Support

This is a commercial-grade component suitable for:

- ✅ Enterprise applications
- ✅ Content management systems
- ✅ E-learning platforms
- ✅ Documentation tools
- ✅ Blog and publishing platforms

For commercial support, custom features, or enterprise licensing, please contact the author.

## 🚀 Why Choose YJD Vue3 Rich Editor?

- **Production Ready**: Battle-tested in real-world applications
- **Performance Optimized**: Efficient rendering and memory management
- **Highly Customizable**: Extensive configuration options
- **Professional Support**: Commercial-grade documentation and support
- **Regular Updates**: Continuous improvement and feature additions
- **Vue 3 Native**: Built specifically for Vue 3 ecosystem

## 📈 Changelog

### v1.0.1

- Initial commercial release
- Full Vue 3 support
- Advanced toolbar configuration
- Real-time content tracking
- Professional UI/UX

---

**Made with ❤️ for the Vue.js community**
