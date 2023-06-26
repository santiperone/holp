import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsConfigPaths()],
  build: {
    emptyOutDir: false,
    outDir: 'dist',
    sourcemap: true,
    lib: {
      entry: {
        index: './src/index.ts',
        errors: './src/errors/index.ts',
      },
      formats: ['es', 'cjs'],
    }
  },
});