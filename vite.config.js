import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Must match your GitHub Pages path (site: https://retail-roulette.github.io/NSTEM/)
const repoName = 'NSTEM'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? `/${repoName}/` : '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
})
