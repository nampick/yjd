import terser from '@rollup/plugin-terser';

const terserPlugin = terser({
  compress: {
    drop_console: true,
    drop_debugger: true
  }
});

export default [
  // UMD build for <script> / CDN usage. Global `yjd` is the class itself, so
  // `new yjd(...)` works directly. `window.RichEditor` is kept as an alias for
  // backward compatibility. Built from umd-entry.js.
  {
    input: 'umd-entry.js',
    output: {
      file: 'dist/rich-editor.min.js',
      format: 'umd',
      inlineDynamicImports: true,
      name: 'yjd',
      exports: 'default',
      sourcemap: true,
      footer: 'typeof window!=="undefined"&&(window.RichEditor=window.RichEditor||window.yjd);'
    },
    plugins: [terserPlugin]
  },
  // ESM build for bundlers / `import`. Keeps default + named exports.
  {
    input: 'index.js',
    output: {
      file: 'dist/rich-editor.esm.js',
      format: 'es',
      inlineDynamicImports: true,
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
      inlineDynamicImports: true,
      sourcemap: true
    },
    // Feature modules register their icons via a top-level registerIcons() call.
    // Honour package.json "sideEffects" (only the full-bundle entries) so unused
    // features and their icons tree-shake out of this /core build.
    treeshake: {
      moduleSideEffects: (id) => /index\.js$|umd-entry\.js$/.test(id)
    },
    plugins: [terserPlugin]
  }
];
