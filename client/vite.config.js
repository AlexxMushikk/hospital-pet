import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
        '/api': {
            target: 'http://localhost:3000',
            changeOrigin: true,
        }
    }
  },
    test: {
        environment: 'jsdom',
        include: ['src/**/*.test.{js,jsx}'],
        restoreMocks: true,
        // West of Greenwich, where date-only strings parsed as UTC land on the previous day.
        env: { TZ: 'America/New_York' },
    },
})
