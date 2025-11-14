import { useState, useRef } from 'react';

interface ImageFile {
  file: File;
  preview: string;
  altText: string;
  isPrimary: boolean;
}

interface ImageUploadProps {
  maxImages?: number;
  onImagesChange: (images: ImageFile[]) => void;
  existingImages?: ImageFile[];
}

export function ImageUpload({ maxImages = 3, onImagesChange, existingImages = [] }: ImageUploadProps) {
  const [images, setImages] = useState<ImageFile[]>(existingImages);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null): void => {
    if (!files) {
      return;
    }

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((file) => file.type.startsWith('image/'));

    if (images.length + validFiles.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images`);
      return;
    }

    const newImages: ImageFile[] = validFiles.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      altText: '',
      isPrimary: images.length === 0 && index === 0,
    }));

    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const handleDrag = (e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    e.preventDefault();
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleRemove = (index: number): void => {
    const updatedImages = images.filter((_, i) => i !== index);

    // If we removed the primary image, make the first image primary
    if (images[index].isPrimary && updatedImages.length > 0) {
      updatedImages[0].isPrimary = true;
    }

    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const handleAltTextChange = (index: number, altText: string): void => {
    const updatedImages = [...images];
    updatedImages[index].altText = altText;
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const handleSetPrimary = (index: number): void => {
    const updatedImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const handleMoveUp = (index: number): void => {
    if (index === 0) {
      return;
    }

    const updatedImages = [...images];
    [updatedImages[index - 1], updatedImages[index]] = [updatedImages[index], updatedImages[index - 1]];
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const handleMoveDown = (index: number): void => {
    if (index === images.length - 1) {
      return;
    }

    const updatedImages = [...images];
    [updatedImages[index], updatedImages[index + 1]] = [updatedImages[index + 1], updatedImages[index]];
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Recipe Images (up to {maxImages})
        </label>
        <span className="text-sm text-gray-500">
          {images.length} / {maxImages}
        </span>
      </div>

      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 transition-colors
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleChange}
            className="hidden"
            id="file-upload"
          />

          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <svg
              className="w-12 h-12 text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
          </label>
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="space-y-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex gap-4">
                {/* Preview */}
                <div className="relative w-32 h-32 flex-shrink-0">
                  <img
                    src={image.preview}
                    alt={image.altText || `Preview ${index + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                  {image.isPrimary && (
                    <span className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Thumbnail
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 space-y-3">
                  <div>
                    <label htmlFor={`alt-text-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Alt Text (for accessibility)
                    </label>
                    <input
                      id={`alt-text-${index}`}
                      type="text"
                      value={image.altText}
                      onChange={(e) => {
                        handleAltTextChange(index, e.target.value);
                      }}
                      placeholder="Describe the image..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {!image.isPrimary && (
                      <button
                        type="button"
                        onClick={() => {
                          handleSetPrimary(index);
                        }}
                        className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                      >
                        Set as Thumbnail
                      </button>
                    )}

                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          handleMoveUp(index);
                        }}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                        aria-label="Move image up"
                      >
                        ↑ Move Up
                      </button>
                    )}

                    {index < images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          handleMoveDown(index);
                        }}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                        aria-label="Move image down"
                      >
                        ↓ Move Down
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        handleRemove(index);
                      }}
                      className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors ml-auto"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
