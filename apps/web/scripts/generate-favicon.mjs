import sharp from 'sharp';
import { readFileSync } from 'fs';

const svg = readFileSync('./public/favicon.svg');

const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
];

for (const { size, name } of sizes) {
  await sharp(svg)
    .resize(size, size, { fit: 'contain', background: { r: 17, g: 16, b: 16, alpha: 1 } })
    .png()
    .toFile(`./public/${name}`);
  console.log(`Generated ${name}`);
}
