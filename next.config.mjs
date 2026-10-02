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
}

export default nextConfig
