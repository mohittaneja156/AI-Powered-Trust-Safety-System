import React, { useState, ChangeEvent, useEffect } from 'react';
import { FaSearch, FaGlobe, FaEnvelope, FaQuestionCircle, FaTimesCircle, FaCheckCircle, FaExclamationTriangle, FaShieldAlt } from 'react-icons/fa';
import { FiMenu } from 'react-icons/fi';

// Define a type for the AI prediction result from your FastAPI
interface AIResult {
  visual_analysis_status: string; // 'clear' or 'warning'
  visual_analysis_message: string;
  text_analysis_status: string; // 'clear' or 'warning'
  text_analysis_message: string;
  summary: string;
  authenticity_score: number;
  predicted_label_text: string; // 'REAL' or 'FAKE'
}

// Define a type for listed products from the backend
interface ListedProduct {
  id: string;
  listing_data: {
    brandName: string;
    productTitle: string;
    productDescription: string;
    price: number;
    category: string;
    condition: string;
    mainImage: string;
  };
  monitoring_result: {
    overall_risk_score: number;
    risk_level: string;
    flags: Array<{
      type: string;
      severity: string;
      message: string;
    }>;
    ai_analysis: {
      ml_analysis: {
        authenticity_score: number;
        predicted_label: string;
        visual_analysis: string;
        text_analysis: string;
        similarity_check: string;
        summary: string;
        ml_model_used: boolean;
        error?: string;
      };
      text_analysis: {
        suspicious_keywords: string[];
        price_anomalies: boolean;
        description_quality: string;
        brand_consistency: boolean;
        risk_score: number;
        counterfeit_indicators: string[];
        ml_text_score: number;
        ml_analysis: string;
      };
      brand_authenticity_score: number;
    };
    recommendations: string[];
  };
  created_at: string;
  status: string;
}

// Define a type for your product structure including dynamic AI result
interface Product {
  title: string;
  upc: string;
  ean: string;
  salesRank: string;
  offers: string;
  status: string;
  showLimitation: boolean;
  limitation: string;
  asin: string;
  image: string;
  // This 'ai' property will now be derived from 'modalAIResult' in the modal
  // We'll keep it here for existing products that don't go through the AI check
  // but it will be overridden for newly checked products
  ai?: {
    visual: { type: string; status: string; message: string; }[];
    text: { type: string; status: string; message: string; }[];
    summary: string;
  };
}

const navLinks = [
  'Catalog',
  'Inventory',
  'Pricing',
  'Orders',
  'Advertising',
  'Reports',
  'Performance',
  'Growth'
];

const optionCards = [
  { label: 'Keywords', icon: '🔍' },
  { label: 'Product Image', icon: '📷' },
  { label: 'Barcode', icon: '📊' },
  { label: 'Product URL', icon: '🌐' }
];

// Placeholder data for search results
const categories = [
  'Electronics',
  'Clothing & Accessories',
  'Home & Garden',
  'Sports & Outdoors',
  'Beauty & Personal Care',
  'Health & Household',
  'Toys & Games',
  'Automotive',
  'Books',
  'Tools & Home Improvement'
];
const brands = [
  'Apple',
  'Samsung',
  'Nike',
  'Adidas',
  'Sony',
  'LG',
  'Canon',
  'Nikon',
  'Dell',
  'HP'
];

