/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },
  // Generate static sitemap and robots.txt
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
  // Move serverComponentsExternalPackages to the correct location
  serverExternalPackages: ['canvas', 'pdfjs-dist', 'pdf-parse', 'mammoth'],
  webpack: (config, { isServer, webpack }) => {
    // Canvas configuration
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas'];
    }

    // Handle PDF.js worker
    config.resolve.alias.canvas = 'canvas';
    
    // Fix for webpack chunk issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      fs: false,
      path: false,
      stream: false,
      crypto: false,
    };
    
    // Add webpack plugin to handle missing chunks
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/5611\.js$/,
      })
    );
    
    return config;
  },
}

export default nextConfig