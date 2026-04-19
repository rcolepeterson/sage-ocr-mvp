import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
  async rewrites() {
    return [
      {
        // Serve the dynamic service worker at the expected root path.
        // The route injects NEXT_PUBLIC_* Firebase config at request time.
        source: "/firebase-messaging-sw.js",
        destination: "/api/firebase-messaging-sw",
      },
    ];
  },
};

export default nextConfig;
