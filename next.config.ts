import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "firebase/app",
      "firebase/messaging",
      "jspdf",
      "html2canvas",
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
