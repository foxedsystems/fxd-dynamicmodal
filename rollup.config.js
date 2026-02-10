import terser from '@rollup/plugin-terser';

const name = 'FxdDynamicModal';
const input = 'src/index.js';

export default [
  {
    input,
    output: [
      {
        file: 'dist/fxd-dynamicmodal.esm.js',
        format: 'es',
        sourcemap: true,
      },
      {
        file: 'dist/fxd-dynamicmodal.umd.js',
        format: 'umd',
        name,
        sourcemap: true,
      },
    ],
  },
  {
    input,
    output: [
      {
        file: 'dist/fxd-dynamicmodal.esm.min.js',
        format: 'es',
        sourcemap: true,
      },
      {
        file: 'dist/fxd-dynamicmodal.umd.min.js',
        format: 'umd',
        name,
        sourcemap: true,
      },
    ],
    plugins: [terser()],
  },
];