/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  outputFileTracingRoot: __dirname,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
