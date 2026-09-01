import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 8000,
    cssCodeSplit: false,
  },
  plugins: [viteSingleFile({ removeViteModuleLoader: true })],
});
