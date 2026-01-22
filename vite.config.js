import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures assets are linked relatively (helps with some hosting setups)
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})
