import React, { useState, useEffect } from 'react';
import { 
  FaShieldAlt, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaUserShield, 
  FaClipboardList, 
  FaBars, 
  FaChartBar, 
  FaCog, 
  FaSignOutAlt, 
  FaUserCircle, 
  FaListAlt, 
  FaSearch, 
  FaFilter, 
  FaSort, 
  FaBell, 
  FaGlobe, 
  FaQuestionCircle, 
  FaTimes
} from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ReactMarkdown from 'react-markdown';

// Simple Donut Chart component since FlagSeverityDonutChart is not available
const FlagSeverityDonutChart = ({ data }: { data: Record<string, number> }) => {
  const total = Object.values(data).reduce((sum: number, count: number) => sum + count, 0);
  const colors: Record<string, string> = {
    Critical: '#dc2626',
    High: '#f97316',
    Medium: '#eab308',
    Low: '#16a34a'
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32 mb-4">
        <svg viewBox="0 0 42 42" className="w-full h-full">
          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e5e7eb" strokeWidth="3"/>
          {Object.entries(data).map(([severity, count], index) => {
            const percentage = (count as number / total) * 100;
            const offset = Object.entries(data).slice(0, index).reduce((sum, [, prevCount]) => sum + ((prevCount as number) / total) * 100, 0);
            return (
              <circle
                key={severity}
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke={colors[severity]}
                strokeWidth="3"
                strokeDasharray={`${percentage} ${100 - percentage}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 21 21)"
              />
            );
          })}
        </svg>
      </div>
      <div className="text-xs space-y-1">
        {Object.entries(data).map(([severity, count]) => (
          <div key={severity} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: colors[severity] }}></div>
            <span>{severity}: {count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface EvidenceItem {
  type: string;
  message?: string;
  detail?: string;
  image?: string;
  severity?: string;
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
  user_upload?: any;
  gemini_analysis?: string;
  ai_analysis?: string;
}

const severityColors: Record<string, string> = {
  Critical: 'bg-red-600 text-white',
  High: 'bg-orange-500 text-white',
  Medium: 'bg-yellow-400 text-black',
  Low: 'bg-green-400 text-black',
};

type Severity = keyof typeof severityColors;

const sidebarLinks = [
  { label: 'Dashboard', icon: 'FaChartBar', active: true },
  { label: 'Flag Queue', icon: 'FaListAlt', active: false },
  { label: 'Reports', icon: 'FaClipboardList', active: false },
  { label: 'Settings', icon: 'FaCog', active: false },
];

const getIconComponent = (iconName: string) => {
  const icons: Record<string, any> = {
    FaChartBar: FaChartBar,
    FaListAlt: FaListAlt,
    FaClipboardList: FaClipboardList,
    FaCog: FaCog,
  };
  return icons[iconName] || FaChartBar;
};

const FlagTrendsChart = ({ labels, data }: { labels: string[], data: { [severity: string]: number[] } }) => {
  const chartData = labels.map((label, index) => ({
    date: label,
    Critical: data.Critical[index],
    High: data.High[index],
    Medium: data.Medium[index],
    Low: data.Low[index],
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="Critical" stroke="#dc2626" strokeWidth={2} />
        <Line type="monotone" dataKey="High" stroke="#f97316" strokeWidth={2} />
        <Line type="monotone" dataKey="Medium" stroke="#eab308" strokeWidth={2} />
        <Line type="monotone" dataKey="Low" stroke="#16a34a" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
};

const getFlagTrendsData = (flags: Flag[]) => {
  const dates = Array.from(new Set(flags.map((f: Flag) => f.flaggedOn))).sort();
  const severities = ['Critical', 'High', 'Medium', 'Low'];
  const data: { [severity: string]: number[] } = {};
  severities.forEach(sev => {
    data[sev] = dates.map(date => flags.filter((f: Flag) => f.flaggedOn === date && f.severity === sev).length);
  });
  return { labels: dates as string[], data };
};

const getSeverityCounts = (flags: Flag[]) => {
  const counts: { [severity: string]: number } = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  flags.forEach((f: Flag) => { counts[f.severity] = (counts[f.severity] || 0) + 1; });
  return counts;
};

// Add a simple CSS spinner
const Spinner = () => (
  <div className="flex items-center justify-center py-8">
    <svg className="animate-spin h-6 w-6 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
    </svg>
    <span>Loading detailed report...</span>
  </div>
);

const AdminDashboard = () => {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loadingFlags, setLoadingFlags] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFlag, setSelectedFlag] = useState<Flag | null>(null);
  const [flagDetail, setFlagDetail] = useState<Flag | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [operatorNote, setOperatorNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchFlags = async () => {
      setLoadingFlags(true);
      setError(null);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/flags`);
        if (!res.ok) throw new Error('Failed to fetch flags');
        const data = await res.json();
        setFlags(data);
      } catch (err) {
        setError('Failed to load flags');
      } finally {
        setLoadingFlags(false);
      }
    };
    fetchFlags();
  }, []);

  const handleFlagClick = async (flag: Flag) => {
    setSelectedFlag(flag);
    setLoadingDetail(true);
    setShowModal(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/flags/${flag.id}`);
      if (!res.ok) {
        console.error('Failed to fetch flag details:', res.status, res.statusText);
        throw new Error(`Failed to fetch flag details: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      console.log('Flag detail data received:', data);
      setFlagDetail(data);
    } catch (err) {
      console.error('Error fetching flag details:', err);
      setFlagDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredFlags = flags.filter(f =>
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Hamburger for mobile */}
      <button className="md:hidden fixed top-2 left-2 z-40 bg-slate-800 text-yellow-400 p-2 rounded shadow-lg" onClick={()=>setSidebarOpen(true)}>
        <FaBars size={24} />
      </button>
      {/* Sidebar drawer for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-4/5 max-w-xs bg-slate-800 h-full flex flex-col justify-between py-6 px-4 animate-slide-in-right">
            <div>
              {/* ShopHub Admin Branding */}
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-secondary px-2 py-1 rounded text-white text-xl font-bold">S</span>
                <span className="text-xl font-bold text-primary">ShopHub Admin Dashboard</span>
              </div>
              <nav className="flex flex-col gap-2">
                {sidebarLinks.map((link, i) => {
                  const IconComponent = getIconComponent(link.icon);
                  return (
                    <button key={i} className={`flex items-center gap-3 px-3 py-2 rounded text-base font-medium transition-colors duration-150 ${link.active ? 'bg-slate-700 text-yellow-400' : 'text-white hover:bg-slate-700 hover:text-yellow-400'}`} onClick={()=>setSidebarOpen(false)}> <IconComponent /> {link.label} </button>
                  );
                })}
              </nav>
            </div>
            {/* User/Admin Profile */}
            <div className="flex flex-col gap-2 items-start mt-10">
              <div className="flex items-center gap-2">
                <FaUserCircle className="text-2xl text-yellow-400" />
                <span className="text-white font-semibold">Admin User</span>
              </div>
              <button className="flex items-center gap-2 text-sm text-gray-300 hover:text-yellow-400 mt-2">
                <FaSignOutAlt /> Logout
              </button>
            </div>
          </div>
          {/* Click outside to close */}
          <div className="flex-1" onClick={()=>setSidebarOpen(false)}></div>
        </div>
      )}
      {/* Sidebar for desktop */}
      <aside className="w-64 min-h-screen bg-slate-800 flex-col justify-between py-6 px-4 fixed left-0 top-0 z-30 hidden md:flex">
        <div>
          {/* ShopHub Admin Branding */}
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-secondary px-2 py-1 rounded text-white text-xl font-bold">S</span>
            <span className="text-xl font-bold text-primary">ShopHub Admin Dashboard</span>
          </div>
          <nav className="flex flex-col gap-2">
            {sidebarLinks.map((link, i) => {
              const IconComponent = getIconComponent(link.icon);
              return (
                <button key={i} className={`flex items-center gap-3 px-3 py-2 rounded text-base font-medium transition-colors duration-150 ${link.active ? 'bg-slate-700 text-yellow-400' : 'text-white hover:bg-slate-700 hover:text-yellow-400'}`}> <IconComponent /> {link.label} </button>
              );
            })}
          </nav>
        </div>
        {/* User/Admin Profile */}
        <div className="flex flex-col gap-2 items-start mt-10">
          <div className="flex items-center gap-2">
            <FaUserCircle className="text-2xl text-yellow-400" />
            <span className="text-white font-semibold">Admin User</span>
          </div>
          <button className="flex items-center gap-2 text-sm text-gray-300 hover:text-yellow-400 mt-2">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-2 md:p-8 overflow-x-auto">
        {/* Header and Banner */}
        <div className="flex flex-col gap-4 mb-4 md:mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-4">
            <div className="flex items-center gap-2 md:gap-4">
              <FaShieldAlt className="text-2xl md:text-3xl text-green-600" />
              <span className="text-lg md:text-2xl font-bold text-slate-800">Trust & Safety Operations Hub</span>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <FaBell className="text-xl text-gray-600" />
              <FaGlobe className="text-xl text-gray-600" />
              <FaQuestionCircle className="text-xl text-gray-600" />
            </div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-2 md:p-4 rounded flex items-center gap-2 md:gap-3">
            <span className="text-blue-900 font-semibold text-xs md:text-base">A unified dashboard that provides a complete overview of marketplace health and surfaces the most critical risks for human review.</span>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Left Column - Flag Queue */}
          <div className="lg:col-span-2">
            <section className="bg-white rounded-lg shadow p-2 md:p-6 border border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2 md:gap-0">
                <div className="text-base md:text-lg font-bold text-slate-700 flex items-center gap-2">
                  <FaExclamationTriangle className="text-orange-500" /> Flag Queue
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <input type="text" placeholder="Search flags..." className="pl-8 pr-4 py-2 border rounded-lg text-xs md:text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  </div>
                  <button className="p-2 border rounded-lg hover:bg-gray-50">
                    <FaFilter className="text-gray-600" />
                  </button>
                  <button className="p-2 border rounded-lg hover:bg-gray-50">
                    <FaSort className="text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto max-h-[320px] md:max-h-[520px] overflow-y-auto">
                <table className="w-full text-xs md:text-sm">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2">Flag ID</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th>Flagged On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFlags.map((flag) => (
                      <tr key={flag.id} className={`cursor-pointer hover:bg-blue-50 ${selectedFlag?.id === flag.id ? 'bg-blue-100' : ''}`} onClick={() => handleFlagClick(flag)}>
                        <td className="py-2 font-mono">{flag.id}</td>
                        <td>{flag.title}</td>
                        <td>{flag.category}</td>
                        <td><span className={`px-2 py-1 rounded text-xs font-bold ${severityColors[flag.severity as Severity]}`}>{flag.severity}</span></td>
                        <td>{flag.status}</td>
                        <td>{flag.flaggedOn}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
          {/* Right Column - Marketplace Insights */}
          <div className="lg:col-span-1">
            <section className="bg-white rounded-lg shadow p-2 md:p-6 border border-gray-200 flex flex-col gap-4 md:gap-6">
              <div className="text-base md:text-lg font-bold text-slate-700 mb-2 flex items-center gap-2">
                <FaChartBar className="text-blue-500" /> Marketplace Insights
              </div>
              {/* Donut Chart Section */}
              <div className="w-full flex justify-center mb-2 md:mb-4">
                <div className="w-40 md:w-64"><FlagSeverityDonutChart data={getSeverityCounts(flags)} /></div>
              </div>
              {/* Line Chart Section */}
              <div className="w-full h-32 md:h-56 bg-white rounded flex items-center justify-center mb-2 md:mb-4">
                <FlagTrendsChart {...getFlagTrendsData(flags)} />
              </div>
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2 md:gap-4">
                <div className="bg-blue-50 rounded p-2 md:p-3 flex flex-col items-center">
                  <span className="text-lg md:text-2xl font-bold text-blue-700">{flags.length}</span>
                  <span className="text-xs text-gray-600">Total Flags</span>
                </div>
                <div className="bg-green-50 rounded p-2 md:p-3 flex flex-col items-center">
                  <span className="text-lg md:text-2xl font-bold text-green-700">{flags.filter(f => f.status === 'Open').length}</span>
                  <span className="text-xs text-gray-600">Open Flags</span>
                </div>
                <div className="bg-yellow-50 rounded p-2 md:p-3 flex flex-col items-center">
                  <span className="text-lg md:text-2xl font-bold text-yellow-700">{flags.filter(f => f.severity === 'Critical').length}</span>
                  <span className="text-xs text-gray-600">Critical</span>
                </div>
                <div className="bg-orange-50 rounded p-2 md:p-3 flex flex-col items-center">
                  <span className="text-lg md:text-2xl font-bold text-orange-700">{flags.filter(f => f.category === 'Review').length}</span>
                  <span className="text-xs text-gray-600">Review Flags</span>
                </div>
              </div>
              {/* Recent Actions */}
              <div className="mt-4 md:mt-6">
                <div className="font-semibold text-slate-700 mb-2">Recent Admin Actions</div>
                <ul className="text-xs text-gray-600 list-disc ml-4">
                  <li>Suspended listing FLAG-001</li>
                  <li>Warned seller for FLAG-002</li>
                  <li>Dismissed review flag FLAG-008</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
        {/* Flag Details Modal */}
        {showModal && selectedFlag && (
          <>
            {/* Desktop: right-side drawer */}
            <div className="hidden md:fixed md:top-0 md:right-0 md:h-full md:w-[420px] md:bg-white md:z-50 md:shadow-2xl md:p-0 md:flex md:flex-col md:transition-transform md:duration-300">
              <div className="flex items-center justify-between px-6 py-5 border-b">
                <div className="flex items-center gap-2">
                  <FaUserShield className="text-green-600 text-2xl" />
                  <span className="text-2xl font-bold text-slate-800">Flag Details</span>
                </div>
                <button className="text-gray-400 hover:text-gray-700 text-3xl font-light" onClick={() => setShowModal(false)}>&times;</button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {/* Flag Summary */}
                <section>
                  <h3 className="text-lg font-semibold text-blue-900 mb-1 border-l-4 border-blue-400 pl-2">AI Flag Report</h3>
                  {loadingDetail ? (
                    <Spinner />
                  ) : (
                    <div className="prose max-w-none bg-gray-50 rounded p-3 overflow-y-auto" style={{maxHeight: 400}}>
                      {flagDetail?.ai_analysis ? (
                        <ReactMarkdown>
                          {flagDetail.ai_analysis}
                        </ReactMarkdown>
                      ) : flagDetail?.aiSummary ? (
                        <div className="text-sm">
                          <h4 className="font-bold text-gray-800 mb-2">Summary</h4>
                          <p className="text-gray-700">{flagDetail.aiSummary}</p>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">
                          No AI analysis available for this flag.
                        </div>
                      )}
                    </div>
                  )}
                </section>
                {/* Evidence */}
                <section>
                  <h3 className="text-lg font-semibold text-blue-900 mb-1 border-l-4 border-blue-400 pl-2">Evidence</h3>
                  <div className="space-y-3">
                    {flagDetail?.evidence && flagDetail.evidence.length > 0 ? (
                      flagDetail.evidence.map((item, index) => {
                        const evidenceText = item.message || item.detail || 'No details provided';
                        const evidenceType = item.type || 'Unknown';
                        
                        return (
                          <div key={index} className="bg-gray-50 rounded-lg p-3 border flex flex-col gap-2">
                            <div className="text-sm">
                              <span className="font-bold text-slate-700 capitalize">{evidenceType.replace(/_/g, ' ')}:</span> 
                              <span className="ml-2">{evidenceText}</span>
                            </div>
                            {item.image && (
                              <div className="relative w-full flex flex-col items-center">
                                <img 
                                  src={item.image} 
                                  alt="Evidence" 
                                  className="rounded-lg max-w-full max-h-32 object-contain border" 
                                  onError={e => (e.currentTarget.style.display = 'none')} 
                                />
                                {/* Image label if flagged */}
                                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-0.5 rounded shadow border border-white">
                                  {evidenceText.toLowerCase().includes('stock photo') ? 'Stock Photo Detected' : 
                                   evidenceText.toLowerCase().includes('ai-generated') ? 'AI-generated' : 
                                   evidenceText.toLowerCase().includes('fake') ? 'Fake Image' : 
                                   evidenceText.toLowerCase().includes('suspicious') ? 'Suspicious' : 
                                   evidenceText.toLowerCase().includes('counterfeit') ? 'Counterfeit' : 'Flagged'}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-3 border text-sm text-gray-500">
                        No evidence details available
                      </div>
                    )}
                  </div>
                </section>
                 {/* Product Information */}
                 {selectedFlag.product && (
                  <section>
                    <h3 className="text-lg font-semibold text-blue-900 mb-1 border-l-4 border-blue-400 pl-2">Product Information</h3>
                    <div className="bg-white rounded-lg border p-3 text-sm space-y-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="font-bold">Title:</span> {selectedFlag.product.title}</div>
                        <div><span className="font-bold">Price:</span> ${selectedFlag.product.price}</div>
                        <div><span className="font-bold">Category:</span> {selectedFlag.product.category}</div>
                        {/* Mock extra details */}
                        <div><span className="font-bold">ASIN:</span> B0CV5VCL8F</div>
                        <div><span className="font-bold">EAN:</span> 0609332571501</div>
                        <div><span className="font-bold">Sales Rank:</span> 1,803</div>
                      </div>
                      {/* Product Description */}
                      <div className="mt-2">
                        <span className="font-bold">Description:</span>
                        <span className="ml-1 text-gray-700">Premium quality, wireless, noise-cancelling headphones with long battery life. <span className="bg-yellow-200 text-yellow-900 px-1 rounded">Brand name misspelling detected</span>. <span className="bg-red-200 text-red-800 px-1 rounded">Stock photo anomaly</span>.</span>
                      </div>
                      {/* Product Images with anomaly labels if flagged */}
                      {selectedFlag.product.images && (
                        <div className="flex gap-2 mt-2 overflow-x-auto">
                          {selectedFlag.product.images.map((img, idx) => {
                            // Find evidence for this image
                            const evidence = selectedFlag.evidence.find(ev => ev.image === img);
                            let label = '';
                            if (evidence) {
                              const message = evidence.message || evidence.detail || '';
                              if (message.includes('stock photo')) label = 'Stock Photo Detected';
                              else if (message.includes('AI-generated')) label = 'AI-generated';
                              else if (message.includes('fake')) label = 'Fake Image';
                              else if (message.includes('suspicious')) label = 'Suspicious';
                            }
                            return (
                              <div key={idx} className="relative flex flex-col items-center">
                                <img src={img} alt={`Product ${idx + 1}`} className="rounded-lg max-h-24 object-contain border" onError={e => (e.currentTarget.style.display = 'none')} />
                                {label && <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-0.5 rounded shadow border border-white">{label}</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {/* Product Anomalies */}
                      <div className="mt-3">
                        <h4 className="text-sm font-bold text-red-700 mb-1">Product Anomalies</h4>
                        <ul className="list-disc ml-5 space-y-1">
                          {selectedFlag.evidence.filter(ev => ev.type === 'Visual' || ev.type === 'Text' || ev.type === 'Pattern' || ev.type === 'AI').map((ev, i) => (
                            <li key={i} className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-semibold inline-block mb-1">{ev.message || ev.detail || 'Anomaly detected'}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>
                )}
                {/* User Upload Information */}
                {flagDetail?.user_upload && (
                  <section>
                    <h3 className="text-lg font-semibold text-blue-900 mb-1 border-l-4 border-blue-400 pl-2">User Upload Information</h3>
                    <div className="bg-white rounded-lg border p-3 text-sm space-y-2 shadow-sm">
                      {Object.entries(flagDetail.user_upload).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-bold capitalize">{key.replace(/_/g, ' ')}:</span>
                          <span className="ml-2">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                
                {/* Seller Information */}
                {selectedFlag.seller && (
                  <section>
                    <h3 className="text-lg font-semibold text-blue-900 mb-1 border-l-4 border-blue-400 pl-2">Seller Information</h3>
                    <div className="bg-white rounded-lg border p-3 text-sm space-y-1 shadow-sm">
                      <div><span className="font-bold">Name:</span> {selectedFlag.seller.name}</div>
                      <div><span className="font-bold">Rating:</span> {selectedFlag.seller.rating}</div>
                      <div><span className="font-bold">Total Sales:</span> {selectedFlag.seller.totalSales}</div>
                      <div><span className="font-bold">Account Age:</span> {selectedFlag.seller.accountAge}</div>
                    </div>
                  </section>
                )}
               
                {/* Account Information */}
                {selectedFlag.account && (
                  <section>
                    <h3 className="text-lg font-semibold text-blue-900 mb-1 border-l-4 border-blue-400 pl-2">Account Information</h3>
                    <div className="bg-white rounded-lg border p-3 text-sm space-y-1 shadow-sm">
                      <div><span className="font-bold">Username:</span> {selectedFlag.account.username}</div>
                      <div><span className="font-bold">Last Login:</span> {selectedFlag.account.lastLogin}</div>
                      <div><span className="font-bold">Location:</span> {selectedFlag.account.location}</div>
                    </div>
                  </section>
                )}
                {/* Debug Information (only show in development) */}
                {process.env.NODE_ENV === 'development' && flagDetail && (
                  <section>
                    <h3 className="text-lg font-semibold text-blue-900 mb-1 border-l-4 border-blue-400 pl-2">Debug Info</h3>
                    <details className="bg-gray-50 rounded p-3 border">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700">Raw Flag Data</summary>
                      <pre className="text-xs mt-2 overflow-auto max-h-32 bg-white p-2 rounded border">
                        {JSON.stringify(flagDetail, null, 2)}
                      </pre>
                    </details>
                  </section>
                )}
                {/* Actions */}
                <section>
                  <h3 className="text-lg font-semibold text-blue-900 mb-1 border-l-4 border-blue-400 pl-2">Actions</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 shadow">Suspend</button>
                    <button className="bg-yellow-400 text-black px-4 py-2 rounded font-semibold hover:bg-yellow-500 shadow">Warn</button>
                    <button className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 shadow">Dismiss</button>
                  </div>
                </section>
                {/* Operator Notes */}
                <section>
                  <h3 className="text-lg font-semibold text-blue-900 mb-1 border-l-4 border-blue-400 pl-2">Operator Notes</h3>
                  <textarea className="w-full border rounded p-2 text-sm bg-gray-50" rows={3} placeholder="Add your notes here..." value={operatorNote} onChange={e => setOperatorNote(e.target.value)} />
                </section>
              </div>
            </div>
            {/* Mobile: full overlay */}
            <div className="fixed top-0 right-0 h-full w-full bg-white z-50 shadow-2xl p-0 flex flex-col transition-transform duration-300 md:hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-2">
                  <FaUserShield className="text-green-600 text-xl" />
                  <span className="text-lg font-bold text-slate-800">Flag Details</span>
                </div>
                <button className="text-gray-400 hover:text-gray-700 text-2xl font-light" onClick={() => setShowModal(false)}>&times;</button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
                {/* Flag Summary */}
                <section>
                  <h3 className="text-base font-semibold text-blue-900 mb-1 border-l-4 border-blue-400 pl-2">AI Flag Report</h3>
                  {loadingDetail ? (
                    <Spinner />
                  ) : (
                    <div className="prose max-w-none bg-gray-50 rounded p-3 overflow-y-auto" style={{maxHeight: 300}}>
                      {flagDetail?.ai_analysis ? (
                        <ReactMarkdown>
                          {flagDetail.ai_analysis}
                        </ReactMarkdown>
                      ) : flagDetail?.aiSummary ? (
                        <div className="text-sm">
                          <h4 className="font-bold text-gray-800 mb-2">Summary</h4>
                          <p className="text-gray-700">{flagDetail.aiSummary}</p>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">
                          No AI analysis available for this flag.
                        </div>
                      )}
                    </div>
                  )}
                </section>
                {/* Evidence */}
                <section>
                  <h3 className="text-lg font-semibold text-blue-900 mb-1 border-l-4 border-blue-400 pl-2">Evidence</h3>
                  <div className="space-y-3">
                    {flagDetail?.evidence && flagDetail.evidence.length > 0 ? (
                      flagDetail.evidence.map((item, index) => {
                        const evidenceText = item.message || item.detail || 'No details provided';
                        const evidenceType = item.type || 'Unknown';
                        
                        return (
                          <div key={index} className="bg-gray-50 rounded-lg p-3 border flex flex-col gap-2">
                            <div className="text-sm">
                              <span className="font-bold text-slate-700 capitalize">{evidenceType.replace(/_/g, ' ')}:</span> 
                              <span className="ml-2">{evidenceText}</span>
                            </div>
                            {item.image && (
                              <div className="relative w-full flex flex-col items-center">
                                <img 
                                  src={item.image} 
                                  alt="Evidence" 
                                  className="rounded-lg max-w-full max-h-32 object-contain border" 
                                  onError={e => (e.currentTarget.style.display = 'none')} 
                                />
                                {/* Image label if flagged */}
                                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-0.5 rounded shadow border border-white">
                                  {evidenceText.toLowerCase().includes('stock photo') ? 'Stock Photo Detected' : 
                                   evidenceText.toLowerCase().includes('ai-generated') ? 'AI-generated' : 
                                   evidenceText.toLowerCase().includes('fake') ? 'Fake Image' : 
                                   evidenceText.toLowerCase().includes('suspicious') ? 'Suspicious' : 
                                   evidenceText.toLowerCase().includes('counterfeit') ? 'Counterfeit' : 'Flagged'}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-3 border text-sm text-gray-500">
                        No evidence details available
                      </div>
                    )}
                  </div>
                </section>
                 {/* Product Information */}
                 {selectedFlag.product && (
                  <section>
                    <h3 className="text-lg font-semibold text-blue-900 mb-1 border-l-4 border-blue-400 pl-2">Product Information</h3>
                    <div className="bg-white rounded-lg border p-3 text-sm space-y-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="font-bold">Title:</span> {selectedFlag.product.title}</div>
                        <div><span className="font-bold">Price:</span> ${selectedFlag.product.price}</div>
                        <div><span className="font-bold">Category:</span> {selectedFlag.product.category}</div>
                        {/* Mock extra details */}
                        <div><span className="font-bold">ASIN:</span> B0CV5VCL8F</div>
                        <div><span className="font-bold">EAN:</span> 0609332571501</div>
                        <div><span className="font-bold">Sales Rank:</span> 1,803</div>
                      </div>
                      {/* Product Description */}
                      <div className="mt-2">
                        <span className="font-bold">Description:</span>
                        <span className="ml-1 text-gray-700">Premium quality, wireless, noise-cancelling headphones with long battery life. <span className="bg-yellow-200 text-yellow-900 px-1 rounded">Brand name misspelling detected</span>. <span className="bg-red-200 text-red-800 px-1 rounded">Stock photo anomaly</span>.</span>
                      </div>
                      {/* Product Images with anomaly labels if flagged */}
                      {selectedFlag.product.images && (
                        <div className="flex gap-2 mt-2 overflow-x-auto">
                          {selectedFlag.product.images.map((img, idx) => {
                            // Find evidence for this image
                            const evidence = selectedFlag.evidence.find(ev => ev.image === img);
                            let label = '';
                            if (evidence) {
                              const message = evidence.message || evidence.detail || '';
                              if (message.includes('stock photo')) label = 'Stock Photo Detected';
                              else if (message.includes('AI-generated')) label = 'AI-generated';
                              else if (message.includes('fake')) label = 'Fake Image';
                              else if (message.includes('suspicious')) label = 'Suspicious';
                            }
                            return (
                              <div key={idx} className="relative flex flex-col items-center">
                                <img src={img} alt={`Product ${idx + 1}`} className="rounded-lg max-h-24 object-contain border" onError={e => (e.currentTarget.style.display = 'none')} />
                                {label && <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-0.5 rounded shadow border border-white">{label}</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {/* Product Anomalies */}
                      <div className="mt-3">
                        <h4 className="text-sm font-bold text-red-700 mb-1">Product Anomalies</h4>
                        <ul className="list-disc ml-5 space-y-1">
                          {selectedFlag.evidence.filter(ev => ev.type === 'Visual' || ev.type === 'Text' || ev.type === 'Pattern' || ev.type === 'AI').map((ev, i) => (
                            <li key={i} className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-semibold inline-block mb-1">{ev.message || ev.detail || 'Anomaly detected'}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>
                )}
                {/* User Upload Information */}
                {flagDetail?.user_upload && (
                  <section>
                    <h3 className="text-lg font-semibold text-blue-900 mb-1 border-l-4 border-blue-400 pl-2">User Upload Information</h3>
                    <div className="bg-white rounded-lg border p-3 text-sm space-y-2 shadow-sm">
                      {Object.entries(flagDetail.user_upload).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-bold capitalize">{key.replace(/_/g, ' ')}:</span>
                          <span className="ml-2">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                {/* Seller Information */}
                {selectedFlag.seller && (
                  <section>
                    <h3 className="text-lg font-semibold text-blue-900 mb-1 border-l-4 border-blue-400 pl-2">Seller Information</h3>
                    <div className="bg-white rounded-lg border p-3 text-sm space-y-1 shadow-sm">
                      <div><span className="font-bold">Name:</span> {selectedFlag.seller.name}</div>
                      <div><span className="font-bold">Rating:</span> {selectedFlag.seller.rating}</div>
                      <div><span className="font-bold">Total Sales:</span> {selectedFlag.seller.totalSales}</div>
                      <div><span className="font-bold">Account Age:</span> {selectedFlag.seller.accountAge}</div>
                    </div>
                  </section>
                )}
               
                {/* Account Information */}
                {selectedFlag.account && (
                  <section>
                    <h3 className="text-lg font-semibold text-blue-900 mb-1 border-l-4 border-blue-400 pl-2">Account Information</h3>
                    <div className="bg-white rounded-lg border p-3 text-sm space-y-1 shadow-sm">
                      <div><span className="font-bold">Username:</span> {selectedFlag.account.username}</div>
                      <div><span className="font-bold">Last Login:</span> {selectedFlag.account.lastLogin}</div>
                      <div><span className="font-bold">Location:</span> {selectedFlag.account.location}</div>
                    </div>
                  </section>
                )}
                {/* Debug Information (only show in development) */}
                {process.env.NODE_ENV === 'development' && flagDetail && (
                  <section>
                    <h3 className="text-lg font-semibold text-blue-900 mb-1 border-l-4 border-blue-400 pl-2">Debug Info</h3>
                    <details className="bg-gray-50 rounded p-3 border">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700">Raw Flag Data</summary>
                      <pre className="text-xs mt-2 overflow-auto max-h-32 bg-white p-2 rounded border">
                        {JSON.stringify(flagDetail, null, 2)}
                      </pre>
                    </details>
                  </section>
                )}
                {/* Actions */}
                <section>
                  <h3 className="text-lg font-semibold text-blue-900 mb-1 border-l-4 border-blue-400 pl-2">Actions</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 shadow">Suspend</button>
                    <button className="bg-yellow-400 text-black px-4 py-2 rounded font-semibold hover:bg-yellow-500 shadow">Warn</button>
                    <button className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 shadow">Dismiss</button>
                  </div>
                </section>
                {/* Operator Notes */}
                <section>
                  <h3 className="text-lg font-semibold text-blue-900 mb-1 border-l-4 border-blue-400 pl-2">Operator Notes</h3>
                  <textarea className="w-full border rounded p-2 text-sm bg-gray-50" rows={3} placeholder="Add your notes here..." value={operatorNote} onChange={e => setOperatorNote(e.target.value)} />
                </section>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;