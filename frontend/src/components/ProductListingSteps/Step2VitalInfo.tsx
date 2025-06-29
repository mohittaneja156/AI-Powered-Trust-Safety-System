import React from 'react';

interface VitalInfoProps {
  productData: {
    manufacturer: string;
    partNumber: string;
    modelNumber: string;
    countryOfOrigin: string;
  };
  onInputChange: (field: string, value: any) => void;
}

const Step2VitalInfo: React.FC<VitalInfoProps> = ({ productData, onInputChange }) => {
  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'CN', name: 'China' },
    { code: 'IN', name: 'India' },
    { code: 'DE', name: 'Germany' },
    { code: 'JP', name: 'Japan' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'MX', name: 'Mexico' },
    { code: 'BR', name: 'Brazil' },
    { code: 'AU', name: 'Australia' },
    { code: 'FR', name: 'France' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'KR', name: 'South Korea' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'SG', name: 'Singapore' },
    { code: 'TH', name: 'Thailand' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'MY', name: 'Malaysia' }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Step 2: Vital Info</h2>
      <div className="space-y-6">
        {/* Manufacturer */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Manufacturer <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={productData.manufacturer}
            onChange={(e) => onInputChange('manufacturer', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
            placeholder="Enter manufacturer name"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            The company that manufactured or assembled the product
          </p>
        </div>

        {/* Part Number */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Part Number
          </label>
          <input
            type="text"
            value={productData.partNumber}
            onChange={(e) => onInputChange('partNumber', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
            placeholder="Enter part number (if applicable)"
          />
          <p className="text-xs text-gray-500 mt-1">
            The manufacturer&apos;s part number for this specific product
          </p>
        </div>

        {/* Model Number */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Model Number
          </label>
          <input
            type="text"
            value={productData.modelNumber}
            onChange={(e) => onInputChange('modelNumber', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
            placeholder="Enter model number (if applicable)"
          />
          <p className="text-xs text-gray-500 mt-1">
            The specific model number of the product
          </p>
        </div>

        {/* Country of Origin */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Country of Origin
          </label>
          <select
            value={productData.countryOfOrigin}
            onChange={(e) => onInputChange('countryOfOrigin', e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
          >
            <option value="">Select country of origin</option>
            {countries.map(country => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            The country where the product was manufactured or assembled
          </p>
        </div>

        {/* Additional Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Additional Product Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                UPC (Universal Product Code)
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                placeholder="Enter 12-digit UPC code"
                maxLength={12}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                EAN (European Article Number)
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                placeholder="Enter 13-digit EAN code"
                maxLength={13}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                ISBN (International Standard Book Number)
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                placeholder="Enter ISBN (for books only)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                GTIN (Global Trade Item Number)
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none"
                placeholder="Enter GTIN"
              />
            </div>
          </div>
        </div>

        {/* Compliance Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Compliance & Safety</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Safety Certifications
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  CE Marking (European Union)
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  FCC Certification (United States)
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  UL Listing (Underwriters Laboratories)
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  RoHS Compliance (Restriction of Hazardous Substances)
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  REACH Compliance (Registration, Evaluation, Authorization of Chemicals)
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Warranty Information
              </label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 focus:border-[#184042] focus:outline-none">
                <option value="">Select warranty period</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="1">1 year</option>
                <option value="2">2 years</option>
                <option value="3">3 years</option>
                <option value="5">5 years</option>
                <option value="lifetime">Lifetime</option>
                <option value="none">No warranty</option>
              </select>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">ℹ️ Important Notes</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Manufacturer information helps customers identify the product source</li>
            <li>• Part numbers and model numbers improve product searchability</li>
            <li>• Country of origin is required for customs and import regulations</li>
            <li>• UPC/EAN codes are essential for retail and inventory management</li>
            <li>• Safety certifications build customer trust and ensure compliance</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Step2VitalInfo; 