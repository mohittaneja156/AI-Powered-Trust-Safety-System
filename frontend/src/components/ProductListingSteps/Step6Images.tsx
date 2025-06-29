import React, { useRef, useState } from 'react';

interface ImagesProps {
  productData: {
    mainImage: string;
    additionalImages: string[];
    variations: Array<{
      type: string;
      value: string;
      price?: number;
      quantity?: number;
      image?: string;
    }>;
  };
  onInputChange: (field: string, value: any) => void;
}

const Step6Images: React.FC<ImagesProps> = ({ productData, onInputChange }) => {
  const mainImageRef = useRef<HTMLInputElement>(null);
  const additionalImageRef = useRef<HTMLInputElement>(null);
  const variationImageRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (type: 'main' | 'additional' | 'variation', index?: number) => {
    const inputRef = type === 'main' ? mainImageRef.current : 
                    type === 'additional' ? additionalImageRef.current : 
                    variationImageRefs.current[index!];
    
    if (inputRef) {
      inputRef.click();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'additional' | 'variation', index?: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB.');
      return;
    }

    setUploading(true);

    try {
      // Create a preview URL for immediate display
      const previewUrl = URL.createObjectURL(file);
      
      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        
        if (type === 'main') {
          onInputChange('mainImage', base64String);
        } else if (type === 'additional') {
          const newAdditionalImages = [...productData.additionalImages];
          if (index !== undefined) {
            newAdditionalImages[index] = base64String;
          } else {
            newAdditionalImages.push(base64String);
          }
          onInputChange('additionalImages', newAdditionalImages);
        } else if (type === 'variation' && index !== undefined) {
          const newVariations = [...productData.variations];
          newVariations[index] = { ...newVariations[index], image: base64String };
          onInputChange('variations', newVariations);
        }
        
        setUploading(false);
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
      setUploading(false);
    }

    // Clear the input
    event.target.value = '';
  };

  const removeImage = (type: 'main' | 'additional', index?: number) => {
    if (type === 'main') {
      onInputChange('mainImage', '');
    } else if (type === 'additional' && index !== undefined) {
      const newAdditionalImages = productData.additionalImages.filter((_, i) => i !== index);
      onInputChange('additionalImages', newAdditionalImages);
    }
  };

  const removeVariationImage = (index: number) => {
    const newVariations = [...productData.variations];
    newVariations[index] = { ...newVariations[index], image: '' };
    onInputChange('variations', newVariations);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Step 6: Images</h2>
      <div className="space-y-6">
        {/* Hidden file inputs */}
        <input
          ref={mainImageRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileUpload(e, 'main')}
          style={{ display: 'none' }}
        />
        <input
          ref={additionalImageRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileUpload(e, 'additional')}
          style={{ display: 'none' }}
        />
        {productData.variations.map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              variationImageRefs.current[index] = el;
            }}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, 'variation', index)}
            style={{ display: 'none' }}
          />
        ))}

        {/* Main Product Image */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium mb-4">Main Product Image <span className="text-red-500">*</span></h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This is the primary image that appears in search results and product listings.
            </p>
            
            {productData.mainImage ? (
              <div className="relative">
                <img 
                  src={productData.mainImage} 
                  alt="Main product" 
                  className="w-64 h-64 object-cover border border-gray-300 rounded-lg"
                />
                <button
                  onClick={() => removeImage('main')}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
                <div className="mt-2 text-xs text-green-600">
                  ✓ Main image uploaded successfully
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="text-gray-400 text-4xl mb-4">📷</div>
                <h4 className="font-medium text-gray-700 mb-2">Upload Main Product Image</h4>
                <p className="text-sm text-gray-500 mb-4">
                  This will be the primary image customers see first
                </p>
                <button
                  onClick={() => handleFileSelect('main')}
                  disabled={uploading}
                  className={`px-6 py-2 rounded ${
                    uploading 
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                      : 'bg-[#184042] text-white hover:bg-[#123133]'
                  }`}
                >
                  {uploading ? 'Uploading...' : 'Choose Image'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Additional Images */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium mb-4">Additional Images</h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Add up to 8 additional images to showcase different angles, features, and use cases.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Existing additional images */}
              {productData.additionalImages.map((image, index) => (
                <div key={index} className="relative">
                  <img 
                    src={image} 
                    alt={`Additional ${index + 1}`} 
                    className="w-full h-32 object-cover border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={() => removeImage('additional', index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                  <div className="mt-1 text-xs text-gray-500 text-center">
                    Image {index + 2}
                  </div>
                </div>
              ))}
              
              {/* Add more image slots */}
              {productData.additionalImages.length < 8 && (
                <>
                  {Array.from({ length: 8 - productData.additionalImages.length }, (_, index) => (
                    <div key={`slot-${index}`} className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <div className="text-gray-400 text-2xl mb-2">📷</div>
                      <p className="text-xs text-gray-500 mb-2">
                        Image {productData.additionalImages.length + index + 2}
                      </p>
                      <button
                        onClick={() => handleFileSelect('additional', productData.additionalImages.length + index)}
                        disabled={uploading}
                        className={`px-3 py-1 rounded text-xs ${
                          uploading 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {uploading ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Variation Images */}
        {productData.variations.length > 0 && (
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium mb-4">Variation Images</h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Add specific images for each variation to help customers see the exact product they want.
              </p>
              
              <div className="space-y-4">
                {productData.variations.map((variation, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-700">
                        {variation.value} - Variation {index + 1}
                      </h5>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {variation.image ? (
                        <div className="relative">
                          <img 
                            src={variation.image} 
                            alt={`Variation ${index + 1}`} 
                            className="w-24 h-24 object-cover border border-gray-300 rounded"
                          />
                          <button
                            onClick={() => removeVariationImage(index)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleFileSelect('variation', index)}
                          disabled={uploading}
                          className={`w-24 h-24 border-2 border-dashed rounded flex items-center justify-center ${
                            uploading 
                              ? 'border-gray-200 text-gray-300 cursor-not-allowed' 
                              : 'border-gray-300 text-gray-400 hover:border-gray-400'
                          }`}
                        >
                          📷
                        </button>
                      )}
                      
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">
                          {variation.image ? 'Image uploaded' : 'No image uploaded yet'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Click to upload a specific image for this variation
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Image Requirements */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">📸 Image Requirements</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Minimum 1000 x 1000 pixels (1:1 aspect ratio recommended)</li>
            <li>• Maximum file size: 10MB</li>
            <li>• Supported formats: JPEG, PNG, TIFF</li>
            <li>• White or transparent background</li>
            <li>• Product should fill 85% of the image frame</li>
            <li>• No text, logos, or watermarks on the main image</li>
            <li>• High resolution and professional quality</li>
          </ul>
        </div>

        {/* Help Section */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">💡 Tips for Better Listings</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• High-quality images can increase conversion rates by up to 40%</li>
            <li>• Include images that show scale and size relationships</li>
            <li>• Use images to highlight unique features and benefits</li>
            <li>• Each variation should have its own image when possible</li>
            <li>• Ensure images load quickly for better user experience</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Step6Images; 