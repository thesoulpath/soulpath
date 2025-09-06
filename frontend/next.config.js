/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: require('path').resolve(__dirname),
  experimental: {
    // Enable experimental features if needed
  },
  webpack: (config, { isServer }) => {
    // Configure webpack to handle module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname),
    };
    return config;
  },
};

module.exports = nextConfig;

