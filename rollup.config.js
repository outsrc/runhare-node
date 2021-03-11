import typescript from 'rollup-plugin-typescript2'
import commonjs from 'rollup-plugin-commonjs'
import external from 'rollup-plugin-peer-deps-external'
import resolve from 'rollup-plugin-node-resolve'
import json from '@rollup/plugin-json'
import progress from 'rollup-plugin-progress'
import visualizer from 'rollup-plugin-visualizer'
import { terser } from 'rollup-plugin-terser'

import pkg from './package.json'

export default {
  input: 'src/index.ts',
  external: [
    'crypto',
    'http',
    'url',
    'https',
    'zlib',
    'stream',
    'assert',
    'tty',
    'util',
    'os'
  ],
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      exports: 'named',
      sourcemap: true
    },
    {
      file: pkg.module,
      format: 'es',
      exports: 'named',
      sourcemap: true
    }
  ],
  plugins: [
    progress(),
    visualizer(),
    json(),
    external(),
    typescript({
      rollupCommonJSResolveHack: true,
      exclude: '**/__tests__/**',
      clean: true
    }),
    resolve({
      browser: false,
      preferBuiltins: true
    }),
    commonjs({
      include: ['node_modules/**/*'],
      namedExports: {
        'node_modules/react/index.js': [
          'Children',
          'Component',
          'PropTypes',
          'createElement',
          'useState',
          'useMemo'
        ],
        'node_modules/react-dom/index.js': ['render']
      }
    }),
    terser()
  ]
}
