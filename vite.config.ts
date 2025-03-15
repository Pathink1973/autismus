import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
// Configure Vite for proper public asset handling
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  
  return {
    base: './',
    server: {
      host: 'localhost',
      port: 4000,
      strictPort: true,
      proxy: {
        '/.auth': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false
        }
      }
    },
    plugins: [react()],
    define: {
      // Make environment variables available to the app
      'process.env.VITE_APP_URL': isProd 
        ? JSON.stringify('https://autismus.netlify.app')
        : JSON.stringify('http://localhost:4000')
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    publicDir: 'public',
    build: {
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name].[hash][extname]',
        },
      },
    },
  }
});
