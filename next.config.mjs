const financeOrigin = process.env.FINANCE_API_ORIGIN || `http://127.0.0.1:${process.env.FINANCE_PORT || 4000}`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${financeOrigin}/api/:path*` }];
  },
};

export default nextConfig;