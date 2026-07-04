import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Любой запрос /api/* проксируется на бэкенд.
      // Благодаря этому в коде пишем fetch('/api/login')
      // вместо fetch('http://localhost:3000/api/login').
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
