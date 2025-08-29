# Vue 2 Rich Editor Component

A powerful and customizable rich text editor component for Vue 2 applications, built as a standalone Vue component.

## Features

- 🎨 **Rich Text Editing**: Bold, italic, underline, strikethrough, and more
- 📝 **Text Formatting**: Font family, size, color, background color
- 📋 **Lists & Indentation**: Bullet lists, numbered lists, and indentation controls
- 🔗 **Links & Media**: Insert links, images, videos, and emojis
- 📊 **Tables**: Create and edit tables with toolbar
- 🎯 **Text Alignment**: Left, center, right, and justify alignment
- 📏 **Line Height**: Adjust line spacing
- 🏷️ **Tags**: Add custom tags to content
- 📄 **Headings**: Multiple heading levels (H1-H6)
- 🔄 **History**: Undo/redo functionality
- 📱 **Responsive**: Works on desktop and mobile devices
- 🎨 **Customizable**: Highly customizable toolbar and styling

## Installation

```bash
npm install vue2-rich-editor
```

### Option 1: Direct Import

```javascript
import RichEditor from "vue2-rich-editor";

// Use in your Vue component
export default {
  mounted() {
    this.editor = new RichEditor(this.$refs.editorContainer, {
      height: 400,
      width: 800,
      placeholder: "Start typing...",
      content: "<p>Hello <strong>World</strong>!</p>",
      onChange: (content) => {
        this.content = content;
      },
    });
  },
  beforeUnmount() {
    if (this.editor) {
      this.editor.destroy();
    }
  },
};
```

### Option 2: Create a Vue Component Wrapper

```javascript
import RichEditor from "vue2-rich-editor";

// Create a Vue component wrapper
const RichEditorComponent = {
  name: "RichEditorComponent",
  props: {
    content: String,
    height: { type: Number, default: 400 },
    width: { type: Number, default: 800 },
    placeholder: { type: String, default: "Type here..." },
  },
  mounted() {
    this.initializeEditor();
  },
  beforeUnmount() {
    if (this.editor) {
      this.editor.destroy();
    }
  },
  methods: {
    initializeEditor() {
      this.editor = new RichEditor(this.$refs.editorContainer, {
        height: this.height,
        width: this.width,
        placeholder: this.placeholder,
        content: this.content,
        onChange: (content) => {
          this.$emit("update:content", content);
        },
      });
    },
  },
  template: '<div ref="editorContainer"></div>',
};

// Register globally
Vue.component("RichEditorComponent", RichEditorComponent);
```

## Basic Usage

### Simple Implementation

```vue
<template>
  <div id="app">
    <div ref="editorContainer"></div>
  </div>
</template>

<script>
import RichEditor from "vue2-rich-editor";

export default {
  name: "App",
  data() {
    return {
      content: "<p>Hello <strong>World</strong>!</p>",
      editor: null,
    };
  },
  mounted() {
    this.initializeEditor();
  },
  beforeUnmount() {
    if (this.editor) {
      this.editor.destroy();
    }
  },
  methods: {
    initializeEditor() {
      this.editor = new RichEditor(this.$refs.editorContainer, {
        height: 400,
        width: 800,
        placeholder: "Start typing...",
        content: this.content,
        onChange: (content) => {
          this.content = content;
          console.log("Content changed:", content);
        },
        onReady: (editor) => {
          console.log("Editor is ready:", editor);
        },
      });
    },
  },
};
</script>
```

### With Two-Way Data Binding

```vue
<template>
  <div>
    <div ref="editorContainer"></div>

    <div class="preview">
      <h3>Preview:</h3>
      <div v-html="editorContent"></div>
    </div>
  </div>
</template>

<script>
import RichEditor from "vue2-rich-editor";

export default {
  data() {
    return {
      editorContent: "<p>Initial content</p>",
      editor: null,
    };
  },
  mounted() {
    this.initializeEditor();
  },
  beforeUnmount() {
    if (this.editor) {
      this.editor.destroy();
    }
  },
  methods: {
    initializeEditor() {
      this.editor = new RichEditor(this.$refs.editorContainer, {
        height: 500,
        width: 800,
        placeholder: "Write your content here...",
        content: this.editorContent,
        onChange: (content) => {
          this.editorContent = content;
        },
      });
    },
  },
};
</script>
```

