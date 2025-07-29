import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production'

// 若使用 project pages（https://username.github.io/<repo>）
const repo = 'amigotools'

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath: isProd ? `/${repo}` : '',
  assetPrefix: isProd ? `/${repo}/` : '',
  // 僅使用 client component / browser APIs，避免 SSR
  experimental: {
    typedRoutes: true
  },
  // 支援 Web Workers (使用 Next.js 原生支持)
  webpack: (config) => {
    // Next.js 15 原生支持 Web Workers，無需額外配置
    return config
  },
};

export default nextConfig;
