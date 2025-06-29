import React from 'react';

interface OfferProps {
  productData: {
    price: number;
    quantity: number;
    condition: 'new' | 'used' | 'refurbished';
    fulfillmentType: 'fba' | 'fbm';
  };
  onInputChange: (field: string, value: any) => void;
}

const Step3Offer: React.FC<OfferProps> = ({ productData, onInputChange }) => {
  const calculateFees = () => {
    // Simplified fee calculation for demo
    const referralFee = productData.price * 0.15; // 15% referral fee
    const fbaFee = productData.fulfillmentType === 'fba' ? 3.22 : 0; // FBA fulfillment fee
    const totalFees = referralFee + fbaFee;
    const netProfit = productData.price - totalFees;
    
    return {
      referralFee: referralFee.toFixed(2),
      fbaFee: fbaFee.toFixed(2),
      totalFees: totalFees.toFixed(2),
      netProfit: netProfit.toFixed(2),
      profitMargin: ((netProfit / productData.price) * 100).toFixed(1)
    };
  };

  const fees = calculateFees();

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Step 3: Offer</h2>
      <div className="space-y-6">
        {/* Pricing Section */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium mb-4">Pricing Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Your Price <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <span className="text-lg mr-2 text-gray-600">$</span>
                <input
                  type="number"
                  value={productData.price || ''}
                  onChange={(e) => onInputChange('price', parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                The price you want to sell your product for
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={productData.quantity || ''}
                onChange={(e) => onInputChange('quantity', parseInt(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                placeholder="1"
                min="1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of units available for sale
              </p>
            </div>
          </div>
        </div>

        {/* Condition Section */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium mb-4">Product Condition</h3>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Condition <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <label className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="condition"
                  value="new"
                  checked={productData.condition === 'new'}
                  onChange={(e) => onInputChange('condition', e.target.value)}
                  className="mr-3 mt-1"
                />
                <div>
                  <div className="font-medium">New</div>
                  <div className="text-sm text-gray-600">
                    A brand-new, unused, unopened, undamaged item in its original packaging
                  </div>
                </div>
              </label>
              
              <label className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="condition"
                  value="used"
                  checked={productData.condition === 'used'}
                  onChange={(e) => onInputChange('condition', e.target.value)}
                  className="mr-3 mt-1"
                />
                <div>
                  <div className="font-medium">Used</div>
                  <div className="text-sm text-gray-600">
                    An item that has been used previously. The item may have some signs of cosmetic wear
                  </div>
                </div>
              </label>
              
              <label className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="condition"
                  value="refurbished"
                  checked={productData.condition === 'refurbished'}
                  onChange={(e) => onInputChange('condition', e.target.value)}
                  className="mr-3 mt-1"
                />
                <div>
                  <div className="font-medium">Refurbished</div>
                  <div className="text-sm text-gray-600">
                    An item that has been restored to working order by the manufacturer or a third party
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Fulfillment Section */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium mb-4">Fulfillment Method</h3>
          <div className="space-y-4">
            <label className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="fulfillmentType"
                value="fba"
                checked={productData.fulfillmentType === 'fba'}
                onChange={(e) => onInputChange('fulfillmentType', e.target.value)}
                className="mr-3 mt-1"
              />
              <div className="flex-1">
                <div className="font-medium flex items-center">
                  Fulfilled by ShopHub (FBS)
                </div>
                <p className="text-sm text-gray-600 ml-6">
                  ShopHub stores, packs, and ships your products. You get Prime eligibility and customer service.
                </p>
              </div>
            </label>
            
            <label className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="fulfillmentType"
                value="fbm"
                checked={productData.fulfillmentType === 'fbm'}
                onChange={(e) => onInputChange('fulfillmentType', e.target.value)}
                className="mr-3 mt-1"
              />
              <div className="flex-1">
                <div className="font-medium">Fulfilled by Merchant (FBM)</div>
                <div className="text-sm text-gray-600 mt-1">
                  You store, pack, and ship your products directly to customers.
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  <strong>Benefits:</strong> Lower fees, direct customer contact, control over packaging
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Fee Calculator */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium mb-4">Fee Calculator</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex justify-between mb-2">
                  <span>Your Price:</span>
                  <span className="font-medium">${productData.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2 text-red-600">
                  <span>Referral Fee (15%):</span>
                  <span>-${fees.referralFee}</span>
                </div>
                {productData.fulfillmentType === 'fba' && (
                  <div className="flex justify-between mb-2 text-red-600">
                    <span>FBA Fulfillment Fee:</span>
                    <span>-${fees.fbaFee}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>Total Fees:</span>
                  <span className="text-red-600">-${fees.totalFees}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2 font-medium text-lg">
                  <span>Net Profit:</span>
                  <span className="text-green-600">${fees.netProfit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Profit Margin:</span>
                  <span className="text-green-600">{fees.profitMargin}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Settings */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-medium mb-4">Shipping Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Shipping Template
              </label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none">
                <option value="">Select shipping template</option>
                <option value="standard">Standard Shipping</option>
                <option value="expedited">Expedited Shipping</option>
                <option value="free">Free Shipping</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Handling Time
              </label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none">
                <option value="1">1 business day</option>
                <option value="2">2 business days</option>
                <option value="3">3 business days</option>
                <option value="5">5 business days</option>
                <option value="7">7 business days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Business Price */}
        <div>
          <h3 className="text-lg font-medium mb-4">Business Pricing (Optional)</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Business Price
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
                Special pricing for business customers (usually lower than retail price)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Minimum Order Quantity
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                placeholder="1"
                min="1"
              />
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">💰 Pricing Tips</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Research competitor prices to stay competitive</li>
            <li>• Consider your costs: product cost, shipping, fees, and desired profit</li>
            <li>• FBA fees vary by product size and weight</li>
            <li>• Business pricing can help attract bulk buyers</li>
            <li>• Monitor your profit margins regularly</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Step3Offer; 