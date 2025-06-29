import React, { useState, useEffect } from 'react';
import { FaSearch, FaGlobe, FaEnvelope, FaQuestionCircle, FaTimesCircle, FaCheckCircle, FaExclamationTriangle, FaArrowLeft, FaArrowRight, FaSave, FaEye, FaShieldAlt } from 'react-icons/fa';
import { FiMenu } from 'react-icons/fi';
import Step1ProductIdentity from '@/components/ProductListingSteps/Step1ProductIdentity';
import Step2VitalInfo from '@/components/ProductListingSteps/Step2VitalInfo';
import Step3Offer from '@/components/ProductListingSteps/Step3Offer';
import Step4ProductDetails from '@/components/ProductListingSteps/Step4ProductDetails';
import Step5Variations from '@/components/ProductListingSteps/Step5Variations';
import Step6Images from '@/components/ProductListingSteps/Step6Images';
import Step7Shipping from '@/components/ProductListingSteps/Step7Shipping';

// Define types for the product listing flow
interface ProductListingData {
  // Product Identity
  brandName: string;
  productTitle: string;
  productDescription: string;
  bulletPoints: string[];
  
  // Vital Info
  manufacturer: string;
  partNumber: string;
  modelNumber: string;
  countryOfOrigin: string;
  
  // Offer
  price: number;
  quantity: number;
  condition: 'new' | 'used' | 'refurbished';
  fulfillmentType: 'fba' | 'fbm';
  
  // Product Details
  category: string;
  subcategory: string;
  itemType: string;
  targetAudience: string;
  
  // Variations
  hasVariations: boolean;
  variationType: 'size' | 'color' | 'style' | 'material';
  variations: Array<{
    type: string;
    value: string;
    price?: number;
    quantity?: number;
  }>;
  
  // Images
  mainImage: string;
  additionalImages: string[];
  
  // Shipping
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
}

interface MonitoringResult {
  step: number;
  product_id: string;
  timestamp: string;
  warnings: string[];
  risk_score: number;
  recommendations: string[];
}

