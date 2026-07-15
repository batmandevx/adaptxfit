import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The frontend reaches the Python backend through this proxy, so there are
// no CORS issues and the app works from a single origin in the browser.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
