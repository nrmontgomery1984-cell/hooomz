import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Modal } from '../UI/Modal'
import { Button } from '../UI/Button'
import { Dropdown } from '../UI/Dropdown'
import { ImageUpload } from '../UI/ImageUpload'
import { uploadMaterialImages, deleteMaterialImages } from '../../services/storage'

/**
 * MaterialForm Component
 * Form for creating/editing materials
 */
export const MaterialForm = ({
  isOpen,
  onClose,
  onSubmit,
  material = null,
  categories = [],
  rooms = []
}) => {
  const { homeId } = useParams()
  const [formData, setFormData] = useState({
    category: '',
    room_id: '',
    brand: '',
    model: '',
    color: '',
    supplier: '',
    purchase_date: '',
    purchase_price: '',
    notes: '',
    photos: []
  })

  const [submitting, setSubmitting] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [error, setError] = useState('')
  const [imageFiles, setImageFiles] = useState([])
  const [existingPhotos, setExistingPhotos] = useState([])

  // Populate form when editing
  useEffect(() => {
    if (material) {
      setFormData({
        category: material.category || '',
        room_id: material.room_id || '',
        brand: material.brand || '',
        model: material.model || '',
        color: material.color || '',
        supplier: material.supplier || '',
        purchase_date: material.purchase_date || '',
        purchase_price: material.purchase_price || '',
        notes: material.notes || '',
        photos: material.photos || []
      })
      setExistingPhotos(material.photos || [])
      setImageFiles([])
    } else {
      // Reset form for new material
      setFormData({
        category: '',
        room_id: '',
        brand: '',
        model: '',
        color: '',
        supplier: '',
        purchase_date: '',
        purchase_price: '',
        notes: '',
        photos: []
      })
      setExistingPhotos([])
      setImageFiles([])
    }
  }, [material, isOpen])

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
    if (!formData.category) {
      setError('Category is required')
      return
    }

    setSubmitting(true)

    try {
      let photoUrls = [...existingPhotos]

      // Upload new images if any
      if (imageFiles.length > 0) {
        setUploadingImages(true)
        const { urls, errors } = await uploadMaterialImages(
          imageFiles,
          homeId,
          material?.id || 'temp'
        )

        if (errors.length > 0) {
          console.error('Some images failed to upload:', errors)
          setError(`Failed to upload ${errors.length} image(s). Continuing with ${urls.length} successful uploads.`)
        }

        photoUrls = [...photoUrls, ...urls]
        setUploadingImages(false)
      }

      // Clean up empty fields and add photo URLs
      const cleanData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && key !== 'photos') {
          acc[key] = value
        }
        return acc
      }, {})

      // Add photo URLs
      cleanData.photos = photoUrls

      await onSubmit(cleanData)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save material')
    } finally {
      setSubmitting(false)
      setUploadingImages(false)
    }
  }

  const handleImagesChange = (files) => {
    setImageFiles(files)
  }

  const handleQRCodeDetected = (qrData) => {
    console.log('[MaterialForm] QR code detected callback called with data:', qrData)
    console.log('[MaterialForm] Current formData before update:', formData)

    // Auto-fill form fields from QR code data
    const newFormData = {
      ...formData,
      brand: qrData.brand || formData.brand,
      model: qrData.model || formData.model,
    }

    console.log('[MaterialForm] New formData after QR update:', newFormData)
    setFormData(newFormData)
    console.log('[MaterialForm] Form data state updated')
  }

  console.log('[MaterialForm] Rendering with props:', {
    categoriesLength: categories?.length,
    categories: categories,
    roomsLength: rooms?.length,
    formData: formData
  })

  // Fallback to hardcoded categories if API doesn't return any
  const defaultCategories = ['flooring', 'paint', 'countertop', 'cabinet', 'fixture', 'tile', 'hardware', 'appliances', 'other']
  const categoriesToUse = (categories && categories.length > 0) ? categories : defaultCategories

  console.log('[MaterialForm] Categories to use:', categoriesToUse)

  const categoryOptions = categoriesToUse.map(cat => ({
    value: cat,
    label: cat.charAt(0).toUpperCase() + cat.slice(1)
  }))

  console.log('[MaterialForm] Category options:', categoryOptions)

  const roomOptions = [
    { value: '', label: 'No specific room' },
    ...rooms.map(room => ({
      value: room.id,
      label: room.name
    }))
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={material ? 'Edit Material' : 'Add New Material'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Category - Required */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <Dropdown
            options={categoryOptions}
            value={formData.category}
            onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            placeholder="Select category"
          />
        </div>

        {/* Room - Optional */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Room (Optional)
          </label>
          <Dropdown
            options={roomOptions}
            value={formData.room_id}
            onChange={(value) => setFormData(prev => ({ ...prev, room_id: value }))}
            placeholder="Select room"
          />
        </div>

        {/* Brand & Model Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand
            </label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Armstrong, Benjamin Moore"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Model number"
            />
          </div>
        </div>

        {/* Color & Supplier Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color/Finish
            </label>
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Silver Chalice, Matte"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier
            </label>
            <input
              type="text"
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Home Depot, Lowes"
            />
          </div>
        </div>

        {/* Purchase Date & Price Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Date
            </label>
            <input
              type="date"
              name="purchase_date"
              value={formData.purchase_date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">$</span>
              <input
                type="number"
                name="purchase_price"
                value={formData.purchase_price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Additional details, installation notes, etc."
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Photos
          </label>
          <ImageUpload
            onImagesChange={handleImagesChange}
            onQRCodeDetected={handleQRCodeDetected}
            initialImages={existingPhotos}
            multiple={true}
            maxSize={5 * 1024 * 1024} // 5MB
            maxImages={10}
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
            disabled={submitting || uploadingImages}
          >
            {uploadingImages ? 'Uploading Images...' : submitting ? 'Saving...' : material ? 'Update Material' : 'Add Material'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default MaterialForm
