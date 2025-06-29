import { GetStaticPaths, GetStaticProps } from 'next';
import products from '@/data/products.json';
import Image from 'next/image';
import Link from 'next/link';
import ProductReviews, { Review } from '@/components/ProductReviews';
import { productReviews } from '@/data/reviews';

// Helper for star rating
const renderStars = (rating: number) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  return (
    <span className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <span key={i} className="text-secondary text-xl">★</span>
      ))}
      {halfStar && <span className="text-secondary text-xl">☆</span>}
    </span>
  );
};

type Product = typeof products[0];

interface ProductPageProps {
  product: Product;
}

export default function ProductPage({ product }: ProductPageProps) {
  if (!product) return <div>Product not found</div>;

  return (
    <>
      <div className="flex flex-col md:flex-row gap-8 p-8 bg-white min-h-screen">
        {/* Sidebar images (simulate with color blocks or product images) */}
        <div className="flex flex-col gap-4 items-center">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="w-16 h-16 border border-gray-200 rounded-lg overflow-hidden bg-gray_light flex items-center justify-center">
              <Image src={product.image} alt={product.title} width={60} height={60} />
            </div>
          ))}
        </div>
        {/* Main product image */}
        <div className="flex flex-col items-center flex-1">
          <Image src={product.image} alt={product.title} width={400} height={400} className="rounded-lg shadow-sm" />
          {/* Color options */}
          <div className="flex gap-2 mt-4">
            {product.colors.map((color, idx) => (
              <span key={idx} className="w-8 h-8 rounded-full border-2 border-gray-300" style={{ background: color }} />
            ))}
          </div>
          <div className="mt-2 text-sm font-semibold text-text_primary">Colour: <span className="text-secondary">Yellow</span></div>
        </div>
        {/* Product details and right box */}
        <div className="flex-1 flex flex-col md:flex-row gap-8">
          {/* Details */}
          <div className="flex-1">
            <div className="text-xs text-text_secondary mb-2">Electronics › Wearable Technology › Smart Watches</div>
            <h1 className="text-2xl font-bold text-text_primary">{product.title}</h1>
            <div className="text-primary text-sm font-semibold mb-2 cursor-pointer">Visit the Brand Store</div>
            <div className="flex items-center gap-2 mb-2">
              {renderStars(product.rating)}
              <span className="ml-2 text-text_primary font-semibold">{product.rating} ratings</span>
              <span className="mx-2">|</span>
              <span className="text-text_secondary">587 answered questions</span>
            </div>
            <div className="text-red-600 font-bold text-lg mb-2">Limited Time Offer</div>
            <div className="text-3xl font-bold mb-2 text-primary">₹ {product.price}</div>
            <div className="text-text_secondary mb-2">Inclusive of all taxes</div>
            <div className="text-sm mb-2 text-text_secondary">EMI starts at ₹2099. No Cost EMI available <span className="text-primary cursor-pointer">EMI options</span></div>
            {/* EMI cards */}
            <div className="flex flex-wrap gap-2 mb-4">
              {product.offers.map((offer, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 text-xs w-48 shadow-sm">
                  <div className="font-bold text-xs mb-1 text-primary">No Cost EMI</div>
                  <div className="text-text_secondary">{offer}</div>
                  <div className="text-primary mt-1 cursor-pointer">2 offers</div>
                </div>
              ))}
            </div>
            {/* Icons row (simulate with text/icons) */}
            <div className="flex gap-4 mb-4 text-xs text-text_secondary items-center">
              <span className="flex flex-col items-center"><span className="bg-gray_light rounded-full p-2">🚚</span>Free Delivery</span>
              <span className="flex flex-col items-center"><span className="bg-gray_light rounded-full p-2">💳</span>Pay on Delivery</span>
              <span className="flex flex-col items-center"><span className="bg-gray_light rounded-full p-2">🔄</span>7 days Replacement</span>
              <span className="flex flex-col items-center"><span className="bg-gray_light rounded-full p-2">🛡️</span>1 Year Warranty</span>
              <span className="flex flex-col items-center"><span className="bg-gray_light rounded-full p-2">🏆</span>Top Brand</span>
              <span className="flex flex-col items-center"><span className="bg-gray_light rounded-full p-2">✔️</span>ShopHub Delivered</span>
              <span className="flex flex-col items-center"><span className="bg-gray_light rounded-full p-2">🔒</span>Secure transaction</span>
            </div>
          </div>
          {/* Right price box */}
          <div className="w-full md:w-80 border border-gray-200 rounded-lg p-6 flex flex-col items-center shadow-lg h-fit bg-white">
            <div className="text-3xl font-bold mb-2 text-primary">₹ {product.price}</div>
            <div className="text-accent font-semibold mb-2">FREE Delivery Friday, May 27 <span className="text-primary cursor-pointer">Details</span></div>
            <div className="text-sm mb-2 text-text_secondary">Or Fastest Delivery Tomorrow, May 2. Order Within 8 Hrs 17 Mins. <span className="text-primary cursor-pointer">Details</span></div>
            <div className="text-accent font-bold mb-2">In stock</div>
            <button className="w-full bg-secondary text-white py-2 rounded-lg font-bold text-lg mb-2 hover:bg-secondary_dark transition-colors duration-200">Add to Cart</button>
            <button className="w-full bg-primary text-white py-2 rounded-lg font-bold text-lg hover:bg-primary_dark transition-colors duration-200">Buy Now</button>
          </div>
        </div>
      </div>
      <ProductReviews 
        reviews={productReviews[product.id] || []}
        productTrustScore={92}
        productImageUrl={product.image}
      />
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: products.map((product) => ({
      params: { id: product.id }
    })),
    fallback: false
  };
};

export const getStaticProps: GetStaticProps = async (context) => {
  const { id } = context.params!;
  const product = products.find((p) => p.id === id) || null;
  return { props: { product } };
};