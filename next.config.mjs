const financeOrigin = process.env.FINANCE_API_ORIGIN || `http://127.0.0.1:${process.env.FINANCE_PORT || 4000}`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Scheduling batches may outlast the default 30-second internal proxy window.
  experimental: { proxyTimeout: 120000 },
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${financeOrigin}/api/:path*` }];
  },
};

export default nextConfig;