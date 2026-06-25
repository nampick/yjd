import terser from '@rollup/plugin-terser';

// Build each preset as its own tree-shaken bundle to demonstrate the size
// difference between feature sets (all built from the /core entry).
const presets = ['minimal', 'bubble', 'basic', 'standard'];

export default presets.map((name) => ({
  input: `demos/presets/${name}.js`,
  output: { file: `demos/dist/${name}.js`, format: 'es', sourcemap: false },
  plugins: [terser({ compress: { drop_console: true } })],
  onwarn(warning, warn) {
    if (warning.code === 'CIRCULAR_DEPENDENCY') return;
    warn(warning);
  }
}));
