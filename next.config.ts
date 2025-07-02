import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'ap-south-1.graphassets.com',
				pathname: '/**',
			},
		],
	},
};

export default nextConfig;
