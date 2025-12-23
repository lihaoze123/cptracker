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
          // Vendor chunks for better caching
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-day-picker') || id.includes('node_modules/react-markdown') ||
              id.includes('node_modules/framer-motion')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/@tanstack')) {
            return 'tanstack-vendor';
          }
          if (id.includes('node_modules/@radix-ui') || id.includes('node_modules/radix-ui')) {
            return 'ui-vendor';
          }

          // Heavy dependencies - separate chunks for code splitting
          if (id.includes('node_modules/recharts')) {
            return 'recharts';
          }
          if (id.includes('node_modules/react-syntax-highlighter')) {
            return 'syntax-highlighter';
          }
          if (id.includes('node_modules/remark-gfm') ||
              id.includes('node_modules/remark-math') ||
              id.includes('node_modules/rehype-katex')) {
            return 'markdown';
          }

          // Supabase - separate chunk
          if (id.includes('node_modules/@supabase')) {
            return 'supabase';
          }

          // Other utilities
          if (id.includes('node_modules/papaparse') ||
              id.includes('node_modules/dexie') ||
              id.includes('node_modules/date-fns')) {
            return 'utils';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
