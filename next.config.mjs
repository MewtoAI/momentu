/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["placeholder.supabase.co", "images.unsplash.com", "nvakmlbsnwlboavgcsuf.supabase.co"],
    unoptimized: true,
  },
  eslint: {
    // Warnings are fine for MVP, block only on errors
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
