// Asset generator. Run with: npm run images
//
// This used to convert every camera master into a single 1400px .webp sibling,
// which the asset barrel then imported. vite-imagetools took that job over on
// 2026-08-16: photographs are now imported straight from their .jpg masters
// with a `?w=` list, and each width is resized and encoded at build time. One
// pipeline, several sizes, nothing to keep in sync by hand.
//
// What is left is the one asset a build step cannot produce: a raster icon that
// no component imports, so nothing pulls it into the bundle graph.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

// public/ is copied verbatim into dist/, which is what an <link rel> in
// index.html needs and what an import would not give.
await mkdir('public', { recursive: true });

// iOS home-screen icon. Safari still ignores SVG favicons, so the logo is
// rasterised once at 180px on the dark background colour.
const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#121815"/>
  <path d="M26.2 16.5 A10.2 10.2 0 1 1 16 6.3" stroke="#a3bfa8" stroke-width="1.8"
        stroke-linecap="round" fill="none"/>
  <path d="M9 18 Q9.9 13.8 11.9 15.9 Q13.2 12 15.2 15 Q16.8 11.4 18.8 14.8
           Q20.6 13 21.9 16.4 Q22.7 15.4 23 18 Q23.9 19.4 24.14 21
           A9.3 9.3 0 0 1 7.86 21 Q8.1 19.4 9 18 Z" fill="#a3bfa8"/>
  <circle cx="21.6" cy="9.6" r="2" fill="#a3bfa8" opacity="0.85"/>
</svg>`;

await sharp(Buffer.from(LOGO)).resize(180, 180).png().toFile('public/apple-touch-icon.png');
console.log('apple-touch-icon.png  180x180');