const ProductInfoModal = ({ open, onClose, product, aiResult, listedProduct }: { 
  open: boolean; 
  onClose: () => void; 
  product: Product | null; 
  aiResult: AIResult | null;
  listedProduct: ListedProduct | null;
}) => {
  if (!open || (!product && !listedProduct)) return null;

  // Determine status icon based on 'clear' or 'warning'
  const getStatusIcon = (status: string) => {
    return status === 'clear' ? <FaCheckCircle className="text-green-500" /> : <FaExclamationTriangle className="text-yellow-500" />;
  };

  // Use listed product data if available, otherwise use regular product
  const displayProduct = listedProduct ? {
    title: listedProduct.listing_data.productTitle,
    asin: listedProduct.id,
    ean: 'N/A',
    upc: 'N/A',
    salesRank: 'N/A',
    offers: 'N/A',
    status: listedProduct.status,
    showLimitation: false,
    limitation: '',
    image: listedProduct.listing_data.mainImage || 'https://via.placeholder.com/150',
  } : product!;

  // Determine if overall AI status is clear or warning for the summary
  const isAISummaryClear = listedProduct ? 
    listedProduct.monitoring_result.risk_level === 'low' :
    aiResult ? 
      (aiResult.visual_analysis_status === 'clear' && aiResult.text_analysis_status === 'clear') :
      (product?.ai && product.ai.summary && !product.ai.summary.includes('flagged'));

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      <div className="w-full max-w-lg h-full bg-white shadow-2xl p-8 overflow-y-auto relative animate-slide-in-right pointer-events-auto">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl" onClick={onClose}><FaTimesCircle /></button>
        <div className="mb-6">
          <div className="text-xl font-semibold text-primary mb-2 flex items-center gap-2">
            Product information
          </div>
          <div className="flex items-center gap-2 mb-4">
            <input className="border rounded px-3 py-2 w-full text-base" value={displayProduct.asin} readOnly />
            <button className="bg-primary text-white px-4 py-2 rounded flex items-center justify-center"><FaSearch /></button>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <img src={displayProduct.image} alt="product" className="w-20 h-20 object-contain rounded border" />
            <div>
              <a href="#" className="text-primary font-semibold hover:underline text-base">{displayProduct.title}</a>
              <div className="text-xs text-text_secondary mt-1"><b>Product ID:</b> {displayProduct.asin}</div>
              <div className="text-xs text-text_secondary"><b>European Article Number (EAN):</b> {displayProduct.ean}</div>
              <div className="text-xs text-text_secondary"><b>Sales Rank:</b> {displayProduct.salesRank}</div>
              <a href="#" className="text-xs text-primary underline">{displayProduct.offers} new and used offers</a>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1">Select a condition and sell</label>
            <select className="border rounded px-3 py-2 w-full mb-2">
              <option>New</option>
              <option>Used</option>
            </select>
            <div className="flex gap-2">
              <button className="flex-1 border border-primary text-primary px-4 py-2 rounded font-semibold">Copy listing</button>
              <button className="flex-1 bg-primary text-white px-4 py-2 rounded font-semibold">Apply to sell</button>
            </div>
          </div>
          {displayProduct.showLimitation && (
            <div className="bg-gray_light border-l-4 border-primary p-2 text-xs text-primary mt-2 rounded">
              {displayProduct.limitation}
            </div>
          )}
        </div>
        {/* AI Monitoring Panel */}
        <div className="mt-8 bg-gray_light border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-bold text-primary">AI Monitoring</span>
            {listedProduct ? (
              <span className={`ml-2 px-2 py-1 rounded text-xs flex items-center gap-1 ${
                listedProduct.monitoring_result.risk_level === 'low' ? 'bg-accent text-accent' : 
                listedProduct.monitoring_result.risk_level === 'medium' ? 'bg-secondary text-secondary' :
                listedProduct.monitoring_result.risk_level === 'high' ? 'bg-orange text-orange' :
                'bg-red text-red'
              }`}>
                <FaShieldAlt className="text-xs" />
                {listedProduct.monitoring_result.risk_level.toUpperCase()} Risk (Score: {listedProduct.monitoring_result.overall_risk_score.toFixed(2)})
              </span>
            ) : aiResult ? (
              <span className={`ml-2 px-2 py-1 rounded text-xs flex items-center gap-1 ${aiResult.predicted_label_text === 'REAL' ? 'bg-accent text-accent' : 'bg-red text-red'}`}>
                {getStatusIcon(aiResult.predicted_label_text === 'REAL' ? 'clear' : 'warning')}
                {aiResult.predicted_label_text === 'REAL' ? 'Authentic' : 'Counterfeit'} (Score: {aiResult.authenticity_score.toFixed(4)})
              </span>
            ) : (
              product?.ai ? (
                <span className="ml-2 px-2 py-1 rounded bg-accent text-accent text-xs flex items-center gap-1"><FaCheckCircle className="mr-1" />Active</span>
              ) : (
                <span className="ml-2 px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs flex items-center gap-1">Not Analyzed</span>
              )
            )}
          </div>
          
          {listedProduct ? (
            // Show monitoring results for listed products
            <div className="space-y-4">
              <div>
                <div className="font-semibold text-primary mb-1">Text Analysis</div>
                <ul className="ml-4 list-disc text-sm">
                  <li className="flex items-center gap-2 mb-1">
                    {getStatusIcon(listedProduct.monitoring_result?.ai_analysis?.text_analysis?.brand_consistency ? 'clear' : 'warning')}
                    <span className="font-medium">Brand Consistency:</span> 
                    <span>{listedProduct.monitoring_result?.ai_analysis?.text_analysis?.brand_consistency ? 'Passed' : 'Failed'}</span>
                  </li>
                  <li className="flex items-center gap-2 mb-1">
                    {getStatusIcon((listedProduct.monitoring_result?.ai_analysis?.text_analysis?.suspicious_keywords?.length || 0) === 0 ? 'clear' : 'warning')}
                    <span className="font-medium">Suspicious Keywords:</span> 
                    <span>{(listedProduct.monitoring_result?.ai_analysis?.text_analysis?.suspicious_keywords?.length || 0) === 0 ? 'None detected' : listedProduct.monitoring_result?.ai_analysis?.text_analysis?.suspicious_keywords?.join(', ') || 'Unknown'}</span>
                  </li>
                  <li className="flex items-center gap-2 mb-1">
                    {getStatusIcon(!listedProduct.monitoring_result?.ai_analysis?.text_analysis?.price_anomalies ? 'clear' : 'warning')}
                    <span className="font-medium">Price Analysis:</span> 
                    <span>{listedProduct.monitoring_result?.ai_analysis?.text_analysis?.price_anomalies ? 'Anomalies detected' : 'Normal pricing'}</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <div className="font-semibold text-primary mb-1">Image Analysis</div>
                <ul className="ml-4 list-disc text-sm">
                  <li className="flex items-center gap-2 mb-1">
                    {getStatusIcon(listedProduct.monitoring_result?.ai_analysis?.ml_analysis?.ml_model_used ? 'clear' : 'warning')}
                    <span className="font-medium">ML Model Status:</span> 
                    <span>{listedProduct.monitoring_result?.ai_analysis?.ml_analysis?.ml_model_used ? 'Model used successfully' : 'Model not available'}</span>
                  </li>
                  <li className="flex items-center gap-2 mb-1">
                    {getStatusIcon((listedProduct.monitoring_result?.ai_analysis?.ml_analysis?.predicted_label || '').toLowerCase() === 'genuine' ? 'clear' : 'warning')}
                    <span className="font-medium">Prediction:</span> 
                    <span className="font-bold">{listedProduct.monitoring_result?.ai_analysis?.ml_analysis?.predicted_label || 'Unknown'}</span>
                  </li>
                  <li className="flex items-center gap-2 mb-1">
                    <span className="font-medium">Confidence Score:</span> 
                    <span>{((listedProduct.monitoring_result?.ai_analysis?.ml_analysis?.authenticity_score || 0) * 100).toFixed(1)}%</span>
                  </li>
                  {listedProduct.monitoring_result?.ai_analysis?.ml_analysis?.error && (
                    <li className="flex items-center gap-2 mb-1">
                      <FaExclamationTriangle className="text-yellow-500" />
                      <span className="font-medium">Error:</span> 
                      <span>{listedProduct.monitoring_result.ai_analysis.ml_analysis.error}</span>
                    </li>
                  )}
                </ul>
              </div>
              
              {(listedProduct.monitoring_result?.flags?.length || 0) > 0 && (
                <div>
                  <div className="font-semibold text-primary mb-1">Flags</div>
                  <ul className="ml-4 list-disc text-sm">
                    {listedProduct.monitoring_result.flags.map((flag, index) => (
                      <li key={index} className="flex items-start gap-2 mb-1">
                        <FaExclamationTriangle className="text-yellow-500 mt-1" />
                        <div>
                          <span className="font-medium capitalize">{flag.type.replace(/_/g, ' ')}:</span>
                          <span className="ml-2">{flag.message}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="mt-2 text-sm text-primary font-semibold flex items-center gap-2">
                {getStatusIcon(isAISummaryClear ? 'clear' : 'warning')}
                Risk Level: {listedProduct.monitoring_result?.risk_level?.toUpperCase() || 'UNKNOWN'} - {listedProduct.monitoring_result?.recommendations?.length > 0 ? listedProduct.monitoring_result.recommendations[0] : 'No issues detected'}
              </div>
            </div>
          ) : (
            // Show original AI analysis for non-listed products
            <div>
              <div className="mb-2">
                <div className="font-semibold text-primary mb-1">Visual Analysis</div>
                <ul className="ml-4 list-disc text-sm">
                  {aiResult ? (
                    <li className="flex items-center gap-2 mb-1">
                      {getStatusIcon(aiResult.visual_analysis_status)}
                      <span className="font-medium">Overall Visual Check:</span> <span>{aiResult.visual_analysis_message}</span>
                    </li>
                  ) : (product?.ai && product.ai.visual) ? (
                    product.ai.visual.map((v: any, i: number) => (
                      <li key={i} className="flex items-center gap-2 mb-1">
                        {getStatusIcon(v.status)}
                        <span className="font-medium">{v.type}:</span> <span>{v.message}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500">No visual analysis data available.</li>
                  )}
                </ul>
              </div>
              <div className="mb-2">
                <div className="font-semibold text-primary mb-1">Text & Language Analysis</div>
                <ul className="ml-4 list-disc text-sm">
                  {aiResult ? (
                    <li className="flex items-center gap-2 mb-1">
                      {getStatusIcon(aiResult.text_analysis_status)}
                      <span className="font-medium">Overall Text Check:</span> <span>{aiResult.text_analysis_message}</span>
                    </li>
                  ) : (product?.ai && product.ai.text) ? (
                    product.ai.text.map((t: any, i: number) => (
                      <li key={i} className="flex items-center gap-2 mb-1">
                        {getStatusIcon(t.status)}
                        <span className="font-medium">{t.type}:</span> <span>{t.message}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500">No text analysis data available.</li>
                  )}
                </ul>
              </div>
              <div className="mt-2 text-sm text-primary font-semibold flex items-center gap-2">
                {aiResult ? (
                  getStatusIcon(isAISummaryClear ? 'clear' : 'warning')
                ) : (product?.ai && product.ai.summary) ? (
                  getStatusIcon(product.ai.summary.includes('flagged') ? 'warning' : 'clear')
                ) : null}
                {aiResult ? aiResult.summary : (product?.ai ? product.ai.summary : 'No summary available.')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProductIdentity = () => {
  const [selected, setSelected] = useState(0); // Keywords selected by default
  const [url, setUrl] = useState('https://www.mybrandsiteexample.com/products/mouse-pad-gel-wrist-rest');
  const [search, setSearch] = useState('e.l.f. skin hydrated ever after skincare mini kit'); // For Keywords tab
  const [brandName, setBrandName] = useState(''); // For Image Upload tab
  const [tagline, setTagline] = useState('');     // For Image Upload tab
  const [productImage, setProductImage] = useState<File | null>(null); // For Image Upload tab
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null); // For Image Upload tab

  const [showLimitationIdx, setShowLimitationIdx] = useState<number|null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [modalAIResult, setModalAIResult] = useState<AIResult | null>(null); // State for AI result
  const [modalListedProduct, setModalListedProduct] = useState<ListedProduct | null>(null); // State for listed product

  // Backend API URLs
  const API_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/predict_authenticity/`;
  const LISTING_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

  // State for listed products
  const [listedProducts, setListedProducts] = useState<ListedProduct[]>([]);
  const [searchResults, setSearchResults] = useState<ListedProduct[]>([]);

  // Fetch listed products on component mount
  useEffect(() => {
    fetchListedProducts();
  }, []);

  const fetchListedProducts = async () => {
    try {
      const response = await fetch(`${LISTING_API_URL}/products/search`);
      if (response.ok) {
        const data = await response.json();
        setListedProducts(data.products || []);
      } else {
        console.error('Failed to fetch listed products:', response.status);
        setListedProducts([]);
      }
    } catch (error) {
      console.error('Error fetching listed products:', error);
      setListedProducts([]);
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProductImage(file);
      setProductImagePreview(URL.createObjectURL(file)); // Create a preview URL
    } else {
      setProductImage(null);
      setProductImagePreview(null);
    }
  };

  // Handle search submit for Keywords tab (search listed products)
  const handleKeywordSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${LISTING_API_URL}/products/search?keyword=${encodeURIComponent(search)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.products || []);
      } else {
        console.error('Search failed:', response.status);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    }
  };

  // Handle submit for Product Image tab (new AI integration)
  const handleImageUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productImage || !brandName || !tagline) {
      alert('Please upload an image and fill in brand name and tagline.');
      return;
    }

    const formData = new FormData();
    formData.append('image', productImage);
    formData.append('brand_name', brandName);
    formData.append('tagline', tagline);

    try {
      // Create product data for the modal
      const dummyProduct: Product = {
        title: `Authenticity Check for ${brandName}`,
        asin: 'N/A',
        ean: 'N/A',
        upc: 'N/A',
        salesRank: 'N/A',
        offers: 'N/A',
        status: 'N/A',
        showLimitation: false,
        limitation: '',
        image: productImagePreview || 'https://via.placeholder.com/150',
        ai: undefined,
      };

      setModalProduct(dummyProduct);
      setModalAIResult(null);
      setModalListedProduct(null);
      setModalOpen(true);

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Something went wrong with the prediction.');
      }

      const result: AIResult = await response.json();
      setModalAIResult(result);
      console.log('AI Prediction Result:', result);

    } catch (error) {
      console.error('Error during AI prediction:', error);
      alert(`Prediction failed: ${error instanceof Error ? error.message : String(error)}`);
      setModalOpen(false);
      setModalAIResult(null);
      setModalProduct(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray_light flex flex-col">
      <ProductInfoModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        product={modalProduct} 
        aiResult={modalAIResult}
        listedProduct={modalListedProduct}
      />
      {/* Header */}
      <header className="bg-primary text-white w-full shadow z-20">
        <div className="flex flex-col md:flex-row items-center px-2 md:px-6 py-2 gap-2 md:gap-4">
          <FiMenu className="text-2xl mr-2" />
          {/* Logo */}
          <span className="font-bold text-lg flex items-center gap-1">
            <div className="bg-white px-2 py-1 rounded text-primary text-xl font-bold">S</div>
            <span className="ml-1 text-base font-normal text-white">ShopHub Seller Portal</span>
          </span>
          {/* Search bar */}
          <div className="flex-1 flex items-center mx-0 md:mx-8 max-w-full md:max-w-xl mt-2 md:mt-0">
            <input className="w-full px-4 py-2 rounded-l bg-white text-black text-sm focus:outline-none" placeholder="Search" value={''} readOnly />
            <button className="bg-primary_dark px-4 py-2 rounded-r flex items-center justify-center">
              <FaSearch />
            </button>
          </div>
          {/* Nav links */}
          <nav className="flex gap-2 md:gap-6 text-xs md:text-sm font-medium mt-2 md:mt-0 overflow-x-auto w-full md:w-auto">
            {navLinks.map((link, i) => (
              <span key={i} className="hover:underline cursor-pointer whitespace-nowrap">{link}</span>
            ))}
          </nav>
          {/* Right icons */}
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
      <main className="flex-1 flex flex-col w-full max-w-full md:max-w-[1400px] mx-auto pt-4 md:pt-8 pb-8 md:pb-12 px-2 md:px-4">
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-start justify-start">
          {/* Illustration */}
          <div className="flex flex-col items-center justify-start pt-2 min-w-0 md:min-w-[260px] max-w-full md:max-w-[320px] w-full md:w-auto">
            <div className="w-40 h-40 md:w-64 md:h-64 bg-secondary/20 rounded-2xl flex items-center justify-center relative shadow-lg">
              {/* Product box illustration placeholder */}
              <div className="absolute left-4 md:left-8 top-4 md:top-8 w-24 h-24 md:w-40 md:h-40 bg-secondary/30 rounded-lg border-4 border-secondary flex items-center justify-center">
                <span className="text-4xl md:text-7xl text-primary font-bold">📦</span>
              </div>
              {/* Decorative stars */}
              <div className="absolute left-2 md:left-4 top-2 md:top-4 text-secondary text-lg md:text-2xl">★</div>
              <div className="absolute right-3 md:right-6 top-3 md:top-6 text-secondary text-base md:text-lg">★</div>
              <div className="absolute left-8 md:left-16 bottom-3 md:bottom-6 text-secondary text-base md:text-xl">★</div>
              <div className="absolute right-5 md:right-10 bottom-5 md:bottom-10 text-secondary text-base md:text-lg">★</div>
            </div>
          </div>
          {/* Main Card */}
          <section className="flex-1 flex flex-col items-start w-full">
            <h1 className="text-2xl md:text-4xl font-light text-primary mb-2 mt-4">List Your Products <span className="text-base text-primary align-top ml-2 cursor-pointer">Learn more</span></h1>
            <p className="text-base md:text-lg text-text_secondary mb-8">Select an option to start listing your product</p>
            {/* Option Cards - single row */}
            <div className="flex gap-2 md:gap-4 mb-8 w-full overflow-x-auto">
              {optionCards.map((card, i) => (
                <button
                  key={card.label}
                  className={`flex flex-col items-center justify-center w-32 md:w-44 h-20 md:h-24 rounded border transition-all duration-200 shadow-sm text-primary bg-white text-xs md:text-base font-medium gap-2 ${selected === i ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary hover:bg-gray_light'}`}
                  onClick={() => setSelected(i)}
                >
                  {card.icon}
                  {card.label}
                </button>
              ))}
            </div>
            {/* Card Content based on selected option */}
            {selected === 0 && (
              <div className="w-full max-w-full md:max-w-2xl bg-white border border-primary rounded-lg shadow p-4 md:p-6 mb-6">
                <div className="font-medium text-primary mb-2">Find your product in our catalog using a few words.</div>
                <form className="flex flex-col gap-4" onSubmit={handleKeywordSearchSubmit}>
                  <input type="text" className="w-full border border-gray-300 rounded px-4 py-2 text-base focus:border-primary focus:outline-none" value={search} onChange={e => setSearch(e.target.value)} placeholder="Enter product title, description and keywords" />
                  <div className="flex justify-end">
                    <button type="submit" className="bg-primary text-white px-8 py-2 rounded-lg font-semibold hover:bg-primary_dark transition-colors duration-200 w-full md:w-auto">Submit</button>
                  </div>
                </form>
              </div>
            )}
            {selected === 1 && (
              <div className="w-full max-w-full md:max-w-2xl bg-white border border-primary rounded-lg shadow p-4 md:p-6 mb-6">
                <div className="font-medium text-primary mb-2">Upload a product image to check authenticity and potentially create a listing.</div>
                <form className="flex flex-col gap-4" onSubmit={handleImageUploadSubmit}>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="productImage" className="block text-sm font-semibold text-text_primary">Product Image:</label>
                    <input type="file" id="productImage" accept="image/*" className="w-full border border-gray-300 rounded px-4 py-2 text-base focus:border-primary focus:outline-none" onChange={handleImageChange} />
                    {productImagePreview && (
                      <div className="mt-2">
                        <img src={productImagePreview} alt="Image Preview" className="max-w-full max-h-48 object-contain border rounded" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="brandName" className="block text-sm font-semibold text-text_primary">Brand Name:</label>
                    <input type="text" id="brandName" className="w-full border border-gray-300 rounded px-4 py-2 text-base focus:border-primary focus:outline-none" value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g., Nutella" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="tagline" className="block text-sm font-semibold text-text_primary">Tagline (optional):</label>
                    <input type="text" id="tagline" className="w-full border border-gray-300 rounded px-4 py-2 text-base focus:border-primary focus:outline-none" value={tagline} onChange={e => setTagline(e.target.value)} placeholder="e.g., Original" />
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" className="bg-primary text-white px-8 py-2 rounded-lg font-semibold hover:bg-primary_dark transition-colors duration-200 w-full md:w-auto">Analyze & Submit</button>
                  </div>
                </form>
              </div>
            )}
            {selected === 3 && (
              <div className="w-full max-w-full md:max-w-2xl bg-white border border-primary rounded-lg shadow p-4 md:p-6 mb-6">
                <div className="font-medium text-primary mb-2">Generate a listing based on your existing product web page.</div>
                <form className="flex flex-col gap-4">
                  <input type="text" className="w-full border border-gray-300 rounded px-4 py-2 text-base focus:border-primary focus:outline-none" value={url} onChange={e => setUrl(e.target.value)} />
                  <div className="flex justify-end">
                    <button type="submit" className="bg-primary text-white px-8 py-2 rounded-lg font-semibold hover:bg-primary_dark transition-colors duration-200 w-full md:w-auto">Submit</button>
                  </div>
                </form>
                <div className="mt-4 bg-gray_light border border-gray-200 rounded p-4 text-xs text-text_secondary">
                  <span className="font-bold mr-1">ⓘ</span>
                  By creating this listing, you represent and warrant that you are the owner of or have a license or other agreement to use any content that will become part of the listing, including rights to any trademarks, copyrights, trade dress, design patents, and/or any other legal rights implicated by use of the content. You also represent and warrant that you have the legal right to instruct ShopHub to obtain this information and create a listing on your behalf. Failure to accurately represent your authority to use this content could result in action taken against your seller account and/or could subject you to legal ramifications. The URL must be publicly accessible and not be protected by credentials.
                </div>
              </div>
            )}
            {/* Complete your listings info box */}
            <div className="w-full max-w-full md:max-w-2xl bg-primary/5 border border-primary/20 rounded p-4 flex items-center gap-2 md:gap-4 mt-2">
              <span className="text-xl md:text-2xl text-primary">📋</span>
              <div className="flex flex-col">
                <span className="font-semibold text-primary">Complete your listings</span>
                <span className="text-xs md:text-sm text-text_secondary">You have unfinished listings in drafts. <span className="text-primary underline cursor-pointer">View my drafts</span></span>
              </div>
            </div>
          </section>
        </div>
        {/* Search Results Section (below main card) */}
        {selected === 0 && (
          <section className="mt-8 md:mt-12 w-full flex flex-col md:flex-row gap-4 md:gap-8 items-start">
            {/* Sidebar Filters */}
            <aside className="w-full md:w-64 bg-transparent">
              <div className="mb-4 md:mb-8">
                <div className="font-semibold text-primary mb-2">Narrow by category</div>
                <ul className="text-xs md:text-sm text-text_secondary space-y-1">
                  {categories.map((cat, i) => (
                    <li key={i} className="cursor-pointer hover:underline">{cat}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-semibold text-primary mb-2">Narrow By Brand</div>
                <ul className="text-xs md:text-sm text-text_secondary space-y-1">
                  {brands.map((brand, i) => (
                    <li key={i} className="cursor-pointer hover:underline">{brand}</li>
                  ))}
                </ul>
              </div>
            </aside>
            {/* Product Results Table/List */}
            <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow p-4 md:p-6 overflow-x-auto">
              <div className="mb-4">
                <div className="font-semibold text-base md:text-lg text-primary mb-1">Keyword search results</div>
                <form className="flex flex-col md:flex-row gap-2 mb-2" onSubmit={handleKeywordSearchSubmit}>
                  <input type="text" className="flex-1 border border-gray-300 rounded px-4 py-2 text-base focus:border-primary focus:outline-none" value={search} onChange={e => setSearch(e.target.value)} />
                  <button type="submit" className="bg-primary text-white px-6 py-2 rounded font-semibold hover:bg-primary_dark transition-colors duration-200 w-full md:w-auto">Submit</button>
                </form>
                <span className="text-xs text-text_secondary">Can&apos;t find your product in our catalog? <span className="text-primary underline cursor-pointer">Create a new listing</span></span>
              </div>
              {/* Results List */}
              <div className="divide-y divide-gray-200">
                {searchResults.length > 0 ? (
                  searchResults.map((product, idx) => (
                    <div key={idx} className="py-4 md:py-6 flex flex-col gap-2">
                      <div className="flex flex-col md:flex-row md:items-start md:gap-4">
                        <img src={product.listing_data.mainImage || 'https://via.placeholder.com/150'} alt={product.listing_data.productTitle} className="w-24 h-24 object-contain rounded border self-center md:self-start" />
                        <div className="flex-1 mt-2 md:mt-0">
                          <a href="#" className="text-primary font-semibold hover:underline text-base">{product.listing_data.productTitle}</a>
                          <div className="text-xs text-text_secondary mt-1">Brand: {product.listing_data.brandName}</div>
                          <div className="text-xs text-text_secondary mt-1">Category: {product.listing_data.category}</div>
                          <div className="text-xs text-text_secondary mt-1">Price: ${product.listing_data.price}</div>
                          <div className="text-xs text-text_secondary mt-1">Condition: {product.listing_data.condition}</div>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded mt-2 ${
                            (product.monitoring_result?.risk_level || 'unknown') === 'low' ? 'bg-accent/10 text-accent' :
                            (product.monitoring_result?.risk_level || 'unknown') === 'medium' ? 'bg-secondary/10 text-secondary' :
                            (product.monitoring_result?.risk_level || 'unknown') === 'high' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            <FaShieldAlt className="text-xs" />
                            AI Monitoring ({(product.monitoring_result?.risk_level || 'UNKNOWN').toUpperCase()})
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-2 min-w-0 md:min-w-[180px] mt-2 md:mt-0 w-full md:w-auto self-center md:self-end">
                          <span className={`text-xs px-2 py-1 rounded ${
                            product.status === 'active' ? 'bg-accent/10 text-accent' :
                            product.status === 'flagged' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {product.status.toUpperCase()}
                          </span>
                          <button 
                            className="text-xs text-primary underline mt-2" 
                            onClick={() => { 
                              setModalListedProduct(product); 
                              setModalProduct(null);
                              setModalAIResult(null);
                              setModalOpen(true); 
                            }}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-text_secondary">
                    <p>No products found. Try a different search term or create a new listing.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default ProductIdentity;
