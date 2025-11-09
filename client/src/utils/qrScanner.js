import jsQR from 'jsqr'

/**
 * QR Code Scanner Utility
 * Scans images for QR codes and extracts data
 */

/**
 * Scan an image file for QR codes
 * @param {File} file - Image file to scan
 * @returns {Promise<{success: boolean, data: string | null, error: string | null}>}
 */
export const scanQRCode = async (file) => {
  console.log('[QR Scanner] Starting QR code scan for file:', file.name)
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      console.log('[QR Scanner] File loaded, creating image')
      const img = new Image()

      img.onload = () => {
        console.log('[QR Scanner] Image loaded, dimensions:', img.width, 'x', img.height)

        // Helper function to try scanning at a specific size
        const tryScanning = (targetWidth, targetHeight) => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          canvas.width = targetWidth
          canvas.height = targetHeight
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

          return jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          })
        }

        // Try multiple resolutions for better detection
        const resolutionsToTry = []

        // Original size (if not too large)
        if (img.width <= 2000 && img.height <= 2000) {
          resolutionsToTry.push({ width: img.width, height: img.height, label: 'original' })
        }

        // Medium resolution (1500px max)
        const mediumScale = 1500 / Math.max(img.width, img.height)
        if (mediumScale < 1) {
          resolutionsToTry.push({
            width: Math.floor(img.width * mediumScale),
            height: Math.floor(img.height * mediumScale),
            label: 'medium (1500px)'
          })
        }

        // Lower resolution (800px max) - sometimes works better for blurry images
        const lowScale = 800 / Math.max(img.width, img.height)
        if (lowScale < 1) {
          resolutionsToTry.push({
            width: Math.floor(img.width * lowScale),
            height: Math.floor(img.height * lowScale),
            label: 'low (800px)'
          })
        }

        console.log('[QR Scanner] Will try', resolutionsToTry.length, 'different resolutions')

        // Try each resolution until we find a QR code
        let code = null
        for (const res of resolutionsToTry) {
          console.log('[QR Scanner] Trying resolution:', res.label, `${res.width}x${res.height}`)
          code = tryScanning(res.width, res.height)

          if (code) {
            console.log('[QR Scanner] ✅ QR code found at resolution:', res.label)
            break
          }
        }

        if (code) {
          console.log('[QR Scanner] ✅ QR code found! Data:', code.data)
          resolve({
            success: true,
            data: code.data,
            error: null
          })
        } else {
          console.log('[QR Scanner] ❌ No QR code found in image after trying all resolutions')
          resolve({
            success: false,
            data: null,
            error: 'No QR code found in image'
          })
        }
      }

      img.onerror = () => {
        console.error('[QR Scanner] Failed to load image')
        resolve({
          success: false,
          data: null,
          error: 'Failed to load image'
        })
      }

      img.src = e.target.result
    }

    reader.onerror = () => {
      console.error('[QR Scanner] Failed to read file')
      resolve({
        success: false,
        data: null,
        error: 'Failed to read file'
      })
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Parse appliance QR code data
 * Attempts to extract brand, model, serial number from QR code data
 *
 * Common QR code formats:
 * - JSON: {"brand": "LG", "model": "LFX28968ST", "serial": "123ABC"}
 * - Delimited: BRAND:LG|MODEL:LFX28968ST|SERIAL:123ABC
 * - URL: https://manufacturer.com/product?model=ABC&serial=123
 *
 * @param {string} qrData - Raw QR code data
 * @returns {Object} Parsed data object
 */
export const parseApplianceQRCode = (qrData) => {
  console.log('[QR Parser] Parsing QR data:', qrData)
  const result = {
    brand: null,
    model: null,
    serial: null,
    rawData: qrData
  }

  try {
    // Try parsing as JSON first
    if (qrData.startsWith('{') || qrData.startsWith('[')) {
      console.log('[QR Parser] Attempting JSON parse')
      const json = JSON.parse(qrData)

      result.brand = json.brand || json.manufacturer || json.BRAND || null
      result.model = json.model || json.MODEL || json.modelNumber || null
      result.serial = json.serial || json.serialNumber || json.SERIAL || json.sn || null

      console.log('[QR Parser] JSON parsed:', result)
      return result
    }

    // Try parsing pipe-delimited format
    if (qrData.includes('|') || qrData.includes(':')) {
      const pairs = qrData.split('|')
      pairs.forEach(pair => {
        const [key, value] = pair.split(':').map(s => s.trim())
        const lowerKey = key.toLowerCase()

        if (lowerKey.includes('brand') || lowerKey.includes('manufacturer')) {
          result.brand = value
        } else if (lowerKey.includes('model')) {
          result.model = value
        } else if (lowerKey.includes('serial') || lowerKey === 'sn') {
          result.serial = value
        }
      })

      return result
    }

    // Try parsing URL format
    if (qrData.startsWith('http://') || qrData.startsWith('https://')) {
      const url = new URL(qrData)
      const params = new URLSearchParams(url.search)

      result.brand = params.get('brand') || params.get('manufacturer') || null
      result.model = params.get('model') || params.get('modelNumber') || null
      result.serial = params.get('serial') || params.get('serialNumber') || params.get('sn') || null

      // Try to extract from path if not in params
      if (!result.model && url.pathname) {
        const pathParts = url.pathname.split('/')
        // Look for model-like strings (alphanumeric with dashes/underscores)
        const modelPattern = /^[A-Z0-9\-_]+$/i
        const possibleModel = pathParts.find(part => modelPattern.test(part) && part.length >= 3)
        if (possibleModel) {
          result.model = possibleModel
        }
      }

      return result
    }

    // Try parsing comma/semicolon separated values
    if (qrData.includes(',') || qrData.includes(';')) {
      const separator = qrData.includes(';') ? ';' : ','
      const parts = qrData.split(separator).map(s => s.trim())

      // Assume order: brand, model, serial
      if (parts.length >= 1) result.brand = parts[0]
      if (parts.length >= 2) result.model = parts[1]
      if (parts.length >= 3) result.serial = parts[2]

      return result
    }

    // If no structure detected, try to extract patterns
    // Look for serial number patterns (typically alphanumeric, 6-20 chars)
    const serialPattern = /(?:S\/N|SERIAL|SN)[:\s]*([A-Z0-9]{6,20})/i
    const serialMatch = qrData.match(serialPattern)
    if (serialMatch) {
      result.serial = serialMatch[1]
    }

    // Look for model number patterns
    const modelPattern = /(?:MODEL|M\/N|MN)[:\s]*([A-Z0-9\-_]{3,20})/i
    const modelMatch = qrData.match(modelPattern)
    if (modelMatch) {
      result.model = modelMatch[1]
    }

  } catch (error) {
    console.error('[QR Parser] Error parsing QR code data:', error)
  }

  console.log('[QR Parser] Final result:', result)
  return result
}

/**
 * Scan image for QR code and parse appliance data
 * @param {File} file - Image file
 * @returns {Promise<{success: boolean, data: Object, error: string | null}>}
 */
export const scanApplianceQRCode = async (file) => {
  const scanResult = await scanQRCode(file)

  if (!scanResult.success) {
    return scanResult
  }

  const parsedData = parseApplianceQRCode(scanResult.data)

  return {
    success: true,
    data: parsedData,
    error: null
  }
}
