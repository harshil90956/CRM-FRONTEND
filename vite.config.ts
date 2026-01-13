import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/auth': { target: 'http://127.0.0.1:3000', changeOrigin: true },
      '/public': { target: 'http://127.0.0.1:3000', changeOrigin: true },
      '/projects': { target: 'http://127.0.0.1:3000', changeOrigin: true },
      '/units': { target: 'http://127.0.0.1:3000', changeOrigin: true },
      '/reviews': { target: 'http://127.0.0.1:3000', changeOrigin: true },
      '/bookings': { target: 'http://127.0.0.1:3000', changeOrigin: true },
      '/payments': { target: 'http://127.0.0.1:3000', changeOrigin: true },
      '/leads': { target: 'http://127.0.0.1:3000', changeOrigin: true },
      '/tenants': { target: 'http://127.0.0.1:3000', changeOrigin: true },
      '/users': { target: 'http://127.0.0.1:3000', changeOrigin: true },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
