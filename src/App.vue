<script setup>
import { ref } from "vue";
import RichEditorComponent from "./components/RichEditorComponent.vue";

const handleContentChange = (newContent) => {
  console.log("Content changed:", newContent);
};

const handleEditorReady = (editor) => {
  console.log("Editor ready:", editor);
};

const content = ref("<p>Welcome to Rich Editor!</p>");

// Toolbar configuration
const toolbar1 = [
  { group: "123", items: ["bold", "italic", "underline", "strike"] },
  { group: "more", items: ["more"] },
];

const toolbar2 = [
  { group: "colors", items: ["color", "background"] },
  { group: "structure", items: ["text-size", "link"] },
];
</script>

<template>
  <div class="app">
    <h1>Rich Editor Vue Component Test</h1>
    <div class="editor-section">
      <RichEditorComponent
        v-model:content="content"
        @update:content="handleContentChange"
        @ready="handleEditorReady"
        :height="500"
        :width="800"
        placeholder="Bắt đầu viết..."
      />
    </div>
    <div class="content-display">
      <h3>Current Content:</h3>
      <pre>{{ content }}</pre>
    </div>
  </div>
</template>
