import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Nota de seguridad: GEMINI_API_KEY se eliminó intencionalmente de aquí.
// Antes se inyectaba en el bundle del cliente con `define`, lo cual la
// dejaba visible en el JS servido al navegador. La clave solo debe vivir
// en el servidor (las funciones serverless de /api la leen directo de
// process.env, que Vercel inyecta de forma segura en tiempo de ejecución).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Separar dependencias grandes y estables en su propio chunk para
        // que el navegador las cachee entre despliegues (mejor rendimiento
        // en visitas repetidas).
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor-motion': ['motion'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
