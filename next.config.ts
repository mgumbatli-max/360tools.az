import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // uploadImage action-ı 8 MB-a qədər fayl qəbul edir (lib/actions/images.ts)
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
