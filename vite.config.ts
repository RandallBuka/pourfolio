import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** GitHub Pages project site: https://randallbuka.github.io/pourfolio/ */
export default defineConfig(({ mode }) => ({
  base: process.env.VITE_BASE_PATH ?? (mode === 'production' ? '/pourfolio/' : '/'),
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
}))
