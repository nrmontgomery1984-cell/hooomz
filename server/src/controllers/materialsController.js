import * as materialsService from '../services/materialsService.js'

/**
 * Materials Controller
 * Handles HTTP requests for material operations
 */

/**
 * Create a new material
 * POST /api/homes/:homeId/materials
 */
export const createMaterial = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { homeId } = req.params
    const materialData = req.body

    const material = await materialsService.createMaterial(homeId, userId, materialData)

    res.status(201).json({
      success: true,
      data: material,
      message: 'Material created successfully'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get all materials for a home
 * GET /api/homes/:homeId/materials
 */
export const getMaterials = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { homeId } = req.params
    const { category, room_id } = req.query

    const materials = await materialsService.getHomeMaterials(homeId, userId, {
      category,
      room_id
    })

    res.status(200).json({
      success: true,
      data: materials,
      count: materials.length
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get a single material by ID
 * GET /api/materials/:id
 */
export const getMaterialById = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const material = await materialsService.getMaterialById(id, userId)

    res.status(200).json({
      success: true,
      data: material
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update a material
 * PUT /api/materials/:id
 */
export const updateMaterial = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const updates = req.body

    const material = await materialsService.updateMaterial(id, userId, updates)

    res.status(200).json({
      success: true,
      data: material,
      message: 'Material updated successfully'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete a material (soft delete)
 * DELETE /api/materials/:id
 */
export const deleteMaterial = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    await materialsService.deleteMaterial(id, userId)

    res.status(200).json({
      success: true,
      message: 'Material deleted successfully'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get material categories
 * GET /api/materials/categories
 */
export const getCategories = async (req, res, next) => {
  try {
    const categories = materialsService.getCategories()

    res.status(200).json({
      success: true,
      data: categories
    })
  } catch (error) {
    next(error)
  }
}
