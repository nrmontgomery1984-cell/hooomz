import { supabase } from './auth'

/**
 * Storage Service
 * Handles image uploads to Supabase Storage
 */

const STORAGE_BUCKETS = {
  MATERIALS: 'materials',
  SYSTEMS: 'systems',
  DOCUMENTS: 'documents',
  MAINTENANCE: 'maintenance'
}

/**
 * Upload a single image to Supabase Storage
 * @param {File} file - The image file to upload
 * @param {string} bucket - The storage bucket name
 * @param {string} folder - Optional folder path within bucket (e.g., 'homeId/materialId')
 * @returns {Promise<{url: string, path: string, error: null} | {url: null, path: null, error: string}>}
 */
export const uploadImage = async (file, bucket, folder = '') => {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = folder ? `${folder}/${fileName}` : fileName

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return { url: null, path: null, error: error.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return {
      url: publicUrl,
      path: filePath,
      error: null
    }
  } catch (err) {
    console.error('Upload exception:', err)
    return { url: null, path: null, error: err.message }
  }
}

/**
 * Upload multiple images to Supabase Storage
 * @param {File[]} files - Array of image files to upload
 * @param {string} bucket - The storage bucket name
 * @param {string} folder - Optional folder path within bucket
 * @returns {Promise<{urls: string[], paths: string[], errors: string[]}>}
 */
export const uploadImages = async (files, bucket, folder = '') => {
  const results = await Promise.all(
    files.map(file => uploadImage(file, bucket, folder))
  )

  const urls = []
  const paths = []
  const errors = []

  results.forEach((result, index) => {
    if (result.error) {
      errors.push(`${files[index].name}: ${result.error}`)
    } else {
      urls.push(result.url)
      paths.push(result.path)
    }
  })

  return { urls, paths, errors }
}

/**
 * Delete an image from Supabase Storage
 * @param {string} bucket - The storage bucket name
 * @param {string} filePath - The file path to delete
 * @returns {Promise<{success: boolean, error: string | null}>}
 */
export const deleteImage = async (bucket, filePath) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err) {
    console.error('Delete exception:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Delete multiple images from Supabase Storage
 * @param {string} bucket - The storage bucket name
 * @param {string[]} filePaths - Array of file paths to delete
 * @returns {Promise<{success: boolean, error: string | null}>}
 */
export const deleteImages = async (bucket, filePaths) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(filePaths)

    if (error) {
      console.error('Delete error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err) {
    console.error('Delete exception:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Get public URL for an image
 * @param {string} bucket - The storage bucket name
 * @param {string} filePath - The file path
 * @returns {string} - Public URL
 */
export const getImageUrl = (bucket, filePath) => {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)

  return publicUrl
}

/**
 * Upload material images
 * @param {File[]} files - Array of image files
 * @param {string} homeId - Home ID
 * @param {string} materialId - Material ID (optional for new materials)
 */
export const uploadMaterialImages = async (files, homeId, materialId = 'temp') => {
  return uploadImages(files, STORAGE_BUCKETS.MATERIALS, `${homeId}/${materialId}`)
}

/**
 * Upload system images
 * @param {File[]} files - Array of image files
 * @param {string} homeId - Home ID
 * @param {string} systemId - System ID (optional for new systems)
 */
export const uploadSystemImages = async (files, homeId, systemId = 'temp') => {
  return uploadImages(files, STORAGE_BUCKETS.SYSTEMS, `${homeId}/${systemId}`)
}

/**
 * Delete material images
 * @param {string[]} filePaths - Array of file paths to delete
 */
export const deleteMaterialImages = async (filePaths) => {
  return deleteImages(STORAGE_BUCKETS.MATERIALS, filePaths)
}

/**
 * Delete system images
 * @param {string[]} filePaths - Array of file paths to delete
 */
export const deleteSystemImages = async (filePaths) => {
  return deleteImages(STORAGE_BUCKETS.SYSTEMS, filePaths)
}

export { STORAGE_BUCKETS }
