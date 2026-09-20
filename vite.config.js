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
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // The generated sw.js has no push-event hooks of its own — this
        // injects public/push-listener.js's `push`/`notificationclick`
        // handlers into it so web-push broadcasts (sent by the warm-cache
        // cron) actually show notifications.
        importScripts: ['/push-listener.js']
      }
    })
  ],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Split the two big runtime libraries out of the app chunk. They
        // change only when the dependency is upgraded, while the app chunk
        // changes on every deploy — keeping them separate means a returning
        // visitor re-downloads the app code alone instead of the whole
        // 375 kB (118 kB gzipped) bundle. The tab views are already split
        // by the lazy imports in App.jsx; this is the last big slice.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('react-dom') || id.includes('scheduler')) return 'vendor-react';
          if (/node_modules\/react\//.test(id)) return 'vendor-react';
          return undefined;
        }
      }
    }
  }
})
