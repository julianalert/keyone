/** @type {import('next').NextConfig} */
const nextConfig = {
  // serverExternalPackages is Next.js 15+ syntax; in Next.js 14 use serverComponentsExternalPackages
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
    // Marketing pages read Markdown from content/ (guides, blog, docs) at runtime (ISR, the 404 page, the navbar menu);
    // make sure the Markdown files ship with every serverless function.
    outputFileTracingIncludes: {
      '/**': ['./content/**/*'],
      '/setup.js': ['./cli/keyone.js'],
    },
  },
  // The VisionBTP customer story used to live at its old agency name
  async redirects() {
    return [{ source: '/customers/vision-bds', destination: '/customers/visionbtp', permanent: true }]
  },
}

export default nextConfig
