import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// Permite acessar o Vite de fora do container (0.0.0.0) e evita erro de
// "host not allowed" quando o navegador acessa http://localhost:5173.
export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
});
