import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron({
      entry: 'electron/main.js',
      vite: {
        build: {
          target: 'node18',
          rollupOptions: {
            external: ['axios', 'cheerio', 'undici'],
          },
        },
      },
    }),
    renderer(),
  ],
})
