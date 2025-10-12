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