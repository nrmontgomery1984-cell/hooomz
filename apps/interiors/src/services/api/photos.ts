/**
 * Photos API Service
 * Handles photo uploads
 */

import { supabase } from '../supabase';

/**
 * Upload a photo to Supabase storage and create a record
 */
export async function uploadPhoto(
  file: File,
  projectId: string,
  loopId?: string
): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const filename = `${timestamp}-${randomId}.${ext}`;
  const storagePath = `${projectId}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload photo: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('photos')
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl;

  // Create photo record in database (non-blocking — upload already succeeded)
  await supabase.from('photos').insert({
    storage_path: storagePath,
    loop_id: loopId || null,
  } as never);

  return publicUrl;
}
