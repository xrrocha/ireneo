import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: false,  // Don't clear dist (library build from tsc is there)
    lib: {
      entry: 'src/index.ts',
      name: 'Ireneo',
      fileName: () => 'ireneo.js',
      formats: ['es']
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  }
});
