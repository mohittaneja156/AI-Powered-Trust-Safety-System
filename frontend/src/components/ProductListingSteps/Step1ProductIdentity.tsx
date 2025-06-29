import React from 'react';

interface ProductIdentityProps {
  productData: {
    brandName: string;
    productTitle: string;
    productDescription: string;
    bulletPoints: string[];
  };
  onInputChange: (field: string, value: any) => void;
}

const Step1ProductIdentity: React.FC<ProductIdentityProps> = ({ productData, onInputChange }) => {
  const handleBulletPointChange = (index: number, value: string) => {
    const newBulletPoints = [...productData.bulletPoints];
    newBulletPoints[index] = value;
    onInputChange('bulletPoints', newBulletPoints);
  };

  const addBulletPoint = () => {
    if (productData.bulletPoints.length < 5) {
      onInputChange('bulletPoints', [...productData.bulletPoints, '']);
    }
  };

  const removeBulletPoint = (index: number) => {
    const newBulletPoints = productData.bulletPoints.filter((_, i) => i !== index);
    onInputChange('bulletPoints', newBulletPoints);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Step 1: Product Identity</h2>
      <div className="space-y-6">
        {/* Brand Name */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Brand Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={productData.brandName}
            onChange={(e) => onInputChange('brandName', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
            placeholder="Enter your brand name"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Start your title with your brand name followed by your primary keyword
          </p>
        </div>

        {/* Product Title */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Product Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={productData.productTitle}
            onChange={(e) => onInputChange('productTitle', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
            placeholder="Enter product title (80-200 characters)"
            maxLength={200}
            required
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Keep between 80-200 characters</span>
            <span>{productData.productTitle.length}/200</span>
          </div>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
            <strong>Title Guidelines (Effective January 21, 2025):</strong>
            <ul className="mt-2 space-y-1 text-xs">
              <li>• Start with brand name followed by primary keyword</li>
              <li>• Capitalize first letter of each word (except prepositions, conjunctions, articles)</li>
              <li>• Use numerals instead of spelling out numbers (e.g., "2-Pack" not "Two-Pack")</li>
              <li>• Avoid characters: !, $, ?, _, &#123;, &#125;, ^, ¬, ¦</li>
              <li>• Do not use the same word more than twice</li>
              <li>• Include size and color for product variations</li>
            </ul>
          </div>
        </div>

        {/* Product Description */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Product Description
          </label>
          <textarea
            value={productData.productDescription}
            onChange={(e) => onInputChange('productDescription', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 h-32 focus:border-[#184042] focus:outline-none"
            placeholder="Enter detailed product description"
          />
          <p className="text-xs text-gray-500 mt-1">
            Provide a comprehensive description of your product features and benefits
          </p>
        </div>

        {/* Bullet Points */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Bullet Points <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Add up to 5 bullet points highlighting key features and benefits
          </p>
          {productData.bulletPoints.map((point, index) => (
            <div key={index} className="flex gap-2 mb-3">
              <div className="flex-shrink-0 w-6 h-6 bg-[#184042] text-white rounded-full flex items-center justify-center text-sm font-bold mt-1">
                {index + 1}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={point}
                  onChange={(e) => handleBulletPointChange(index, e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                  placeholder={`Bullet point ${index + 1} - Key feature or benefit`}
                />
              </div>
              {productData.bulletPoints.length > 1 && (
                <button
                  onClick={() => removeBulletPoint(index)}
                  className="flex-shrink-0 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {productData.bulletPoints.length < 5 && (
            <button
              onClick={addBulletPoint}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              + Add Bullet Point
            </button>
          )}
        </div>

        {/* Variations Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Variations</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Does this product have variations?
              </label>
              <div className="flex gap-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasVariations"
                    value="yes"
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasVariations"
                    value="no"
                    className="mr-2"
                    defaultChecked
                  />
                  No
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Select "Yes" if you have different sizes, colors, or styles of the same product
              </p>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">💡 Tips for Better Listings</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Use relevant keywords naturally in your title and bullet points</li>
            <li>• Focus on benefits, not just features</li>
            <li>• Be specific about what makes your product unique</li>
            <li>• Use clear, concise language that customers understand</li>
            <li>• Include important specifications and dimensions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Step1ProductIdentity; 