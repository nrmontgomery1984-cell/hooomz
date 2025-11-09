import { supabase } from './auth'

/**
 * Upload Service - Client Side
 * Handles file uploads to Supabase Storage
 */

// Storage buckets
export const BUCKETS = {
  DOCUMENTS: 'documents',
  PHOTOS: 'photos',
  MATERIALS: 'materials',
  AVATARS: 'avatars'
}

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  VIDEO: 50 * 1024 * 1024 // 50MB
}

// Allowed file types
export const ALLOWED_TYPES = {
  IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  DOCUMENT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ],
  VIDEO: ['video/mp4', 'video/quicktime', 'video/x-msvideo']
}

/**
 * Validate file before upload
 */
const validateFile = (file, options = {}) => {
  const {
    maxSize = FILE_SIZE_LIMITS.DOCUMENT,
    allowedTypes = [...ALLOWED_TYPES.IMAGE, ...ALLOWED_TYPES.DOCUMENT]
  } = options

  // Check file size
  if (file.size > maxSize) {
    throw new Error(`File size exceeds ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`)
  }

  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`)
  }

  return true
}

/**
 * Generate unique file name
 */
const generateFileName = (file) => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  const extension = file.name.split('.').pop()
  const sanitizedName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.+/g, '.')
    .toLowerCase()

  return `${timestamp}-${random}-${sanitizedName}`
}

export const uploadService = {
  /**
   * Upload a single file to Supabase Storage
   * @param {File} file - File object to upload
   * @param {Object} options - Upload options
   * @returns {Promise<{url: string, path: string, size: number, type: string}>}
   */
  async uploadFile(file, options = {}) {
    const {
      bucket = BUCKETS.DOCUMENTS,
      folder = '',
      maxSize = FILE_SIZE_LIMITS.DOCUMENT,
      allowedTypes = [...ALLOWED_TYPES.IMAGE, ...ALLOWED_TYPES.DOCUMENT],
      upsert = false
    } = options

    try {
      // Validate file
      validateFile(file, { maxSize, allowedTypes })

      // Generate unique file name
      const fileName = generateFileName(file)
      const filePath = folder ? `${folder}/${fileName}` : fileName

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert
        })

      if (error) {
        console.error('Upload error:', error)
        throw new Error(error.message || 'Failed to upload file')
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      return {
        url: urlData.publicUrl,
        path: data.path,
        size: file.size,
        type: file.type,
        name: file.name
      }
    } catch (error) {
      console.error('Upload service error:', error)
      throw error
    }
  },

  /**
   * Upload multiple files
   * @param {FileList|Array<File>} files - Files to upload
   * @param {Object} options - Upload options
   * @returns {Promise<Array>}
   */
  async uploadMultiple(files, options = {}) {
    try {
      const fileArray = Array.from(files)

      if (fileArray.length === 0) {
        throw new Error('No files provided')
      }

      // Upload all files in parallel
      const uploadPromises = fileArray.map(file =>
        this.uploadFile(file, options)
      )

      const results = await Promise.allSettled(uploadPromises)

      // Separate successful and failed uploads
      const successful = []
      const failed = []

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(result.value)
        } else {
          failed.push({
            file: fileArray[index].name,
            error: result.reason.message
          })
        }
      })

      return {
        successful,
        failed,
        total: fileArray.length
      }
    } catch (error) {
      console.error('Multiple upload error:', error)
      throw error
    }
  },

  /**
   * Upload image with compression
   * @param {File} file - Image file
   * @param {Object} options - Upload options
   * @returns {Promise<Object>}
   */
  async uploadImage(file, options = {}) {
    const {
      bucket = BUCKETS.PHOTOS,
      folder = '',
      maxSize = FILE_SIZE_LIMITS.IMAGE
    } = options

    return this.uploadFile(file, {
      bucket,
      folder,
      maxSize,
      allowedTypes: ALLOWED_TYPES.IMAGE
    })
  },

  /**
   * Upload document
   * @param {File} file - Document file
   * @param {Object} options - Upload options
   * @returns {Promise<Object>}
   */
  async uploadDocument(file, options = {}) {
    const {
      bucket = BUCKETS.DOCUMENTS,
      folder = '',
      maxSize = FILE_SIZE_LIMITS.DOCUMENT
    } = options

    return this.uploadFile(file, {
      bucket,
      folder,
      maxSize,
      allowedTypes: ALLOWED_TYPES.DOCUMENT
    })
  },

  /**
   * Delete a file from storage
   * @param {string} filePath - Path to file in bucket
   * @param {string} bucket - Storage bucket name
   * @returns {Promise<void>}
   */
  async deleteFile(filePath, bucket = BUCKETS.DOCUMENTS) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath])

      if (error) {
        throw new Error(error.message || 'Failed to delete file')
      }

      return { success: true }
    } catch (error) {
      console.error('Delete file error:', error)
      throw error
    }
  },

  /**
   * Delete multiple files
   * @param {Array<string>} filePaths - Array of file paths
   * @param {string} bucket - Storage bucket name
   * @returns {Promise<void>}
   */
  async deleteMultiple(filePaths, bucket = BUCKETS.DOCUMENTS) {
    try {
      if (!Array.isArray(filePaths) || filePaths.length === 0) {
        throw new Error('No file paths provided')
      }

      const { error } = await supabase.storage
        .from(bucket)
        .remove(filePaths)

      if (error) {
        throw new Error(error.message || 'Failed to delete files')
      }

      return { success: true, deleted: filePaths.length }
    } catch (error) {
      console.error('Delete multiple files error:', error)
      throw error
    }
  },

  /**
   * Get public URL for a file
   * @param {string} filePath - Path to file in bucket
   * @param {string} bucket - Storage bucket name
   * @returns {string}
   */
  getPublicUrl(filePath, bucket = BUCKETS.DOCUMENTS) {
    try {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Get public URL error:', error)
      throw error
    }
  },

  /**
   * List files in a folder
   * @param {string} folder - Folder path
   * @param {string} bucket - Storage bucket name
   * @returns {Promise<Array>}
   */
  async listFiles(folder = '', bucket = BUCKETS.DOCUMENTS) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folder)

      if (error) {
        throw new Error(error.message || 'Failed to list files')
      }

      return data
    } catch (error) {
      console.error('List files error:', error)
      throw error
    }
  },

  /**
   * Check if file exists
   * @param {string} filePath - Path to file
   * @param {string} bucket - Storage bucket name
   * @returns {Promise<boolean>}
   */
  async fileExists(filePath, bucket = BUCKETS.DOCUMENTS) {
    try {
      const folder = filePath.split('/').slice(0, -1).join('/')
      const fileName = filePath.split('/').pop()

      const files = await this.listFiles(folder, bucket)
      return files.some(file => file.name === fileName)
    } catch (error) {
      console.error('File exists check error:', error)
      return false
    }
  }
}

export default uploadService
