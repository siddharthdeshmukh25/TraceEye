/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { 
    remotePatterns: [] 
  },
  eslint: {
    // Vercel par ESLint warnings/errors ko ignore karega
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Vercel par TypeScript errors ko ignore karega
    ignoreBuildErrors: true,
  },
};

export default nextConfig;