import React, { useState } from 'react';

interface ReviewAnalysisResult {
  trust_score: number;
  text_score: number;
  image_score: number | null;
  badge: string;
}

interface ReviewTrustAnalyzerProps {
  reviewText?: string;
  productImageUrl?: string;
  reviewImageUrl?: string;
  onAnalysisComplete?: (result: ReviewAnalysisResult) => void;
}

const ReviewTrustAnalyzer: React.FC<ReviewTrustAnalyzerProps> = ({
  reviewText = '',
  productImageUrl = '',
  reviewImageUrl = '',
  onAnalysisComplete
}) => {
  const [result, setResult] = useState<ReviewAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeReview = async () => {
    if (!reviewText) {
      setError('Review text is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/analyze/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          review_text: reviewText,
          product_image_url: productImageUrl,
          review_image_url: reviewImageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze review');
      }

      const data = await response.json();
      setResult(data);
      onAnalysisComplete?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error analyzing review:', err);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'High Trust Review':
        return 'bg-green-100 text-green-800';
      case 'Medium Trust Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low Trust Review':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTrustScore = () => {
    if (!result) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">Trust Score</span>
          <span className="text-2xl font-bold">{result.trust_score}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${result.trust_score}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBadgeColor(result.badge)}`}>
            {result.badge}
          </span>
          <div className="text-sm text-gray-500">
            Text Score: {result.text_score.toFixed(1)}
            {result.image_score && ` • Image Score: ${result.image_score.toFixed(1)}`}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {!result && (
              <button
                onClick={analyzeReview}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                disabled={!reviewText}
              >
                Analyze Review
              </button>
            )}
            {renderTrustScore()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewTrustAnalyzer;