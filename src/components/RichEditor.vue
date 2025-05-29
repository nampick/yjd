<template>
  <div class="rich-editor-container">
    <div :id="editorId" class="rich-editor"></div>
  </div>
</template>

<script>
import { Editor } from '../lib/Editor';

export default {
  name: 'RichEditor',
  props: {
    // Editor options
    options: {
      type: Object,
      default: () => ({})
    },
    // Initial content
    modelValue: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      editor: null,
      editorId: `rich-editor-${Date.now()}`
    }
  },
  mounted() {
    this.initEditor();
  },
  beforeUnmount() {
    if (this.editor) {
      // Clean up any editor resources if needed
      this.editor = null;
    }
  },
  methods: {
    initEditor() {
      this.editor = new Editor(`#${this.editorId}`, this.options);
      this.editor.init();

      // Set initial content if provided
      if (this.modelValue) {
        this.editor.importContent(this.modelValue);
      }

      // Listen for content changes
      this.editor.editorArea.addEventListener('input', () => {
        this.$emit('update:modelValue', this.editor.editorArea.innerHTML);
      });
    },
    // Expose editor methods
    getContent() {
      return this.editor.editorArea.innerHTML;
    },
    setContent(content) {
      this.editor.importContent(content);
    },
    // Expose other editor methods as needed
    insertImage(url) {
      this.editor.insertImageWithStyle(url);
    },
    insertVideo(url) {
      this.editor.insertVideo(url);
    },
    toggleSourceView() {
      this.editor.toggleSourceView();
    },
    exportAsHTML() {
      return this.editor.exportAsHTML();
    }
  }
}
</script>

<style scoped>
.rich-editor-container {
  width: 100%;
  height: 100%;
}

.rich-editor {
  width: 100%;
  height: 100%;
}
</style> 