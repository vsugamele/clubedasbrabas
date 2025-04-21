import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false // Desabilita o overlay de erros para permitir desenvolvimento
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Alias para módulos do Capacitor para resolver problemas de importação
      "@capacitor/core": path.resolve(__dirname, "node_modules/@capacitor/core"),
      "@capacitor/preferences": path.resolve(__dirname, "node_modules/@capacitor/preferences"),
      "@capacitor/network": path.resolve(__dirname, "node_modules/@capacitor/network"),
      "@capacitor/camera": path.resolve(__dirname, "node_modules/@capacitor/camera"), 
      "@capacitor/share": path.resolve(__dirname, "node_modules/@capacitor/share"),
      "@capacitor/local-notifications": path.resolve(__dirname, "node_modules/@capacitor/local-notifications"),
      "@capacitor/push-notifications": path.resolve(__dirname, "node_modules/@capacitor/push-notifications"),
      "@capacitor/splash-screen": path.resolve(__dirname, "node_modules/@capacitor/splash-screen"),
      "@capacitor/status-bar": path.resolve(__dirname, "node_modules/@capacitor/status-bar"),
    },
  },
  optimizeDeps: {
    exclude: [
      '@capacitor/core',
      '@capacitor/preferences',
      '@capacitor/network',
      '@capacitor/camera',
      '@capacitor/share',
      '@capacitor/local-notifications',
      '@capacitor/push-notifications',
      '@capacitor/splash-screen',
      '@capacitor/status-bar'
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
}));
