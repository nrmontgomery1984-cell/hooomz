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
