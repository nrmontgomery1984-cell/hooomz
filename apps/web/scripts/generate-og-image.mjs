import sharp from 'sharp';

const width = 1200;
const height = 630;

const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#111010"/>
  <text x="80" y="240" font-family="Georgia, serif" font-weight="900" font-size="96" fill="white" letter-spacing="8">HOOOMZ</text>
  <text x="80" y="320" font-family="Georgia, serif" font-size="32" fill="#6B6560" letter-spacing="4">INTERIORS</text>
  <text x="80" y="440" font-family="Georgia, serif" font-size="36" fill="#9A8E84">Interior finishing for homeowners who want to know.</text>
  <circle cx="1080" cy="200" r="28" fill="none" stroke="#DC2626" stroke-width="10"/>
  <circle cx="1080" cy="290" r="28" fill="none" stroke="#D97706" stroke-width="10"/>
  <circle cx="1080" cy="380" r="28" fill="none" stroke="#16A34A" stroke-width="10"/>
</svg>
`;

await sharp(Buffer.from(svg))
  .jpeg({ quality: 95 })
  .toFile('./public/og-image.jpg');

console.log('Generated og-image.jpg');
