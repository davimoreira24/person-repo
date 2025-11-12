/** @type {import('next').NextConfig} */
const supabaseHostname = process.env.SUPABASE_URL
  ? new URL(process.env.SUPABASE_URL).hostname
  : undefined;

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      ...(supabaseHostname
        ? [
            {
              protocol: "https",
              hostname: supabaseHostname,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;

