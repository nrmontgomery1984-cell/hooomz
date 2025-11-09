import { useState, useEffect } from 'react'
import { Modal } from '../UI/Modal'
import { Button } from '../UI/Button'

/**
 * HomeForm Component
 * Form for creating/editing homes
 */
export const HomeForm = ({
  isOpen,
  onClose,
  onSubmit,
  home = null
}) => {
  const [formData, setFormData] = useState({
    address: '',
    year_built: '',
    sqft: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Populate form when editing
  useEffect(() => {
    if (home) {
      setFormData({
        address: home.address || '',
        year_built: home.year_built || '',
        sqft: home.sqft || ''
      })
    } else {
      // Reset form for new home
      setFormData({
        address: '',
        year_built: '',
        sqft: ''
      })
    }
  }, [home, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate required fields
    if (!formData.address) {
      setError('Address is required')
      return
    }

    setSubmitting(true)

    try {
      // Clean up empty fields
      const cleanData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null) {
          // Convert numbers
          if (key === 'year_built' || key === 'sqft') {
            acc[key] = parseInt(value, 10)
          } else {
            acc[key] = value
          }
        }
        return acc
      }, {})

      await onSubmit(cleanData)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save home')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={home ? 'Edit Home' : 'Add New Home'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Address - Required */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="123 Main St, City, State ZIP"
          />
        </div>

        {/* Year Built */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year Built
          </label>
          <input
            type="number"
            name="year_built"
            value={formData.year_built}
            onChange={handleChange}
            min="1800"
            max={new Date().getFullYear()}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g., 2015"
          />
        </div>

        {/* Square Footage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Square Footage
          </label>
          <input
            type="number"
            name="sqft"
            value={formData.sqft}
            onChange={handleChange}
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g., 2000"
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : home ? 'Update Home' : 'Add Home'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default HomeForm
