import { useState, useEffect } from 'react'
import api from '../services/api'

export const useContacts = (filters = {}) => {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchContacts()
  }, [filters.type, filters.trade, filters.favorite, filters.project])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.type) params.append('type', filters.type)
      if (filters.trade) params.append('trade', filters.trade)
      if (filters.favorite) params.append('favorite', filters.favorite)
      if (filters.project) params.append('project', filters.project)

      const response = await api.get(`/contacts?${params.toString()}`)
      setContacts(response.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching contacts:', err)
      setError(err.response?.data?.error || 'Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }

  const createContact = async (contactData) => {
    try {
      const response = await api.post('/contacts', contactData)
      setContacts([...contacts, response.data])
      return response.data
    } catch (err) {
      console.error('Error creating contact:', err)
      throw err
    }
  }

  const updateContact = async (id, updates) => {
    try {
      const response = await api.put(`/contacts/${id}`, updates)
      setContacts(contacts.map(c => c.id === id ? response.data : c))
      return response.data
    } catch (err) {
      console.error('Error updating contact:', err)
      throw err
    }
  }

  const deleteContact = async (id) => {
    try {
      await api.delete(`/contacts/${id}`)
      setContacts(contacts.filter(c => c.id !== id))
    } catch (err) {
      console.error('Error deleting contact:', err)
      throw err
    }
  }

  const toggleFavorite = async (id, currentFavorite) => {
    try {
      await updateContact(id, { is_favorite: !currentFavorite })
    } catch (err) {
      console.error('Error toggling favorite:', err)
      throw err
    }
  }

  return {
    contacts,
    loading,
    error,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
    toggleFavorite
  }
}
