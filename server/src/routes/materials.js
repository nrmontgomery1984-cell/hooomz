import express from 'express'
import * as materialsController from '../controllers/materialsController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

/**
 * All routes require authentication
 */
router.use(authMiddleware)

/**
 * @route   GET /api/materials/categories
 * @desc    Get list of valid material categories
 * @access  Private
 */
router.get('/categories', materialsController.getCategories)

/**
 * @route   POST /api/homes/:homeId/materials
 * @desc    Create a new material for a home
 * @access  Private
 */
router.post('/homes/:homeId/materials', materialsController.createMaterial)

/**
 * @route   GET /api/homes/:homeId/materials
 * @desc    Get all materials for a home (supports query filters: category, room_id)
 * @access  Private
 */
router.get('/homes/:homeId/materials', materialsController.getMaterials)

/**
 * @route   GET /api/materials/:id
 * @desc    Get a single material by ID
 * @access  Private
 */
router.get('/:id', materialsController.getMaterialById)

/**
 * @route   PUT /api/materials/:id
 * @desc    Update a material
 * @access  Private
 */
router.put('/:id', materialsController.updateMaterial)

/**
 * @route   DELETE /api/materials/:id
 * @desc    Delete a material (soft delete)
 * @access  Private
 */
router.delete('/:id', materialsController.deleteMaterial)

export default router
