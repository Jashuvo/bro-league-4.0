// vite.config.js - Fixed PWA Configuration
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { analyzer } from 'vite-bundle-analyzer'

export default defineConfig({
  plugins: [
    react(),
    // `npm run analyze` was broken — it ran `vite-bundle-analyzer` as a
    // standalone CLI (`npx vite-bundle-analyzer dist`), but the package
    // has no bin at all; it's a Vite PLUGIN. Wired up here instead,
    // gated behind ANALYZE=true so a normal `npm run build` never spins
    // up the analyzer's local preview server.
    process.env.ANALYZE === 'true' && analyzer(),
    VitePWA({
      registerType: 'autoUpdate',
      // We register the service worker ourselves (src/components/PWAUpdate.jsx,
      // via `virtual:pwa-register`) so we can show an in-app "Update
      // Available" banner instead of updating silently in the background.
      injectRegister: null,
      includeAssets: ['apple-icon-180.png', 'manifest-icon-192.png', 'manifest-icon-512.png'],
      manifest: {
        name: 'BRO League 5',
        short_name: 'BRO League',
        description: 'Fantasy Premier League competition with live standings, prizes, and stats',
        // Matches tailwind.config.js's light-theme `sunflower`/`surface` —
        // the gold badge chip and cream page ground the Memphis x Football
        // redesign actually uses, not the old indigo/white pairing.
        theme_color: '#efcb7c',
        background_color: '#fff4e6',
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
          },
          {
            src: 'manifest-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
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
