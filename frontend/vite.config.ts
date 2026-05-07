import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// base: ruta donde queda la app en GitHub Pages
// el repo se llama pae, asi que la app vive en /pae/
export default defineConfig({
  base: '/pae/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Iconos que se incluyen como "extra" en el precache
      includeAssets: ['icon.svg', 'favicon.svg', 'apple-touch-icon.png', 'og-image.svg'],
      manifest: {
        name: 'PAE - Programa de Alimentación Escolar',
        short_name: 'PAE',
        description: 'Reserva tu minuta y ayuda a reducir el desperdicio de alimentos.',
        lang: 'es',
        start_url: '/pae/',
        scope: '/pae/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2e9e6b',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precachea todo lo del build (JS/CSS con hash) + navegacion SPA
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        navigateFallback: '/pae/index.html',
      },
    }),
  ],
})
