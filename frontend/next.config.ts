import type { NextConfig } from 'next'
import webpack from 'webpack'

const nextConfig: NextConfig = {
  // Remove turbopack config that might cause Vercel build issues
  // output: 'standalone', // This can cause issues in Vercel
  outputFileTracingRoot: process.cwd(),
  webpack: (config, { isServer }) => {
    // Handle WebAssembly modules
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }
    
    // Handle .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    })

    // Fix for sweph-wasm module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      stream: false,
      util: false,
      buffer: false,
      process: false,
      os: false,
      url: false,
      querystring: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      constants: false,
      events: false,
      domain: false,
      punycode: false,
      string_decoder: false,
      timers: false,
      tty: false,
      vm: false,
      worker_threads: false,
      child_process: false,
      cluster: false,
      dgram: false,
      dns: false,
      net: false,
      readline: false,
      repl: false,
    }

    // Handle sweph-wasm specific issues
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      })
    )

    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hwxrstqeuouefyrwjsjt.supabase.co', // Your Supabase project hostname
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
    ],
  },
}

export default nextConfig