## Options

| Option        | Type     | Default          | Description                     |
| ------------- | -------- | ---------------- | ------------------------------- |
| `content`     | String   | `null`           | Initial content (HTML)          |
| `height`      | Number   | `400`            | Editor height in pixels         |
| `width`       | Number   | `800`            | Editor width in pixels          |
| `placeholder` | String   | `"Type here..."` | Placeholder text                |
| `onChange`    | Function | `null`           | Content change handler function |
| `onReady`     | Function | `null`           | Editor ready handler function   |
| `toolbar1`    | Array    | `null`           | Primary toolbar configuration   |
| `toolbar2`    | Array    | `null`           | Secondary toolbar configuration |

## Events

| Event      | Parameters | Description                       |
| ---------- | ---------- | --------------------------------- |
| `onChange` | `content`  | Called when content changes       |
| `onReady`  | `editor`   | Called when editor is initialized |

## Methods

Access the editor methods through the editor instance:

```vue
<template>
  <div>
    <div ref="editorContainer"></div>
    <button @click="getContent">Get Content</button>
    <button @click="setContent">Set Content</button>
    <button @click="focusEditor">Focus Editor</button>
  </div>
</template>

<script>
import RichEditor from "vue2-rich-editor";

export default {
  data() {
    return {
      content: "<p>Hello World!</p>",
      editor: null,
    };
  },
  mounted() {
    this.initializeEditor();
  },
  beforeUnmount() {
    if (this.editor) {
      this.editor.destroy();
    }
  },
  methods: {
    initializeEditor() {
      this.editor = new RichEditor(this.$refs.editorContainer, {
        content: this.content,
        onChange: (content) => {
          this.content = content;
        },
      });
    },
    getContent() {
      if (this.editor) {
        const content = this.editor.getContent();
        console.log("Current content:", content);
      }
    },
    setContent() {
      if (this.editor) {
        this.editor.setContent("<p>New content set programmatically!</p>");
      }
    },
    focusEditor() {
      if (this.editor) {
        this.editor.focus();
      }
    },
  },
};
</script>
```

### Available Methods

- `getContent()` - Returns the current HTML content
- `setContent(content)` - Sets the editor content
- `focus()` - Focuses the editor
- `destroy()` - Destroys the editor instance

## Toolbar Configuration

### Simple Toolbar Arrays

```vue
<template>
  <div ref="editorContainer"></div>
</template>

<script>
import RichEditor from "vue2-rich-editor";

export default {
  mounted() {
    this.editor = new RichEditor(this.$refs.editorContainer, {
      toolbar1: ["bold", "italic", "underline", "color"],
      toolbar2: ["heading", "list", "link", "image"],
    });
  },
  beforeUnmount() {
    if (this.editor) {
      this.editor.destroy();
    }
  },
};
</script>
```

### Advanced Toolbar Groups

```vue
<template>
  <div ref="editorContainer"></div>
</template>

<script>
import RichEditor from "vue2-rich-editor";

export default {
  data() {
    return {
      toolbarConfig: [
        {
          group: "formatting",
          items: ["bold", "italic", "underline", "strike"],
        },
        {
          group: "text",
          items: ["font-family", "text-size", "color", "background"],
        },
        {
          group: "layout",
          items: ["heading", "text-align", "list", "indent"],
        },
      ],
    };
  },
  mounted() {
    this.editor = new RichEditor(this.$refs.editorContainer, {
      toolbar1: this.toolbarConfig,
    });
  },
  beforeUnmount() {
    if (this.editor) {
      this.editor.destroy();
    }
  },
};
</script>
```

### Available Formats

