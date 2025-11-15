import api from './api'

/**
 * Projects API Service
 * Handles all project management and time tracking API calls
 */

// ==================== PROJECTS ====================

export const getProjects = async () => {
  const response = await api.get('/projects')
  return response.data.data
}

export const getProject = async (projectId) => {
  const response = await api.get(`/projects/${projectId}`)
  return response.data.data
}

export const getProjectWithScope = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/scope`)
  return response.data.data
}

export const createProject = async (projectData) => {
  const response = await api.post('/projects', projectData)
  return response.data.data
}

export const updateProject = async (projectId, updates) => {
  const response = await api.put(`/projects/${projectId}`, updates)
  return response.data.data
}

export const deleteProject = async (projectId) => {
  const response = await api.delete(`/projects/${projectId}`)
  return response.data
}

// ==================== SCOPE ITEMS ====================

export const getAllScopeItems = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/items`)
  return response.data.data
}

export const createScopeItem = async (subcategoryId, itemData) => {
  const response = await api.post(`/projects/subcategories/${subcategoryId}/items`, itemData)
  return response.data.data
}

export const updateScopeItem = async (itemId, updates) => {
  const response = await api.put(`/projects/items/${itemId}`, updates)
  return response.data.data
}

export const deleteScopeItem = async (itemId) => {
  const response = await api.delete(`/projects/items/${itemId}`)
  return response.data
}

// ==================== TIME TRACKING ====================

export const getTimeEntries = async (projectId, filters = {}) => {
  const params = new URLSearchParams(filters)
  const response = await api.get(`/projects/${projectId}/time-entries?${params}`)
  return response.data.data
}

export const getActiveTimeEntry = async (workerName) => {
  const response = await api.get(`/projects/time-entries/active/${workerName}`)
  return response.data.data
}

export const startTimeEntry = async (scopeItemId, workerName, notes = '') => {
  const response = await api.post(`/projects/items/${scopeItemId}/time-entries`, {
    worker_name: workerName,
    notes,
    start_time: new Date().toISOString()
  })
  return response.data.data
}

export const stopTimeEntry = async (entryId) => {
  const response = await api.post(`/projects/time-entries/${entryId}/stop`)
  return response.data.data
}

export const updateTimeEntry = async (entryId, updates) => {
  const response = await api.put(`/projects/time-entries/${entryId}`, updates)
  return response.data.data
}

export const deleteTimeEntry = async (entryId) => {
  const response = await api.delete(`/projects/time-entries/${entryId}`)
  return response.data
}

// ==================== CATEGORIES ====================

export const createCategory = async (projectId, categoryData) => {
  const response = await api.post(`/projects/${projectId}/categories`, categoryData)
  return response.data.data
}

export const createSubcategory = async (categoryId, subcategoryData) => {
  const response = await api.post(`/projects/categories/${categoryId}/subcategories`, subcategoryData)
  return response.data.data
}

// ==================== ESTIMATES ====================

export const getEstimates = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/estimates`)
  return response.data.data
}

export const getEstimate = async (estimateId) => {
  const response = await api.get(`/projects/estimates/${estimateId}`)
  return response.data.data
}

export const createEstimate = async (projectId, estimateData) => {
  const response = await api.post(`/projects/${projectId}/estimates`, estimateData)
  return response.data.data
}

export const updateEstimate = async (estimateId, updates) => {
  const response = await api.put(`/projects/estimates/${estimateId}`, updates)
  return response.data.data
}

export const deleteEstimate = async (estimateId) => {
  const response = await api.delete(`/projects/estimates/${estimateId}`)
  return response.data
}

// ==================== ESTIMATE LINE ITEMS ====================

export const createLineItem = async (estimateId, lineItemData) => {
  const response = await api.post(`/projects/estimates/${estimateId}/line-items`, lineItemData)
  return response.data.data
}

export const updateLineItem = async (lineItemId, updates) => {
  const response = await api.put(`/projects/line-items/${lineItemId}`, updates)
  return response.data.data
}

export const deleteLineItem = async (lineItemId) => {
  const response = await api.delete(`/projects/line-items/${lineItemId}`)
  return response.data
}

// ==================== LOOP CONTEXTS & ITERATIONS ====================

export const getLoopContexts = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/loop-contexts`)
  return response.data.data
}

export const createLoopContext = async (projectId, contextData) => {
  const response = await api.post(`/projects/${projectId}/loop-contexts`, contextData)
  return response.data.data
}

export const updateLoopContext = async (contextId, updates) => {
  const response = await api.put(`/projects/loop-contexts/${contextId}`, updates)
  return response.data.data
}

export const deleteLoopContext = async (contextId) => {
  const response = await api.delete(`/projects/loop-contexts/${contextId}`)
  return response.data
}

export const getLoopIterations = async (contextId) => {
  const response = await api.get(`/projects/loop-contexts/${contextId}/iterations`)
  return response.data.data
}

