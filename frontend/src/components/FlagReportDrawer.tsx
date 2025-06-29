import React from 'react';
import { FaTimes, FaUserShield, FaCheckCircle, FaExclamationTriangle, FaUser, FaBoxOpen, FaClipboardList, FaRobot, FaImage, FaInfoCircle, FaUserCircle, FaTag, FaCalendarAlt, FaMapMarkerAlt, FaEnvelope, FaPhone, FaStar, FaFileAlt } from 'react-icons/fa';
import Image from 'next/image';

interface EvidenceItem {
  type: string;
  detail: string;
  image?: string;
}

interface Seller {
  name: string;
  rating: number;
  totalSales: number;
  accountAge: string;
}

interface Product {
  title: string;
  price: number;
  category: string;
  images?: string[];
  rating?: number;
  totalReviews?: number;
  marketAvg?: number;
}

interface Flag {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: string;
  flaggedOn: string;
  risk: string;
  category: string;
  evidence: EvidenceItem[];
  aiSummary: string;
  seller?: Seller;
  product?: Product;
  account?: {
    username: string;
    lastLogin: string;
    location: string;
  };
}

interface FlagReportDrawerProps {
  open: boolean;
  onClose: () => void;
  flag: Flag | null;
  operatorNote: string;
  setOperatorNote: (v: string) => void;
}

const severityColors = {
  Critical: 'bg-red-600 text-white',
  High: 'bg-orange-500 text-white',
  Medium: 'bg-yellow-400 text-black',
  Low: 'bg-green-400 text-black',
} as const;

