/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow build to succeed even if backend is down (API calls are client-side)
  // Optional proxy alternative: uncomment to proxy /api to backend same-origin (avoids CORS)
  // async rewrites() {
  //   const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  //   return [{ source: "/api/:path*", destination: `${apiBase}/api/:path*` }];
  // },
};

export default nextConfig;
