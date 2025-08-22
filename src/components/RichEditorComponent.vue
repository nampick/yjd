<template>
  <div ref="editorContainer"></div>
</template>

<script>
import RichEditor from "./index.js";
import "./lib/styles.css";

export default {
  name: "RichEditorComponent",
  props: {
    modelValue: {
      type: String,
      default: "",
    },
    options: {
      type: Object,
      default: () => ({}),
    },
    width: {
      type: [Number, String],
      default: 800,
    },
    height: {
      type: [Number, String],
      default: 400,
    },
    maxWidth: {
      type: [Number, String],
      default: 1200,
    },
    maxHeight: {
      type: [Number, String],
      default: 800,
    },
  },
  emits: ["update:modelValue", "text-change"],
  mounted() {
    // Merge size props with options
    const editorOptions = {
      ...this.options,
      width: typeof this.width === "string" ? parseInt(this.width) : this.width,
      height:
        typeof this.height === "string" ? parseInt(this.height) : this.height,
      maxWidth:
        typeof this.maxWidth === "string"
          ? parseInt(this.maxWidth)
          : this.maxWidth,
      maxHeight:
        typeof this.maxHeight === "string"
          ? parseInt(this.maxHeight)
          : this.maxHeight,
    };

    this.editor = RichEditor.create(this.$refs.editorContainer, editorOptions);

    // Set initial content if provided
    if (this.modelValue) {
      this.editor.setContent(this.modelValue);
    }

    // Listen for content changes
    this.editor.on("text-change", (content) => {
      this.$emit("update:modelValue", content);
      this.$emit("text-change", content);
    });
  },
};
</script>
