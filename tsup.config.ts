import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/errors/index.ts'],
  sourcemap: true,
  clean: true,
  dts: true,
  splitting: false,
  format: ['cjs', 'esm'],
  target: 'node16'
});
