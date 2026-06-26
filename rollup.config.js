import terser from '@rollup/plugin-terser';

const terserPlugin = terser({
  compress: {
    drop_console: true,
    drop_debugger: true
  }
});

export default [
  // UMD build for <script> / CDN usage. Global `RichEditor` is the class itself,
  // so `new RichEditor(...)` works directly. Built from umd-entry.js.
  {
    input: 'umd-entry.js',
    output: {
      file: 'dist/rich-editor.min.js',
      format: 'umd',
      name: 'RichEditor',
      exports: 'default',
      sourcemap: true
    },
    plugins: [terserPlugin]
  },
  // ESM build for bundlers / `import`. Keeps default + named exports.
  {
    input: 'index.js',
    output: {
      file: 'dist/rich-editor.esm.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [terserPlugin]
  },
  // Bundled tree-shakeable core (named exports, no side effects). One file so
  // consumers of /core avoid a 50+ request ESM waterfall on first load.
  {
    input: 'core.js',
    output: {
      file: 'dist/core.esm.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [terserPlugin]
  }
];
