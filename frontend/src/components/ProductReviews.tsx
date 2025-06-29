import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaUserShield, FaUserAltSlash, FaCertificate, FaInfoCircle, FaTimesCircle } from "react-icons/fa";

// First, update the Review interface to include imageScore
export interface Review {
  author: string;
  rating: number;
  title: string;
  date: string;
  text: string;
  images: string[];
  verified?: boolean;
  aiStatus?: 'genuine' | 'suspicious' | 'fake';
  trustScore?: number;
  aiNotes?: string;
  reviewerHistory?: string;
  aiRecommendation?: string;
  imageScore?: number;
}

interface ReviewStats {
  accountAge: number;
  reviewCount: number;
  helpfulVotes: number;
  verified: boolean;
  reviewLength: number;
  sentiment: string;
  yearly: number[];
}

interface DonutData {
  label: string;
  value: number;
  color: string;
}

const ratingStats = [
  { label: '5 star', percent: 86 },
  { label: '4 star', percent: 10 },
  { label: '3 star', percent: 3 },
  { label: '2 star', percent: 0 },
  { label: '1 star', percent: 1 },
];

const statusMap = {
  genuine: {
    color: "green-500",
    icon: <FaCheckCircle className="text-green-500" />, label: "AI Verified"
  },
  suspicious: {
    color: "yellow-500",
    icon: <FaExclamationTriangle className="text-yellow-500" />, label: "Suspicious"
  },
  fake: {
    color: "red-500",
    icon: <FaUserAltSlash className="text-red-500" />, label: "Counterfeit Alert"
  }
};

const reviewStats: ReviewStats = {
  accountAge: 3,
  reviewCount: 15,
  helpfulVotes: 42,
  verified: true,
  reviewLength: 450,
  sentiment: 'Positive',
  yearly: [2, 5, 4, 4]
};

const donutData: DonutData[] = [
  { label: '5★', value: 8, color: '#22c55e' },
  { label: '4★', value: 4, color: '#3b82f6' },
  { label: '3★', value: 2, color: '#eab308' },
  { label: '1-2★', value: 1, color: '#ef4444' }
];

// Calculate donut chart angles
const donutAngles = donutData.reduce((acc: { start: number; end: number; color: string }[], curr, i) => {
  const total = donutData.reduce((sum, d) => sum + d.value, 0);
  const lastAngle = acc[i - 1]?.end || 0;
  const angle = (curr.value / total) * 360;
  return [...acc, { start: lastAngle, end: lastAngle + angle, color: curr.color }];
}, []);

// Add this type for API response
interface ReviewAnalysis {
  trust_score: number;
  text_score: number;
  image_score: number;
  trust_badge: string;
  fake_probability: number;
  recommendation: string;
  image_analysis: {
    manipulation_detected: boolean;
    similarity_score: number;
  };
}

