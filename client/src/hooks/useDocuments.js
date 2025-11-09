import { useState, useEffect } from 'react'
import { api } from '../services/api'

export const useDocuments = (homeId) => {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDocuments = async () => {
    if (!homeId) return
    try {
      setLoading(true)
      const { data } = await api.get(`/homes/${homeId}/documents`)
      setDocuments(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createDocument = async (documentData) => {
    try {
      const { data } = await api.post(`/homes/${homeId}/documents`, documentData)
      setDocuments(prev => [...prev, data])
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateDocument = async (documentId, documentData) => {
    try {
      const { data } = await api.put(`/documents/${documentId}`, documentData)
      setDocuments(prev => prev.map(d => d.id === documentId ? data : d))
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deleteDocument = async (documentId) => {
    try {
      await api.delete(`/documents/${documentId}`)
      setDocuments(prev => prev.filter(d => d.id !== documentId))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [homeId])

  return {
    documents,
    loading,
    error,
    refetch: fetchDocuments,
    createDocument,
    updateDocument,
    deleteDocument
  }
}