const FlagReportDrawer: React.FC<FlagReportDrawerProps> = ({ open, onClose, flag, operatorNote, setOperatorNote }) => {
  if (!open || !flag) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose}></div>
      {/* Drawer */}
      <div className="relative bg-white shadow-2xl w-full max-w-xl h-full overflow-y-auto p-8 animate-slide-in-right">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl" onClick={onClose}><FaTimes /></button>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <FaUserShield className="text-green-600 text-2xl" />
          <div>
            <div className="text-xl font-bold text-slate-800">Flag Report</div>
            <div className="text-xs text-gray-500">Flag ID: {flag.id} | Severity: <span className={`px-2 py-1 rounded text-xs font-bold ${severityColors[flag.severity]}`}>{flag.severity}</span> | Status: {flag.status}</div>
          </div>
        </div>
        {/* Product/Review Details */}
        {flag.product && (
          <section className="mb-6 border-b pb-4">
            <div className="flex items-center gap-4 mb-2">
              <FaBoxOpen className="text-blue-500 text-xl" />
              <span className="font-semibold text-slate-700 text-lg">Product Details</span>
            </div>
            <div className="flex gap-4">
              {flag.product.images && flag.product.images.length > 0 && (
                <div className="flex gap-2">
                  {flag.product.images.map((img, idx) => (
                    <Image key={idx} src={img} alt="Product" className="w-20 h-20 object-contain rounded border" width={80} height={80} onError={e => (e.currentTarget.style.display = 'none')} />
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-1 text-sm">
                <div className="font-bold text-slate-800">{flag.product.title}</div>
                <div className="text-gray-600">Category: {flag.product.category}</div>
                <div className="text-gray-600">Price: ${flag.product.price}</div>
                {flag.product.rating && <div className="text-yellow-600 flex items-center gap-1">Rating: {flag.product.rating} <FaStar className="inline" /></div>}
                {flag.product.totalReviews && <div className="text-gray-500">Reviews: {flag.product.totalReviews}</div>}
                {flag.product.marketAvg && <div className="text-gray-500">Market Avg: ${flag.product.marketAvg}</div>}
              </div>
            </div>
          </section>
        )}
        {/* Seller/Account Details */}
        {(flag.seller || flag.account) && (
          <section className="mb-6 border-b pb-4">
            <div className="flex items-center gap-4 mb-2">
              <FaUser className="text-purple-500 text-xl" />
              <span className="font-semibold text-slate-700 text-lg">Seller/Account Details</span>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              {flag.seller && (
                <>
                  <div>Name: {flag.seller.name}</div>
                  <div>Rating: {flag.seller.rating}</div>
                  <div>Total Sales: {flag.seller.totalSales}</div>
                  <div>Account Age: {flag.seller.accountAge}</div>
                </>
              )}
              {flag.account && (
                <>
                  <div>Username: {flag.account.username}</div>
                  <div>Last Login: {flag.account.lastLogin}</div>
                  <div>Location: {flag.account.location}</div>
                </>
              )}
            </div>
          </section>
        )}
        {/* AI Monitoring Steps */}
        <section className="mb-6 border-b pb-4">
          <div className="flex items-center gap-4 mb-2">
            <FaRobot className="text-cyan-500 text-xl" />
            <span className="font-semibold text-slate-700 text-lg">AI Monitoring</span>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            {flag.evidence.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {item.type === 'Visual' && <FaImage className="text-blue-400" />}
                {item.type === 'Text' && <FaFileAlt className="text-green-500" />}
                {item.type === 'Pattern' && <FaClipboardList className="text-orange-400" />}
                {item.type === 'Timing' && <FaCalendarAlt className="text-pink-400" />}
                {item.type === 'Account' && <FaUserCircle className="text-purple-400" />}
                {item.type === 'Price' && <FaTag className="text-yellow-500" />}
                {item.type === 'Market' && <FaTag className="text-blue-500" />}
                {item.type === 'History' && <FaInfoCircle className="text-gray-500" />}
                {item.type === 'Login' && <FaUser className="text-cyan-500" />}
                {item.type === 'IP' && <FaMapMarkerAlt className="text-red-400" />}
                {item.type === 'Behavior' && <FaRobot className="text-cyan-700" />}
                {item.type === 'Content' && <FaFileAlt className="text-green-700" />}
                {item.type === 'Policy' && <FaClipboardList className="text-orange-700" />}
                {item.type === 'Report' && <FaExclamationTriangle className="text-red-500" />}
                {item.type === 'Payment' && <FaTag className="text-green-400" />}
                {item.type === 'AI' && <FaRobot className="text-cyan-400" />}
                <span className="font-medium">{item.type}:</span> {item.detail}
                {item.image && (
                  <Image src={item.image} alt="Evidence" className="ml-2 rounded-lg max-w-[80px] max-h-16 object-contain border" width={80} height={64} onError={e => (e.currentTarget.style.display = 'none')} />
                )}
              </div>
            ))}
          </div>
        </section>
        {/* Evidence Section */}
        <section className="mb-6 border-b pb-4">
          <div className="flex items-center gap-4 mb-2">
            <FaImage className="text-pink-500 text-xl" />
            <span className="font-semibold text-slate-700 text-lg">Evidence</span>
          </div>
          <ul className="flex flex-wrap gap-3">
            {flag.evidence.filter(e => e.image).map((item, idx) => (
              <li key={idx} className="">
                {item.image && (
                  <Image src={item.image} alt="Evidence" className="rounded-lg max-w-[120px] max-h-24 object-contain border" width={120} height={96} onError={e => (e.currentTarget.style.display = 'none')} />
                )}
                <div className="text-xs text-gray-500 mt-1">{item.type}</div>
              </li>
            ))}
            {flag.evidence.filter(e => !e.image).length === flag.evidence.length && (
              <li className="text-xs text-gray-400">No image evidence available.</li>
            )}
          </ul>
        </section>
        {/* Flag Reason & AI Summary */}
        <section className="mb-6 border-b pb-4">
          <div className="flex items-center gap-4 mb-2">
            <FaExclamationTriangle className="text-red-500 text-xl" />
            <span className="font-semibold text-slate-700 text-lg">Flag Reason & AI Summary</span>
          </div>
          <div className="text-sm text-gray-700 mb-2">{flag.aiSummary}</div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-gray-100 px-2 py-1 rounded">Risk: {flag.risk}</span>
            <span className="bg-gray-100 px-2 py-1 rounded">Category: {flag.category}</span>
            <span className="bg-gray-100 px-2 py-1 rounded">Flagged On: {flag.flaggedOn}</span>
          </div>
        </section>
        {/* Actions & Notes */}
        <section className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <FaClipboardList className="text-blue-500 text-xl" />
            <span className="font-semibold text-slate-700 text-lg">Actions & Operator Notes</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            <button className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700">Suspend</button>
            <button className="bg-yellow-400 text-black px-4 py-2 rounded font-semibold hover:bg-yellow-500">Warn</button>
            <button className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700">Dismiss</button>
          </div>
          <textarea className="w-full border rounded p-2 text-sm" rows={3} placeholder="Add your notes here..." value={operatorNote} onChange={e => setOperatorNote(e.target.value)} />
        </section>
      </div>
      <style jsx>{`
        .animate-slide-in-right {
          animation: slideInRight 0.3s cubic-bezier(0.4,0,0.2,1) both;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default FlagReportDrawer; 