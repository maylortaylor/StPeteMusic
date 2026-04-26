import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = './apps/web/public/images/brand/favicon/favicon.svg';
const outputDir = './apps/web/public/images/brand/favicon';

const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

async function generateFavicons() {
  try {
    const svg = fs.readFileSync(svgPath);

    for (const { size, name } of sizes) {
      await sharp(svg)
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(path.join(outputDir, name));
      console.log(`✓ Generated ${name} (${size}x${size})`);
    }

    console.log('\n✓ All favicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons();
