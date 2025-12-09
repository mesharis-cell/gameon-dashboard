/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
		remotePatterns: [
			{
				protocol: 'https',
				hostname: '*',
				pathname: '**',
			},
		],
  },
  webpack: (config, { isServer }) => {
    // Fix for react-pdf and pdfjs-dist
    if (!isServer) {
      config.resolve.alias.canvas = false;
      config.resolve.alias.encoding = false;
    }
    return config;
  },
};

export default nextConfig;
