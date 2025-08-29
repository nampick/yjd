<template>
  <div ref="editorContainer" class="rich-editor-vue-component"></div>
</template>

<script>
import RichEditor from "./index.js";
import "./lib/styles.css";
import { triggerContentChange } from "./lib/utils/history-helper.js";

export default {
  name: "RichEditorComponent",
  props: {
    content: {
      type: String,
      default: null,
    },
    height: {
      type: Number,
      default: 400,
    },
    width: {
      type: Number,
      default: 800,
    },
    placeholder: {
      type: String,
      default: "Type here...",
    },
    onChange: {
      type: Function,
      default: null,
    },
    toolbar1: {
      type: Array,
      default: null,
    },
    toolbar2: {
      type: Array,
      default: null,
    },
  },
  data() {
    return {
      editor: null,
      mutationObserver: null,
      lastContent: "",
    };
  },
  mounted() {
    this.initializeEditor();
  },
  beforeUnmount() {
    this.destroyEditor();
  },
  watch: {
    content(newContent) {
      if (this.editor && newContent !== this.editor.getContent()) {
        this.editor.setContent(newContent || "");
      }
    },
    height(newHeight) {
      if (this.editor && this.editor.wrapper) {
        this.editor.wrapper.style.minHeight = newHeight + "px";
      }
    },
    width(newWidth) {
      if (this.editor && this.editor.wrapper) {
        this.editor.wrapper.style.width = newWidth + "px";
      }
    },
    placeholder(newPlaceholder) {
      if (this.editor && this.editor.editor) {
        this.editor.editor.setAttribute("placeholder", newPlaceholder);
      }
    },
  },
  methods: {
    initializeEditor() {
      if (!this.$refs.editorContainer) return;

      // Prepare editor options
      const options = {
        height: this.height,
        width: this.width,
        placeholder: this.placeholder,
        content: this.content,
        onChange: this.handleContentChange,
      };

      // Add toolbar configuration if provided
      if (this.toolbar1) {
        // Check if it's a simple array or proper group structure
        if (Array.isArray(this.toolbar1)) {
          // If first element is string, convert to group structure
          if (typeof this.toolbar1[0] === "string") {
            options.toolbar1 = [{ group: "custom", items: this.toolbar1 }];
          } else {
            // Already in proper group structure
            options.toolbar1 = this.toolbar1;
          }
        } else {
          options.toolbar1 = this.toolbar1;
        }
      }
      if (this.toolbar2) {
        // Check if it's a simple array or proper group structure
        if (Array.isArray(this.toolbar2)) {
          // If first element is string, convert to group structure
          if (typeof this.toolbar2[0] === "string") {
            options.toolbar2 = [{ group: "custom", items: this.toolbar2 }];
          } else {
            // Already in proper group structure
            options.toolbar2 = this.toolbar2;
          }
        } else {
          options.toolbar2 = this.toolbar2;
        }
      }

      // If either toolbar1 or toolbar2 is provided, set the toolbar option
      if (this.toolbar1 || this.toolbar2) {
        options.toolbar = true;
      }

      // Create editor instance
      this.editor = new RichEditor(this.$refs.editorContainer, options);

      // Setup content change monitoring
      this.setupContentMonitoring();

      // Store initial content
      this.lastContent = this.editor.getContent();

      // Emit ready event
      this.$emit("ready", this.editor);
    },

    destroyEditor() {
      // Cleanup mutation observer
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
        this.mutationObserver = null;
      }

      if (this.editor) {
        this.editor.destroy();
        this.editor = null;
      }
    },

    handleContentChange(content) {
      // Emit content change to parent
      this.$emit("update:content", content);

      // Call custom onChange handler if provided
      if (this.onChange && typeof this.onChange === "function") {
        this.onChange(content);
      }
    },

    // Public methods to interact with the editor
    getContent() {
      return this.editor ? this.editor.getContent() : "";
    },

    setContent(content) {
      if (this.editor) {
        this.editor.setContent(content || "");
      }
    },

    focus() {
      if (this.editor) {
        this.editor.focus();
      }
    },

    getEditor() {
      return this.editor;
    },

    setupContentMonitoring() {
      if (!this.editor || !this.editor.editor) return;

      // Setup MutationObserver to watch for content changes
      this.mutationObserver = new MutationObserver(() => {
        // Use triggerContentChange from history-helper to ensure onChange is called
        triggerContentChange();
      });

      // Start observing the editor content area
      this.mutationObserver.observe(this.editor.editor, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
        attributeFilter: ["style", "class", "href", "src", "alt", "title"],
      });

      // Also listen to input events for immediate changes
      this.editor.editor.addEventListener("input", () => {
        triggerContentChange();
      });

      // Listen to keyboard events that might change formatting
      this.editor.editor.addEventListener("keydown", (e) => {
        // Check for formatting shortcuts (Ctrl+B, Ctrl+I, etc.)
        if (e.ctrlKey || e.metaKey) {
          const formatKeys = ["b", "i", "u"];
          if (formatKeys.includes(e.key.toLowerCase())) {
            // Delay to let the formatting apply first
            setTimeout(() => {
              triggerContentChange();
            }, 10);
          }
        }
      });
    },
  },
};
</script>

<style scoped>
.rich-editor-vue-component {
  width: 100%;
  height: 100%;
}
</style>
