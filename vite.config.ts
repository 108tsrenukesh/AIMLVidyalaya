import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/AIMLVidyalaya/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Vidyalaya - Learning Platform',
        short_name: 'Vidyalaya',
        description: 'Offline educational learning platform',
        theme_color: '#0d0f14',
        background_color: '#0d0f14',
        display: 'standalone',
        scope: '/AIMLVidyalaya/',
        start_url: '/AIMLVidyalaya/',
        icons: [
          {
            src: '/AIMLVidyalaya/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          },
          {
            src: '/AIMLVidyalaya/logo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0
  }
})
