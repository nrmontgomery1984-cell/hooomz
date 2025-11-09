import { writeFileSync } from 'fs'

const content = `import * as materialsRepo from '../repositories/materialsRepo.js'
import * as homesRepo from '../repositories/homesRepo.js'
import { searchProductImage, searchOwnerManual } from './webSearchService.js'

/**
 * Materials Service
 * Business logic layer for material operations
 */

const VALID_CATEGORIES = [
  'flooring',
  'paint',
  'countertop',
  'cabinet',
  'fixture',
  'tile',
  'hardware',
  'appliances',
  'other'
]

/**
 * Create a new material
 * @param {string} homeId - Home ID
 * @param {string} userId - User ID from auth
 * @param {Object} materialData - Material data
 * @returns {Promise<Object>} Created material
 */
export const createMaterial = async (homeId, userId, materialData) => {
  // Verify home ownership
  await homesRepo.getHomeById(homeId, userId)

  // Validate required fields
  if (!materialData.category) {
    throw new Error('Category is required')
  }

  if (!VALID_CATEGORIES.includes(materialData.category)) {
    throw new Error(\`Invalid category. Must be one of: \${VALID_CATEGORIES.join(', ')}\`)
  }

  // Prepare material data
  const material = {
    home_id: homeId,
    room_id: materialData.room_id || null,
    category: materialData.category,
    brand: materialData.brand || null,
    model: materialData.model || null,
    color: materialData.color || null,
    purchase_date: materialData.purchase_date || null,
    purchase_price: materialData.purchase_price || null,
    supplier: materialData.supplier || null,
    notes: materialData.notes || null,
    photos: materialData.photos || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  // Auto-fetch product image if brand and model are provided and no photos uploaded
  if (material.brand && material.model && (!material.photos || material.photos.length === 0)) {
    console.log(\`[Materials Service] Auto-fetching product image for \${material.brand} \${material.model}\`)
    try {
      const imageUrl = await searchProductImage(material.brand, material.model)
      if (imageUrl) {
        material.product_image_url = imageUrl
        console.log(\`[Materials Service] Found product image: \${imageUrl}\`)
      }
    } catch (error) {
      console.error('[Materials Service] Error fetching product image:', error.message)
      // Don't fail material creation if image fetch fails
    }
  }

  // Auto-fetch owner's manual if brand and model are provided
  if (material.brand && material.model) {
    console.log(\`[Materials Service] Auto-fetching owner's manual for \${material.brand} \${material.model}\`)
    try {
      const manualUrl = await searchOwnerManual(material.brand, material.model)
      if (imageUrl) {
        material.manual_url = manualUrl
        console.log(\`[Materials Service] Found owner's manual: \${manualUrl}\`)
      }
    } catch (error) {
      console.error("[Materials Service] Error fetching owner's manual:", error.message)
      // Don't fail material creation if manual fetch fails
    }
  }

  return await materialsRepo.createMaterial(material)
}

/**
 * Get all materials for a home
 * @param {string} homeId - Home ID
 * @param {string} userId - User ID from auth
 * @param {Object} filters - Optional filters (category, room_id)
 * @returns {Promise<Array>} Array of materials
 */
export const getHomeMaterials = async (homeId, userId, filters = {}) => {
  // Verify home ownership
  await homesRepo.getHomeById(homeId, userId)

  // Apply filters
  if (filters.room_id) {
    return await materialsRepo.getMaterialsByRoomId(homeId, filters.room_id)
  }

  if (filters.category) {
    return await materialsRepo.getMaterialsByCategory(homeId, filters.category)
  }

  return await materialsRepo.getMaterialsByHomeId(homeId)
}

/**
 * Get a single material by ID
 * @param {string} materialId - Material ID
 * @param {string} userId - User ID from auth
 * @returns {Promise<Object>} Material object
 */
export const getMaterialById = async (materialId, userId) => {
  const material = await materialsRepo.getMaterialById(materialId)

  if (!material) {
    throw new Error('Material not found')
  }

  // Verify home ownership
  await homesRepo.getHomeById(material.home_id, userId)

  return material
}

/**
 * Update a material
 * @param {string} materialId - Material ID
 * @param {string} userId - User ID from auth
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated material
 */
export const updateMaterial = async (materialId, userId, updates) => {
  // Get material and verify ownership
  const material = await getMaterialById(materialId, userId)

  // Validate category if provided
  if (updates.category && !VALID_CATEGORIES.includes(updates.category)) {
    throw new Error(\`Invalid category. Must be one of: \${VALID_CATEGORIES.join(', ')}\`)
  }

  // Remove fields that shouldn't be updated
  const { id, home_id, created_at, deleted_at, ...allowedUpdates } = updates

  if (Object.keys(allowedUpdates).length === 0) {
    throw new Error('No valid fields to update')
  }

  // If brand or model changed and currently no product image, try to fetch one
  if ((updates.brand || updates.model) && !material.product_image_url) {
    const brand = updates.brand || material.brand
    const model = updates.model || material.model

    if (brand && model) {
      console.log(\`[Materials Service] Brand/model updated, fetching product image for \${brand} \${model}\`)
      try {
        const imageUrl = await searchProductImage(brand, model)
        if (imageUrl) {
          allowedUpdates.product_image_url = imageUrl
          console.log(\`[Materials Service] Found product image: \${imageUrl}\`)
        }
      } catch (error) {
        console.error('[Materials Service] Error fetching product image:', error.message)
      }
    }
  }

  // If brand or model changed and currently no manual, try to fetch one
  if ((updates.brand || updates.model) && !material.manual_url) {
    const brand = updates.brand || material.brand
    const model = updates.model || material.model

    if (brand && model) {
      console.log(\`[Materials Service] Brand/model updated, fetching owner's manual for \${brand} \${model}\`)
      try {
        const manualUrl = await searchOwnerManual(brand, model)
        if (manualUrl) {
          allowedUpdates.manual_url = manualUrl
          console.log(\`[Materials Service] Found owner's manual: \${manualUrl}\`)
        }
      } catch (error) {
        console.error("[Materials Service] Error fetching owner's manual:", error.message)
      }
    }
  }

  return await materialsRepo.updateMaterial(materialId, allowedUpdates)
}

/**
 * Delete a material (soft delete)
 * @param {string} materialId - Material ID
 * @param {string} userId - User ID from auth
 * @returns {Promise<Object>} Deleted material
 */
export const deleteMaterial = async (materialId, userId) => {
  // Verify ownership
  await getMaterialById(materialId, userId)

  const material = await materialsRepo.softDeleteMaterial(materialId)

  if (!material) {
    throw new Error('Material not found or already deleted')
  }

  return material
}

/**
 * Get material categories
 * @returns {Array} Array of valid categories
 */
export const getCategories = () => {
  return VALID_CATEGORIES
}
`

writeFileSync('./src/services/materialsService.js', content, 'utf8')
console.log('✅ File written successfully')
