import express from 'express'
import * as projectsRepo from '../repositories/projectsRepo.js'
import * as scopeRepo from '../repositories/scopeRepo.js'
import * as timeEntriesRepo from '../repositories/timeEntriesRepo.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// All routes require authentication
router.use(authMiddleware)

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`[PROJECTS ROUTER] ${req.method} ${req.originalUrl}`, 'params:', req.params)
  next()
})

// ==================== WORKERS ====================

// Get all active workers
router.get('/workers', async (req, res) => {
  try {
    const workers = await projectsRepo.getWorkers()
    res.json({ data: workers })
  } catch (error) {
    console.error('Error fetching workers:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== TIME ENTRIES (Must come BEFORE /:projectId) ====================

// Get active time entry for a worker
router.get('/time-entries/active/:workerName', async (req, res) => {
  try {
    const { workerName } = req.params
    const activeEntry = await timeEntriesRepo.getActiveTimeEntry(workerName)
    res.json({ data: activeEntry })
  } catch (error) {
    console.error('Error fetching active time entry:', error)
    res.status(500).json({ error: error.message })
  }
})

// Stop time entry
router.post('/time-entries/:entryId/stop', async (req, res) => {
  try {
    const { entryId } = req.params
    const timeEntry = await timeEntriesRepo.stopTimeEntry(entryId)
    res.json({ data: timeEntry })
  } catch (error) {
    console.error('Error stopping time entry:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update time entry
router.put('/time-entries/:entryId', async (req, res) => {
  try {
    const { entryId } = req.params
    const timeEntry = await timeEntriesRepo.updateTimeEntry(entryId, req.body)
    res.json({ data: timeEntry })
  } catch (error) {
    console.error('Error updating time entry:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete time entry
router.delete('/time-entries/:entryId', async (req, res) => {
  try {
    const { entryId } = req.params
    await timeEntriesRepo.deleteTimeEntry(entryId)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting time entry:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== SCOPE CATEGORIES (Must come BEFORE /:projectId) ====================

// Update category
router.put('/categories/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params
    const category = await scopeRepo.updateCategory(categoryId, req.body)
    res.json({ data: category })
  } catch (error) {
    console.error('Error updating category:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete category
router.delete('/categories/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params
    await scopeRepo.deleteCategory(categoryId)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get subcategories for a category
router.get('/categories/:categoryId/subcategories', async (req, res) => {
  try {
    const { categoryId } = req.params
    const subcategories = await scopeRepo.getSubcategoriesByCategory(categoryId)
    res.json({ data: subcategories })
  } catch (error) {
    console.error('Error fetching subcategories:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create subcategory
router.post('/categories/:categoryId/subcategories', async (req, res) => {
  try {
    const { categoryId } = req.params
    const subcategory = await scopeRepo.createSubcategory({
      ...req.body,
      category_id: categoryId
    })
    res.status(201).json({ data: subcategory })
  } catch (error) {
    console.error('Error creating subcategory:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== SCOPE SUBCATEGORIES (Must come BEFORE /:projectId) ====================

// Update subcategory
router.put('/subcategories/:subcategoryId', async (req, res) => {
  try {
    const { subcategoryId } = req.params
    const subcategory = await scopeRepo.updateSubcategory(subcategoryId, req.body)
    res.json({ data: subcategory })
  } catch (error) {
    console.error('Error updating subcategory:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete subcategory
router.delete('/subcategories/:subcategoryId', async (req, res) => {
  try {
    const { subcategoryId } = req.params
    await scopeRepo.deleteSubcategory(subcategoryId)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting subcategory:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get items for a subcategory
router.get('/subcategories/:subcategoryId/items', async (req, res) => {
  try {
    const { subcategoryId } = req.params
    const items = await scopeRepo.getScopeItemsBySubcategory(subcategoryId)
    res.json({ data: items })
  } catch (error) {
    console.error('Error fetching scope items:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create scope item
router.post('/subcategories/:subcategoryId/items', async (req, res) => {
  try {
    const { subcategoryId } = req.params
    const item = await scopeRepo.createScopeItem({
      ...req.body,
      subcategory_id: subcategoryId
    })
    res.status(201).json({ data: item })
  } catch (error) {
    console.error('Error creating scope item:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== SCOPE ITEMS (Must come BEFORE /:projectId) ====================

// Update scope item
router.put('/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params
    const item = await scopeRepo.updateScopeItem(itemId, req.body)
    res.json({ data: item })
  } catch (error) {
    console.error('Error updating scope item:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete scope item
router.delete('/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params
    await scopeRepo.deleteScopeItem(itemId)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting scope item:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get time entries for a scope item
router.get('/items/:itemId/time-entries', async (req, res) => {
  try {
    const { itemId } = req.params
    const timeEntries = await timeEntriesRepo.getTimeEntriesByScopeItem(itemId)
    res.json({ data: timeEntries })
  } catch (error) {
    console.error('Error fetching time entries:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create/start time entry
router.post('/items/:itemId/time-entries', async (req, res) => {
  try {
    const { itemId } = req.params
    const timeEntry = await timeEntriesRepo.createTimeEntry({
      ...req.body,
      scope_item_id: itemId,
      start_time: req.body.start_time || new Date().toISOString()
    })
    res.status(201).json({ data: timeEntry })
  } catch (error) {
    console.error('Error creating time entry:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get scope item details (tools, materials, checklist, photos)
router.get('/items/:itemId/details', async (req, res) => {
  try {
    const { itemId } = req.params
    const details = await scopeRepo.getScopeItemDetails(itemId)
    res.json({ data: details })
  } catch (error) {
    console.error('Error fetching scope item details:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update scope item materials
router.put('/items/:itemId/materials', async (req, res) => {
  try {
    const { itemId } = req.params
    const materials = await scopeRepo.updateScopeItemMaterials(itemId, req.body.materials)
    res.json({ data: materials })
  } catch (error) {
    console.error('Error updating materials:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update scope item tools
router.put('/items/:itemId/tools', async (req, res) => {
  try {
    const { itemId } = req.params
    const tools = await scopeRepo.updateScopeItemTools(itemId, req.body.tools)
    res.json({ data: tools })
  } catch (error) {
    console.error('Error updating tools:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update scope item checklist
router.put('/items/:itemId/checklist', async (req, res) => {
  try {
    const { itemId } = req.params
    const checklist = await scopeRepo.updateScopeItemChecklist(itemId, req.body.checklist)
    res.json({ data: checklist })
  } catch (error) {
    console.error('Error updating checklist:', error)
    res.status(500).json({ error: error.message })
  }
})

// Toggle checklist item
router.patch('/items/checklist/:checklistItemId', async (req, res) => {
  try {
    const { checklistItemId } = req.params
    const { isCompleted } = req.body
    const item = await scopeRepo.toggleChecklistItem(checklistItemId, isCompleted)
    res.json({ data: item })
  } catch (error) {
    console.error('Error toggling checklist item:', error)
    res.status(500).json({ error: error.message })
  }
})

// Upload photo for scope item
router.post('/items/:itemId/photos', async (req, res) => {
  try {
    const { itemId } = req.params
    const photo = await scopeRepo.addScopeItemPhoto({
      ...req.body,
      scope_item_id: itemId
    })
    res.status(201).json({ data: photo })
  } catch (error) {
    console.error('Error uploading photo:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete photo
router.delete('/items/photos/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params
    await scopeRepo.deleteScopeItemPhoto(photoId)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting photo:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== PROJECTS ====================

// Get all projects
router.get('/', async (req, res) => {
  try {
    console.log('[GET /] Fetching all projects, userId:', req.query.userId)
    const { userId } = req.query
    const projects = await projectsRepo.getProjects(userId)
    console.log('[GET /] Found projects:', projects.length)
    res.json({ data: projects })
  } catch (error) {
    console.error('[GET /] Error fetching projects:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create project
router.post('/', async (req, res) => {
  try {
    const project = await projectsRepo.createProject(req.body)
    res.status(201).json({ data: project })
  } catch (error) {
    console.error('Error creating project:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get project with full scope
router.get('/:projectId/scope', async (req, res) => {
  try {
    const { projectId } = req.params
    const projectWithScope = await projectsRepo.getProjectWithScope(projectId)
    res.json({ data: projectWithScope })
  } catch (error) {
    console.error('Error fetching project scope:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get categories for a project
router.get('/:projectId/categories', async (req, res) => {
  try {
    const { projectId } = req.params
    const categories = await scopeRepo.getCategoriesByProject(projectId)
    res.json({ data: categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create category
router.post('/:projectId/categories', async (req, res) => {
  try {
    const { projectId } = req.params
    const category = await scopeRepo.createCategory({
      ...req.body,
      project_id: projectId
    })
    res.status(201).json({ data: category })
  } catch (error) {
    console.error('Error creating category:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get all items for a project (for time tracker dropdown)
router.get('/:projectId/items', async (req, res) => {
  try {
    const { projectId } = req.params
    const items = await scopeRepo.getAllScopeItemsByProject(projectId)
    res.json({ data: items })
  } catch (error) {
    console.error('Error fetching project items:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get time entries for a project
router.get('/:projectId/time-entries', async (req, res) => {
  try {
    const { projectId } = req.params
    const { startDate, endDate, workerName } = req.query

    let timeEntries

    if (startDate && endDate) {
      timeEntries = await timeEntriesRepo.getTimeEntriesByDateRange(projectId, startDate, endDate)
    } else if (workerName) {
      timeEntries = await timeEntriesRepo.getTimeEntriesByWorker(workerName, projectId)
    } else {
      timeEntries = await timeEntriesRepo.getTimeEntriesByProject(projectId)
    }

    res.json({ data: timeEntries })
  } catch (error) {
    console.error('Error fetching time entries:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get single project (MUST BE LAST among GET routes)
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params
    const project = await projectsRepo.getProjectById(projectId)
    res.json({ data: project })
  } catch (error) {
    console.error('Error fetching project:', error)
    res.status(404).json({ error: error.message })
  }
})

// Update project
router.put('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params
    const project = await projectsRepo.updateProject(projectId, req.body)
    res.json({ data: project })
  } catch (error) {
    console.error('Error updating project:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete project
router.delete('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params
    await projectsRepo.softDeleteProject(projectId)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== PROJECT MEMBERS ====================

// Get project members
router.get('/:projectId/members', async (req, res) => {
  try {
    const { projectId } = req.params
    const members = await projectsRepo.getProjectMembers(projectId)
    res.json({ data: members })
  } catch (error) {
    console.error('Error fetching project members:', error)
    res.status(500).json({ error: error.message })
  }
})

// Add project member
router.post('/:projectId/members', async (req, res) => {
  try {
    const { projectId } = req.params
    const { email, role } = req.body
    const invitedBy = req.user?.id

    const member = await projectsRepo.addProjectMember(projectId, email, role, invitedBy)
    res.status(201).json({ data: member })
  } catch (error) {
    console.error('Error adding project member:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update project member role
router.patch('/:projectId/members/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params
    const { role } = req.body

    const member = await projectsRepo.updateProjectMemberRole(memberId, role)
    res.json({ data: member })
  } catch (error) {
    console.error('Error updating project member:', error)
    res.status(500).json({ error: error.message })
  }
})

// Remove project member
router.delete('/:projectId/members/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params
    await projectsRepo.removeProjectMember(memberId)
    res.json({ success: true })
  } catch (error) {
    console.error('Error removing project member:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
