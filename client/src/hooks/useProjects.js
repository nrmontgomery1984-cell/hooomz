import { useState, useEffect, useCallback } from 'react'
import * as projectsApi from '../services/projectsApi'

/**
 * Custom hook for project management
 */
export const useProjects = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await projectsApi.getProjects()
      setProjects(data)
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const createProject = async (projectData) => {
    const newProject = await projectsApi.createProject(projectData)
    setProjects(prev => [newProject, ...prev])
    return newProject
  }

  const updateProject = async (projectId, updates) => {
    const updated = await projectsApi.updateProject(projectId, updates)
    setProjects(prev => prev.map(p => p.id === projectId ? updated : p))
    return updated
  }

  const deleteProject = async (projectId) => {
    await projectsApi.deleteProject(projectId)
    setProjects(prev => prev.filter(p => p.id !== projectId))
  }

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject
  }
}

/**
 * Custom hook for a single project with full scope
 */
export const useProjectScope = (projectId) => {
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProject = useCallback(async () => {
    if (!projectId) return

    try {
      setLoading(true)
      setError(null)
      const data = await projectsApi.getProjectWithScope(projectId)
      setProject(data)
    } catch (err) {
      console.error('Error fetching project scope:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  const updateScopeItem = async (itemId, updates) => {
    const updated = await projectsApi.updateScopeItem(itemId, updates)

    // Update the local state
    setProject(prev => {
      if (!prev) return prev

      const newCategories = prev.categories.map(cat => ({
        ...cat,
        subcategories: cat.subcategories.map(sub => ({
          ...sub,
          items: sub.items.map(item =>
            item.id === itemId ? updated : item
          )
        }))
      }))

      return { ...prev, categories: newCategories }
    })

    return updated
  }

  return {
    project,
    loading,
    error,
    fetchProject,
    updateScopeItem
  }
}

/**
 * Custom hook for time tracking
 */
export const useTimeTracking = (projectId) => {
  const [timeEntries, setTimeEntries] = useState([])
  const [activeEntry, setActiveEntry] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchTimeEntries = useCallback(async (filters = {}) => {
    if (!projectId) return

    try {
      setLoading(true)
      setError(null)
      const data = await projectsApi.getTimeEntries(projectId, filters)
      setTimeEntries(data)
    } catch (err) {
      console.error('Error fetching time entries:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const checkActiveEntry = async (workerName) => {
    try {
      const active = await projectsApi.getActiveTimeEntry(workerName)
      setActiveEntry(active)
      return active
    } catch (err) {
      setActiveEntry(null)
      return null
    }
  }

  const startTimer = async (scopeItemId, workerName, notes = '') => {
    const entry = await projectsApi.startTimeEntry(scopeItemId, workerName, notes)
    setActiveEntry(entry)
    setTimeEntries(prev => [entry, ...prev])
    return entry
  }

  const stopTimer = async (entryId) => {
    const updated = await projectsApi.stopTimeEntry(entryId)
    setActiveEntry(null)
    setTimeEntries(prev => prev.map(e => e.id === entryId ? updated : e))
    return updated
  }

  const deleteEntry = async (entryId) => {
    await projectsApi.deleteTimeEntry(entryId)
    setTimeEntries(prev => prev.filter(e => e.id !== entryId))
    if (activeEntry?.id === entryId) {
      setActiveEntry(null)
    }
  }

  return {
    timeEntries,
    activeEntry,
    loading,
    error,
    fetchTimeEntries,
    checkActiveEntry,
    startTimer,
    stopTimer,
    deleteEntry
  }
}
