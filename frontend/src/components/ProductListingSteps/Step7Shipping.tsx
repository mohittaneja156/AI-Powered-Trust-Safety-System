import React from 'react';

interface ShippingProps {
  productData: {
    shippingTemplate: string;
    handlingTime: string;
    shippingWeight: number;
    shippingDimensions: {
      length: number;
      width: number;
      height: number;
    };
    shippingService: string;
    freeShipping: boolean;
  };
  onInputChange: (field: string, value: any) => void;
}

const Step7Shipping: React.FC<ShippingProps> = ({ productData, onInputChange }) => {
  const shippingTemplates = [
    { value: 'standard', label: 'Standard Shipping', description: '3-5 business days' },
    { value: 'expedited', label: 'Expedited Shipping', description: '2-3 business days' },
    { value: 'free', label: 'Free Shipping', description: 'Free standard shipping' },
    { value: 'custom', label: 'Custom Template', description: 'Create your own template' }
  ];

  const handlingTimes = [
    { value: '1', label: '1 business day' },
    { value: '2', label: '2 business days' },
    { value: '3', label: '3 business days' },
    { value: '5', label: '5 business days' },
    { value: '7', label: '7 business days' }
  ];

  const shippingServices = [
    'USPS First Class',
    'USPS Priority Mail',
    'USPS Media Mail',
    'FedEx Ground',
    'FedEx 2Day',
    'UPS Ground',
    'UPS 2nd Day Air',
    'ShopHub FBS'
  ];

  const handleDimensionChange = (field: string, value: number) => {
    onInputChange('shippingDimensions', {
      ...productData.shippingDimensions,
      [field]: value
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Step 7: Shipping</h2>
      <div className="space-y-6">
        {/* Shipping Template */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium mb-4">Shipping Template</h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Choose a shipping template that defines your shipping rates and delivery times.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shippingTemplates.map((template) => (
                <label key={template.value} className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="shippingTemplate"
                    value={template.value}
                    checked={productData.shippingTemplate === template.value}
                    onChange={(e) => onInputChange('shippingTemplate', e.target.value)}
                    className="mr-3 mt-1"
                  />
                  <div>
                    <div className="font-medium">{template.label}</div>
                    <div className="text-sm text-gray-600">{template.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Handling Time */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium mb-4">Handling Time</h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              How long it takes you to process and ship the order after receiving it.
            </p>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Processing Time <span className="text-red-500">*</span>
              </label>
              <select
                value={productData.handlingTime}
                onChange={(e) => onInputChange('handlingTime', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                required
              >
                <option value="">Select handling time</option>
                {handlingTimes.map(time => (
                  <option key={time.value} value={time.value}>
                    {time.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Package Dimensions */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium mb-4">Package Dimensions</h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Enter the package dimensions for accurate shipping calculations.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Package Weight <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={productData.shippingWeight || ''}
                    onChange={(e) => onInputChange('shippingWeight', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                  <select className="ml-2 border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none">
                    <option value="lbs">lbs</option>
                    <option value="oz">oz</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Package Dimensions
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    value={productData.shippingDimensions.length || ''}
                    onChange={(e) => handleDimensionChange('length', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                    placeholder="Length"
                    step="0.1"
                    min="0"
                  />
                  <input
                    type="number"
                    value={productData.shippingDimensions.width || ''}
                    onChange={(e) => handleDimensionChange('width', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                    placeholder="Width"
                    step="0.1"
                    min="0"
                  />
                  <input
                    type="number"
                    value={productData.shippingDimensions.height || ''}
                    onChange={(e) => handleDimensionChange('height', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                    placeholder="Height"
                    step="0.1"
                    min="0"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">All dimensions in inches</p>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Service */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium mb-4">Shipping Service</h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Select your preferred shipping service for this product.
            </p>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Primary Shipping Service
              </label>
              <select
                value={productData.shippingService}
                onChange={(e) => onInputChange('shippingService', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
              >
                <option value="">Select shipping service</option>
                {shippingServices.map(service => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Free Shipping Options */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium mb-4">Free Shipping Options</h3>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={productData.freeShipping}
                onChange={(e) => onInputChange('freeShipping', e.target.checked)}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Offer Free Shipping</div>
                <div className="text-sm text-gray-600">
                  Customers love free shipping! This can increase your conversion rates.
                </div>
              </div>
            </label>
            
            {productData.freeShipping && (
              <div className="ml-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Free Shipping Settings</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Minimum Order Amount
                    </label>
                    <div className="flex items-center">
                      <span className="text-lg mr-2 text-gray-600">$</span>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Orders above this amount qualify for free shipping
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Free Shipping Regions
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        Continental United States
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        Alaska & Hawaii
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        International
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Shipping Calculator */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium mb-4">Shipping Cost Calculator</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Estimated Shipping Costs</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>USPS First Class:</span>
                    <span className="font-medium">$3.50 - $5.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>USPS Priority Mail:</span>
                    <span className="font-medium">$7.50 - $12.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>FedEx Ground:</span>
                    <span className="font-medium">$8.00 - $15.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>UPS Ground:</span>
                    <span className="font-medium">$9.00 - $18.00</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Shipping Tips</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Accurate dimensions help calculate correct shipping costs</li>
                  <li>• Consider offering free shipping for orders over $25</li>
                  <li>• USPS is often the most cost-effective for small items</li>
                  <li>• FedEx/UPS are better for larger or heavier items</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">ℹ️ Shipping Best Practices</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Offer competitive shipping rates to stay competitive</li>
            <li>• Provide accurate handling times to meet customer expectations</li>
            <li>• Consider free shipping for higher-value items</li>
            <li>• Use appropriate packaging to protect your products</li>
            <li>• Track packages and provide shipping confirmations</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Step7Shipping; 