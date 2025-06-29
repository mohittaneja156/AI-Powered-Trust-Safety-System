import React from 'react';
import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

const mockOrders = [
  {
    id: '204-6984100-8009958',
    placed: '20 December 2022',
    total: '£10.99',
    dispatchTo: 'Jon Gilbert',
    delivered: 'Today',
    status: 'Delivered',
    archived: true,
    product: {
      title: 'Folding Step Stool - 9 Inches Height, Premium Quality Plastic Foldable Stool - Non-Slip, Portable Folding Stool with Carrying Handle for Kitchen, Bath',
      image: 'https://www.harborfreight.com/media/catalog/product/cache/95ddc68b3b409c753b895e31eaf85ef8/5/7/57576_W3.jpg',
      link: '#',
      returnClosed: '7 June 2025',
    },
  },
  {
    id: '204-6984100-8009959',
    placed: '15 January 2023',
    total: '£24.99',
    dispatchTo: 'Jon Gilbert',
    delivered: '18 January',
    status: 'Delivered',
    archived: false,
    product: {
      title: 'Heavy Duty Step Stool - 12 Inches, Industrial Grade, Anti-Slip Feet, Easy Storage',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQk0mdPhZLseRXJiZjCZ1w3XC9MvXpanUC0ew&s',
      link: '#',
      returnClosed: '15 February 2023',
    },
  },
  {
    id: '204-6984100-8009960',
    placed: '10 February 2023',
    total: '£79.99',
    dispatchTo: 'Jon Gilbert',
    delivered: '13 February',
    status: 'Delivered',
    archived: false,
    product: {
      title: 'Premium Handcrafted Leather Wallet - Genuine Italian Full-Grain Leather with RFID Protection',
      image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=2787&auto=format&fit=crop',
      link: '#',
      returnClosed: '10 March 2023',
    },
  },
];

const buyAgain = [
  {
    title: 'Utopia Bedding Flat Sheet - Easy...',
    price: '£9.99',
    image: 'https://m.media-amazon.com/images/I/81Q1A4l3QwL._AC_SL1500_.jpg',
    link: '#',
    promo: 'Buy 4, save 5%'
  }
];

const tabs = [
  'Orders',
  'Buy Again',
  'Not Yet Dispatched',
  'Local Store Orders',
  'Digital Orders',
  'Cancelled Orders',
];

// Simple Webcam Component using getUserMedia
const SimpleWebcam = ({ onCapture, isActive }: { onCapture: (img: string) => void; isActive: boolean }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  React.useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        (videoRef.current as HTMLVideoElement).srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
  };

  const captureImage = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    const video = videoRef.current! as HTMLVideoElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');
    onCapture!(imageData);
  };

  return (
    <div className="flex flex-col items-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="rounded-lg border w-full max-w-xs h-48 object-cover"
      />
      <button
        onClick={captureImage}
        className="mt-2 px-4 py-2 bg-primary hover:bg-primary_dark text-white font-semibold rounded-lg shadow w-full transition-colors duration-200"
      >
        Capture & Verify
      </button>
    </div>
  );
};

// Helper to convert base64 dataURL to File
function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) {
    throw new Error('Invalid data URL format');
  }
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

