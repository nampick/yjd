import terser from '@rollup/plugin-terser';

export default {
  input: 'index.js',
  output: [
    {
      file: 'dist/rich-editor.min.js',
      format: 'umd',
      name: 'RichEditor',
      sourcemap: true
    },
    {
      file: 'dist/rich-editor.esm.js',
      format: 'es',
      sourcemap: true
    }
  ],
  plugins: [
    terser({
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    })
  ]
};
