import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    hmr: {
      overlay: false // Desabilita o overlay de erros para permitir desenvolvimento
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      // Use custom service worker for push notification support
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      manifest: {
        name: 'Clube das Brabas',
        short_name: 'Clube Brabas',
        description: 'A comunidade das mulheres brabas. Conteúdo, comunidade e muito mais.',
        theme_color: '#1A1F2C',
        background_color: '#1A1F2C',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/tkbivipqiewkfnhktmqq\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
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