export default function ProductReviews({ reviews, productTrustScore = 92, productImageUrl = '' }: { reviews: Review[], productTrustScore?: number, productImageUrl?: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzedReviews, setAnalyzedReviews] = useState<Review[]>([]);
  const [insightIdx, setInsightIdx] = useState<number|null>(null);

  useEffect(() => {
    const fetchAndAnalyzeReviews = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const analyzedResults = await Promise.all(
          reviews.map(async (review) => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/analyze/review`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                review_text: review.text,
                product_image_url: productImageUrl,
                review_image_url: review.images?.[0] || '',
                reviewer_history: review.reviewerHistory || ''
              })
            });

            if (!response.ok) {
              throw new Error(`API error: ${response.status}`);
            }

            const analysis: ReviewAnalysis = await response.json();
            // Add this before returning the analyzed results
            console.log('API Response:', analysis);
            console.log('Image Score:', analysis.image_score);

            return {
              ...review,
              imageScore: analysis.image_score, // Convert to camelCase here
              trustScore: analysis.trust_score,
              text_score: analysis.text_score,
              aiStatus: analysis.fake_probability > 0.7 ? 'fake' :
                       analysis.fake_probability > 0.3 ? 'suspicious' : 'genuine',
              aiRecommendation: analysis.recommendation,
              aiNotes: analysis.detailed_analysis || '',
              imageAnalysis: analysis.image_analysis
            };
          })
        );

        setAnalyzedReviews(analyzedResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to analyze reviews');
        console.error('Error analyzing reviews:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (reviews.length > 0 && productImageUrl) {
      fetchAndAnalyzeReviews();
    }
  }, [reviews, productImageUrl]);

  // Add suspicious review patterns
  const SUSPICIOUS_PATTERNS = [
    'bit.ly', 'discount', 'cheap', 'link', 'offer',
    'best price', 'amazing deal', 'click here',
    'limited time', 'huge discount'
  ];

  // Update the review analysis function
  const analyzeReview = async (review: Review, productImageUrl: string) => {
    // Check if review image matches product image (exact string match)
    const imageMatches = review.images?.length > 0 && 
      review.images[0].trim() === productImageUrl.trim();

    // Update image score calculation
    const imageScore = imageMatches ? 100 : 20;

    // Calculate trust score based on various factors
    const trustScore = {
      base: review.verified ? 70 : 30,
      textPenalty: hasSuspiciousText ? -30 : 0,
      imagePenalty: !imageMatches ? -20 : 0
    };

    const totalScore = Math.max(0, Math.min(100, 
      trustScore.base + trustScore.textPenalty + trustScore.imagePenalty
    ));

    return {
      ...review,
      trustScore: totalScore,
      aiStatus: totalScore < 40 ? 'fake' : 
               totalScore < 70 ? 'suspicious' : 'genuine',
      imageScore: imageScore,
      text_score: hasSuspiciousText ? 30 : 80,
      aiRecommendation: generateRecommendation(totalScore, hasSuspiciousText, imageMatches)
    };
  };

  // Add helper function for recommendations
  const generateRecommendation = (score: number, suspiciousText: boolean, imageMatches: boolean) => {
    const reasons = [];
    if (suspiciousText) reasons.push('Contains promotional or suspicious text patterns');
    if (!imageMatches) reasons.push('Review image does not match product image');
    
    return `Trust Score: ${score}%. ${reasons.length ? 'Issues detected: ' + reasons.join(', ') : 'No major issues detected'}`;
  };

  // Update the ReviewCard component
  const ReviewCard = ({ review, isExpanded, onToggle }: { 
    review: Review & { 
      trustScore?: number, 
      aiRecommendation?: string 
    }, 
    isExpanded: boolean, 
    onToggle: () => void 
  }) => {
    // Update card styling to be more subtle
    const getCardStyle = (trustScore: number | undefined) => {
      if (!trustScore) return 'bg-white border-gray-100';
      if (trustScore >= 80) return 'bg-white border-l-4 border-l-green-400 border-gray-100';
      if (trustScore >= 50) return 'bg-white border-l-4 border-l-yellow-400 border-gray-100';
      return 'bg-white border-l-4 border-l-red-400 border-gray-100';
    };

    return (
      <div className={`p-4 rounded-lg shadow-sm mb-4 ${getCardStyle(review.trustScore)}`}>
        <div className="flex justify-between items-start">
          <div className="flex-grow">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-gray-800">{review.author}</span>
              {review.verified && (
                <span className="text-green-600 text-xs bg-green-50 px-2 py-0.5 rounded-full">
                  ✓ Verified
                </span>
              )}
            </div>
            
            {/* Add rating stars here */}
            <div className="flex items-center mb-2">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${
                    i < review.rating ? 'text-yellow-400' : 'text-gray-200'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="ml-2 text-sm text-gray-500">{review.rating}.0</span>
            </div>

            <p className="text-gray-700 text-sm mb-2">{review.text}</p>
            
            <div className="text-xs text-gray-500">{review.date}</div>
          </div>

          {review.images?.[0] && (
            <div className="ml-4 flex-shrink-0">
              <div className="relative group">
                <Image 
                  src={review.images[0]} 
                  alt="Review" 
                  className={`w-16 h-16 object-cover rounded-md transition-all duration-200 hover:scale-105 ${
                    review.imageScore === 100 
                      ? 'ring-1 ring-green-300' 
                      : review.imageScore >= 50
                        ? 'ring-1 ring-yellow-300'
                        : 'ring-1 ring-red-300'
                  }`}
                  width={64} height={64}
                />
                {review.imageScore === 100 && (
                  <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Trust Score Badge - More subtle design */}
        <div className="mt-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            review.trustScore >= 80 
              ? 'bg-green-50 text-green-700' 
              : review.trustScore >= 50
                ? 'bg-yellow-50 text-yellow-700'
                : 'bg-red-50 text-red-700'
          }`}>
            Trust Score: {review.trustScore}%
          </span>
        </div>
      </div>
    );
  };

  // Add this component
  const TrustScoreProgress = ({ reviews }: { reviews: Review[] }) => {
    // Calculate average trust score
    const averageScore = Math.round(
      reviews.reduce((acc, review) => acc + (review.trustScore || 0), 0) / reviews.length
    );

    // Calculate score distribution
    const distribution = {
      high: reviews.filter(r => (r.trustScore || 0) >= 80).length,
      medium: reviews.filter(r => (r.trustScore || 0) >= 50 && (r.trustScore || 0) < 80).length,
      low: reviews.filter(r => (r.trustScore || 0) < 50).length
    };

    return (
      <div className="mb-8 p-6 bg-white rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Overall Trust Score</h3>
        
        {/* Main progress bar */}
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                Trust Score
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-blue-600">
                {averageScore}%
              </span>
            </div>
          </div>
          <div className="flex h-2 mb-4 overflow-hidden rounded bg-gray-200">
            <div 
              style={{ width: `${averageScore}%` }}
              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                averageScore >= 80 ? 'bg-green-500' :
                averageScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
            ></div>
          </div>

          {/* Distribution stats */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-green-500 font-semibold">{distribution.high}</div>
              <div className="text-gray-500">High Trust</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-500 font-semibold">{distribution.medium}</div>
              <div className="text-gray-500">Medium Trust</div>
            </div>
            <div className="text-center">
              <div className="text-red-500 font-semibold">{distribution.low}</div>
              <div className="text-gray-500">Low Trust</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-16 mb-8 bg-white rounded-lg shadow p-8 w-full max-w-6xl mx-auto">
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Analyzing reviews...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <>
          

          {/* Trust Score Progress Component */}
          <TrustScoreProgress reviews={analyzedReviews} />

          {/* Reviews List */}
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">Customer Reviews</h3>
            {analyzedReviews.map((review, idx) => {
              // Add this line to calculate if insight is open for current review
              const isInsightOpen = insightIdx === idx;
              
              return (
                <ReviewCard 
                  key={idx} 
                  review={review} 
                  isExpanded={isInsightOpen} 
                  onToggle={() => setInsightIdx(isInsightOpen ? null : idx)}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}