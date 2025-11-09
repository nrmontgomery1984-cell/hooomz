import { useState, useRef } from 'react'
import { Upload, X, Camera, Image as ImageIcon, QrCode, Check } from 'lucide-react'
import { Button } from './Button'
import { scanApplianceQRCode } from '../../utils/qrScanner'

/**
 * ImageUpload Component
 * Enhanced file upload with camera capture, image preview, and validation
 * Supports both file selection and camera capture for taking photos
 */
export const ImageUpload = ({
  onImagesChange,
  onQRCodeDetected,
  initialImages = [],
  multiple = true,
  maxSize = 5 * 1024 * 1024, // 5MB default
  maxImages = 10,
  className = ''
}) => {
  const [images, setImages] = useState(initialImages)
  const [previews, setPreviews] = useState(initialImages.map(img => img.url || img))
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')
  const [showCamera, setShowCamera] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [qrData, setQrData] = useState(null)

  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  // Handle new files/images
  const handleFiles = (newFiles) => {
    const fileArray = Array.from(newFiles)

    // Validate file size
    const oversizedFiles = fileArray.filter(file => file.size > maxSize)
    if (oversizedFiles.length > 0) {
      setError(`Image size must be less than ${maxSize / 1024 / 1024}MB`)
      return
    }

    // Validate file type (images only)
    const invalidFiles = fileArray.filter(file => !file.type.startsWith('image/'))
    if (invalidFiles.length > 0) {
      setError('Only image files are allowed')
      return
    }

    // Check max images limit
    const totalImages = multiple ? images.length + fileArray.length : fileArray.length
    if (totalImages > maxImages) {
      setError(`Maximum ${maxImages} images allowed`)
      return
    }

    setError('')

    // Create preview URLs
    const newPreviews = fileArray.map(file => URL.createObjectURL(file))

    let updatedImages
    let updatedPreviews

    if (multiple) {
      updatedImages = [...images, ...fileArray]
      updatedPreviews = [...previews, ...newPreviews]
    } else {
      // Clean up old preview URLs
      previews.forEach(url => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url)
      })
      updatedImages = fileArray
      updatedPreviews = newPreviews
    }

    setImages(updatedImages)
    setPreviews(updatedPreviews)
    onImagesChange(updatedImages)

    // Automatically scan new images for QR codes
    if (onQRCodeDetected) {
      console.log('[ImageUpload] onQRCodeDetected callback exists, starting automatic QR scan')
      scanNewImagesForQR(fileArray)
    } else {
      console.log('[ImageUpload] No onQRCodeDetected callback provided, skipping QR scan')
    }
  }

  // Scan newly added images for QR codes
  const scanNewImagesForQR = async (newFiles) => {
    console.log('[ImageUpload] Starting QR scan for', newFiles.length, 'files')
    setScanning(true)
    setQrData(null)

    for (const file of newFiles) {
      console.log('[ImageUpload] Scanning file:', file.name)
      const result = await scanApplianceQRCode(file)
      console.log('[ImageUpload] Scan result:', result)

      if (result.success && result.data) {
        console.log('[ImageUpload] QR code detected! Parsed data:', {
          brand: result.data.brand,
          model: result.data.model,
          serial: result.data.serial,
          rawData: result.data.rawData
        })

        // Check if we got useful data
        if (result.data.brand || result.data.model || result.data.serial) {
          console.log('[ImageUpload] ✅ Valid appliance data found, calling onQRCodeDetected callback')
          console.log('[ImageUpload] Callback function exists?', typeof onQRCodeDetected === 'function')
          console.log('[ImageUpload] Data being passed to callback:', result.data)
          setQrData(result.data)

          if (typeof onQRCodeDetected === 'function') {
            console.log('[ImageUpload] Calling onQRCodeDetected now...')
            onQRCodeDetected(result.data)
            console.log('[ImageUpload] onQRCodeDetected callback completed')
          } else {
            console.error('[ImageUpload] onQRCodeDetected is not a function!', onQRCodeDetected)
          }

          break // Stop after first successful QR code
        } else {
          console.warn('[ImageUpload] ⚠️ QR code found but no brand/model/serial extracted. Raw data:', result.data.rawData)
          // Still show the QR data with raw content
          setQrData(result.data)
        }
      } else {
        console.log('[ImageUpload] No QR code in this file or scan failed')
      }
    }

    console.log('[ImageUpload] QR scan complete')
    setScanning(false)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const removeImage = (index) => {
    // Clean up preview URL if it's a blob
    if (previews[index].startsWith('blob:')) {
      URL.revokeObjectURL(previews[index])
    }

    const newImages = images.filter((_, i) => i !== index)
    const newPreviews = previews.filter((_, i) => i !== index)

    setImages(newImages)
    setPreviews(newPreviews)
    onImagesChange(newImages)
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleCameraClick = () => {
    cameraInputRef.current?.click()
  }

  // Cleanup on unmount
  useState(() => {
    return () => {
      previews.forEach(url => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url)
      })
    }
  }, [])

  return (
    <div className={className}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center space-y-3">
          <ImageIcon className="h-12 w-12 text-gray-400" />

          <div className="text-sm text-gray-600">
            <p className="mb-2">Drag and drop images here, or</p>
            <div className="flex gap-3 justify-center">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleBrowseClick}
              >
                <Upload size={16} className="mr-2" />
                Browse Files
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCameraClick}
              >
                <Camera size={16} className="mr-2" />
                Take Photo
              </Button>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            {multiple ? `Up to ${maxImages} images, ` : ''}Max {maxSize / 1024 / 1024}MB each
          </p>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple={multiple}
            accept="image/*"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <input
            ref={cameraInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* Scanning indicator */}
        {scanning && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700 flex items-center justify-center">
            <QrCode size={16} className="mr-2 animate-pulse" />
            Scanning for QR codes...
          </div>
        )}

        {/* QR Code detected */}
        {qrData && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
            <div className="flex items-start">
              <Check size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold mb-1">QR Code Detected!</p>
                <div className="text-xs space-y-1">
                  {qrData.brand && <p>Brand: {qrData.brand}</p>}
                  {qrData.model && <p>Model: {qrData.model}</p>}
                  {qrData.serial && <p>Serial: {qrData.serial}</p>}
                </div>
                <p className="text-xs mt-2 text-green-700">Form fields have been auto-filled!</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Image Previews */}
      {previews.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Uploaded Images ({previews.length})
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div
                key={index}
                className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-primary-500 transition-colors"
              >
                <img
                  src={preview}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Remove button - appears on hover */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  aria-label="Remove image"
                >
                  <X size={16} />
                </button>

                {/* Image info overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white truncate">
                    {images[index]?.name || `Image ${index + 1}`}
                  </p>
                  {images[index]?.size && (
                    <p className="text-xs text-gray-300">
                      {(images[index].size / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Helper text for OCR/QR future feature */}
      {previews.length > 0 && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Tip:</strong> Take clear photos of product stickers, QR codes, or serial number labels.
            We'll soon add automatic data extraction to fill in brand, model, and serial numbers!
          </p>
        </div>
      )}
    </div>
  )
}

export default ImageUpload
