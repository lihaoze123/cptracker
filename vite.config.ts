import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { TanStackRouterVite } from "@tanstack/router-vite-plugin"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), TanStackRouterVite(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // IMPORTANT: Order matters! Check specific packages BEFORE generic ones

          // Heavy dependencies that should be lazy-loaded (check FIRST)
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion';
          }
          if (id.includes('node_modules/react-day-picker')) {
            return 'date-picker';
          }
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'recharts';
          }
          if (id.includes('node_modules/react-syntax-highlighter')) {
            return 'syntax-highlighter';
          }

          // Markdown ecosystem - lazy loaded
          if (id.includes('node_modules/react-markdown') ||
              id.includes('node_modules/remark-') ||
              id.includes('node_modules/rehype-') ||
              id.includes('node_modules/katex') ||
              id.includes('node_modules/unified') ||
              id.includes('node_modules/unist-') ||
              id.includes('node_modules/mdast-') ||
              id.includes('node_modules/hast-') ||
              id.includes('node_modules/micromark')) {
            return 'markdown';
          }

          // Supabase - conditional load for cloud mode
          if (id.includes('node_modules/@supabase')) {
            return 'supabase';
          }

          // Core React - always loaded (check AFTER specific react-* packages)
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/')) {
            return 'react-core';
          }

          // TanStack - router and query are critical path
          if (id.includes('node_modules/@tanstack/react-router') ||
              id.includes('node_modules/@tanstack/react-query') ||
              id.includes('node_modules/@tanstack/history')) {
            return 'tanstack-core';
          }
          // TanStack Table - lazy loaded with problems-table
          if (id.includes('node_modules/@tanstack/react-table') ||
              id.includes('node_modules/@tanstack/table-core')) {
            return 'tanstack-table';
          }

          // UI components - critical path
          if (id.includes('node_modules/@radix-ui') || id.includes('node_modules/radix-ui')) {
            return 'ui-vendor';
          }

          // Utilities
          if (id.includes('node_modules/dexie')) {
            return 'dexie';
          }
          if (id.includes('node_modules/papaparse') ||
              id.includes('node_modules/date-fns') ||
              id.includes('node_modules/clsx') ||
              id.includes('node_modules/tailwind-merge')) {
            return 'utils';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
})
