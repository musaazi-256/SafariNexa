/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep parallel verification servers from overwriting the app server's manifests.
  distDir: process.env.SAFARINEXA_NEXT_DIST_DIR || ".next",
  async headers() {
    return [{source:"/:path*",headers:[
      {key:"X-Content-Type-Options",value:"nosniff"},
      {key:"X-Frame-Options",value:"SAMEORIGIN"},
      {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
      {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"}
    ]}];
  },
  experimental: { cpus: 2, serverActions: { bodySizeLimit: "12mb" } },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