const ProductListing = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [productData, setProductData] = useState<ProductListingData>({
    brandName: '',
    productTitle: '',
    productDescription: '',
    bulletPoints: ['', '', '', '', ''],
    manufacturer: '',
    partNumber: '',
    modelNumber: '',
    countryOfOrigin: '',
    price: 0,
    quantity: 1,
    condition: 'new',
    fulfillmentType: 'fba',
    category: '',
    subcategory: '',
    itemType: '',
    targetAudience: '',
    hasVariations: false,
    variationType: 'size',
    variations: [],
    mainImage: '',
    additionalImages: [],
    shippingTemplate: '',
    handlingTime: '',
    shippingWeight: 0,
    shippingDimensions: { length: 0, width: 0, height: 0 },
    shippingService: '',
    freeShipping: false
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productId] = useState(`prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [monitoringResults, setMonitoringResults] = useState<MonitoringResult[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMonitoringPanel, setShowMonitoringPanel] = useState(false);

  // Backend API URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

  // Sample categories from ShopHub
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
    'Tools & Home Improvement'
  ];

  const subcategories = {
    'Electronics': ['Computers', 'Cell Phones', 'TV & Video', 'Audio & Home Theater'],
    'Clothing, Shoes & Jewelry': ['Men', 'Women', 'Kids', 'Baby'],
    'Home & Kitchen': ['Kitchen & Dining', 'Furniture', 'Bedding', 'Bath'],
    'Sports & Outdoors': ['Exercise & Fitness', 'Outdoor Recreation', 'Team Sports', 'Hunting & Fishing']
  };

  // Real-time monitoring function
  const monitorStep = async (stepNumber: number, stepData: any) => {
    try {
      // Debug logging
      console.log(`Sending step ${stepNumber} monitoring data:`, {
        step_number: stepNumber,
        product_id: productId,
        step_data: stepData
      });

      const response = await fetch(`${API_BASE_URL}/monitor/step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          step_data: stepData,
          step_number: stepNumber,
          product_id: productId
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMonitoringResults(prev => [...prev, result]);
        
        // Show warnings if any
        if (result.warnings && result.warnings.length > 0) {
          console.warn(`Step ${stepNumber} warnings:`, result.warnings);
        }
        
        return result;
      } else {
        const errorData = await response.json();
        console.error(`Step ${stepNumber} monitoring failed:`, errorData);
        console.error(`Response status:`, response.status);
        console.error(`Response headers:`, response.headers);
      }
    } catch (error) {
      console.error(`Error monitoring step ${stepNumber}:`, error);
    }
  };

  const handleSearch = async () => {
    // Simulate search results
    const mockResults = [
      {
        asin: 'B08N5WRWNW',
        title: 'Echo Dot (4th Gen) | Smart speaker with Alexa | Charcoal',
        brand: 'ShopHub',
        category: 'Electronics',
        image: 'https://m.media-amazon.com/images/I/714Rq4k05UL._AC_SL1000_.jpg',
        price: 49.99,
        rating: 4.7,
        reviews: 123456
      },
      {
        asin: 'B08N5WRWNW',
        title: 'Echo Dot (3rd Gen) | Smart speaker with Alexa | Charcoal',
        brand: 'ShopHub',
        category: 'Electronics',
        image: 'https://m.media-amazon.com/images/I/714Rq4k05UL._AC_SL1000_.jpg',
        price: 39.99,
        rating: 4.5,
        reviews: 98765
      }
    ];
    setSearchResults(mockResults);
  };

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setProductData(prev => ({
      ...prev,
      brandName: product.brand,
      productTitle: product.title,
      category: product.category
    }));
    setCurrentStep(2);
  };

  const handleInputChange = async (field: string, value: any) => {
    setProductData(prev => ({
      ...prev,
      [field]: value
    }));

    // Real-time monitoring for specific fields - send only relevant step data
    if (currentStep === 1 && (field === 'brandName' || field === 'productTitle' || field === 'productDescription' || field === 'bulletPoints')) {
      const stepData = {
        brandName: field === 'brandName' ? value : productData.brandName,
        productTitle: field === 'productTitle' ? value : productData.productTitle,
        productDescription: field === 'productDescription' ? value : productData.productDescription,
        bulletPoints: field === 'bulletPoints' ? value : productData.bulletPoints
      };
      await monitorStep(currentStep, stepData);
    } else if (currentStep === 2 && (field === 'manufacturer' || field === 'partNumber' || field === 'modelNumber' || field === 'countryOfOrigin')) {
      const stepData = {
        manufacturer: field === 'manufacturer' ? value : productData.manufacturer,
        partNumber: field === 'partNumber' ? value : productData.partNumber,
        modelNumber: field === 'modelNumber' ? value : productData.modelNumber,
        countryOfOrigin: field === 'countryOfOrigin' ? value : productData.countryOfOrigin
      };
      await monitorStep(currentStep, stepData);
    } else if (currentStep === 3 && (field === 'price' || field === 'quantity' || field === 'condition' || field === 'fulfillmentType')) {
      const stepData = {
        price: field === 'price' ? value : productData.price,
        quantity: field === 'quantity' ? value : productData.quantity,
        condition: field === 'condition' ? value : productData.condition,
        fulfillmentType: field === 'fulfillmentType' ? value : productData.fulfillmentType
      };
      await monitorStep(currentStep, stepData);
    } else if (currentStep === 6 && (field === 'mainImage' || field === 'additionalImages')) {
      const stepData = {
        mainImage: field === 'mainImage' ? value : productData.mainImage,
        additionalImages: field === 'additionalImages' ? value : productData.additionalImages,
        brandName: productData.brandName,  // Include brand for ML analysis
        productTitle: productData.productTitle  // Include title for ML analysis
      };
      await monitorStep(currentStep, stepData);
    }
  };

  const handleBulletPointChange = (index: number, value: string) => {
    const newBulletPoints = [...productData.bulletPoints];
    newBulletPoints[index] = value;
    handleInputChange('bulletPoints', newBulletPoints);
  };

  const addBulletPoint = () => {
    if (productData.bulletPoints.length < 5) {
      handleInputChange('bulletPoints', [...productData.bulletPoints, '']);
    }
  };

  const removeBulletPoint = (index: number) => {
    const newBulletPoints = productData.bulletPoints.filter((_, i) => i !== index);
    handleInputChange('bulletPoints', newBulletPoints);
  };

  const addVariation = () => {
    const newVariation = {
      type: productData.variationType,
      value: '',
      price: productData.price,
      quantity: 1
    };
    handleInputChange('variations', [...productData.variations, newVariation]);
  };

  const handleVariationChange = (index: number, field: string, value: any) => {
    const newVariations = [...productData.variations];
    newVariations[index] = { ...newVariations[index], [field]: value };
    handleInputChange('variations', newVariations);
  };

  const removeVariation = (index: number) => {
    const newVariations = productData.variations.filter((_, i) => i !== index);
    handleInputChange('variations', newVariations);
  };

  const nextStep = async () => {
    if (currentStep < 7) {
      // Monitor current step before moving to next - send complete step data
      let stepData = {};
      
      if (currentStep === 1) {
        stepData = {
          brandName: productData.brandName,
          productTitle: productData.productTitle,
          productDescription: productData.productDescription,
          bulletPoints: productData.bulletPoints
        };
      } else if (currentStep === 2) {
        stepData = {
          manufacturer: productData.manufacturer,
          partNumber: productData.partNumber,
          modelNumber: productData.modelNumber,
          countryOfOrigin: productData.countryOfOrigin
        };
      } else if (currentStep === 3) {
        stepData = {
          price: productData.price,
          quantity: productData.quantity,
          condition: productData.condition,
          fulfillmentType: productData.fulfillmentType
        };
      } else if (currentStep === 4) {
        stepData = {
          category: productData.category,
          subcategory: productData.subcategory,
          itemType: productData.itemType,
          targetAudience: productData.targetAudience
        };
      } else if (currentStep === 5) {
        stepData = {
          hasVariations: productData.hasVariations,
          variationType: productData.variationType,
          variations: productData.variations
        };
      } else if (currentStep === 6) {
        stepData = {
          mainImage: productData.mainImage,
          additionalImages: productData.additionalImages,
          brandName: productData.brandName,
          productTitle: productData.productTitle
        };
      }
      
      await monitorStep(currentStep, stepData);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveDraft = () => {
    localStorage.setItem('productListingDraft', JSON.stringify(productData));
    alert('Draft saved successfully!');
  };

  const submitListing = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/submit/listing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listing_data: productData,
          seller_id: 'seller_123' // In real app, get from auth
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Product listing submitted successfully! Product ID: ${result.product_id}`);
        
        // Show monitoring results
        setShowMonitoringPanel(true);
        
        // Reset form
        setProductData({
          brandName: '',
          productTitle: '',
          productDescription: '',
          bulletPoints: ['', '', '', '', ''],
          manufacturer: '',
          partNumber: '',
          modelNumber: '',
          countryOfOrigin: '',
          price: 0,
          quantity: 1,
          condition: 'new',
          fulfillmentType: 'fba',
          category: '',
          subcategory: '',
          itemType: '',
          targetAudience: '',
          hasVariations: false,
          variationType: 'size',
          variations: [],
          mainImage: '',
          additionalImages: [],
          shippingTemplate: '',
          handlingTime: '',
          shippingWeight: 0,
          shippingDimensions: { length: 0, width: 0, height: 0 },
          shippingService: '',
          freeShipping: false
        });
        setCurrentStep(1);
        setMonitoringResults([]);
      } else {
        const error = await response.json();
        console.error('Submission error:', error);
        alert(`Submission failed: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting listing:', error);
      alert('Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1ProductIdentity 
            productData={{
              brandName: productData.brandName,
              productTitle: productData.productTitle,
              productDescription: productData.productDescription,
              bulletPoints: productData.bulletPoints
            }}
            onInputChange={handleInputChange}
          />
        );
      case 2:
        return (
          <Step2VitalInfo 
            productData={{
              manufacturer: productData.manufacturer,
              partNumber: productData.partNumber,
              modelNumber: productData.modelNumber,
              countryOfOrigin: productData.countryOfOrigin
            }}
            onInputChange={handleInputChange}
          />
        );
      case 3:
        return (
          <Step3Offer 
            productData={{
              price: productData.price,
              quantity: productData.quantity,
              condition: productData.condition,
              fulfillmentType: productData.fulfillmentType
            }}
            onInputChange={handleInputChange}
          />
        );
      case 4:
        return (
          <Step4ProductDetails 
            productData={{
              category: productData.category,
              subcategory: productData.subcategory,
              itemType: productData.itemType,
              targetAudience: productData.targetAudience
            }}
            onInputChange={handleInputChange}
          />
        );
      case 5:
        return (
          <Step5Variations 
            productData={{
              hasVariations: productData.hasVariations,
              variationType: productData.variationType,
              variations: productData.variations
            }}
            onInputChange={handleInputChange}
          />
        );
      case 6:
        return (
          <Step6Images 
            productData={{
              mainImage: productData.mainImage,
              additionalImages: productData.additionalImages,
              variations: productData.variations
            }}
            onInputChange={handleInputChange}
          />
        );
      case 7:
        return (
          <Step7Shipping 
            productData={{
              shippingTemplate: productData.shippingTemplate,
              handlingTime: productData.handlingTime,
              shippingWeight: productData.shippingWeight,
              shippingDimensions: productData.shippingDimensions,
              shippingService: productData.shippingService,
              freeShipping: productData.freeShipping
            }}
            onInputChange={handleInputChange}
          />
        );
      default:
        return null;
    }
  };

  const stepTitles = [
    'Product Identity',
    'Vital Info', 
    'Offer',
    'Product Details',
    'Variations',
    'Images',
    'Shipping'
  ];

  // Calculate overall risk score
  const overallRiskScore = monitoringResults.reduce((total, result) => total + result.risk_score, 0) / Math.max(monitoringResults.length, 1);
  const riskLevel = overallRiskScore >= 0.7 ? 'critical' : overallRiskScore >= 0.5 ? 'high' : overallRiskScore >= 0.3 ? 'medium' : 'low';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#184042] text-white w-full shadow z-20">
        <div className="flex flex-col md:flex-row items-center px-2 md:px-6 py-2 gap-2 md:gap-4">
          <FiMenu className="text-2xl mr-2" />
          <span className="font-bold text-lg flex items-center gap-1">
            <div className="bg-white px-2 py-1 rounded text-primary text-xl font-bold">S</div>
            <span className="ml-1 text-base font-normal text-white">ShopHub Seller Portal</span>
          </span>
          <div className="flex-1 flex items-center mx-0 md:mx-8 max-w-full md:max-w-xl mt-2 md:mt-0">
            <input 
              className="w-full px-4 py-2 rounded-l bg-white text-black text-sm focus:outline-none" 
              placeholder="Search" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              className="bg-[#0f292f] px-4 py-2 rounded-r flex items-center justify-center"
              onClick={handleSearch}
            >
              <FaSearch />
            </button>
          </div>
          <nav className="flex gap-2 md:gap-6 text-xs md:text-sm font-medium mt-2 md:mt-0 overflow-x-auto w-full md:w-auto">
            <span className="hover:underline cursor-pointer whitespace-nowrap">Add Products</span>
            <span className="hover:underline cursor-pointer whitespace-nowrap">Complete Your Drafts</span>
            <span className="hover:underline cursor-pointer whitespace-nowrap">Manage All Inventory</span>
            <span className="hover:underline cursor-pointer whitespace-nowrap">Sell Globally</span>
            <span className="hover:underline cursor-pointer whitespace-nowrap">Automate Pricing</span>
          </nav>
          <div className="flex items-center gap-2 md:gap-4 ml-0 md:ml-8 mt-2 md:mt-0">
            <FaEnvelope className="text-lg" />
            <FaGlobe className="text-lg" />
            <span className="text-sm font-semibold">EN</span>
            <FaQuestionCircle className="text-lg" />
            <span className="text-sm font-semibold">Help</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-semibold text-gray-800">Create New Product Listing</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Step {currentStep} of 7</span>
              <button
                onClick={() => setShowMonitoringPanel(!showMonitoringPanel)}
                className={`flex items-center gap-2 px-3 py-1 rounded text-sm ${
                  riskLevel === 'critical' ? 'bg-red-100 text-red-700' :
                  riskLevel === 'high' ? 'bg-orange-100 text-orange-700' :
                  riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}
              >
                <FaShieldAlt />
                AI Monitor ({riskLevel})
              </button>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#184042] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 7) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            {stepTitles.map((title, index) => (
              <span key={index} className={currentStep === index + 1 ? 'font-semibold text-[#184042]' : ''}>
                {title}
              </span>
            ))}
          </div>
        </div>

        {/* AI Monitoring Panel */}
        {showMonitoringPanel && (
          <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FaShieldAlt className="text-[#184042]" />
                AI Monitoring Results
              </h3>
              <button
                onClick={() => setShowMonitoringPanel(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimesCircle />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-2xl font-bold text-gray-800">{monitoringResults.length}</div>
                <div className="text-sm text-gray-600">Steps Monitored</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className={`text-2xl font-bold ${
                  riskLevel === 'critical' ? 'text-red-600' :
                  riskLevel === 'high' ? 'text-orange-600' :
                  riskLevel === 'medium' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {overallRiskScore.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Risk Score</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className={`text-2xl font-bold ${
                  riskLevel === 'critical' ? 'text-red-600' :
                  riskLevel === 'high' ? 'text-orange-600' :
                  riskLevel === 'medium' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {riskLevel.toUpperCase()}
                </div>
                <div className="text-sm text-gray-600">Risk Level</div>
              </div>
            </div>

            {monitoringResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">Step-by-Step Analysis:</h4>
                {monitoringResults.map((result, index) => (
                  <div key={index} className="border-l-4 border-gray-300 pl-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Step {result.step}: {stepTitles[result.step - 1]}</span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        result.risk_score > 0.5 ? 'bg-red-100 text-red-700' :
                        result.risk_score > 0.3 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        Risk: {result.risk_score.toFixed(2)}
                      </span>
                    </div>
                    {result.warnings.length > 0 && (
                      <div className="mt-1">
                        {result.warnings.map((warning, wIndex) => (
                          <div key={wIndex} className="text-sm text-red-600 flex items-center gap-1">
                            <FaExclamationTriangle className="text-xs" />
                            {warning}
                          </div>
                        ))}
                      </div>
                    )}
                    {result.recommendations.length > 0 && (
                      <div className="mt-1">
                        {result.recommendations.map((rec, rIndex) => (
                          <div key={rIndex} className="text-sm text-blue-600 flex items-center gap-1">
                            <FaCheckCircle className="text-xs" />
                            {rec}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step Content */}
        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-2 rounded ${
              currentStep === 1 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
          >
            <FaArrowLeft />
            Previous
          </button>
          
          <div className="flex gap-4">
            <button
              onClick={saveDraft}
              className="flex items-center gap-2 px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              <FaSave />
              Save Draft
            </button>
            
            {currentStep < 7 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2 bg-[#184042] text-white rounded hover:bg-[#123133]"
              >
                Next
                <FaArrowRight />
              </button>
            ) : (
              <button
                onClick={submitListing}
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-6 py-2 rounded ${
                  isSubmitting 
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Listing'}
              </button>
            )}
          </div>
        </div>

        {/* Search Results Modal */}
        {searchResults.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Search Results</h2>
                <button
                  onClick={() => setSearchResults([])}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimesCircle />
                </button>
              </div>
              <div className="space-y-4">
                {searchResults.map((product, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleProductSelect(product)}
                  >
                    <div className="flex gap-4">
                      <img src={product.image} alt={product.title} className="w-20 h-20 object-cover rounded" />
                      <div className="flex-1">
                        <h3 className="font-semibold">{product.title}</h3>
                        <p className="text-sm text-gray-600">Brand: {product.brand}</p>
                        <p className="text-sm text-gray-600">Category: {product.category}</p>
                        <p className="text-sm text-gray-600">Price: ${product.price}</p>
                        <p className="text-sm text-gray-600">Rating: {product.rating} ({product.reviews} reviews)</p>
                      </div>
                      <button className="px-4 py-2 bg-[#184042] text-white rounded hover:bg-[#123133]">
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductListing;