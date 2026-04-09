import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base: ruta donde queda la app en GitHub Pages
// el repo se llama pae, asi que la app vive en /pae/
export default defineConfig({
  base: '/pae/',
  plugins: [react()],
})
