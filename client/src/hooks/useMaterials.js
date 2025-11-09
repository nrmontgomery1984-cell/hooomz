import { useState, useEffect } from 'react'
import { api } from '../services/api'

/**
 * useMaterials Hook
 * Manages materials state and API operations
 */
export const useMaterials = (homeId, filters = {}) => {
  const [materials, setMaterials] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Fetch materials for a home
   */
  const fetchMaterials = async () => {
    if (!homeId) return

    try {
      setLoading(true)
      setError(null)

      // Build query params
      const params = new URLSearchParams()
      if (filters.category) params.append('category', filters.category)
      if (filters.room_id) params.append('room_id', filters.room_id)

      const queryString = params.toString()
      const endpoint = `/homes/${homeId}/materials${queryString ? `?${queryString}` : ''}`

      const { data } = await api.get(endpoint)
      setMaterials(data.data || data) // Handle both response formats
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch materials')
      console.error('Error fetching materials:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Fetch material categories
   */
  const fetchCategories = async () => {
    console.log('[useMaterials] Fetching categories from /materials/categories')
    try {
      const response = await api.get('/materials/categories')
      console.log('[useMaterials] Full API response:', response)
      console.log('[useMaterials] Response data:', response.data)
      console.log('[useMaterials] Response data.data:', response.data?.data)

      const categoriesArray = response.data?.data || response.data || []
      console.log('[useMaterials] Extracted categories array:', categoriesArray)
      console.log('[useMaterials] Is array?', Array.isArray(categoriesArray))
      console.log('[useMaterials] Array length:', categoriesArray?.length)

      setCategories(categoriesArray)
      console.log('[useMaterials] Categories state updated')
    } catch (err) {
      console.error('[useMaterials] Error fetching categories:', err)
      console.error('[useMaterials] Error response:', err.response)
      console.error('[useMaterials] Error data:', err.response?.data)
    }
  }

  /**
   * Create a new material
   */
  const createMaterial = async (materialData) => {
    try {
      setError(null)
      const { data } = await api.post(`/homes/${homeId}/materials`, materialData)
      const newMaterial = data.data || data

      setMaterials(prev => [newMaterial, ...prev])
      return { data: newMaterial, error: null }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create material'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Update a material
   */
  const updateMaterial = async (materialId, materialData) => {
    try {
      setError(null)
      const { data } = await api.put(`/materials/${materialId}`, materialData)
      const updatedMaterial = data.data || data

      setMaterials(prev => prev.map(m => m.id === materialId ? updatedMaterial : m))
      return { data: updatedMaterial, error: null }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update material'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Delete a material
   */
  const deleteMaterial = async (materialId) => {
    try {
      setError(null)
      await api.delete(`/materials/${materialId}`)
      setMaterials(prev => prev.filter(m => m.id !== materialId))
      return { error: null }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete material'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }

  // Fetch materials when homeId or filters change
  useEffect(() => {
    fetchMaterials()
  }, [homeId, filters.category, filters.room_id])

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  return {
    materials,
    categories,
    loading,
    error,
    refetch: fetchMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial
  }
}

export default useMaterials
