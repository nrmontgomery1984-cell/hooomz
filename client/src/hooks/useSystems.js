import { useState, useEffect } from 'react'
import { api } from '../services/api'

export const useSystems = (homeId) => {
  const [systems, setSystems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSystems = async () => {
    if (!homeId) return
    try {
      setLoading(true)
      const { data } = await api.get(`/homes/${homeId}/systems`)
      setSystems(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createSystem = async (systemData) => {
    try {
      const { data } = await api.post(`/homes/${homeId}/systems`, systemData)
      setSystems(prev => [...prev, data])
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateSystem = async (systemId, systemData) => {
    try {
      const { data } = await api.put(`/systems/${systemId}`, systemData)
      setSystems(prev => prev.map(s => s.id === systemId ? data : s))
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deleteSystem = async (systemId) => {
    try {
      await api.delete(`/systems/${systemId}`)
      setSystems(prev => prev.filter(s => s.id !== systemId))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  useEffect(() => {
    fetchSystems()
  }, [homeId])

  return {
    systems,
    loading,
    error,
    refetch: fetchSystems,
    createSystem,
    updateSystem,
    deleteSystem
  }
}
