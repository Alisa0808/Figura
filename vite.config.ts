import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.svg', 'icon-192x192.svg', 'icon-512x512.svg'],
          manifest: {
            name: 'Figura - Pose Generator',
            short_name: 'Figura',
            description: 'Upload a scene, get posing ideas. AI-powered tool for photographers and models.',
            theme_color: '#a8c878',
            background_color: '#faf6ee',
            display: 'standalone',
            orientation: 'portrait',
            icons: [
              {
                src: '/favicon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
                purpose: 'any maskable'
              },
              {
                src: '/icon-192x192.svg',
                sizes: '192x192',
                type: 'image/svg+xml',
                purpose: 'any maskable'
              },
              {
                src: '/icon-512x512.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
                purpose: 'any maskable'
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/api\.atlascloud\.ai\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'atlas-api-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 // 24 hours
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
