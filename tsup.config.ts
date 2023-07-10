import {defineConfig} from 'tsup';

export default defineConfig({
  entry: ['./src/**/*.ts'],
  bundle: false,
  sourcemap: true,
  clean: true,
  dts: true,
  format: ['cjs', 'esm'],
  target: 'node16',
  tsconfig: 'tsconfig.json',
});
