import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import {VitePWA} from "vite-plugin-pwa";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),
     VitePWA({
    registerType: 'autoUpdate',
    injectRegister: "auto",
    pwaAssets: {
      disabled: false,
      config: true,
    },
    includeAssets:["favicon.svg","wooden-background-wood-texture-brown-600nw-2477335391.webp","logo.png","astronaut.png"],
    manifest: {
      name: 'Letshost',
      short_name: 'Letshost',
      description: 'Deploy any website with Letshost’s all-in-one platform. Enjoy fast hosting, unlimited image tools, global CDN, and simple pricing. Try it free and see why developers trust us.',
      theme_color: '#000000',
    },

    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico,webp}'],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      maximumFileSizeToCacheInBytes:5 * 1024 * 1024
    },

    devOptions: {
      enabled: true,
      navigateFallback: 'index.html',
      suppressWarnings: true,
      type: 'module',
    },
  })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
