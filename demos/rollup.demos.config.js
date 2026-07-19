import terser from '@rollup/plugin-terser';

// Build each preset as its own tree-shaken bundle to demonstrate the size
// difference between feature sets (all built from the /core entry).
const presets = ['minimal', 'bubble', 'basic', 'standard'];

export default presets.map((name) => ({
  input: `demos/presets/${name}.js`,
  output: { file: `demos/dist/${name}.js`, format: 'es', sourcemap: false },
  // Feature modules register their own icons via a top-level registerIcons()
  // call. Rollup's default resolver ignores package.json "sideEffects", so it
  // would otherwise treat every such call as an unremovable side effect and
  // keep all icons. Honour the declared side-effect list (only the full-bundle
  // entries) so unused feature modules — and their icons — tree-shake away.
  treeshake: {
    moduleSideEffects: (id) => /index\.js$|umd-entry\.js$/.test(id)
  },
  plugins: [terser({ compress: { drop_console: true } })],
  onwarn(warning, warn) {
    if (warning.code === 'CIRCULAR_DEPENDENCY') return;
    warn(warning);
  }
}));
