import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';
import copy from 'rollup-plugin-copy';

import packageJson from './package.json' assert { type: 'json' };

export default {
  input: 'react.js',
  output: [
    {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
      interop: 'auto'
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    }
  ],
  plugins: [
    peerDepsExternal(),
    resolve({
      browser: true,
      preferBuiltins: false,
      extensions: ['.js', '.jsx']
    }),
    commonjs({
      include: ['src/**', 'node_modules/**'],
      exclude: []
    }),
    postcss({
      extract: false,
      minimize: true,
      inject: true,
      modules: false
    }),
    copy({
      targets: [
        {
          src: 'src/assets/icon/*',
          dest: 'dist/assets/icon'
        }
      ],
      verbose: true
    }),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      extensions: ['.js', '.jsx'],
      presets: [
        ['@babel/preset-env', { 
          modules: false,
          targets: {
            node: '14',
            browsers: ['> 1%', 'last 2 versions', 'not dead']
          }
        }],
        ['@babel/preset-react', { runtime: 'automatic' }]
      ]
    }),
    terser({
      compress: {
        drop_console: true
      }
    })
  ],
  external: (id) => {
    // Only externalize react and react-dom
    return ['react', 'react-dom'].includes(id) || id.startsWith('react/');
  }
};
