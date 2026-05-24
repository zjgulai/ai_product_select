import devServer from "@hono/vite-dev-server"
import path from "path"
const __dirname = import.meta.dirname
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    devServer({ entry: "api/boot.ts", exclude: [/^\/(?!api\/).*$/, /^\/api\/services\/mockData\//] }),
    inspectAttr(), react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@contracts": path.resolve(__dirname, "./contracts"),
      "@db": path.resolve(__dirname, "./db"),
      "db": path.resolve(__dirname, "./db"),
    },
  },
  envDir: path.resolve(__dirname),
  define: {
    'import.meta.env.VITE_USE_MOCK_DATA': '"true"',
  },
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-dom/client', 'react-router', 'react-router-dom'],
          'echarts': ['echarts', 'echarts-for-react'],
          'trpc': ['@trpc/client', '@trpc/react-query', '@trpc/server', '@tanstack/react-query'],
          'lucide': ['lucide-react'],
          'recharts': ['recharts'],
        },
      },
    },
  },
});
