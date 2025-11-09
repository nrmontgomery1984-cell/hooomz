import { useState, useEffect } from 'react'
import { api } from '../services/api'

export const useRooms = (homeId) => {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRooms = async () => {
    if (!homeId) return
    try {
      setLoading(true)
      const { data } = await api.get(`/homes/${homeId}/rooms`)
      setRooms(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createRoom = async (roomData) => {
    try {
      const { data } = await api.post(`/homes/${homeId}/rooms`, roomData)
      setRooms(prev => [...prev, data])
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateRoom = async (roomId, roomData) => {
    try {
      const { data } = await api.put(`/rooms/${roomId}`, roomData)
      setRooms(prev => prev.map(r => r.id === roomId ? data : r))
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deleteRoom = async (roomId) => {
    try {
      await api.delete(`/rooms/${roomId}`)
      setRooms(prev => prev.filter(r => r.id !== roomId))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [homeId])

  return {
    rooms,
    loading,
    error,
    refetch: fetchRooms,
    createRoom,
    updateRoom,
    deleteRoom
  }
}
