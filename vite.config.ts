import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'https://erpcompras-production.up.railway.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
      // Proxy dedicado para el servicio de tareas externo durante desarrollo
      '/tareas-api': {
        target: 'https://exclousit.up.railway.app',
        changeOrigin: true,
        secure: true,
        // '/tareas-api/*' -> 'https://exclousit.up.railway.app/api/*'
        rewrite: (path) => path.replace(/^\/tareas-api/, '/api'),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})