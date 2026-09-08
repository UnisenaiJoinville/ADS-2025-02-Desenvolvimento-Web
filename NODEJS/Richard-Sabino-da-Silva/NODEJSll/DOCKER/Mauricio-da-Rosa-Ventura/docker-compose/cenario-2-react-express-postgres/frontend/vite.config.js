import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    // permite que o proxy Nginx (container "proxy") acesse este dev server
    allowedHosts: true,
    hmr: {
      // o navegador acessa via http://localhost:8080, mas o HMR precisa
      // saber falar com o processo do Vite atraves do proxy
      clientPort: 8080,
    },
  },
});
