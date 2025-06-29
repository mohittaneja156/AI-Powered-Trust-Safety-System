/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "fakestoreapi.com",
      "m.media-amazon.com",
      "www.harborfreight.com",
      "encrypted-tbn0.gstatic.com"
    ],
  }
};

export default nextConfig;
