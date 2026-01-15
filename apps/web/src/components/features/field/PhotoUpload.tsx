'use client';

/**
 * PhotoUpload Component
 *
 * Camera/file upload with offline queue support.
 * Large touch-friendly buttons for field use.
 */

import React, { useRef, useState } from 'react';
import { Button, Card } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

interface PhotoUploadProps {
  onPhotoCapture: (photo: File, caption?: string) => void;
  maxPhotos?: number;
  currentCount?: number;
}

export function PhotoUpload({
  onPhotoCapture,
  maxPhotos,
  currentCount = 0,
}: PhotoUploadProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  const canAddMore = !maxPhotos || currentCount < maxPhotos;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!canAddMore) {
      showToast(`Maximum of ${maxPhotos} photos reached`, 'error');
      return;
    }

    const file = files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast('Image size must be less than 10MB', 'error');
      return;
    }

    onPhotoCapture(file, caption);
    setCaption('');
    showToast('Photo added', 'success');

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCameraClick = () => {
    if (!canAddMore) {
      showToast(`Maximum of ${maxPhotos} photos reached`, 'error');
      return;
    }

    // Trigger file input with camera capture
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleGalleryClick = () => {
    if (!canAddMore) {
      showToast(`Maximum of ${maxPhotos} photos reached`, 'error');
      return;
    }

    // Trigger file input without camera capture
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
      // Re-add capture attribute for next camera use
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.setAttribute('capture', 'environment');
        }
      }, 100);
    }
  };

  return (
    <Card>
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Add Photos</h3>

        {/* Caption Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photo Caption (Optional)
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Describe this photo..."
            className="w-full h-14 px-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Upload Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Camera Button */}
          <Button
            variant="primary"
            onClick={handleCameraClick}
            disabled={!canAddMore}
            className="h-20 text-lg"
            fullWidth
          >
            <svg
              className="h-8 w-8 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Take Photo
          </Button>

          {/* Gallery Button */}
          <Button
            variant="secondary"
            onClick={handleGalleryClick}
            disabled={!canAddMore}
            className="h-20 text-lg"
            fullWidth
          >
            <svg
              className="h-8 w-8 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Choose from Gallery
          </Button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Photo Count */}
        {maxPhotos && (
          <div className="text-sm text-gray-600 text-center">
            {currentCount} of {maxPhotos} photos
          </div>
        )}

        {/* Offline Queue Info */}
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Offline Support</p>
              <p>
                Photos are saved locally and will be uploaded automatically when you're
                back online.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Card>
  );
}
