import type { NextConfig } from "next";

const isCapacitor = process.env.CAPACITOR === 'true';
const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:14725';

const nextConfig: NextConfig = {
  devIndicators: false,
  output: isCapacitor ? 'export' : undefined,
  images: {
    unoptimized: isCapacitor,
  },
  env: {
    NEXT_PUBLIC_API_BASE: apiBase,
  },
};

export default nextConfig;