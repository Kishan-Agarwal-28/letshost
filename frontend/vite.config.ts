import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { compression, defineAlgorithm } from "vite-plugin-compression2";
import { createHtmlPlugin } from "vite-plugin-html";

import { createRequire } from "module";

const require = createRequire(import.meta.url);
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    createHtmlPlugin({
      minify: {
        collapseWhitespace: true,
        keepClosingSlash: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyJS: true,
        removeEmptyAttributes: true,
        removeAttributeQuotes: true,
        collapseBooleanAttributes: true,
        sortAttributes: true,
        sortClassName: true,
      },
    }),
    // Advanced compression plugin
    compression({
      include: /\.(html|xml|css|js|mjs|json|svg)$/,
      threshold: 1024,
      skipIfLargerOrEqual: true,
      algorithms: [
        defineAlgorithm("gzip", { level: 9 }),
        defineAlgorithm("brotliCompress", {
          params: {
            [require("zlib").constants.BROTLI_PARAM_QUALITY]: 11,
          },
        }),
      ],
    }),

    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      pwaAssets: {
        disabled: false,
        config: true,
      },
      includeAssets: [
        "favicon.svg",
        "wooden-background-wood-texture-brown-600nw-2477335391.webp",
        "logo.png",
        "astronaut.png",
      ],
      manifest: {
        name: "Letshost",
        short_name: "Letshost",
        description:
          "Deploy any website with Letshost's all-in-one platform. Enjoy fast hosting, unlimited image tools, global CDN, and simple pricing. Try it free and see why developers trust us.",
        theme_color: "#000000",
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webp}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
    {
      urlPattern: /.*\.(?:webp|png|jpg|jpeg|svg|ico)/,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
      },
      devOptions: {
        enabled: true,
        navigateFallback: "index.html",
        suppressWarnings: true,
        type: "module",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
      },
      // Split chunks to reduce memory usage
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          lottie: ["lottie-web"],
          crypto: ["crypto-js"],
        },
      },
    },
    terserOptions: {
      compress: {
        // Keep only the safest compression options
        dead_code: true,
        drop_console: true,
        drop_debugger: true,
        unused: true,
        // Disable potentially problematic options
        arrows: false,
        collapse_vars: false,
        comparisons: false,
        computed_props: false,
        conditionals: false,
        evaluate: false,
        hoist_props: false,
        inline: false,
        join_vars: false,
        loops: false,
        properties: false,
        reduce_funcs: false,
        reduce_vars: false,
        sequences: false,
        side_effects: false,
        switches: false,
        passes: 1, // Single pass to avoid aggressive optimization
      },
      mangle: {
        safari10: true,
        toplevel: false,
        eval: false,
        keep_fnames: false,
        properties: false, // Disable property mangling entirely
        reserved: [
          "CryptoJS", "AES", "encrypt", "decrypt", "enc", "Utf8", "toString", "S", "T", "U", "V", "W", "X", "Y", "Z"
        ],
      },
      format: {
        comments: false,
        ascii_only: true,
      },
    },
    minify: "terser",
  },
  optimizeDeps: {
    include: ["react", "react-dom", "crypto-js"], // Include crypto-js in optimization
    exclude: ["@vite/client", "@vite/env"],
  },
});