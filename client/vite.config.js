import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Enable network access - listen on all interfaces
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://10.0.0.77:3001', // Use network IP instead of localhost for mobile access
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
