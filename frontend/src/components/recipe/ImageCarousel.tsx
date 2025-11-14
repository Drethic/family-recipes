import { useState } from 'react';
import type { RecipeImage } from '@/types';

interface ImageCarouselProps {
  images: RecipeImage[];
  recipeName: string;
}

export function ImageCarousel({ images, recipeName }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];

  const handlePrevious = (): void => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (): void => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number): void => {
    setCurrentIndex(index);
  };

  const handleKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'ArrowLeft') {
      handlePrevious();
    } else if (event.key === 'ArrowRight') {
      handleNext();
    }
  };

  return (
    <div
      className="w-full"
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Recipe image carousel"
      tabIndex={0}
    >
      {/* Main Image */}
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
        <img
          src={currentImage.url}
          alt={currentImage.alt_text || `${recipeName} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              aria-label="Previous image"
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              aria-label="Next image"
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>

            {/* Image Counter */}
            <div className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => {
                handleThumbnailClick(index);
              }}
              className={`
                flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all
                ${
                  index === currentIndex
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-300 hover:border-gray-400'
                }
              `}
              aria-label={`View image ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : 'false'}
              type="button"
            >
              <img
                src={image.url}
                alt={image.alt_text || `Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
