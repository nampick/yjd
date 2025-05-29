<template>

    <div class="editor-wrapper">
      <RichEditor
        v-model="content"
        :options="editorOptions"
        ref="editor"
      />
    </div>

</template>

<script>
import RichEditor from './components/RichEditor.vue'

export default {
  name: 'App',
  components: {
    RichEditor
  },
  data() {
    return {
      editorOptions: {
        theme: 'light'
      }
    }
  },
  methods: {
    toggleSource() {
      this.$refs.editor.toggleSourceView()
    },
    getContent() {
      const content = this.$refs.editor.getContent()
      console.log('Current content:', content)
    }
  }
}
</script>

<style>

.editor-wrapper {
  border: 1px solid #ccc;
  border-radius: 4px;
  margin: 20px 0;
}

</style> 