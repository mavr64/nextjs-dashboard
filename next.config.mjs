/** @type {import('next').NextConfig} */

const nextConfig = {
    images: { unoptimized: true },
    experimental: {
        ppr: 'incremental',
    },
};

export default nextConfig;
