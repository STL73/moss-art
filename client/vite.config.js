import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { imagetools } from 'vite-imagetools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Photographs are imported from their camera masters with a `?w=` list and
    // resized at build time. Encoding is set once here rather than repeated in
    // every import, so the import lines only ever say which widths are needed.
    // 78 matches what scripts/optimise-images.mjs used before this replaced it.
    imagetools({
      defaultDirectives: () => new URLSearchParams({ format: 'webp', quality: '78' }),
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
  },
})
