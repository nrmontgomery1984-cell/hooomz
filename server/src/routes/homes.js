import express from 'express'
import * as homesController from '../controllers/homesController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

/**
 * All routes require authentication
 */
router.use(authMiddleware)

/**
 * @route   POST /api/homes
 * @desc    Create a new home
 * @access  Private
 */
router.post('/', homesController.createHome)

/**
 * @route   GET /api/homes
 * @desc    Get all homes for authenticated user
 * @access  Private
 */
router.get('/', homesController.getHomes)

/**
 * @route   GET /api/homes/:id
 * @desc    Get a single home by ID
 * @access  Private
 */
router.get('/:id', homesController.getHomeById)

/**
 * @route   PUT /api/homes/:id
 * @desc    Update a home
 * @access  Private
 */
router.put('/:id', homesController.updateHome)

/**
 * @route   DELETE /api/homes/:id
 * @desc    Delete a home (soft delete)
 * @access  Private
 */
router.delete('/:id', homesController.deleteHome)

export default router
