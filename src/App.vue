<script setup>
import { ref } from "vue";
import RichEditorComponent from "./components/RichEditorComponent.vue";

const handleTextChange = (newContent) => {
  console.log("Content changed:", newContent);
};

const content = ref("<p></p>");
</script>

<template>
  <div class="app">
    <div class="editor-section">
      <RichEditorComponent
        v-model="content"
        @text-change="handleTextChange"
        height="500"
        width="900"
        :options="{
          placeholder: 'Bắt đầu viết...',
          theme: 'default',
        }"
      />
    </div>
  </div>
</template>
