import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // O navegador roda no HOST, entao ele fala com a API pela porta publicada.
    proxy: { '/api': { target: 'http://api:3000', changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, '') } },
  },
});