export const getBuildingStructure = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/building-structure`)
  return response.data.data
}

export const createLoopIteration = async (contextId, iterationData) => {
  const response = await api.post(`/projects/loop-contexts/${contextId}/iterations`, iterationData)
  return response.data.data
}

export const updateLoopIteration = async (iterationId, updates) => {
  const response = await api.put(`/projects/loop-iterations/${iterationId}`, updates)
  return response.data.data
}

// ==================== PHASES ====================

export const getGlobalPhases = async () => {
  const response = await api.get('/projects/phases/global')
  return response.data.data
}

export const getProjectPhases = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/phases`)
  return response.data.data
}

export const createProjectPhase = async (projectId, phaseData) => {
  const response = await api.post(`/projects/${projectId}/phases`, phaseData)
  return response.data.data
}

export const updatePhase = async (phaseId, updates) => {
  const response = await api.put(`/projects/phases/${phaseId}`, updates)
  return response.data.data
}

export const deletePhase = async (phaseId) => {
  const response = await api.delete(`/projects/phases/${phaseId}`)
  return response.data
}

export const getPhaseStats = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/phase-stats`)
  return response.data.data
}

// ==================== TASK TEMPLATES (Quantum Tasks) ====================

export const getTaskTemplates = async (projectId, includeCompleted = true) => {
  const params = new URLSearchParams({ includeCompleted: includeCompleted.toString() })
  const response = await api.get(`/projects/${projectId}/task-templates?${params}`)
  return response.data.data
}

export const getQuantumTasks = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/quantum-tasks`)
  return response.data.data
}

export const getTaskTemplate = async (templateId) => {
  const response = await api.get(`/projects/task-templates/${templateId}`)
  return response.data.data
}

export const createTaskTemplate = async (projectId, templateData) => {
  const response = await api.post(`/projects/${projectId}/task-templates`, templateData)
  return response.data.data
}

export const convertEstimateToTemplate = async (projectId, lineItemId) => {
  const response = await api.post(`/projects/${projectId}/convert-estimate`, { lineItemId })
  return response.data.data
}

export const updateTaskTemplate = async (templateId, updates) => {
  const response = await api.put(`/projects/task-templates/${templateId}`, updates)
  return response.data.data
}

export const deleteTaskTemplate = async (templateId) => {
  const response = await api.delete(`/projects/task-templates/${templateId}`)
  return response.data
}

export const deployTemplate = async (templateId, iterationId) => {
  const response = await api.post(`/projects/task-templates/${templateId}/deploy`, { iterationId })
  return response.data.data
}

export const deployTemplateToAll = async (templateId) => {
  const response = await api.post(`/projects/task-templates/${templateId}/deploy-all`)
  return response.data.data
}

// ==================== TEMPLATE MATERIALS ====================

export const getTemplateMaterials = async (templateId) => {
  const response = await api.get(`/projects/task-templates/${templateId}/materials`)
  return response.data.data
}

export const addTemplateMaterial = async (templateId, materialData) => {
  const response = await api.post(`/projects/task-templates/${templateId}/materials`, materialData)
  return response.data.data
}

export const updateTemplateMaterial = async (materialId, updates) => {
  const response = await api.put(`/projects/template-materials/${materialId}`, updates)
  return response.data.data
}

// ==================== TEMPLATE TOOLS ====================

export const getTemplateTools = async (templateId) => {
  const response = await api.get(`/projects/task-templates/${templateId}/tools`)
  return response.data.data
}

export const addTemplateTool = async (templateId, toolData) => {
  const response = await api.post(`/projects/task-templates/${templateId}/tools`, toolData)
  return response.data.data
}

export const updateTemplateTool = async (toolId, updates) => {
  const response = await api.put(`/projects/template-tools/${toolId}`, updates)
  return response.data.data
}

// ==================== PHASE CHECKLISTS ====================

export const getPhaseChecklist = async (phaseId) => {
  const response = await api.get(`/projects/phases/${phaseId}/checklists`)
  return response.data.data
}

export const getTemplateChecklists = async (templateId) => {
  const response = await api.get(`/projects/task-templates/${templateId}/checklists`)
  return response.data.data
}

export const createPhaseChecklist = async (phaseId, templateId, checklistData) => {
  const response = await api.post(`/projects/phases/${phaseId}/checklists`, {
    templateId,
    ...checklistData
  })
  return response.data.data
}

export const updatePhaseChecklistItem = async (checklistId, updates) => {
  const response = await api.put(`/projects/phase-checklists/${checklistId}`, updates)
  return response.data.data
}

// ==================== TASK INSTANCES ====================

export const getTaskInstances = async (projectId, filters = {}) => {
  const params = new URLSearchParams()
  if (filters.status) params.append('status', filters.status)
  if (filters.priority) params.append('priority', filters.priority)
  if (filters.phase) params.append('phase', filters.phase)
  if (filters.context) params.append('context', filters.context)
  if (filters.iteration) params.append('iteration', filters.iteration)
  if (filters.template) params.append('template', filters.template)
  if (filters.assignedTo) params.append('assignedTo', filters.assignedTo)
  if (filters.page) params.append('page', filters.page)
  if (filters.limit) params.append('limit', filters.limit)

  const response = await api.get(`/projects/${projectId}/task-instances?${params}`)
  return response.data
}

