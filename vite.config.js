// vite.config.js - Fixed PWA Configuration
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // We register the service worker ourselves (src/components/PWAUpdate.jsx,
      // via `virtual:pwa-register`) so we can show an in-app "Update
      // Available" banner instead of updating silently in the background.
      injectRegister: null,
      includeAssets: ['apple-icon-180.png', 'manifest-icon-192.png', 'manifest-icon-512.png'],
      manifest: {
        name: 'BRO League 4.0',
        short_name: 'BRO League',
        description: 'Fantasy Premier League competition with live standings, prizes, and stats',
        // Matches tailwind.config.js's `bro-primary` — the color that
        // actually drives the UI via daisyUI, not the leftover violet this
        // used to disagree with.
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'manifest-icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'manifest-icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
