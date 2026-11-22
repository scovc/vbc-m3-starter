/** @type {import('next').NextConfig} */
const nextConfig = {
  // The API routes read data/seed-requests.csv at runtime. Make sure that file
  // is bundled with them when deployed as serverless functions (e.g. Netlify).
  outputFileTracingIncludes: {
    "/api/**": ["./data/**"],
  },
};

export default nextConfig;
