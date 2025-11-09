import { useState, useEffect } from 'react'
import { api } from '../services/api'

export const useMaintenance = (homeId) => {
  const [maintenanceTasks, setMaintenanceTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMaintenance = async () => {
    if (!homeId) return
    try {
      setLoading(true)
      const { data } = await api.get(`/homes/${homeId}/maintenance`)
      setMaintenanceTasks(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createMaintenanceTask = async (taskData) => {
    try {
      const { data } = await api.post(`/homes/${homeId}/maintenance`, taskData)
      setMaintenanceTasks(prev => [...prev, data])
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateMaintenanceTask = async (taskId, taskData) => {
    try {
      const { data } = await api.put(`/maintenance/${taskId}`, taskData)
      setMaintenanceTasks(prev => prev.map(t => t.id === taskId ? data : t))
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deleteMaintenanceTask = async (taskId) => {
    try {
      await api.delete(`/maintenance/${taskId}`)
      setMaintenanceTasks(prev => prev.filter(t => t.id !== taskId))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const completeMaintenanceTask = async (taskId) => {
    try {
      const { data } = await api.post(`/maintenance/${taskId}/complete`)
      setMaintenanceTasks(prev => prev.map(t => t.id === taskId ? data : t))
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  useEffect(() => {
    fetchMaintenance()
  }, [homeId])

  return {
    maintenanceTasks,
    loading,
    error,
    refetch: fetchMaintenance,
    createMaintenanceTask,
    updateMaintenanceTask,
    deleteMaintenanceTask,
    completeMaintenanceTask
  }
}