- `bold` - Bold text
- `italic` - Italic text
- `underline` - Underlined text
- `strike` - Strikethrough text
- `subscript` - Subscript text
- `superscript` - Superscript text
- `color` - Text color
- `background` - Background color
- `font-family` - Font family
- `text-size` - Text size
- `heading` - Headings (H1-H6)
- `text-align` - Text alignment
- `list` - Bullet and numbered lists
- `indent` - Indentation controls
- `link` - Insert/edit links
- `image` - Insert images
- `video` - Insert videos
- `table` - Create/edit tables
- `emoji` - Insert emojis
- `tag` - Insert tags
- `line-height` - Line height adjustment
- `capitalization` - Text capitalization

## Advanced Usage

### Custom Change Handler

```vue
<template>
  <div ref="editorContainer"></div>
</template>

<script>
import RichEditor from "vue2-rich-editor";

export default {
  data() {
    return {
      content: "<p>Initial content</p>",
      editor: null,
    };
  },
  mounted() {
    this.initializeEditor();
  },
  beforeUnmount() {
    if (this.editor) {
      this.editor.destroy();
    }
  },
  methods: {
    initializeEditor() {
      this.editor = new RichEditor(this.$refs.editorContainer, {
        content: this.content,
        onChange: this.handleContentChange,
      });
    },
    handleContentChange(newContent) {
      console.log("Content changed:", newContent);
      this.content = newContent;
      // Save to database, validate, etc.
      this.saveContent(newContent);
    },
    saveContent(content) {
      // Your save logic here
    },
  },
};
</script>
```

### Accessing Editor Instance

```vue
<template>
  <div ref="editorContainer"></div>
</template>

<script>
import RichEditor from "vue2-rich-editor";

export default {
  data() {
    return {
      editor: null,
    };
  },
  mounted() {
    this.initializeEditor();
  },
  beforeUnmount() {
    if (this.editor) {
      this.editor.destroy();
    }
  },
  methods: {
    initializeEditor() {
      this.editor = new RichEditor(this.$refs.editorContainer, {
        onReady: this.onEditorReady,
      });
    },
    onEditorReady(editorInstance) {
      // Access the underlying editor API
      console.log("Editor instance:", editorInstance);

      // You can now use all editor methods
      editorInstance.focus();
      editorInstance.setContent("<p>Programmatically set content</p>");
    },
  },
};
</script>
```

### Responsive Design

```vue
<template>
  <div class="editor-container">
    <div ref="editorContainer"></div>
  </div>
</template>

<script>
import RichEditor from "vue2-rich-editor";

export default {
  data() {
    return {
      content: "",
      editorHeight: 400,
      editorWidth: 800,
      editor: null,
    };
  },
  mounted() {
    this.initializeEditor();
    this.adjustEditorSize();
    window.addEventListener("resize", this.adjustEditorSize);
  },
  beforeUnmount() {
    if (this.editor) {
      this.editor.destroy();
    }
    window.removeEventListener("resize", this.adjustEditorSize);
  },
  methods: {
    initializeEditor() {
      this.editor = new RichEditor(this.$refs.editorContainer, {
        height: this.editorHeight,
        width: this.editorWidth,
        content: this.content,
        onChange: (content) => {
          this.content = content;
        },
      });
    },
    adjustEditorSize() {
      const container = this.$el.querySelector(".editor-container");
      if (container && this.editor) {
        this.editorWidth = container.offsetWidth;
        this.editorHeight = Math.max(400, window.innerHeight * 0.6);

        // Update editor size
        this.editor.wrapper.style.width = this.editorWidth + "px";
        this.editor.wrapper.style.minHeight = this.editorHeight + "px";
      }
    },
  },
};
</script>

<style scoped>
.editor-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
</style>
```

## Styling

The component includes default styles, but you can customize them:

```css
/* Custom editor styles */
.rich-editor-vue-component {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Override toolbar styles */
.yjd-rich-editor .toolbar {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

/* Custom content area */
.yjd-rich-editor .rich-editor-area {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 16px;
  line-height: 1.6;
}
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- IE 11+

## Dependencies

The package requires the following dependencies to be available in your project:

- Vue 2.x

All other dependencies and styles are bundled within the package. CSS is automatically loaded when you import the library.

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please open an issue on the project repository.
