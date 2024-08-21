/** @type {import('next').NextConfig} */

const nextConfig = {
    output: 'export',
    images: { unoptimized: true },
    experimental: {
        ppr: 'incremental',
    },
};

export default nextConfig;
