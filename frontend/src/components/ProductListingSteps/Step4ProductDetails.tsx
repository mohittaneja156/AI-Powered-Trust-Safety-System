import React from 'react';

interface ProductDetailsProps {
  productData: {
    category: string;
    subcategory: string;
    itemType: string;
    targetAudience: string;
  };
  onInputChange: (field: string, value: any) => void;
}

const Step4ProductDetails: React.FC<ProductDetailsProps> = ({ productData, onInputChange }) => {
  const categories = [
    'Electronics',
    'Clothing, Shoes & Jewelry',
    'Home & Kitchen',
    'Sports & Outdoors',
    'Beauty & Personal Care',
    'Health & Household',
    'Toys & Games',
    'Automotive',
    'Books',
    'Tools & Home Improvement',
    'Garden & Outdoor',
    'Pet Supplies',
    'Baby Products',
    'Office Products',
    'Musical Instruments',
    'Arts & Crafts',
    'Industrial & Scientific',
    'Luggage & Travel Gear'
  ];

  const subcategories = {
    'Electronics': ['Computers', 'Cell Phones', 'TV & Video', 'Audio & Home Theater', 'Camera & Photo', 'Video Games'],
    'Clothing, Shoes & Jewelry': ['Men', 'Women', 'Kids', 'Baby', 'Jewelry', 'Watches'],
    'Home & Kitchen': ['Kitchen & Dining', 'Furniture', 'Bedding', 'Bath', 'Home Decor', 'Storage & Organization'],
    'Sports & Outdoors': ['Exercise & Fitness', 'Outdoor Recreation', 'Team Sports', 'Hunting & Fishing', 'Camping Gear'],
    'Beauty & Personal Care': ['Makeup', 'Skin Care', 'Hair Care', 'Fragrances', 'Tools & Accessories'],
    'Health & Household': ['Health Care', 'Household Supplies', 'Personal Care', 'Medical Supplies']
  };

  const itemTypes = [
    'Physical Product',
    'Digital Product',
    'Service',
    'Subscription',
    'Gift Card',
    'Downloadable Content'
  ];

  const targetAudiences = [
    'General',
    'Men',
    'Women',
    'Children',
    'Teenagers',
    'Adults',
    'Seniors',
    'Professionals',
    'Students',
    'Athletes',
    'Parents',
    'Pet Owners'
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Step 4: Product Details</h2>
      <div className="space-y-6">
        {/* Category Selection */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium mb-4">Category & Classification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Product Category <span className="text-red-500">*</span>
              </label>
              <select
                value={productData.category}
                onChange={(e) => onInputChange('category', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                required
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose the most appropriate category for your product
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Subcategory
              </label>
              <select
                value={productData.subcategory}
                onChange={(e) => onInputChange('subcategory', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                disabled={!productData.category}
              >
                <option value="">Select subcategory</option>
                {productData.category && subcategories[productData.category as keyof typeof subcategories]?.map(subcategory => (
                  <option key={subcategory} value={subcategory}>
                    {subcategory}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Item Type & Target Audience */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium mb-4">Product Classification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Item Type <span className="text-red-500">*</span>
              </label>
              <select
                value={productData.itemType}
                onChange={(e) => onInputChange('itemType', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                required
              >
                <option value="">Select item type</option>
                {itemTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Target Audience
              </label>
              <select
                value={productData.targetAudience}
                onChange={(e) => onInputChange('targetAudience', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
              >
                <option value="">Select target audience</option>
                {targetAudiences.map(audience => (
                  <option key={audience} value={audience}>
                    {audience}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Product Specifications */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium mb-4">Product Specifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Product Dimensions
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                  placeholder="Length (in)"
                  step="0.1"
                />
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                  placeholder="Width (in)"
                  step="0.1"
                />
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                  placeholder="Height (in)"
                  step="0.1"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Product Weight
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                  placeholder="Weight"
                  step="0.1"
                />
                <select className="ml-2 border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none">
                  <option value="lbs">lbs</option>
                  <option value="oz">oz</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Material & Features */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium mb-4">Material & Features</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Primary Material
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                placeholder="e.g., Cotton, Plastic, Metal, Wood"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Key Features
              </label>
              <textarea
                className="w-full border border-gray-300 rounded px-3 py-2 h-24 focus:border-[#184042] focus:outline-none"
                placeholder="List key features of your product (one per line)"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Color Options
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                placeholder="e.g., Black, White, Red, Blue"
              />
            </div>
          </div>
        </div>

        {/* Compliance & Safety */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium mb-4">Compliance & Safety</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Age Range
              </label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none">
                <option value="">Select age range</option>
                <option value="0-3">0-3 months</option>
                <option value="3-6">3-6 months</option>
                <option value="6-12">6-12 months</option>
                <option value="1-3">1-3 years</option>
                <option value="3-5">3-5 years</option>
                <option value="5-8">5-8 years</option>
                <option value="8-12">8-12 years</option>
                <option value="12+">12+ years</option>
                <option value="adult">Adult</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Safety Warnings
              </label>
              <textarea
                className="w-full border border-gray-300 rounded px-3 py-2 h-20 focus:border-[#184042] focus:outline-none"
                placeholder="Any safety warnings or precautions customers should know"
              />
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">ℹ️ Product Details Tips</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Choose the most specific category that matches your product</li>
            <li>• Accurate dimensions and weight help with shipping calculations</li>
            <li>• Detailed specifications improve search visibility</li>
            <li>• Include all relevant materials and features</li>
            <li>• Safety information builds customer trust</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Step4ProductDetails; 