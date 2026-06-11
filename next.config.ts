import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 native modulu — server bundle-a daxil edilmir, xarici saxlanılır
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    serverActions: {
      // uploadImage action-ı 8 MB-a qədər fayl qəbul edir (lib/actions/images.ts)
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
