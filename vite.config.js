import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',  // Set base URL for production
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable sourcemaps in production
    minify: 'terser',
    chunkSizeWarningLimit: 1000, // Increase chunk size warning limit
    rollupOptions: {
      output: {
        // Simplified, stable vendor chunking to avoid initialization issues
        manualChunks: {
          // Core React bundle - keep together for stable initialization
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI libraries
          'ui-vendor': ['react-bootstrap', 'react-select', 'react-icons'],
          // Socket/realtime
          'realtime': ['socket.io-client'],
        },
        // Better caching for code-split chunks
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      },
    },
  },
  server: {
    port: 3000,
    open: true
  }
});
