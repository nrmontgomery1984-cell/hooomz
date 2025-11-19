# Icon Generation Guide

## Quick Option: Use a Logo Generator

For now, you can use placeholder icons. To create proper app icons:

### Option 1: Automated Icon Generation (Recommended)

Use an online PWA icon generator:
1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload a square logo/icon (at least 512x512px)
3. Download the generated icon pack
4. Extract all icons to this `/icons` folder

### Option 2: Manual Creation

Create a 512x512 PNG with your logo, then use ImageMagick or similar:

```bash
# Install ImageMagick first
convert logo-512.png -resize 72x72 icon-72x72.png
convert logo-512.png -resize 96x96 icon-96x96.png
convert logo-512.png -resize 128x128 icon-128x128.png
convert logo-512.png -resize 144x144 icon-144x144.png
convert logo-512.png -resize 152x152 icon-152x152.png
convert logo-512.png -resize 192x192 icon-192x192.png
convert logo-512.png -resize 384x384 icon-384x384.png
convert logo-512.png -resize 512x512 icon-512x512.png
```

### Option 3: Use Favicon.io

1. Go to https://favicon.io/
2. Create icon from text, image, or emoji
3. Download and extract to this folder

## Temporary Placeholder

For now, I'll create a simple SVG-based icon that will work as a placeholder.

## Icon Requirements

- **72x72**: Android home screen
- **96x96**: Android launcher
- **128x128**: Chrome Web Store
- **144x144**: Windows tile
- **152x152**: iOS touch icon
- **192x192**: Android splash screen (minimum PWA requirement)
- **384x384**: Android splash screen
- **512x512**: Android splash screen (recommended PWA requirement)

## iOS Specific

iOS also needs an apple-touch-icon. Add to index.html:
```html
<link rel="apple-touch-icon" href="/icons/icon-192x192.png">
```
