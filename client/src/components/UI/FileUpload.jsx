import { useState } from 'react'
import { Upload, X, File } from 'lucide-react'

export const FileUpload = ({
  onFileSelect,
  multiple = false,
  accept = '*',
  maxSize = 10 * 1024 * 1024, // 10MB default
  className = ''
}) => {
  const [files, setFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')

  const handleFiles = (newFiles) => {
    const fileArray = Array.from(newFiles)

    // Validate file size
    const oversizedFiles = fileArray.filter(file => file.size > maxSize)
    if (oversizedFiles.length > 0) {
      setError(`File size must be less than ${maxSize / 1024 / 1024}MB`)
      return
    }

    setError('')

    if (multiple) {
      setFiles(prev => [...prev, ...fileArray])
      onFileSelect([...files, ...fileArray])
    } else {
      setFiles(fileArray)
      onFileSelect(fileArray)
    }
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

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onFileSelect(newFiles)
  }

  return (
    <div className={className}>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drag and drop files here, or
          <label className="ml-1 text-primary-600 hover:text-primary-700 cursor-pointer">
            browse
            <input
              type="file"
              className="hidden"
              multiple={multiple}
              accept={accept}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <File size={20} className="text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-red-600"
              >
                <X size={20} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
