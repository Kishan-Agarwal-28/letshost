import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { compression, defineAlgorithm } from "vite-plugin-compression2";
import { createHtmlPlugin } from "vite-plugin-html";
import viteCompression from "vite-plugin-compression";
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

    // Gzip compression
    viteCompression({
      verbose: false,
      disable: false,
      threshold: 1024, // Only compress files larger than 1KB
      algorithm: "gzip",
      ext: ".gz",
      compressionOptions: {
        level: 9, // Maximum compression
        chunkSize: 1024,
        windowBits: 15,
        memLevel: 8,
      },
      filter: /\.(js|mjs|json|css|html|svg)$/i,
      deleteOriginFile: false,
    }),

    // Brotli compression (better than gzip)
    viteCompression({
      verbose: false,
      disable: false,
      threshold: 1024,
      algorithm: "brotliCompress",
      ext: ".br",
      compressionOptions: {
        params: {
          [require("zlib").constants.BROTLI_PARAM_QUALITY]: 11, // Maximum quality
          [require("zlib").constants.BROTLI_PARAM_SIZE_HINT]: 0,
          [require("zlib").constants.BROTLI_PARAM_MODE]:
            require("zlib").constants.BROTLI_MODE_TEXT,
        },
      },
      filter: /\.(js|mjs|json|css|html|svg)$/i,
      deleteOriginFile: false,
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
        },
      },
    },
    terserOptions: {
      compress: {
        arguments: false,
        arrows: true,
        booleans: true,
        booleans_as_integers: false,
        collapse_vars: true,
        comparisons: true,
        computed_props: true,
        conditionals: true,
        dead_code: true,
        directives: true,
        drop_console: true,
        drop_debugger: true,
        ecma: 2020,
        evaluate: true,
        expression: false,
        global_defs: {},
        hoist_funs: false,
        hoist_props: true,
        hoist_vars: false,
        if_return: true,
        inline: true,
        join_vars: true,
        keep_fargs: true,
        keep_infinity: false,
        loops: true,
        negate_iife: true,
        properties: true,
        pure_funcs: [
          "console.log",
          "console.info",
          "console.debug",
          "console.trace",
          "console.warn",
        ],
        pure_getters: "strict",
        reduce_funcs: true,
        reduce_vars: true,
        sequences: true,
        side_effects: true,
        switches: true,
        top_retain: null,
        toplevel: false,
        typeofs: true,
        unsafe: false,
        unsafe_arrows: false,
        unsafe_comps: false,
        unsafe_Function: false,
        unsafe_math: false,
        unsafe_symbols: false,
        unsafe_methods: false,
        unsafe_proto: false,
        unsafe_regexp: false,
        unsafe_undefined: false,
        unused: true,
        passes: 3, // Multiple passes for better compression
      },
      mangle: {
        safari10: true,
        toplevel: true,
        eval: false,
        keep_fnames: false,
        reserved: [],
      },
      format: {
        comments: false,
        ascii_only: true,
      },
    },
    minify: "terser",
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
    exclude: ["@vite/client", "@vite/env"],
  },
});
