/** @type {import('next').NextConfig} */
const nextConfig = {
  // serverExternalPackages is Next.js 15+ syntax; in Next.js 14 use serverComponentsExternalPackages
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
  },
}

export default nextConfig
