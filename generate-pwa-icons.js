/**
 * Simple PWA Icon Generator
 *
 * This script creates placeholder PNG icons from the SVG template.
 *
 * To run:
 * 1. Install sharp: npm install sharp
 * 2. Run: node generate-pwa-icons.js
 *
 * For production, use a proper logo with an online generator like:
 * https://www.pwabuilder.com/imageGenerator
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const inputSvg = path.join(__dirname, 'client/public/icon-template.svg')
const outputDir = path.join(__dirname, 'client/public/icons')

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

async function generateIcons() {
  console.log('🎨 Generating PWA icons...')

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`)

    try {
      await sharp(inputSvg)
        .resize(size, size)
        .png()
        .toFile(outputPath)

      console.log(`✅ Created ${size}x${size} icon`)
    } catch (error) {
      console.error(`❌ Failed to create ${size}x${size} icon:`, error.message)
    }
  }

  console.log('✨ Icon generation complete!')
  console.log('\n📝 Note: These are placeholder icons.')
  console.log('For production, create proper icons using:')
  console.log('https://www.pwabuilder.com/imageGenerator')
}

generateIcons().catch(console.error)
