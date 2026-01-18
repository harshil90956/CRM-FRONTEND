import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = (env.VITE_DEV_PROXY_TARGET || env.VITE_API_URL || env.VITE_API_BASE_URL || '').trim();

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: proxyTarget
        ? {
            '/auth': { target: proxyTarget, changeOrigin: true },
            '/public': { target: proxyTarget, changeOrigin: true },
            '/super-admin': { target: proxyTarget, changeOrigin: true },
            '/dashboard': { target: proxyTarget, changeOrigin: true },
            '/projects': { target: proxyTarget, changeOrigin: true },
            '/units': { target: proxyTarget, changeOrigin: true },
            '/reviews': { target: proxyTarget, changeOrigin: true },
            '/bookings': { target: proxyTarget, changeOrigin: true },
            '/payments': { target: proxyTarget, changeOrigin: true },
            '/leads': { target: proxyTarget, changeOrigin: true },
            '/tenants': { target: proxyTarget, changeOrigin: true },
            '/users': { target: proxyTarget, changeOrigin: true },
          }
        : undefined,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
