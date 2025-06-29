import { FaCheckCircle, FaExclamationTriangle, FaUserShield, FaUserAltSlash, FaShieldAlt } from "react-icons/fa";
import Image from "next/image";

type AIStatus = "genuine" | "suspicious" | "fake";

const reviews: Array<{
  author: string;
  verified: boolean;
  aiStatus: AIStatus;
  trustScore: number;
  title: string;
  date: string;
  text: string;
  images: string[];
  aiNotes: string;
}> = [
  {
    author: "clarence",
    verified: true,
    aiStatus: "genuine",
    trustScore: 95,
    title: "Amazing quality, works as described!",
    date: "2024-05-01",
    text: "I bought this product last month and it exceeded my expectations. The packaging was authentic and the product matches the description perfectly.",
    images: [
      "https://m.media-amazon.com/images/I/81QpkIctqPL._AC_SX679_.jpg"
    ],
    aiNotes: "No suspicious patterns detected. Verified purchase.",
  },
  {
    author: "daniel",
    verified: false,
    aiStatus: "suspicious",
    trustScore: 62,
    title: "Not what I expected",
    date: "2024-04-20",
    text: "The product I received looks different from the images. Also, the logo seems off. I haven't bought this exact model before.",
    images: [
      "https://m.media-amazon.com/images/I/71QKQ9mwV7L._AC_SX679_.jpg"
    ],
    aiNotes: "AI detected image mismatch and review text mentions logo issues. No purchase record found.",
  },
  {
    author: "emma",
    verified: true,
    aiStatus: "genuine",
    trustScore: 89,
    title: "Good value for money",
    date: "2024-04-15",
    text: "Solid product, fast delivery. Would recommend to others.",
    images: [],
    aiNotes: "Verified purchase. No issues detected.",
  },
  {
    author: "alex",
    verified: false,
    aiStatus: "fake",
    trustScore: 28,
    title: "Best Gucci ever!",
    date: "2024-04-10",
    text: "This Guchi bag is amazing. Looks just like the real thing. First copy but you can't tell the difference.",
    images: [
      "https://m.media-amazon.com/images/I/81Zt42ioCgL._AC_SX679_.jpg"
    ],
    aiNotes: "Brand name misspelling detected. Keywords indicate possible counterfeit. No purchase record.",
  }
];

const statusMap: Record<AIStatus, { color: string; icon: JSX.Element; label: string }> = {
  genuine: {
    color: "green-500",
    icon: <FaCheckCircle className="text-green-500" />,
    label: "AI Verified"
  },
  suspicious: {
    color: "yellow-500",
    icon: <FaExclamationTriangle className="text-yellow-500" />,
    label: "Suspicious"
  },
  fake: {
    color: "red-500",
    icon: <FaUserAltSlash className="text-red-500" />,
    label: "Counterfeit Alert"
  }
};

export default function AIReviewSection() {
  return (
    <div className="w-full max-w-[1200px] mx-auto bg-white rounded-lg shadow p-10 mt-12 mb-12">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Customer Reviews</h2>
        <div className="flex gap-2">
          <button className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded font-semibold flex items-center gap-2">
            <FaShieldAlt /> Trusted Reviews Only
          </button>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded font-semibold">
            Sort by Trust
          </button>
        </div>
      </div>
      <div className="space-y-8">
        {reviews.map((review, idx) => (
          <div key={idx} className={`p-6 rounded-lg border shadow-sm relative bg-gray-50`}>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-bold text-lg">{review.author}</span>
              {review.verified && (
                <span className="flex items-center gap-1 text-green-600 text-xs font-semibold bg-green-100 px-2 py-1 rounded">
                  <FaUserShield /> Verified Buyer
                </span>
              )}
              <span className={`flex items-center gap-1 text-xs font-semibold bg-${statusMap[review.aiStatus].color} bg-opacity-10 px-2 py-1 rounded`}>
                {statusMap[review.aiStatus].icon} {statusMap[review.aiStatus].label}
              </span>
              <span className="ml-auto text-xs text-gray-500">{review.date}</span>
            </div>
            <div className="mb-1 font-semibold">{review.title}</div>
            <div className="mb-2 text-gray-700">{review.text}</div>
            {review.images.length > 0 && (
              <div className="flex gap-2 mb-2">
                {review.images.map((img, i) => (
                  <div key={i} className={`w-20 h-20 rounded border-2 ${review.aiStatus === 'fake' ? 'border-red-500' : 'border-gray-200'} overflow-hidden relative`}>
                    <Image src={img} alt="review" width={80} height={80} className="object-cover" />
                    {review.aiStatus === 'fake' && (
                      <div className="absolute top-0 left-0 w-full h-full bg-red-500 bg-opacity-30 flex items-center justify-center">
                        <FaExclamationTriangle className="text-white text-2xl" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <div className="w-40 h-3 bg-gray-200 rounded">
                <div
                  className={`h-3 rounded ${review.trustScore > 80 ? 'bg-green-500' : review.trustScore > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${review.trustScore}%` }}
                />
              </div>
              <span className="text-xs font-semibold">{review.trustScore}/100 Trust Score</span>
            </div>
            <div className="mt-2 text-xs text-gray-600 italic flex items-center gap-2">
              {review.aiStatus !== 'genuine' && <FaExclamationTriangle className="text-yellow-500" />}
              {review.aiNotes}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 