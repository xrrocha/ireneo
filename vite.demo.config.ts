import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';

export default defineConfig({
  plugins: [viteSingleFile()],
  root: 'src/demo',
  build: {
    target: 'es2020',
    outDir: '../../dist',
    emptyOutDir: false,  // Don't clear dist (library build is there)
    rollupOptions: {
      input: {
        demo: resolve(__dirname, 'src/demo/demo.html')
      },
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'demo.js',
        assetFileNames: 'demo.[ext]'
      }
    }
  },
  resolve: {
    alias: {
      // Resolve imports from parent src directory
      '../event-log.js': resolve(__dirname, 'src/event-log.ts'),
      '../transaction.js': resolve(__dirname, 'src/transaction.ts'),
      '../types.js': resolve(__dirname, 'src/types.ts'),
      '../memimg.js': resolve(__dirname, 'src/memimg.ts'),
      '../serialize.js': resolve(__dirname, 'src/serialize.ts'),
      '../deserialize.js': resolve(__dirname, 'src/deserialize.ts')
    }
  }
});
