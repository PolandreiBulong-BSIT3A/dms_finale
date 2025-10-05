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
        // Create granular vendor chunks to shrink the main bundle
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-icons')) return 'icons';
            if (id.includes('react-router')) return 'react-router';
            if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
            if (id.includes('react-bootstrap') || id.includes('bootstrap')) return 'bootstrap';
            if (id.includes('react-select')) return 'react-select';
            if (id.includes('socket.io-client')) return 'realtime';
            if (id.match(/chart|recharts|echarts/)) return 'charts';
            if (id.includes('date-fns') || id.includes('dayjs') || id.includes('moment')) return 'date-lib';
            if (id.includes('lodash')) return 'lodash';
            // Fallback vendor chunk
            return 'vendor';
          }
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
