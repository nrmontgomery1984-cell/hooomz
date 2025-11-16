import express from 'express'
import * as projectsRepo from '../repositories/projectsRepo.js'
import * as scopeRepo from '../repositories/scopeRepo.js'
import * as timeEntriesRepo from '../repositories/timeEntriesRepo.js'
import * as estimatesRepo from '../repositories/estimatesRepo.js'
import * as loopRepo from '../repositories/loopRepo.js'
import * as taskTemplateRepo from '../repositories/taskTemplateRepo.js'
import * as taskInstanceRepo from '../repositories/taskInstanceRepo.js'
import * as phaseRepo from '../repositories/phaseRepo.js'
import * as changeOrderRepo from '../repositories/changeOrderRepo.js'
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

// Patch scope item (for partial updates like Todoist fields)
router.patch('/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params
    const item = await scopeRepo.updateScopeItem(itemId, req.body)
    res.json({ data: item })
  } catch (error) {
    console.error('Error patching scope item:', error)
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
    console.log('[ROUTE /items/:itemId/details] Called with itemId:', itemId)
    const details = await scopeRepo.getScopeItemDetails(itemId)
    console.log('[ROUTE /items/:itemId/details] Returning details with projectMembers count:', details?.projectMembers?.length || 0)
    res.json({ data: details })
  } catch (error) {
    console.error('[ROUTE /items/:itemId/details] Error fetching scope item details:', error)
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

// ==================== ESTIMATES ====================

// Get all estimates for a project
router.get('/:projectId/estimates', async (req, res) => {
  try {
    const { projectId } = req.params
    const estimates = await estimatesRepo.getEstimatesByProject(projectId)
    res.json({ data: estimates })
  } catch (error) {
    console.error('Error fetching estimates:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get a single estimate by ID
router.get('/estimates/:estimateId', async (req, res) => {
  try {
    const { estimateId } = req.params
    const estimate = await estimatesRepo.getEstimateById(estimateId)
    res.json({ data: estimate })
  } catch (error) {
    console.error('Error fetching estimate:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create a new estimate
router.post('/:projectId/estimates', async (req, res) => {
  try {
    const { projectId } = req.params
    const estimate = await estimatesRepo.createEstimate({
      ...req.body,
      project_id: projectId,
      created_by: req.userId
    })
    res.status(201).json({ data: estimate })
  } catch (error) {
    console.error('Error creating estimate:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update an estimate
router.put('/estimates/:estimateId', async (req, res) => {
  try {
    const { estimateId } = req.params
    const estimate = await estimatesRepo.updateEstimate(estimateId, req.body)
    res.json({ data: estimate })
  } catch (error) {
    console.error('Error updating estimate:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete an estimate
router.delete('/estimates/:estimateId', async (req, res) => {
  try {
    const { estimateId } = req.params
    await estimatesRepo.deleteEstimate(estimateId)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting estimate:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== ESTIMATE LINE ITEMS ====================

// Create a new line item
router.post('/estimates/:estimateId/line-items', async (req, res) => {
  try {
    const { estimateId } = req.params
    const lineItem = await estimatesRepo.createLineItem({
      ...req.body,
      estimate_id: estimateId
    })
    res.status(201).json({ data: lineItem })
  } catch (error) {
    console.error('Error creating line item:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update a line item
router.put('/line-items/:lineItemId', async (req, res) => {
  try {
    const { lineItemId } = req.params
    const lineItem = await estimatesRepo.updateLineItem(lineItemId, req.body)
    res.json({ data: lineItem })
  } catch (error) {
    console.error('Error updating line item:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete a line item
router.delete('/line-items/:lineItemId', async (req, res) => {
  try {
    const { lineItemId } = req.params
    await estimatesRepo.deleteLineItem(lineItemId)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting line item:', error)
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
    console.log('🚀🚀🚀 API CALLED: GET /:projectId/items 🚀🚀🚀')
    const { projectId } = req.params
    console.log('🔑 Project ID:', projectId)
    const items = await scopeRepo.getAllScopeItemsByProject(projectId)

    // Debug logging
    console.log('[GET /:projectId/items] Returning items count:', items.length)
    if (items.length > 0) {
      console.log('[GET /:projectId/items] First item sample:', {
        id: items[0].id,
        description: items[0].description,
        assignee_id: items[0].assignee_id,
        assignee_name: items[0].assignee_name,
        assignee_email: items[0].assignee_email
      })
    }

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

// ==================== NESTED LOOP ARCHITECTURE ====================

// ==================== LOOP CONTEXTS & ITERATIONS ====================

// Get loop contexts for a project
router.get('/:projectId/loop-contexts', async (req, res) => {
  try {
    const { projectId } = req.params
    const contexts = await loopRepo.getProjectLoopContexts(projectId)
    res.json({ data: contexts })
  } catch (error) {
    console.error('Error fetching loop contexts:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create loop context
router.post('/:projectId/loop-contexts', async (req, res) => {
  try {
    const { projectId } = req.params
    const context = await loopRepo.createLoopContext(projectId, req.body)
    res.status(201).json({ data: context })
  } catch (error) {
    console.error('Error creating loop context:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get building structure (hierarchical)
router.get('/:projectId/building-structure', async (req, res) => {
  try {
    const { projectId } = req.params
    const structure = await loopRepo.getBuildingStructure(projectId)
    res.json({ data: structure })
  } catch (error) {
    console.error('Error fetching building structure:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get all rooms for a project
router.get('/:projectId/rooms', async (req, res) => {
  try {
    const { projectId } = req.params
    const rooms = await loopRepo.getAllRooms(projectId)
    res.json({ data: rooms })
  } catch (error) {
    console.error('Error fetching rooms:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get iterations for a loop context
router.get('/loop-contexts/:contextId/iterations', async (req, res) => {
  try {
    const { contextId } = req.params
    const iterations = await loopRepo.getLoopIterations(contextId)
    res.json({ data: iterations })
  } catch (error) {
    console.error('Error fetching loop iterations:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create loop iteration
router.post('/loop-contexts/:contextId/iterations', async (req, res) => {
  try {
    const { contextId } = req.params
    const iteration = await loopRepo.createLoopIteration(contextId, req.body)
    res.status(201).json({ data: iteration })
  } catch (error) {
    console.error('Error creating loop iteration:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update loop iteration
router.put('/loop-iterations/:iterationId', async (req, res) => {
  try {
    const { iterationId } = req.params
    const iteration = await loopRepo.updateLoopIteration(iterationId, req.body)
    res.json({ data: iteration })
  } catch (error) {
    console.error('Error updating loop iteration:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete loop iteration
router.delete('/loop-iterations/:iterationId', async (req, res) => {
  try {
    const { iterationId } = req.params
    await loopRepo.deleteLoopIteration(iterationId)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting loop iteration:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== PHASES ====================

// Get global phases
router.get('/phases/global', async (req, res) => {
  try {
    const phases = await phaseRepo.getGlobalPhases()
    res.json({ data: phases })
  } catch (error) {
    console.error('Error fetching global phases:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get phases for a project (global + custom)
router.get('/:projectId/phases', async (req, res) => {
  try {
    const { projectId } = req.params
    const phases = await phaseRepo.getProjectPhases(projectId)
    res.json({ data: phases })
  } catch (error) {
    console.error('Error fetching project phases:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create custom phase for project
router.post('/:projectId/phases', async (req, res) => {
  try {
    const { projectId } = req.params
    const phase = await phaseRepo.createProjectPhase(projectId, req.body)
    res.status(201).json({ data: phase })
  } catch (error) {
    console.error('Error creating phase:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update phase
router.put('/phases/:phaseId', async (req, res) => {
  try {
    const { phaseId } = req.params
    const phase = await phaseRepo.updatePhase(phaseId, req.body)
    res.json({ data: phase })
  } catch (error) {
    console.error('Error updating phase:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete phase
router.delete('/phases/:phaseId', async (req, res) => {
  try {
    const { phaseId } = req.params
    await phaseRepo.deletePhase(phaseId)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting phase:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get phase statistics for project
router.get('/:projectId/phase-stats', async (req, res) => {
  try {
    const { projectId } = req.params
    const stats = await phaseRepo.getPhaseStats(projectId)
    res.json({ data: stats })
  } catch (error) {
    console.error('Error fetching phase stats:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== TASK TEMPLATES ====================

// Get task templates for a project
router.get('/:projectId/task-templates', async (req, res) => {
  try {
    const { projectId } = req.params
    const templates = await taskTemplateRepo.getProjectTemplates(projectId)
    res.json({ data: templates })
  } catch (error) {
    console.error('Error fetching task templates:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get quantum tasks (undeployed templates)
router.get('/:projectId/quantum-tasks', async (req, res) => {
  try {
    const { projectId } = req.params
    const quantumTasks = await taskTemplateRepo.getQuantumTasks(projectId)
    res.json({ data: quantumTasks })
  } catch (error) {
    console.error('Error fetching quantum tasks:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get single template
router.get('/task-templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params
    const template = await taskTemplateRepo.getTemplateById(templateId)
    res.json({ data: template })
  } catch (error) {
    console.error('Error fetching template:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get template with full details
router.get('/task-templates/:templateId/details', async (req, res) => {
  try {
    const { templateId } = req.params
    const details = await taskTemplateRepo.getTemplateWithDetails(templateId)
    res.json({ data: details })
  } catch (error) {
    console.error('Error fetching template details:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create task template
router.post('/:projectId/task-templates', async (req, res) => {
  try {
    const { projectId } = req.params
    const template = await taskTemplateRepo.createTemplate(projectId, req.body)
    res.status(201).json({ data: template })
  } catch (error) {
    console.error('Error creating task template:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update task template
router.put('/task-templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params
    const template = await taskTemplateRepo.updateTemplate(templateId, req.body)
    res.json({ data: template })
  } catch (error) {
    console.error('Error updating task template:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete task template
router.delete('/task-templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params
    await taskTemplateRepo.deleteTemplate(templateId)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting task template:', error)
    res.status(500).json({ error: error.message })
  }
})

// Deploy template to specific iterations
router.post('/task-templates/:templateId/deploy', async (req, res) => {
  try {
    const { templateId } = req.params
    const { iteration_ids } = req.body
    const instances = await taskInstanceRepo.deployTemplate(templateId, iteration_ids)
    res.status(201).json({ data: instances })
  } catch (error) {
    console.error('Error deploying template:', error)
    res.status(500).json({ error: error.message })
  }
})

// Deploy template to all matching iterations
router.post('/task-templates/:templateId/deploy-all', async (req, res) => {
  try {
    const { templateId } = req.params
    const result = await taskInstanceRepo.deployTemplateToAll(templateId)
    res.status(201).json({ data: result })
  } catch (error) {
    console.error('Error deploying template to all:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== TEMPLATE MATERIALS ====================

// Add material to template
router.post('/task-templates/:templateId/materials', async (req, res) => {
  try {
    const { templateId } = req.params
    const material = await taskTemplateRepo.addMaterial(templateId, req.body)
    res.status(201).json({ data: material })
  } catch (error) {
    console.error('Error adding material:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update template material
router.put('/template-materials/:materialId', async (req, res) => {
  try {
    const { materialId } = req.params
    const material = await taskTemplateRepo.updateMaterial(materialId, req.body)
    res.json({ data: material })
  } catch (error) {
    console.error('Error updating material:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete template material
router.delete('/template-materials/:materialId', async (req, res) => {
  try {
    const { materialId } = req.params
    await taskTemplateRepo.deleteMaterial(materialId)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting material:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== TEMPLATE TOOLS ====================

// Add tool to template
router.post('/task-templates/:templateId/tools', async (req, res) => {
  try {
    const { templateId } = req.params
    const tool = await taskTemplateRepo.addTool(templateId, req.body)
    res.status(201).json({ data: tool })
  } catch (error) {
    console.error('Error adding tool:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update template tool
router.put('/template-tools/:toolId', async (req, res) => {
  try {
    const { toolId } = req.params
    const tool = await taskTemplateRepo.updateTool(toolId, req.body)
    res.json({ data: tool })
  } catch (error) {
    console.error('Error updating tool:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete template tool
router.delete('/template-tools/:toolId', async (req, res) => {
  try {
    const { toolId } = req.params
    await taskTemplateRepo.deleteTool(toolId)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting tool:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== PHASE CHECKLISTS ====================

// Get phase checklist for a template
router.get('/task-templates/:templateId/checklists', async (req, res) => {
  try {
    const { templateId } = req.params
    const checklists = await phaseRepo.getTemplateChecklists(templateId)
    res.json({ data: checklists })
  } catch (error) {
    console.error('Error fetching checklists:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create phase checklist item
router.post('/task-templates/:templateId/checklists', async (req, res) => {
  try {
    const { templateId } = req.params
    const { phase_id, ...checklistData } = req.body
    const checklist = await phaseRepo.createPhaseChecklist(phase_id, templateId, checklistData)
    res.status(201).json({ data: checklist })
  } catch (error) {
    console.error('Error creating checklist item:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update phase checklist item
router.put('/phase-checklists/:checklistId', async (req, res) => {
  try {
    const { checklistId } = req.params
    const checklist = await phaseRepo.updatePhaseChecklistItem(checklistId, req.body)
    res.json({ data: checklist })
  } catch (error) {
    console.error('Error updating checklist item:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete phase checklist item
router.delete('/phase-checklists/:checklistId', async (req, res) => {
  try {
    const { checklistId } = req.params
    await phaseRepo.deletePhaseChecklistItem(checklistId)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting checklist item:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== TASK INSTANCES ====================

// Get task instances for a project
router.get('/:projectId/task-instances', async (req, res) => {
  try {
    const { projectId } = req.params
    const { phase_id, iteration_id, category_id, status, assignee_id, page, limit, sortBy, sortOrder } = req.query

    const filters = {}
    if (phase_id) filters.phase_id = phase_id
    if (iteration_id) filters.iteration_id = iteration_id
    if (category_id) filters.category_id = category_id
    if (status) filters.status = status
    if (assignee_id) filters.assignee_id = assignee_id

    const pagination = {}
    if (page) pagination.page = parseInt(page)
    if (limit) pagination.limit = parseInt(limit)
    if (sortBy) pagination.sortBy = sortBy
    if (sortOrder) pagination.sortOrder = sortOrder

    const result = await taskInstanceRepo.getProjectInstances(projectId, filters, pagination)
    res.json(result)
  } catch (error) {
    console.error('Error fetching task instances:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get instances by phase
router.get('/:projectId/task-instances/by-phase/:phaseId', async (req, res) => {
  try {
    const { projectId, phaseId } = req.params
    const instances = await taskInstanceRepo.getInstancesByPhase(projectId, phaseId)
    res.json({ data: instances })
  } catch (error) {
    console.error('Error fetching instances by phase:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get instances by location
router.get('/:projectId/task-instances/by-location', async (req, res) => {
  try {
    const { projectId } = req.params
    const { location_path } = req.query
    const instances = await taskInstanceRepo.getInstancesByLocation(projectId, location_path)
    res.json({ data: instances })
  } catch (error) {
    console.error('Error fetching instances by location:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get instances by category
router.get('/:projectId/task-instances/by-category/:categoryId', async (req, res) => {
  try {
    const { projectId, categoryId } = req.params
    const instances = await taskInstanceRepo.getInstancesByCategory(projectId, categoryId)
    res.json({ data: instances })
  } catch (error) {
    console.error('Error fetching instances by category:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get single task instance
router.get('/task-instances/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params
    const instance = await taskInstanceRepo.getInstanceById(instanceId)
    res.json({ data: instance })
  } catch (error) {
    console.error('Error fetching task instance:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get task instance with full details
router.get('/task-instances/:instanceId/details', async (req, res) => {
  try {
    const { instanceId } = req.params
    const details = await taskInstanceRepo.getInstanceDetails(instanceId)
    res.json({ data: details })
  } catch (error) {
    console.error('Error fetching instance details:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update task instance
router.put('/task-instances/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params
    const instance = await taskInstanceRepo.updateInstance(instanceId, req.body)
    res.json({ data: instance })
  } catch (error) {
    console.error('Error updating task instance:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete task instance
router.delete('/task-instances/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params
    await taskInstanceRepo.deleteInstance(instanceId)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting task instance:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== TASK CHECKLIST ITEMS ====================

// Toggle checklist item completion
router.post('/task-checklist-items/:checklistItemId/toggle', async (req, res) => {
  try {
    const { checklistItemId } = req.params
    const userId = req.user?.id || req.body.user_id
    const item = await taskInstanceRepo.toggleChecklistItem(checklistItemId, userId)
    res.json({ data: item })
  } catch (error) {
    console.error('Error toggling checklist item:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== INSTANCE MATERIALS ====================

// Add material to task instance
router.post('/task-instances/:instanceId/materials', async (req, res) => {
  try {
    const { instanceId } = req.params
    const userId = req.user?.id || req.body.user_id
    const material = await taskInstanceRepo.addInstanceMaterial(instanceId, req.body, userId)
    res.status(201).json({ data: material })
  } catch (error) {
    console.error('Error adding instance material:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update instance material
router.put('/instance-materials/:materialId', async (req, res) => {
  try {
    const { materialId } = req.params
    const material = await taskInstanceRepo.updateInstanceMaterial(materialId, req.body)
    res.json({ data: material })
  } catch (error) {
    console.error('Error updating instance material:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete instance material
router.delete('/instance-materials/:materialId', async (req, res) => {
  try {
    const { materialId } = req.params
    await taskInstanceRepo.deleteInstanceMaterial(materialId)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting instance material:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== CHANGE ORDERS ====================

// Get change orders for a project
router.get('/:projectId/change-orders', async (req, res) => {
  try {
    const { projectId } = req.params
    const { status, source, instance_id, page, limit, sortBy, sortOrder } = req.query

    const filters = {}
    if (status) filters.status = status
    if (source) filters.source = source
    if (instance_id) filters.instance_id = instance_id

    const pagination = {}
    if (page) pagination.page = parseInt(page)
    if (limit) pagination.limit = parseInt(limit)
    if (sortBy) pagination.sortBy = sortBy
    if (sortOrder) pagination.sortOrder = sortOrder

    const result = await changeOrderRepo.getProjectChangeOrders(projectId, filters, pagination)
    res.json(result)
  } catch (error) {
    console.error('Error fetching change orders:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get change order summary
router.get('/:projectId/change-orders/summary', async (req, res) => {
  try {
    const { projectId } = req.params
    const summary = await changeOrderRepo.getChangeOrderSummary(projectId)
    res.json({ data: summary })
  } catch (error) {
    console.error('Error fetching change order summary:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get single change order
router.get('/change-orders/:coId', async (req, res) => {
  try {
    const { coId } = req.params
    const co = await changeOrderRepo.getChangeOrderById(coId)
    res.json({ data: co })
  } catch (error) {
    console.error('Error fetching change order:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create change order
router.post('/:projectId/change-orders', async (req, res) => {
  try {
    const { projectId } = req.params
    const userId = req.user?.id || req.body.created_by
    const co = await changeOrderRepo.createChangeOrder(projectId, req.body, userId)
    res.status(201).json({ data: co })
  } catch (error) {
    console.error('Error creating change order:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update change order
router.put('/change-orders/:coId', async (req, res) => {
  try {
    const { coId } = req.params
    const co = await changeOrderRepo.updateChangeOrder(coId, req.body)
    res.json({ data: co })
  } catch (error) {
    console.error('Error updating change order:', error)
    res.status(500).json({ error: error.message })
  }
})

// Approve change order
router.post('/change-orders/:coId/approve', async (req, res) => {
  try {
    const { coId } = req.params
    const userId = req.user?.id || req.body.user_id
    const { notes } = req.body
    const co = await changeOrderRepo.approveChangeOrder(coId, userId, notes)
    res.json({ data: co })
  } catch (error) {
    console.error('Error approving change order:', error)
    res.status(500).json({ error: error.message })
  }
})

// Reject change order
router.post('/change-orders/:coId/reject', async (req, res) => {
  try {
    const { coId } = req.params
    const userId = req.user?.id || req.body.user_id
    const { reason } = req.body
    const co = await changeOrderRepo.rejectChangeOrder(coId, userId, reason)
    res.json({ data: co })
  } catch (error) {
    console.error('Error rejecting change order:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete change order
router.delete('/change-orders/:coId', async (req, res) => {
  try {
    const { coId } = req.params
    await changeOrderRepo.deleteChangeOrder(coId)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting change order:', error)
    res.status(500).json({ error: error.message })
  }
})

// ==================== UNCAPTURED LABOUR ====================

// Get uncaptured labour log for a project
router.get('/:projectId/uncaptured-labour', async (req, res) => {
  try {
    const { projectId } = req.params
    const { status, instance_id, page, limit, sortBy, sortOrder } = req.query

    const filters = {}
    if (status) filters.status = status
    if (instance_id) filters.instance_id = instance_id

    const pagination = {}
    if (page) pagination.page = parseInt(page)
    if (limit) pagination.limit = parseInt(limit)
    if (sortBy) pagination.sortBy = sortBy
    if (sortOrder) pagination.sortOrder = sortOrder

    const result = await changeOrderRepo.getUncapturedLabour(projectId, filters, pagination)
    res.json(result)
  } catch (error) {
    console.error('Error fetching uncaptured labour:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get uncaptured labour summary
router.get('/:projectId/uncaptured-labour/summary', async (req, res) => {
  try {
    const { projectId } = req.params
    const summary = await changeOrderRepo.getUncapturedLabourSummary(projectId)
    res.json({ data: summary })
  } catch (error) {
    console.error('Error fetching uncaptured labour summary:', error)
    res.status(500).json({ error: error.message })
  }
})

// Log uncaptured labour
router.post('/:projectId/uncaptured-labour', async (req, res) => {
  try {
    const { projectId } = req.params
    const userId = req.user?.id || req.body.logged_by
    const log = await changeOrderRepo.logUncapturedLabour(projectId, req.body, userId)
    res.status(201).json({ data: log })
  } catch (error) {
    console.error('Error logging uncaptured labour:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update uncaptured labour entry
router.put('/uncaptured-labour/:logId', async (req, res) => {
  try {
    const { logId } = req.params
    const log = await changeOrderRepo.updateUncapturedLabour(logId, req.body)
    res.json({ data: log })
  } catch (error) {
    console.error('Error updating uncaptured labour:', error)
    res.status(500).json({ error: error.message })
  }
})

// Convert uncaptured labour to change order
router.post('/uncaptured-labour/:logId/convert-to-co', async (req, res) => {
  try {
    const { logId } = req.params
    const userId = req.user?.id || req.body.user_id
    const co = await changeOrderRepo.convertUncapturedLabourToCO(logId, userId)
    res.status(201).json({ data: co })
  } catch (error) {
    console.error('Error converting to change order:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete uncaptured labour entry
router.delete('/uncaptured-labour/:logId', async (req, res) => {
  try {
    const { logId } = req.params
    await changeOrderRepo.deleteUncapturedLabour(logId)
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting uncaptured labour:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get combined financial impact (COs + uncaptured labour)
router.get('/:projectId/financial-impact', async (req, res) => {
  try {
    const { projectId } = req.params
    const impact = await changeOrderRepo.getProjectFinancialImpact(projectId)
    res.json({ data: impact })
  } catch (error) {
    console.error('Error fetching financial impact:', error)
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
