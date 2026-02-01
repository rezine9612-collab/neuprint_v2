/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep MVP behavior predictable in Vercel + local
  images: { unoptimized: true },
};

export default nextConfig;
