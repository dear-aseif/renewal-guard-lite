import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['renewal-guard-icon.svg'],
      manifest: {
        name: 'Renewal Guard Lite',
        short_name: 'Renewal Guard',
        description: 'A simple offline-first subscription reminder app.',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f4f7f6',
        theme_color: '#0f766e',
        icons: [
          {
            src: '/renewal-guard-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
      },
    }),
  ],
})
