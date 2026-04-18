/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // ✅ static export

  basePath: '/chatbox/backoffice', // ✅ subfolder path
  assetPrefix: '/chatbox/backoffice/',

  images: {
    unoptimized: true, // ✅ required for static export
  },

  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
};

export default nextConfig;