export const getTaskInstance = async (instanceId) => {
  const response = await api.get(`/projects/task-instances/${instanceId}`)
  return response.data.data
}

export const getTemplateInstances = async (templateId) => {
  const response = await api.get(`/projects/task-templates/${templateId}/instances`)
  return response.data.data
}

export const getIterationInstances = async (iterationId) => {
  const response = await api.get(`/projects/loop-iterations/${iterationId}/instances`)
  return response.data.data
}

export const updateTaskInstance = async (instanceId, updates) => {
  const response = await api.put(`/projects/task-instances/${instanceId}`, updates)
  return response.data.data
}

export const deleteTaskInstance = async (instanceId) => {
  const response = await api.delete(`/projects/task-instances/${instanceId}`)
  return response.data
}

export const getTaskInstanceStats = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/task-stats`)
  return response.data.data
}

export const bulkUpdateTaskInstances = async (instanceIds, updates) => {
  const response = await api.post('/projects/task-instances/bulk-update', {
    instanceIds,
    updates
  })
  return response.data.data
}

export const bulkDeleteTaskInstances = async (instanceIds) => {
  const response = await api.post('/projects/task-instances/bulk-delete', { instanceIds })
  return response.data
}

// ==================== CHECKLIST ITEMS ====================

export const updateChecklistItem = async (checklistItemId, updates) => {
  const response = await api.put(`/projects/checklist-items/${checklistItemId}`, updates)
  return response.data.data
}

// ==================== INSTANCE MATERIALS ====================

export const getInstanceMaterials = async (instanceId) => {
  const response = await api.get(`/projects/task-instances/${instanceId}/materials`)
  return response.data.data
}

export const addInstanceMaterial = async (instanceId, materialData) => {
  const response = await api.post(`/projects/task-instances/${instanceId}/materials`, materialData)
  return response.data.data
}

export const updateInstanceMaterial = async (materialId, updates) => {
  const response = await api.put(`/projects/instance-materials/${materialId}`, updates)
  return response.data.data
}

// ==================== CHANGE ORDERS ====================

export const getChangeOrders = async (projectId, filters = {}) => {
  const params = new URLSearchParams()
  if (filters.status) params.append('status', filters.status)
  if (filters.source) params.append('source', filters.source)
  if (filters.instance_id) params.append('instance_id', filters.instance_id)
  if (filters.page) params.append('page', filters.page)
  if (filters.limit) params.append('limit', filters.limit)

  const response = await api.get(`/projects/${projectId}/change-orders?${params}`)
  return response.data
}

export const getChangeOrder = async (coId) => {
  const response = await api.get(`/projects/change-orders/${coId}`)
  return response.data.data
}

export const createChangeOrder = async (projectId, coData) => {
  const response = await api.post(`/projects/${projectId}/change-orders`, coData)
  return response.data.data
}

export const updateChangeOrder = async (coId, updates) => {
  const response = await api.put(`/projects/change-orders/${coId}`, updates)
  return response.data.data
}

export const approveChangeOrder = async (coId, notes = null) => {
  const response = await api.post(`/projects/change-orders/${coId}/approve`, { notes })
  return response.data.data
}

export const rejectChangeOrder = async (coId, reason) => {
  const response = await api.post(`/projects/change-orders/${coId}/reject`, { reason })
  return response.data.data
}

export const deleteChangeOrder = async (coId) => {
  const response = await api.delete(`/projects/change-orders/${coId}`)
  return response.data
}

export const getChangeOrderSummary = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/change-order-summary`)
  return response.data.data
}

// ==================== UNCAPTURED LABOUR ====================

export const getUncapturedLabour = async (projectId, filters = {}) => {
  const params = new URLSearchParams()
  if (filters.status) params.append('status', filters.status)
  if (filters.instance_id) params.append('instance_id', filters.instance_id)
  if (filters.page) params.append('page', filters.page)
  if (filters.limit) params.append('limit', filters.limit)

  const response = await api.get(`/projects/${projectId}/uncaptured-labour?${params}`)
  return response.data
}

export const logUncapturedLabour = async (projectId, labourData) => {
  const response = await api.post(`/projects/${projectId}/uncaptured-labour`, labourData)
  return response.data.data
}

export const updateUncapturedLabour = async (logId, updates) => {
  const response = await api.put(`/projects/uncaptured-labour/${logId}`, updates)
  return response.data.data
}

export const convertUncapturedLabourToCO = async (logId) => {
  const response = await api.post(`/projects/uncaptured-labour/${logId}/convert-to-co`)
  return response.data.data
}

export const deleteUncapturedLabour = async (logId) => {
  const response = await api.delete(`/projects/uncaptured-labour/${logId}`)
  return response.data
}

export const getUncapturedLabourSummary = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/uncaptured-labour-summary`)
  return response.data.data
}

export const getProjectFinancialImpact = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/financial-impact`)
  return response.data.data
}
