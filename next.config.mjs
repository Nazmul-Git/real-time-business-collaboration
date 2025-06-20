/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'healingspringswellness.com',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'pixahive.com',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'wallpapercave.com',
        pathname: '/wp/**',
      },
      {
        protocol: 'https',
        hostname: 'ceocolumn.com',
        pathname: '/wp-content/uploads/**',
      }
    ],
  },
};

export default nextConfig;