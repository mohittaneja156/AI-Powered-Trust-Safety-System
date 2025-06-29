import React, { useState } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaCamera } from 'react-icons/fa';
import Image from 'next/image';

const randomResult = () => (Math.random() > 0.5 ? 'authentic' : 'counterfeit');

const ProductVerify = () => {
  const [scanResult, setScanResult] = useState<null | 'authentic' | 'counterfeit'>(null);
  const [scanning, setScanning] = useState(false);
  const [scanLine, setScanLine] = useState(false);

  const handleScan = () => {
    setScanning(true);
    setScanResult(null);
    setScanLine(true);
    setTimeout(() => {
      setScanResult(randomResult());
      setScanning(false);
      setScanLine(false);
    }, 1800);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 py-10">
      <div className="max-w-md w-full mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Product Authenticity Scanner</h1>
        <p className="text-gray-600 text-sm mb-4">
          Instantly verify your product&apos;s authenticity after delivery. Scan the barcode, QR code, or packaging to check if your item is genuine.
        </p>
      </div>
      {/* Phone Mockup */}
      <div className="relative w-[340px] h-[650px] bg-white rounded-[2.5rem] shadow-2xl border-4 border-gray-200 flex flex-col items-center overflow-hidden">
        {/* Top bar */}
        <div className="w-full h-14 bg-gray-900 flex items-center px-4 justify-between">
          <span className="text-white font-bold text-lg tracking-wide">ShopHub <span className="font-normal">Seller</span></span>
          <FaCamera className="text-white text-xl" />
        </div>
        {/* Back arrow and title */}
        <div className="w-full flex items-center px-4 py-2 bg-gray-100 border-b border-gray-200">
          <span className="text-xl text-gray-500 mr-2">&#8592;</span>
          <span className="text-gray-700 font-semibold">Verify a product</span>
        </div>
        {/* Camera view */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 relative w-full">
          {/* Simulated camera view with barcode and scan line */}
          <div className="w-56 h-56 bg-white rounded-2xl shadow flex flex-col items-center justify-center border-2 border-dashed border-gray-400 mt-8 mb-4 relative overflow-hidden">
            <Image
              src="https://www.harborfreight.com/media/catalog/product/cache/95ddc68b3b409c753b895e31eaf85ef8/5/7/57576_W3.jpg"
              alt="Scanned Product"
              width={144}
              height={144}
              className="w-36 h-36 object-contain rounded mb-2 z-10"
            />
            {/* Animated scan line */}
            <div className="absolute left-0 w-full h-full pointer-events-none">
              <div className={`absolute left-0 w-full h-1 bg-blue-400/80 rounded-full shadow-lg transition-all duration-700 ${scanLine ? 'animate-scanline' : 'opacity-0'}`}></div>
            </div>
            {/* Barcode area */}
            <div className="w-32 h-8 bg-gray-100 rounded flex items-center justify-center border border-gray-300 mt-2 relative z-10">
              <div className="w-24 h-4 bg-gradient-to-r from-gray-700 to-gray-400 rounded barcode"></div>
            </div>
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-500 z-20">Align barcode or QR code within frame</span>
          </div>
          <button
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow disabled:opacity-60 w-56 text-lg"
            onClick={handleScan}
            disabled={scanning}
          >
            {scanning ? 'Scanning...' : 'Scan Product'}
          </button>
          {/* Result */}
          {scanResult && !scanning && (
            <div className={`mt-6 px-4 py-3 rounded-lg flex items-center gap-3 text-lg font-semibold shadow ${scanResult === 'authentic' ? 'bg-green-50 text-green-700 border border-green-400' : 'bg-red-50 text-red-700 border border-red-400'}`}>
              {scanResult === 'authentic' ? (
                <FaCheckCircle className="text-green-500 text-2xl" />
              ) : (
                <FaExclamationTriangle className="text-red-500 text-2xl" />
              )}
              {scanResult === 'authentic'
                ? '✅ Product appears authentic'
                : '\u2757 Suspected counterfeit. Please start a return.'}
            </div>
          )}
        </div>
      </div>
      {/* Scan line animation keyframes */}
      <style jsx>{`
        @keyframes scanline {
          0% { top: 20px; opacity: 0.7; }
          50% { top: 180px; opacity: 1; }
          100% { top: 20px; opacity: 0.7; }
        }
        .animate-scanline {
          animation: scanline 1.2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ProductVerify; 