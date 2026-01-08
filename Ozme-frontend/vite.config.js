import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: '0.0.0.0', // Allow external connections
    strictPort: false,
    allowedHosts: [
      'www.ozme.in',
      'ozme.in',
      'localhost',
      '127.0.0.1',
      '82.112.231.165'
    ],
    // Disable HMR in production to avoid redirect issues
    hmr: false,
  },
})
