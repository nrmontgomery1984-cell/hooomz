import { useState, useEffect } from 'react'
import { api } from '../services/api'

export const useHomes = () => {
  const [homes, setHomes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchHomes = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/homes')
      setHomes(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createHome = async (homeData) => {
    try {
      const { data } = await api.post('/homes', homeData)
      setHomes(prev => [...prev, data])
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateHome = async (homeId, homeData) => {
    try {
      const { data } = await api.put(`/homes/${homeId}`, homeData)
      setHomes(prev => prev.map(h => h.id === homeId ? data : h))
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deleteHome = async (homeId) => {
    try {
      await api.delete(`/homes/${homeId}`)
      setHomes(prev => prev.filter(h => h.id !== homeId))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  useEffect(() => {
    fetchHomes()
  }, [])

  return {
    homes,
    loading,
    error,
    refetch: fetchHomes,
    createHome,
    updateHome,
    deleteHome
  }
}
