import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
    define: {
    global: 'window',
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        // target: 'http://back.devpoticard.kro.kr:8080',
        target: 'http://10.10.10.20:8080',
        // target:'https://api.poticard.kro.kr/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },

      '/ws': {
        // target: 'http://back.devpoticard.kro.kr:8080',
        target: 'http://10.10.10.20:8080',
        // target:'https://api.poticard.kro.kr/',
        ws: true,
        changeOrigin: true,
      },
    },
    allowedHosts : ['front.devpoticard.kro.kr']
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