const YourOrders = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [scanResult, setScanResult] = useState<null | 'authentic' | 'counterfeit' | 'error'>(null);
  const [scanning, setScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [verificationDetails, setVerificationDetails] = useState<any>(null);
  const [verificationMethod, setVerificationMethod] = useState<'camera' | 'upload'>('camera');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVerifyClick = (order: any) => {
    setSelectedOrder(order);
    setShowModal(true);
    setScanResult(null);
    setCapturedImage(null);
    setScanning(false);
  };

  const handleCapture = (imageData: string) => {
    setCapturedImage(imageData);
    setScanning(true);
    setScanResult(null);
    setVerificationDetails(null);

    if (!selectedOrder?.id) {
      setScanResult('error');
      setScanning(false);
      return;
    }

    // Convert base64 to File
    const file = dataURLtoFile(imageData, 'scan.jpg');
    verifyImage(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
        setScanning(true);
        setScanResult(null);
        setVerificationDetails(null);
        verifyImage(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const verifyImage = async (file: File) => {
    const formData = new FormData();
    formData.append('order_id', selectedOrder?.id);
    formData.append('image', file);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/verify`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setScanResult(data.result);
      setVerificationDetails(data.verification_details);
    } catch (error) {
      setScanResult('error');
    } finally {
      setScanning(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
    setScanResult(null);
    setCapturedImage(null);
    setScanning(false);
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="text-xs text-text_secondary px-2 md:px-4 pt-6 pb-2">
        <span className="text-primary cursor-pointer">Your Account</span> {'>'} <span>Your Orders</span>
      </div>
      
      {/* Title */}
      <div className="px-2 md:px-4 text-xl md:text-3xl font-semibold text-text_primary mb-2">Your Orders</div>
      
      {/* Tabs */}
      <div className="px-2 md:px-4 border-b border-gray-200 flex flex-row gap-2 md:gap-6 mb-4 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab} className={`py-2 px-2 text-xs md:text-sm font-medium border-b-2 ${tab === 'Orders' ? 'border-secondary text-secondary' : 'border-transparent text-text_secondary hover:text-secondary'}`}>
            {tab}
          </button>
        ))}
      </div>
      
      {/* Filter and Search */}
      <div className="px-2 md:px-4 flex flex-wrap gap-2 md:gap-4 items-center mb-4">
        <div className="flex items-center gap-2 text-xs md:text-sm">
          <span className="font-semibold text-text_primary">{mockOrders.length} orders</span> placed in
          <button className="border border-gray-200 rounded px-2 py-1 bg-gray_light ml-1 text-text_secondary">past three months</button>
        </div>
        <div className="flex-1 flex justify-end min-w-[120px] md:min-w-[180px]">
          <input type="text" placeholder="Search all orders" className="border border-gray-200 rounded-l px-2 md:px-3 py-2 text-xs md:text-sm w-24 md:w-64" />
          <button className="bg-primary text-white px-2 md:px-4 py-2 rounded-r text-xs md:text-sm hover:bg-primary_dark transition-colors duration-200">Search Orders</button>
        </div>
      </div>
      
      {/* Archived Banner */}
      {mockOrders[0].archived && (
        <div className="px-2 md:px-4 mb-4">
          <div className="bg-accent/10 border border-accent text-accent px-2 md:px-4 py-3 rounded flex items-center gap-2">
            <span className="text-xl">✔️</span>
            <div>
              <div className="font-semibold">Your order has been archived.</div>
              <div className="text-xs md:text-sm">Even though it will no longer appear in Your Orders, you can still view it in <span className="text-primary underline cursor-pointer">Archived Orders</span> from Your Account.</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex flex-col lg:flex-row px-2 md:px-4 gap-4 md:gap-6">
        {/* Orders List */}
        <div className="flex-1 space-y-4 md:space-y-6">
          {mockOrders.map(order => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 md:p-6 flex flex-col gap-2 md:gap-4">
              <div className="flex flex-wrap justify-between items-center border-b border-gray-200 pb-2 mb-2 md:mb-4 text-xs md:text-sm text-text_secondary gap-2">
                <div className="flex gap-2 md:gap-8 flex-wrap">
                  <div><span className="font-semibold text-text_primary">ORDER PLACED</span><br />{order.placed}</div>
                  <div><span className="font-semibold text-text_primary">TOTAL</span><br />{order.total}</div>
                  <div><span className="font-semibold text-text_primary">DISPATCH TO</span><br /><span className="text-primary cursor-pointer">{order.dispatchTo}</span></div>
                </div>
                <div className="flex flex-col items-end gap-1 min-w-[80px] md:min-w-[120px]">
                  <div><span className="font-semibold text-text_primary">ORDER #</span> {order.id}</div>
                  <div className="flex gap-2 mt-1">
                    <button className="text-primary underline text-xs">View order details</button>
                    <button className="text-primary underline text-xs">Invoice</button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col md:flex-row flex-wrap gap-2 md:gap-4 items-center">
                <div className="flex flex-col items-center">
                  <Image src={order.product.image} alt="Product" className="w-16 h-16 md:w-20 md:h-20 rounded-lg border border-gray-200 object-cover" width={80} height={80} />
                </div>
                <div className="flex-1 min-w-[120px] md:min-w-[160px]">
                  <div className="text-xs md:text-sm font-semibold text-accent mb-1">Delivered {order.delivered}</div>
                  <div className="text-xs text-text_secondary mb-1">Parcel was handed to resident.</div>
                  <div className="text-xs md:text-sm text-primary hover:underline cursor-pointer mb-1">{order.product.title}</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button className="bg-secondary hover:bg-secondary_dark text-white text-xs font-semibold px-3 py-1 rounded-lg transition-colors duration-200">Buy it again</button>
                    <button className="bg-gray_light border border-gray-200 text-text_primary text-xs font-semibold px-3 py-1 rounded-lg">View your item</button>
                    <button className="bg-primary hover:bg-primary_dark text-white text-xs font-semibold px-3 py-1 rounded-lg transition-colors duration-200 ml-0 md:ml-2" onClick={() => handleVerifyClick(order)}>Verify Product</button>
                  </div>
                  <div className="text-xs text-text_secondary mt-2">Return window closed on {order.product.returnClosed}</div>
                </div>
                <div className="flex flex-col gap-2 min-w-[80px] md:min-w-[120px] md:min-w-[180px]">
                  <button className="bg-gray_light border border-gray-200 text-text_primary text-xs font-semibold px-3 py-1 rounded-lg">Get help</button>
                  <button className="bg-gray_light border border-gray-200 text-text_primary text-xs font-semibold px-3 py-1 rounded-lg">Leave seller feedback</button>
                  <button className="bg-gray_light border border-gray-200 text-text_primary text-xs font-semibold px-3 py-1 rounded-lg">Write a product review</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Buy it again sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0 mt-4 lg:mt-0">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 md:p-4">
            <div className="font-semibold mb-2 text-text_primary">Buy it again</div>
            {buyAgain.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-center mb-3">
                <Image src="https://m.media-amazon.com/images/I/612etDiWsJL.jpg" alt="Buy Again" className="w-10 h-10 md:w-12 md:h-12 rounded-lg border border-gray-200 object-cover" width={48} height={48} />
                <div className="flex-1">
                  <div className="text-xs font-semibold text-text_primary mb-1">{item.title}</div>
                  <div className="text-xs text-text_secondary mb-1">{item.price}</div>
                  {item.promo && <div className="text-xs text-accent bg-accent/10 rounded px-1 inline-block mb-1">{item.promo}</div>}
                  <button className="bg-secondary hover:bg-secondary_dark text-white text-xs font-semibold px-2 py-1 rounded-lg mt-1 transition-colors duration-200">Add to Basket</button>
                </div>
              </div>
            ))}
            <div className="text-xs text-primary underline cursor-pointer">See all</div>
          </div>
        </div>
      </div>
      
      {/* Modal for Product Verification */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-lg p-2 md:p-4 w-full max-w-xs md:max-w-md mx-2 flex flex-col items-center relative">
            <button className="absolute top-2 right-3 text-2xl text-text_secondary hover:text-text_primary" onClick={handleCloseModal}>&times;</button>
            <h2 className="text-lg font-bold text-text_primary mb-2">Verify Product</h2>
            <p className="text-xs text-text_secondary mb-2 text-center">Scan the barcode, QR code, or packaging of your product to check if it matches your order.</p>
            
            {!capturedImage ? (
              <div className="w-full flex flex-col items-center">
                <div className="flex gap-4 mb-4">
                  <button
                    className={`px-4 py-2 rounded-lg transition-colors duration-200 ${verificationMethod === 'camera' ? 'bg-primary text-white' : 'bg-gray_light text-text_secondary'}`}
                    onClick={() => setVerificationMethod('camera')}
                  >
                    Use Camera
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg transition-colors duration-200 ${verificationMethod === 'upload' ? 'bg-primary text-white' : 'bg-gray_light text-text_secondary'}`}
                    onClick={() => setVerificationMethod('upload')}
                  >
                    Upload Image
                  </button>
                </div>
                
                {verificationMethod === 'camera' ? (
                  <SimpleWebcam onCapture={handleCapture} isActive={showModal && !capturedImage} />
                ) : (
                  <div className="w-full flex flex-col items-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-primary hover:bg-primary_dark text-white font-semibold rounded-lg shadow w-full transition-colors duration-200"
                    >
                      Choose Image
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full flex flex-col items-center">
                <Image src={capturedImage} alt="Captured" className="rounded-lg border border-gray-200 w-full max-w-xs h-48 object-cover mb-2" width={300} height={200} />
                {scanning && <div className="text-primary font-semibold mt-2">Verifying...</div>}
                {scanResult && !scanning && (
                  <div className="w-full">
                    <div className={`mt-4 px-4 py-3 rounded-lg flex flex-col items-center gap-2 text-lg font-semibold shadow ${scanResult === 'authentic' ? 'bg-accent/10 text-accent border border-accent' : scanResult === 'counterfeit' ? 'bg-red-50 text-red-700 border border-red-400' : 'bg-gray_light text-text_secondary border border-gray-300'}`}>
                      {scanResult === 'authentic' && '✅ Product appears authentic'}
                      {scanResult === 'counterfeit' && '❗ Suspected counterfeit. Please start a return.'}
                      {scanResult === 'error' && '❗ Error verifying product. Please try again.'}
                    </div>
                    
                    {verificationDetails && (
                      <div className="mt-4 p-4 bg-gray_light rounded-lg max-h-72 overflow-y-auto">
                        <h3 className="font-semibold mb-2 text-text_primary">Verification Details:</h3>
                        <div className="text-sm space-y-2 text-text_secondary">
                          <p>Order ID: {verificationDetails.order_id}</p>
                          <p>Timestamp: {verificationDetails.timestamp}</p>
                          <p>Barcode Found: {verificationDetails.barcode_found ? 'Yes' : 'No'}</p>
                          {verificationDetails.barcode_found && (
                            <p>Barcode Match: {verificationDetails.barcode_match ? 'Yes' : 'No'}</p>
                          )}
                          {/* Only show product analysis if barcode is not found */}
                          {!verificationDetails.barcode_found && (
                            <>
                              <div className="mt-3">
                                <p className="font-semibold mb-1 text-text_primary">Authentication Scores:</p>
                                <ul className="list-disc pl-4">
                                  <li>Visual Similarity: {verificationDetails.visual_similarity !== undefined ? (verificationDetails.visual_similarity * 100).toFixed(1) + '%' : 'N/A'}</li>
                                  <li>Texture Match: {verificationDetails.texture_score !== undefined ? (verificationDetails.texture_score * 100).toFixed(1) + '%' : 'N/A'}</li>
                                  <li>Color Accuracy: {verificationDetails.color_match !== undefined ? (verificationDetails.color_match * 100).toFixed(1) + '%' : 'N/A'}</li>
                                  <li>Logo Detection: {verificationDetails.logo_detection ? 'Passed' : 'Failed'}</li>
                                </ul>
                              </div>
                              <div className="mt-3">
                                <p className="font-semibold mb-1 text-text_primary">Material Analysis:</p>
                                <ul className="list-disc pl-4">
                                  <li>Leather Grain Pattern: {verificationDetails.grain_pattern_match ? 'Authentic' : 'Suspicious'}</li>
                                  <li>Material Quality: {verificationDetails.material_quality}</li>
                                  <li>Stitching Pattern: {verificationDetails.stitching_quality}</li>
                                </ul>
                              </div>
                              <div className="mt-3">
                                <p className="font-semibold mb-1 text-text_primary">Security Features:</p>
                                <ul className="list-disc pl-4">
                                  {verificationDetails.security_features?.map((feature: string, index: number) => (
                                    <li key={index}>{feature}</li>
                                  ))}
                                </ul>
                              </div>
                            </>
                          )}
                          <div className="mt-3">
                            <p className="font-semibold mb-1 text-text_primary">Verification Steps:</p>
                            <ul className="list-disc pl-4">
                              {verificationDetails.verification_steps?.map((step: any, index: number) => (
                                <li key={index} className={`${step.status === 'success' ? 'text-accent' : step.status === 'warning' ? 'text-secondary' : 'text-red-600'}`}>
                                  {step.step}: {step.details}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button className="px-4 py-2 bg-gray_light hover:bg-gray-200 rounded-lg transition-colors duration-200" onClick={handleCloseModal}>Close</button>
                  <button className="px-4 py-2 bg-primary hover:bg-primary_dark text-white rounded-lg transition-colors duration-200" onClick={() => {
                    setCapturedImage(null);
                    setScanResult(null);
                    setVerificationDetails(null);
                  }}>Try Again</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default YourOrders; 