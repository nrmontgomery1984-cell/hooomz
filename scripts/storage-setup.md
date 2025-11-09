# Supabase Storage Setup Guide

This guide walks you through setting up Storage buckets for Hooomz Profile™.

## Required Storage Buckets

Create the following buckets in your Supabase Dashboard:

### 1. **documents** Bucket
- **Purpose**: Store PDF documents, warranties, manuals, inspection reports
- **Public Access**: No
- **File Size Limit**: 10MB
- **Allowed MIME Types**:
  - application/pdf
  - image/jpeg
  - image/png
  - image/webp

### 2. **photos** Bucket
- **Purpose**: General home photos, room photos
- **Public Access**: Yes (read-only)
- **File Size Limit**: 5MB
- **Allowed MIME Types**:
  - image/jpeg
  - image/png
  - image/webp
  - image/heic

### 3. **materials** Bucket
- **Purpose**: Photos of materials (flooring, paint, fixtures, etc.)
- **Public Access**: Yes (read-only)
- **File Size Limit**: 5MB
- **Allowed MIME Types**:
  - image/jpeg
  - image/png
  - image/webp

### 4. **avatars** Bucket
- **Purpose**: User profile pictures
- **Public Access**: Yes (read-only)
- **File Size Limit**: 2MB
- **Allowed MIME Types**:
  - image/jpeg
  - image/png
  - image/webp

---

## Step-by-Step Setup Instructions

### Navigate to Storage

1. Go to your Supabase project dashboard: `https://app.supabase.com/project/YOUR_PROJECT_ID`
2. Click **Storage** in the left sidebar
3. Click **Create a new bucket**

### Create Each Bucket

For each bucket listed above, follow these steps:

#### Creating the Bucket

1. Click **New bucket**
2. Enter the bucket name (e.g., `documents`)
3. Set **Public bucket** based on the requirements above:
   - `documents`: **OFF** (private)
   - `photos`: **ON** (public)
   - `materials`: **ON** (public)
   - `avatars`: **ON** (public)
4. Click **Create bucket**

#### Configure Storage Policies

After creating each bucket, you need to set up Storage Policies to control access.

**For PRIVATE buckets (documents)**:

1. Click on the bucket name
2. Go to **Policies** tab
3. Click **New Policy**
4. Use the following SQL for authenticated users to upload their own files:

```sql
-- Policy: Users can upload their own documents
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can read their own documents
CREATE POLICY "Users can read their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own documents
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**For PUBLIC buckets (photos, materials, avatars)**:

1. Click on the bucket name
2. Go to **Policies** tab
3. Click **New Policy**
4. Use the following SQL pattern (replace `BUCKET_NAME` with actual bucket name):

```sql
-- Policy: Authenticated users can upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'BUCKET_NAME' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Public can read
CREATE POLICY "Public can read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'BUCKET_NAME');

-- Policy: Users can update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'BUCKET_NAME' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'BUCKET_NAME' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

Apply these policies for each public bucket:
- Replace `BUCKET_NAME` with `photos`, `materials`, or `avatars`
- Run the SQL in the **SQL Editor**

---

## File Organization Structure

Files will be automatically organized by user ID:

```
documents/
  └── {user_id}/
      └── {timestamp}-{filename}.pdf

photos/
  └── {user_id}/
      └── {timestamp}-{filename}.jpg

materials/
  └── {user_id}/
      └── {timestamp}-{filename}.jpg

avatars/
  └── {user_id}/
      └── {timestamp}-{filename}.jpg
```

This structure is enforced by the Storage Policies and the upload service code.

---

## Verification Checklist

After completing the setup, verify:

- [ ] All 4 buckets created (documents, photos, materials, avatars)
- [ ] Public access settings configured correctly
- [ ] Storage policies applied for each bucket
- [ ] You can upload a test file via the Supabase dashboard
- [ ] Public buckets return public URLs
- [ ] Private buckets require authentication

---

## Testing Storage

You can test storage functionality with the following code in your browser console:

```javascript
// Test upload (after authenticating)
const { data, error } = await supabase.storage
  .from('photos')
  .upload('test/sample.jpg', fileBlob, {
    cacheControl: '3600',
    upsert: false
  })

console.log('Upload result:', { data, error })

// Test public URL retrieval
const { data: urlData } = supabase.storage
  .from('photos')
  .getPublicUrl('test/sample.jpg')

console.log('Public URL:', urlData.publicUrl)
```

---

## Troubleshooting

### "new row violates row-level security policy"
- Check that storage policies are created correctly
- Ensure user is authenticated
- Verify file path includes user ID as first folder

### "Bucket not found"
- Double-check bucket name spelling
- Ensure bucket was created successfully in dashboard

### "File size exceeds limit"
- Check file size against bucket limits
- Compress images before uploading
- Use appropriate file formats

### Public URLs not working
- Verify bucket is set to **Public**
- Check that public SELECT policy exists
- Ensure file was uploaded successfully

---

## Next Steps

After setting up storage:
1. Update your environment variables if needed
2. Test file uploads from your application
3. Monitor storage usage in Supabase dashboard
4. Consider setting up automated backups for critical documents
