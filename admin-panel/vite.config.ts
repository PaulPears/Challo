import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://sy5b8p7tug.us-east-1.awsapprunner.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/uploads': {
        target: 'https://sy5b8p7tug.us-east-1.awsapprunner.com',
        changeOrigin: true
      }
    }
  }
})
