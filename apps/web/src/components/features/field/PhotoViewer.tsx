'use client';

/**
 * PhotoViewer Component
 *
 * Full-screen photo viewer with navigation and details.
 */

import React, { useEffect } from 'react';
import type { Photo } from '@hooomz/shared-contracts';
import { Button, Badge } from '@/components/ui';

interface PhotoViewerProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function PhotoViewer({
  photos,
  currentIndex,
  onClose,
  onNavigate,
}: PhotoViewerProps) {
  const currentPhoto = photos[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) {
        onNavigate(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, photos.length, onClose, onNavigate]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < photos.length - 1) {
      onNavigate(currentIndex + 1);
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
      onClick={handleBackgroundClick}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white transition-colors z-10"
        title="Close (Esc)"
      >
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Navigation Buttons */}
      {currentIndex > 0 && (
        <button
          onClick={handlePrevious}
          className="absolute left-4 p-4 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white transition-colors z-10"
          title="Previous (←)"
        >
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {currentIndex < photos.length - 1 && (
        <button
          onClick={handleNext}
          className="absolute right-4 p-4 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white transition-colors z-10"
          title="Next (→)"
        >
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      {/* Photo Container */}
      <div className="max-w-7xl max-h-screen w-full h-full p-4 md:p-8 flex flex-col">
        {/* Image */}
        <div className="flex-1 flex items-center justify-center mb-4">
          <img
            src={currentPhoto.url}
            alt={currentPhoto.caption || 'Photo'}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>

        {/* Photo Details */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 md:p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              {currentPhoto.caption && (
                <h3 className="text-xl font-bold mb-2">{currentPhoto.caption}</h3>
              )}
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-gray-300">Taken:</span>{' '}
                  <span className="font-medium">{formatDate(currentPhoto.takenAt)}</span>
                </div>
                {currentPhoto.takenBy && (
                  <div>
                    <span className="text-gray-300">By:</span>{' '}
                    <span className="font-medium">{currentPhoto.takenBy}</span>
                  </div>
                )}
                {currentPhoto.location && (
                  <div>
                    <span className="text-gray-300">Location:</span>{' '}
                    <span className="font-medium">{currentPhoto.location}</span>
                  </div>
                )}
              </div>
              {currentPhoto.notes && (
                <p className="mt-3 text-sm text-gray-200">{currentPhoto.notes}</p>
              )}
            </div>

            {/* Counter */}
            <div className="text-center">
              <div className="text-3xl font-bold">
                {currentIndex + 1} / {photos.length}
              </div>
              <div className="text-xs text-gray-300 mt-1">
                Use ← → to navigate
              </div>
            </div>
          </div>

          {/* Upload Status */}
          {currentPhoto.uploadStatus && currentPhoto.uploadStatus !== 'completed' && (
            <div className="mt-4 pt-4 border-t border-white border-opacity-20">
              {currentPhoto.uploadStatus === 'pending' && (
                <Badge variant="warning">Pending Upload</Badge>
              )}
              {currentPhoto.uploadStatus === 'failed' && (
                <Badge variant="error">Upload Failed</Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
