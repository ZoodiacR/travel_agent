// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Configuración para el servidor de desarrollo
    // Puedes habilitar CORS aquí si es necesario, pero el proxy es mejor
    cors: true,
    
    // Proxy para redirigir peticiones a tu backend
    // Esto es muy útil para el desarrollo y evita problemas de CORS
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // URL de tu backend de FastAPI
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    // Configuración para la construcción de producción
    outDir: 'dist',
    sourcemap: true,
  },
});