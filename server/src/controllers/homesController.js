import * as homesService from '../services/homesService.js'

/**
 * Homes Controller
 * Handles HTTP requests for home operations
 */

/**
 * Create a new home
 * POST /api/homes
 */
export const createHome = async (req, res, next) => {
  try {
    const userId = req.user.id
    const homeData = req.body

    const home = await homesService.createHome(userId, homeData)

    res.status(201).json({
      success: true,
      data: home,
      message: 'Home created successfully'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get all homes for authenticated user
 * GET /api/homes
 */
export const getHomes = async (req, res, next) => {
  try {
    const userId = req.user.id

    const homes = await homesService.getUserHomes(userId)

    res.status(200).json({
      success: true,
      data: homes,
      count: homes.length
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get a single home by ID
 * GET /api/homes/:id
 */
export const getHomeById = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const home = await homesService.getHomeById(id, userId)

    res.status(200).json({
      success: true,
      data: home
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update a home
 * PUT /api/homes/:id
 */
export const updateHome = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const updates = req.body

    const home = await homesService.updateHome(id, userId, updates)

    res.status(200).json({
      success: true,
      data: home,
      message: 'Home updated successfully'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete a home (soft delete)
 * DELETE /api/homes/:id
 */
export const deleteHome = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    await homesService.deleteHome(id, userId)

    res.status(200).json({
      success: true,
      message: 'Home deleted successfully'
    })
  } catch (error) {
    next(error)
  }
}
