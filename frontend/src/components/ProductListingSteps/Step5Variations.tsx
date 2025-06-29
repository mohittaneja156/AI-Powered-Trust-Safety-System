import React from 'react';

interface VariationsProps {
  productData: {
    hasVariations: boolean;
    variationType: 'size' | 'color' | 'style' | 'material';
    variations: Array<{
      type: string;
      value: string;
      price?: number;
      quantity?: number;
    }>;
  };
  onInputChange: (field: string, value: any) => void;
}

const Step5Variations: React.FC<VariationsProps> = ({ productData, onInputChange }) => {
  const variationTypes = [
    { value: 'size', label: 'Size', examples: ['Small', 'Medium', 'Large', 'XL', 'XXL'] },
    { value: 'color', label: 'Color', examples: ['Black', 'White', 'Red', 'Blue', 'Green'] },
    { value: 'style', label: 'Style', examples: ['Classic', 'Modern', 'Vintage', 'Casual', 'Formal'] },
    { value: 'material', label: 'Material', examples: ['Cotton', 'Polyester', 'Leather', 'Wood', 'Metal'] }
  ];

  const handleVariationChange = (index: number, field: string, value: any) => {
    const newVariations = [...productData.variations];
    newVariations[index] = { ...newVariations[index], [field]: value };
    onInputChange('variations', newVariations);
  };

  const addVariation = () => {
    const newVariation = {
      type: productData.variationType,
      value: '',
      price: 0,
      quantity: 1
    };
    onInputChange('variations', [...productData.variations, newVariation]);
  };

  const removeVariation = (index: number) => {
    const newVariations = productData.variations.filter((_, i) => i !== index);
    onInputChange('variations', newVariations);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Step 5: Variations</h2>
      <div className="space-y-6">
        {/* Variation Setup */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium mb-4">Variation Setup</h3>
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
                    checked={productData.hasVariations === true}
                    onChange={(e) => onInputChange('hasVariations', e.target.value === 'yes')}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasVariations"
                    value="no"
                    checked={productData.hasVariations === false}
                    onChange={(e) => onInputChange('hasVariations', e.target.value === 'yes')}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Select &quot;Yes&quot; if you have different sizes, colors, or styles of the same product
              </p>
            </div>

            {productData.hasVariations && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Variation Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={productData.variationType}
                  onChange={(e) => onInputChange('variationType', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                  required
                >
                  <option value="">Select variation type</option>
                  {variationTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose the primary variation type for your product
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Variation Management */}
        {productData.hasVariations && productData.variationType && (
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium mb-4">Manage Variations</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-700">
                  {variationTypes.find(t => t.value === productData.variationType)?.label} Variations
                </h4>
                <button
                  onClick={addVariation}
                  className="px-4 py-2 bg-[#184042] text-white rounded hover:bg-[#123133] text-sm"
                >
                  + Add Variation
                </button>
              </div>

              {productData.variations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No variations added yet.</p>
                  <p className="text-sm">Click &quot;Add Variation&quot; to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {productData.variations.map((variation, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h5 className="font-medium text-gray-700">
                          Variation {index + 1}
                        </h5>
                        <button
                          onClick={() => removeVariation(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">
                            {variationTypes.find(t => t.value === productData.variationType)?.label} Value <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={variation.value}
                            onChange={(e) => handleVariationChange(index, 'value', e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                            placeholder={`Enter ${variationTypes.find(t => t.value === productData.variationType)?.label.toLowerCase()}`}
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Examples: {variationTypes.find(t => t.value === productData.variationType)?.examples.join(', ')}
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">
                            Price
                          </label>
                          <div className="flex items-center">
                            <span className="text-lg mr-2 text-gray-600">$</span>
                            <input
                              type="number"
                              value={variation.price || ''}
                              onChange={(e) => handleVariationChange(index, 'price', parseFloat(e.target.value) || 0)}
                              className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">
                            Quantity
                          </label>
                          <input
                            type="number"
                            value={variation.quantity || ''}
                            onChange={(e) => handleVariationChange(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                            placeholder="1"
                            min="1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">💡 Variation Tips</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Variations help customers find the exact product they want</li>
            <li>• Each variation can have different pricing and inventory</li>
            <li>• Common variation types include size, color, style, and material</li>
            <li>• You can add multiple variation types for complex products</li>
            <li>• Images for each variation can be added in the next step</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Step5Variations; 