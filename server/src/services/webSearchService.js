import axios from 'axios'

/**
 * Web Search Service
 * Fetches product images and owner's manuals from the web
 */

/**
 * Search for product image
 * @param {string} brand - Product brand
 * @param {string} model - Product model
 * @returns {Promise<string|null>} Image URL or null
 */
export const searchProductImage = async (brand, model) => {
  if (!brand || !model) return null

  try {
    console.log(`[WebSearch] Searching for product image: ${brand} ${model}`)

    // Use Google Custom Search API or SerpAPI for image search
    // For now, we'll construct a search query and use a free image search approach
    const searchQuery = `${brand} ${model} product image`

    // Using DuckDuckGo image search (no API key needed)
    const response = await axios.get('https://api.duckduckgo.com/', {
      params: {
        q: searchQuery,
        format: 'json',
        t: 'hooomz'
      },
      timeout: 5000
    })

    // Try to extract image from results
    if (response.data && response.data.Image) {
      console.log(`[WebSearch] Found image: ${response.data.Image}`)
      return response.data.Image
    }

    // Fallback: construct a generic product image URL
    // Many manufacturers use predictable URL patterns
    const fallbackUrl = constructManufacturerImageUrl(brand, model)
    console.log(`[WebSearch] Using fallback image URL: ${fallbackUrl}`)
    return fallbackUrl

  } catch (error) {
    console.error('[WebSearch] Error searching for product image:', error.message)
    return constructManufacturerImageUrl(brand, model)
  }
}

/**
 * Search for owner's manual PDF
 * @param {string} brand - Product brand
 * @param {string} model - Product model
 * @returns {Promise<string|null>} Manual URL or null
 */
export const searchOwnerManual = async (brand, model) => {
  if (!brand || !model) return null

  try {
    console.log(`[WebSearch] Searching for owner's manual: ${brand} ${model}`)

    const searchQuery = `${brand} ${model} owner's manual PDF`

    // Check common manual repository sites
    const manualSites = [
      { name: 'ManualsLib', url: `https://www.manualslib.com/manual/${brand}-${model}.html` },
      { name: 'Manufacturer', url: constructManufacturerManualUrl(brand, model) }
    ]

    // Try each manual source
    for (const site of manualSites) {
      try {
        const response = await axios.head(site.url, { timeout: 3000 })
        if (response.status === 200) {
          console.log(`[WebSearch] Found manual at ${site.name}: ${site.url}`)
          return site.url
        }
      } catch (err) {
        // Continue to next site
      }
    }

    // Return a search URL as fallback
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`
    console.log(`[WebSearch] No direct manual found, returning search URL: ${searchUrl}`)
    return searchUrl

  } catch (error) {
    console.error('[WebSearch] Error searching for manual:', error.message)
    return `https://www.google.com/search?q=${encodeURIComponent(`${brand} ${model} manual PDF`)}`
  }
}

/**
 * Construct manufacturer image URL based on common patterns
 */
function constructManufacturerImageUrl(brand, model) {
  const brandLower = brand.toLowerCase().replace(/\s+/g, '')
  const modelClean = model.replace(/\s+/g, '-')

  // Common manufacturer URL patterns
  const patterns = {
    'lg': `https://www.lg.com/us/images/products/${modelClean}.jpg`,
    'samsung': `https://images.samsung.com/is/image/samsung/${modelClean}`,
    'whirlpool': `https://www.whirlpool.com/content/dam/global/images/product/${modelClean}.jpg`,
    'ge': `https://products.geappliances.com/MarketingObjectRetrieval/Image/${modelClean}`,
    'maytag': `https://www.maytag.com/content/dam/global/images/product/${modelClean}.jpg`
  }

  return patterns[brandLower] || `https://via.placeholder.com/400x400?text=${encodeURIComponent(brand + ' ' + model)}`
}

/**
 * Construct manufacturer manual URL based on common patterns
 */
function constructManufacturerManualUrl(brand, model) {
  const brandLower = brand.toLowerCase().replace(/\s+/g, '')
  const modelClean = model.replace(/\s+/g, '-')

  const patterns = {
    'lg': `https://www.lg.com/us/support/product/lg-${modelClean}`,
    'samsung': `https://www.samsung.com/us/support/owners/product/${modelClean}`,
    'whirlpool': `https://www.whirlpool.com/services/about-your-appliance/${modelClean}.html`,
    'ge': `https://products.geappliances.com/appliance/gea-support-search-model/${modelClean}`,
    'maytag': `https://www.maytag.com/services/about-your-appliance/${modelClean}.html`
  }

  return patterns[brandLower] || `https://www.manualslib.com/products/${brand}-${model}.html`
}

export default {
  searchProductImage,
  searchOwnerManual
}
