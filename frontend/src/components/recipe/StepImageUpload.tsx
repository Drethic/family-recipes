import { useState, useRef } from 'react';

interface StepImageFile {
  file: File;
  preview: string;
  altText: string;
}

interface StepImageUploadProps {
  stepNumber: number;
  onImageChange: (image: StepImageFile | null) => void;
  existingImage?: StepImageFile | null;
}

export function StepImageUpload({ stepNumber, onImageChange, existingImage = null }: StepImageUploadProps) {
  const [image, setImage] = useState<StepImageFile | null>(existingImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File): void => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const newImage: StepImageFile = {
      file,
      preview: URL.createObjectURL(file),
      altText: '',
    };

    setImage(newImage);
    onImageChange(newImage);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleRemove = (): void => {
    if (image?.preview) {
      URL.revokeObjectURL(image.preview);
    }
    setImage(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAltTextChange = (altText: string): void => {
    if (image) {
      const updatedImage = { ...image, altText };
      setImage(updatedImage);
      onImageChange(updatedImage);
    }
  };

  if (image) {
    return (
      <div className="mt-2 border rounded-lg p-3 bg-gray-50">
        <div className="flex items-start gap-3">
          {/* Preview */}
          <div className="w-24 h-24 flex-shrink-0">
            <img
              src={image.preview}
              alt={image.altText || `Step ${stepNumber} image`}
              className="w-full h-full object-cover rounded"
            />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-2">
            <div>
              <label htmlFor={`step-${stepNumber}-alt-text`} className="block text-xs font-medium text-gray-700 mb-1">
                Image description (optional)
              </label>
              <input
                id={`step-${stepNumber}-alt-text`}
                type="text"
                value={image.altText}
                onChange={(e) => {
                  handleAltTextChange(e.target.value);
                }}
                placeholder={`Describe step ${stepNumber} image...`}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleRemove}
              className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
            >
              Remove Image
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
        id={`step-${stepNumber}-image-upload`}
      />

      <label
        htmlFor={`step-${stepNumber}-image-upload`}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <svg
          className="w-4 h-4 text-gray-600"
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
        Add image (optional)
      </label>
    </div>
  );
}
