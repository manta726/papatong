/** @type {import('next').NextConfig} */
const nextConfig = {
  // Jangan pre-render pages yang perlu auth
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
