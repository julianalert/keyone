/** @type {import('next').NextConfig} */
const nextConfig = {
  // serverExternalPackages is Next.js 15+ syntax; in Next.js 14 use serverComponentsExternalPackages
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
    // Marketing pages read guides from content/guides at runtime (ISR, the 404 page, the navbar menu);
    // make sure the Markdown files ship with every serverless function.
    outputFileTracingIncludes: {
      '/**': ['./content/guides/**/*'],
    },
  },
}

export default nextConfig
