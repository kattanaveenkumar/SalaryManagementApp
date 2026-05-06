/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // ESLint runs locally (npm run lint) and in CI; skipping here avoids peer-dep
  // resolution differences between local npm and the Docker build image.
  eslint: { ignoreDuringBuilds: true },

  // Proxy /api/* to the Rails backend so browser fetches hit the Next.js server
  // (which can resolve the Docker service name "backend"), not localhost:3000.
  // Used only when NEXT_PUBLIC_API_URL is empty (i.e. Docker Compose mode).
  async rewrites() {
    const upstream = process.env.BACKEND_URL || "http://localhost:3000";
    return [
      {
        source: "/api/:path*",
        destination: `${upstream}/api/:path*`,
      },
      {
        source: "/health",
        destination: `${upstream}/health`,
      },
    ];
  },
};

module.exports = nextConfig;
