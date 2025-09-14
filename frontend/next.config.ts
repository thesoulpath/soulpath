import type { NextConfig } from 'next'
import webpack from 'webpack'

const nextConfig: NextConfig = {
  // Remove turbopack config that might cause Vercel build issues
  // output: 'standalone', // This can cause issues in Vercel
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'Permissions-Policy', value: "camera=(), microphone=(), geolocation=()" },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline' https:",
          "img-src 'self' data: blob: https:",
          "font-src 'self' data: https:",
          "connect-src 'self' https: http:",
          "frame-ancestors 'self'",
          "form-action 'self'",
          "base-uri 'self'",
        ].join('; '),
      },
    ] as const

    return [
      {
        source: '/:path*',
        headers: securityHeaders as unknown as { key: string; value: string }[],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/public/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
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
        hostname: 'hwxrstqeuouefyrwjsjt.supabase.co', // Supabase project hostname
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
    ],
  },
}

export default nextConfig
