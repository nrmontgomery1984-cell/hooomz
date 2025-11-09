import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Modal } from '../UI/Modal'
import { Button } from '../UI/Button'
import { Dropdown } from '../UI/Dropdown'
import { ImageUpload } from '../UI/ImageUpload'
import { uploadSystemImages, deleteSystemImages } from '../../services/storage'

/**
 * SystemForm Component
 * Form for creating/editing systems
 */
export const SystemForm = ({
  isOpen,
  onClose,
  onSubmit,
  system = null,
  categories = []
}) => {
  const { homeId } = useParams()
  const [formData, setFormData] = useState({
    type: '',
    category: '',
    brand: '',
    model: '',
    serial: '',
    install_date: '',
    warranty_expiry: '',
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
    if (system) {
      setFormData({
        type: system.type || '',
        category: system.category || '',
        brand: system.brand || '',
        model: system.model || '',
        serial: system.serial || '',
        install_date: system.install_date || '',
        warranty_expiry: system.warranty_expiry || '',
        notes: system.notes || '',
        photos: system.photos || []
      })
      setExistingPhotos(system.photos || [])
      setImageFiles([])
    } else {
      // Reset form for new system
      setFormData({
        type: '',
        category: '',
        brand: '',
        model: '',
        serial: '',
        install_date: '',
        warranty_expiry: '',
        notes: '',
        photos: []
      })
      setExistingPhotos([])
      setImageFiles([])
    }
  }, [system, isOpen])

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
    if (!formData.type) {
      setError('System type is required')
      return
    }

    setSubmitting(true)

    try {
      let photoUrls = [...existingPhotos]

      // Upload new images if any
      if (imageFiles.length > 0) {
        setUploadingImages(true)
        const { urls, errors } = await uploadSystemImages(
          imageFiles,
          homeId,
          system?.id || 'temp'
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
      setError(err.message || 'Failed to save system')
    } finally {
      setSubmitting(false)
      setUploadingImages(false)
    }
  }

  const handleImagesChange = (files) => {
    setImageFiles(files)
  }

  const handleQRCodeDetected = (qrData) => {
    // Auto-fill form fields from QR code data
    setFormData(prev => ({
      ...prev,
      brand: qrData.brand || prev.brand,
      model: qrData.model || prev.model,
      serial: qrData.serial || prev.serial,
    }))
  }

  // System type options
  const systemTypes = [
    'HVAC System',
    'Furnace',
    'Air Conditioner',
    'Heat Pump',
    'Thermostat',
    'Water Heater',
    'Water Softener',
    'Sump Pump',
    'Well Pump',
    'Septic System',
    'Electrical Panel',
    'Generator',
    'Solar Panels',
    'Roof',
    'Siding',
    'Gutters & Downspouts',
    'Windows',
    'Doors - Exterior',
    'Doors - Interior',
    'House Wrap',
    'Vapor Barrier',
    'Waterproofing',
    'Foundation',
    'Framing',
    'Deck/Patio',
    'Flooring System',
    'Drywall',
    'Insulation',
    'Garage Door System',
    'Smoke Detectors',
    'CO Detectors',
    'Security System',
    'Fire Suppression'
  ]

  const typeOptions = systemTypes.map(type => ({
    value: type,
    label: type
  }))

  const categoryOptions = categories.length > 0
    ? categories.map(cat => ({
        value: cat,
        label: cat
      }))
    : [
        { value: 'Heating & Cooling', label: 'Heating & Cooling' },
        { value: 'Plumbing', label: 'Plumbing' },
        { value: 'Electrical', label: 'Electrical' },
        { value: 'Exterior Envelope', label: 'Exterior Envelope' },
        { value: 'Water & Air Barrier', label: 'Water & Air Barrier' },
        { value: 'Structural', label: 'Structural' },
        { value: 'Interior Finishes', label: 'Interior Finishes' },
        { value: 'Appliances', label: 'Appliances' },
        { value: 'Garage', label: 'Garage' },
        { value: 'Safety', label: 'Safety' }
      ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={system ? 'Edit System' : 'Add New System'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Type - Required */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            System Type <span className="text-red-500">*</span>
          </label>
          <Dropdown
            options={typeOptions}
            value={formData.type}
            onChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            placeholder="Select system type"
          />
        </div>

        {/* Category - Optional */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category (Optional)
          </label>
          <Dropdown
            options={categoryOptions}
            value={formData.category}
            onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            placeholder="Select category"
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
              placeholder="e.g., Carrier, Rheem, Generac"
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

        {/* Serial Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Serial Number
          </label>
          <input
            type="text"
            name="serial"
            value={formData.serial}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Serial number"
          />
        </div>

        {/* Install Date & Warranty Expiry Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Install Date
            </label>
            <input
              type="date"
              name="install_date"
              value={formData.install_date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warranty Expiry
            </label>
            <input
              type="date"
              name="warranty_expiry"
              value={formData.warranty_expiry}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
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
            placeholder="Installation details, service history, etc."
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
            {uploadingImages ? 'Uploading Images...' : submitting ? 'Saving...' : system ? 'Update System' : 'Add System'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default SystemForm
