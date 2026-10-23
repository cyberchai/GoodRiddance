import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // In `npm run dev`, read live Firestore data through the deployed API.
    proxy: {
      '/api': {
        target:
          process.env.API_PROXY_TARGET ??
          'https://good-riddance-894711667409.us-east4.run.app',
        changeOrigin: true,
      },
    },
  },
})
